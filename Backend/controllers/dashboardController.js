import Application from "../models/Application.js";
import Project from "../models/Project.js";
import Profile from "../models/Profile.js";
import Team from "../models/Team.js";
import User from "../models/User.js";

const names = (value) => (value || []).map((item) => typeof item === "string" ? item.toLowerCase() : item?.name?.toLowerCase()).filter(Boolean);
const matchScore = (left, right) => {
  const a = names(left.skills), aw = names(left.wantedSkills || left.skillsWanted);
  const b = names(right.skills), bw = names(right.wantedSkills || right.skillsWanted);
  const total = aw.length + bw.length;
  if (!total) return null;
  return Math.round((aw.filter((skill) => b.includes(skill)).length + bw.filter((skill) => a.includes(skill)).length) / total * 100);
};

export const studentDashboard = async (req, res, next) => {
  try {
    const [applications, teamCount, profile, otherProfiles] = await Promise.all([
      Application.find({ applicant: req.user._id }).populate({ path: "project", select: "title status owner", populate: { path: "owner", select: "name" } }).sort({ updatedAt: -1 }).limit(10).lean(),
      Team.countDocuments({ "members.user": req.user._id }),
      Profile.findOne({ user: req.user._id }).lean(),
      Profile.find({ user: { $ne: req.user._id } }).populate("user", "name avatar status role").limit(100).lean(),
    ]);
    const partners = otherProfiles.filter((item) => item.user?.status === "active" && item.user?.role === "student").map((item) => ({ id: String(item.user._id), name: item.user.name, avatar: item.user.avatar, title: item.headline || "", skills: item.skills || item.skillsOffered || [], match: matchScore(profile || {}, item) })).sort((a, b) => (b.match ?? -1) - (a.match ?? -1)).slice(0, 5);
    const serializedApplications = applications.filter((item) => item.project).map((item) => ({ id: String(item._id), project: { id: String(item.project._id), title: item.project.title }, client: item.project.owner?.name ?? "", status: item.status, updatedAt: item.updatedAt }));
    return res.json({ success: true, message: "Student dashboard retrieved.", data: { name: req.user.name, metrics: { applications: applications.length, activeProjects: applications.filter((a) => a.project?.status === "in_progress").length, teamMembers: teamCount, rating: null, reviews: null }, skills: profile?.skills || (profile?.skillsOffered || []).map((name) => ({ name, level: "beginner", proficiency: 0 })), partners, applications: serializedApplications } });
  } catch (error) { return next(error); }
};

export const clientDashboard = async (req, res, next) => {
  try {
    const projects = await Project.find({ owner: req.user._id }).select("_id status title studentsRequired applicationDeadline").lean();
    const projectIds = projects.map((project) => project._id);
    const [applicationCount, selectedCount] = await Promise.all([Application.countDocuments({ project: { $in: projectIds } }), Application.countDocuments({ project: { $in: projectIds }, status: "selected" })]);
    return res.json({ success: true, message: "Client dashboard retrieved.", data: { projects, metrics: { projects: projects.length, applications: applicationCount, selected: selectedCount, rating: null } } });
  } catch (error) { return next(error); }
};
