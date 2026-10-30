import mongoose from "mongoose";
import Review from "../models/Review.js";
import Report from "../models/Report.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import DirectMessage from "../models/DirectMessage.js";
import Conversation from "../models/Conversation.js";

export const createReview = async (req, res, next) => {
  try {
    const { projectId, revieweeId, overallRating, communicationRating, technicalSkillsRating, professionalismRating, comment = "" } = req.body || {};
    const ratings = { overallRating, communicationRating, technicalSkillsRating, professionalismRating };
    const invalidRating = Object.entries(ratings).find(([, rating]) => !Number.isInteger(rating) || rating < 1 || rating > 5);
    if (![projectId, revieweeId].every(mongoose.isValidObjectId) || invalidRating || typeof comment !== "string" || comment.length > 2000) return res.status(400).json({ success: false, message: "Invalid review data.", errors: [{ field: invalidRating?.[0] || "projectId", message: invalidRating ? "Each rating must be an integer from 1 to 5." : "Provide valid project and reviewee IDs and a comment of at most 2000 characters." }] });
    const project = await Project.findOne({ _id: projectId, status: "completed" }).select("owner participants");
    if (!project) return res.status(409).json({ success: false, message: "Reviews can be submitted after project completion.", errors: [] });
    const reviewerIsMember = String(project.owner) === String(req.user._id) || project.participants.some((id) => String(id) === String(req.user._id));
    const revieweeIsMember = String(project.owner) === String(revieweeId) || project.participants.some((id) => String(id) === String(revieweeId));
    if (!reviewerIsMember || !revieweeIsMember || String(req.user._id) === String(revieweeId)) return res.status(403).json({ success: false, message: "Only project participants can review another participant.", errors: [] });
    const review = await Review.create({ project: project._id, reviewer: req.user._id, reviewee: revieweeId, ...ratings, comment: comment.trim() });
    await Notification.create({ recipient: revieweeId, type: "new_review", message: "You received a new project review.", resourceId: project._id });
    return res.status(201).json({ success: true, message: "Review submitted.", data: { review: { id: String(review._id), project: String(review.project), reviewer: String(review.reviewer), reviewee: String(review.reviewee), ...ratings, comment: review.comment, createdAt: review.createdAt } } });
  } catch (error) { if (error.code === 11000) return res.status(409).json({ success: false, message: "You already reviewed this participant for this project.", errors: [] }); return next(error); }
};

export const getUserReviews = async (req, res, next) => {
  try { const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10)); const filter = { reviewee: req.params.id }; const [reviews, total, stats] = await Promise.all([Review.find(filter).populate("reviewer", "name avatar").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Review.countDocuments(filter), Review.aggregate([{ $match: filter }, { $group: { _id: null, rating: { $avg: { $ifNull: ["$overallRating", "$rating"] } }, count: { $sum: 1 } } }])]); return res.json({ success: true, message: "Reviews retrieved.", data: { reviews: reviews.map((item) => ({ id: String(item._id), reviewer: item.reviewer ? { id: String(item.reviewer._id), name: item.reviewer.name, avatar: item.reviewer.avatar } : null, rating: item.overallRating ?? item.rating, overallRating: item.overallRating ?? item.rating, communicationRating: item.communicationRating ?? null, technicalSkillsRating: item.technicalSkillsRating ?? null, professionalismRating: item.professionalismRating ?? null, comment: item.comment, createdAt: item.createdAt })), rating: stats[0]?.rating == null ? null : Number(stats[0].rating.toFixed(2)), totalReviews: total }, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }); } catch (error) { return next(error); }
};

export const createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason } = req.body || {};
    if (!['user', 'project', 'team', 'message', 'review'].includes(targetType) || !mongoose.isValidObjectId(targetId) || typeof reason !== 'string' || !reason.trim() || reason.length > 2000) return res.status(400).json({ success: false, message: "Invalid report data.", errors: [{ field: "reason", message: "Choose a valid target and provide a reason up to 2000 characters." }] });
    let exists;
    if (targetType === "message") {
      const directMessage = await DirectMessage.findById(targetId).select("conversation");
      if (directMessage) exists = await Conversation.exists({ _id: directMessage.conversation, participants: req.user._id });
      else exists = await Project.exists({ "messages._id": targetId, $or: [{ owner: req.user._id }, { participants: req.user._id }] });
    } else {
      const models = { user: User, project: Project, team: Team, review: Review };
      exists = await models[targetType].exists({ _id: targetId });
    }
    if (!exists) return res.status(404).json({ success: false, message: "Report target not found or not accessible.", errors: [] });
    const report = await Report.create({ reporter: req.user._id, targetType, target: targetId, reason: reason.trim() });
    return res.status(201).json({ success: true, message: "Report submitted.", data: { report: { id: String(report._id), targetType, target: String(report.target), reason: report.reason, status: report.status, createdAt: report.createdAt } } });
  } catch (error) { return next(error); }
};
