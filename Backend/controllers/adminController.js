import User from "../models/User.js";
import Project from "../models/Project.js";
import Report from "../models/Report.js";
import Profile from "../models/Profile.js";
import AuditLog from "../models/AuditLog.js";
import Application from "../models/Application.js";
import VerificationDocument from "../models/VerificationDocument.js";

const pageQuery = (req) => ({ page: Math.max(1, Number(req.query.page) || 1), limit: Math.min(100, Math.max(1, Number(req.query.limit) || 20)) });
const logAction = (req, action, targetType, targetId, details = {}) => AuditLog.create({ actor: req.user._id, action, targetType, targetId: String(targetId), details });
const list = async (Model, filter, page, limit, populate) => {
  const query = Model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  if (populate) query.populate(populate);
  const [items, total] = await Promise.all([query.lean(), Model.countDocuments(filter)]);
  return { items: items.map((item) => { const { _id, __v, ...data } = item; return { id: String(_id), ...data }; }), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getMetrics = async (req, res, next) => {
  try { const [students, clients, projects, activeProjects, completedProjects, applications, verifiedUsers, reports] = await Promise.all([User.countDocuments({ role: "student", status: { $ne: "deleted" } }), User.countDocuments({ role: "client", status: { $ne: "deleted" } }), Project.countDocuments(), Project.countDocuments({ status: "in_progress" }), Project.countDocuments({ status: "completed" }), Application.countDocuments(), User.countDocuments({ isVerified: true, status: { $ne: "deleted" } }), Report.countDocuments({ status: { $in: ["open", "investigating"] } })]); return res.json({ success: true, message: "Admin metrics retrieved.", data: { students, clients, projects, activeProjects, completedProjects, applications, verifiedUsers, reports } }); } catch (error) { return next(error); }
};
export const getActivity = async (req, res, next) => {
  try {
    const since = new Date();
    since.setMonth(since.getMonth() - 6);
    const groupByMonth = (dateField) => ({ $group: { _id: { $dateToString: { format: "%Y-%m", date: dateField } }, count: { $sum: 1 } } });
    const [projectsCreated, applications, completedProjects] = await Promise.all([
      Project.aggregate([{ $match: { createdAt: { $gte: since } } }, groupByMonth("$createdAt"), { $sort: { _id: 1 } }]),
      Application.aggregate([{ $match: { createdAt: { $gte: since } } }, groupByMonth("$createdAt"), { $sort: { _id: 1 } }]),
      Project.aggregate([{ $match: { status: "completed", updatedAt: { $gte: since } } }, groupByMonth("$updatedAt"), { $sort: { _id: 1 } }]),
    ]);
    const serialize = (rows) => rows.map((row) => ({ month: row._id, count: row.count }));
    return res.json({ success: true, message: "Platform activity retrieved.", data: { projectsCreated: serialize(projectsCreated), applications: serialize(applications), completedProjects: serialize(completedProjects) } });
  } catch (error) {
    return next(error);
  }
};
export const getRegistrations = async (req, res, next) => {
  try { const since = new Date(); since.setMonth(since.getMonth() - 6); const registrations = await User.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]); return res.json({ success: true, message: "Registration metrics retrieved.", data: { registrations: registrations.map((row) => ({ month: row._id, count: row.count })) } }); } catch (error) { return next(error); }
};
export const getPopularSkills = async (req, res, next) => {
  try { const rows = await Profile.aggregate([{ $project: { values: { $concatArrays: [{ $ifNull: ["$skillsOffered", []] }, { $map: { input: { $ifNull: ["$skills", []] }, as: "skill", in: "$$skill.name" } }] } } }, { $unwind: "$values" }, { $group: { _id: "$values", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }]); return res.json({ success: true, message: "Popular skills retrieved.", data: { skills: rows.map((row) => ({ name: row._id, count: row.count })) } }); } catch (error) { return next(error); }
};
export const getUsers = async (req, res, next) => { try { const { page, limit } = pageQuery(req); const filter = { status: { $ne: "deleted" } }; if (["student", "client", "admin"].includes(req.query.role)) filter.role = req.query.role; if (["active", "suspended"].includes(req.query.status)) filter.status = req.query.status; if (req.query.verified === "true") filter.isVerified = true; if (req.query.verified === "false") filter.isVerified = false; if (typeof req.query.search === "string" && req.query.search.trim()) { const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); filter.$or = [{ name: { $regex: escaped, $options: "i" } }, { email: { $regex: escaped, $options: "i" } }]; } const result = await list(User, filter, page, limit); return res.json({ success: true, message: "Users retrieved.", data: { users: result.items.map(({ password, ...user }) => user) }, meta: result.meta }); } catch (error) { return next(error); } };
export const getProjects = async (req, res, next) => { try { const { page, limit } = pageQuery(req); const result = await list(Project, {}, page, limit, { path: "owner", select: "name role isVerified" }); return res.json({ success: true, message: "Projects retrieved.", data: { projects: result.items.map((item) => { const { owner, skillsRequired, applicationDeadline, ...project } = item; return { ...project, skills: skillsRequired || [], deadline: applicationDeadline || null, client: owner ? { id: String(owner._id), name: owner.name, isVerified: owner.isVerified, rating: null } : null }; }) }, meta: result.meta }); } catch (error) { return next(error); } };
export const getReports = async (req, res, next) => { try { const { page, limit } = pageQuery(req); const result = await list(Report, {}, page, limit, { path: "reporter", select: "name email" }); return res.json({ success: true, message: "Reports retrieved.", data: { reports: result.items.map((item) => ({ ...item, reporter: item.reporter ? { id: String(item.reporter._id), name: item.reporter.name, email: item.reporter.email } : null })) }, meta: result.meta }); } catch (error) { return next(error); } };
export const getAuditLogs = async (req, res, next) => { try { const { page, limit } = pageQuery(req); const result = await list(AuditLog, {}, page, limit, { path: "actor", select: "name email" }); return res.json({ success: true, message: "Audit logs retrieved.", data: { auditLogs: result.items.map((item) => ({ ...item, actor: item.actor ? { id: String(item.actor._id), name: item.actor.name, email: item.actor.email } : null })) }, meta: result.meta }); } catch (error) { return next(error); } };

export const verifyUser = async (req, res, next) => { try { const isVerified = req.body.isVerified ?? true; if (typeof isVerified !== "boolean") return res.status(422).json({ success: false, message: "Invalid verification value.", errors: [{ field: "isVerified", message: "Provide a boolean value." }] }); if (isVerified && !(await VerificationDocument.exists({ owner: req.params.id, status: "approved" }))) return res.status(409).json({ success: false, message: "Approve a verification document before granting a verified badge.", errors: [] }); const user = await User.findByIdAndUpdate(req.params.id, { isVerified }, { new: true }); if (!user) return res.status(404).json({ success: false, message: "User not found.", errors: [] }); await logAction(req, user.isVerified ? "user.verified" : "user.unverified", "user", user._id); return res.json({ success: true, message: "User verification updated.", data: { user: { id: String(user._id), name: user.name, role: user.role, isVerified: user.isVerified } } }); } catch (error) { return next(error); } };
export const suspendUser = async (req, res, next) => { try { const status = req.body.status; if (!['active', 'suspended'].includes(status)) return res.status(422).json({ success: false, message: "Invalid user status.", errors: [{ field: "status", message: "Choose active or suspended." }] }); const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }); if (!user) return res.status(404).json({ success: false, message: "User not found.", errors: [] }); await logAction(req, `user.${status}`, "user", user._id); return res.json({ success: true, message: "User status updated.", data: { user: { id: String(user._id), name: user.name, role: user.role, status: user.status } } }); } catch (error) { return next(error); } };
export const deleteUser = async (req, res, next) => { try { if (String(req.params.id) === String(req.user._id)) return res.status(409).json({ success: false, message: "You cannot delete your own admin account.", errors: [] }); const user = await User.findById(req.params.id); if (!user || user.status === "deleted") return res.status(404).json({ success: false, message: "User not found.", errors: [] }); user.status = "deleted"; user.name = "Deleted user"; user.email = `deleted+${user._id}@campusxchange.invalid`; user.avatar = ""; await user.save(); await Profile.deleteOne({ user: user._id }); await logAction(req, "user.deleted", "user", user._id); return res.json({ success: true, message: "User account deleted and personal profile data removed.", data: { id: String(user._id) } }); } catch (error) { return next(error); } };
export const moderateProject = async (req, res, next) => { try { const moderationStatus = req.body.moderationStatus; if (!["approved", "pending", "removed"].includes(moderationStatus)) return res.status(422).json({ success: false, message: "Invalid moderation status.", errors: [{ field: "moderationStatus", message: "Choose approved, pending, or removed." }] }); const project = await Project.findByIdAndUpdate(req.params.id, { moderationStatus }, { new: true }); if (!project) return res.status(404).json({ success: false, message: "Project not found.", errors: [] }); await logAction(req, "project.moderated", "project", project._id, { moderationStatus }); return res.json({ success: true, message: "Project moderation updated.", data: { id: String(project._id), moderationStatus: project.moderationStatus } }); } catch (error) { return next(error); } };
export const updateReport = async (req, res, next) => { try { const status = req.body.status; if (!["open", "investigating", "action_taken", "closed"].includes(status)) return res.status(422).json({ success: false, message: "Invalid report status.", errors: [{ field: "status", message: "Choose a canonical report status." }] }); const report = await Report.findByIdAndUpdate(req.params.id, { status, adminNote: req.body.adminNote || "" }, { new: true }); if (!report) return res.status(404).json({ success: false, message: "Report not found.", errors: [] }); await logAction(req, "report.updated", "report", report._id, { status }); return res.json({ success: true, message: "Report updated.", data: { id: String(report._id), status: report.status } }); } catch (error) { return next(error); } };

export const getVerificationDocuments = async (req, res, next) => {
  try {
    const filter = ["pending", "approved", "rejected"].includes(req.query.status) ? { status: req.query.status } : {};
    const documents = await VerificationDocument.find(filter).sort({ createdAt: -1 }).limit(100).populate("owner", "name email role").lean();
    return res.json({ success: true, data: { documents: documents.map(({ _id, __v, documentUrl, publicId, format, resourceType, ...document }) => ({ id: String(_id), ...document, owner: document.owner ? { id: String(document.owner._id), name: document.owner.name, email: document.owner.email, role: document.owner.role } : null })) } });
  } catch (error) { return next(error); }
};

export const reviewVerificationDocument = async (req, res, next) => {
  try {
    const { status, adminNote = "" } = req.body || {};
    if (!["approved", "rejected"].includes(status) || typeof adminNote !== "string" || adminNote.length > 1000) return res.status(422).json({ success: false, message: "Choose approved or rejected and provide a note up to 1000 characters.", errors: [] });
    const document = await VerificationDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, message: "Verification document not found.", errors: [] });
    document.status = status;
    document.adminNote = adminNote;
    document.reviewedBy = req.user._id;
    document.reviewedAt = new Date();
    await document.save();
    if (status === "approved") await User.findByIdAndUpdate(document.owner, { isVerified: true });
    else if (!(await VerificationDocument.exists({ owner: document.owner, status: "approved" }))) await User.findByIdAndUpdate(document.owner, { isVerified: false });
    await logAction(req, `verification.${status}`, "verification_document", document._id, { owner: String(document.owner) });
    return res.json({ success: true, data: { id: String(document._id), status: document.status } });
  } catch (error) { return next(error); }
};
