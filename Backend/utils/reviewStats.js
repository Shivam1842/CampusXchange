import Review from "../models/Review.js";
import Application from "../models/Application.js";

export const getReviewStats = async (userId) => {
  const [aggregate, completedProjects] = await Promise.all([
    Review.aggregate([{ $match: { reviewee: userId } }, { $group: { _id: null, rating: { $avg: { $ifNull: ["$overallRating", "$rating"] } }, reviews: { $sum: 1 } } }]),
    Application.aggregate([{ $match: { applicant: userId, status: "selected" } }, { $lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" } }, { $unwind: "$project" }, { $match: { "project.status": "completed" } }, { $count: "total" }]),
  ]);
  return { rating: aggregate[0]?.rating == null ? null : Number(aggregate[0].rating.toFixed(2)), reviews: aggregate[0]?.reviews ?? 0, completedProjects: completedProjects[0]?.total ?? 0 };
};

export const getReviewStatsMap = async (userIds) => {
  if (!userIds.length) return new Map();
  const rows = await Review.aggregate([{ $match: { reviewee: { $in: userIds } } }, { $group: { _id: "$reviewee", rating: { $avg: { $ifNull: ["$overallRating", "$rating"] } }, reviews: { $sum: 1 } } }]);
  return new Map(rows.map((row) => [String(row._id), { rating: Number(row.rating.toFixed(2)), reviews: row.reviews }]));
};
