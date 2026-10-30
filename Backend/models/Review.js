import mongoose from "mongoose";
const schema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  reviewee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  overallRating: { type: Number, required: true, min: 1, max: 5 },
  communicationRating: { type: Number, required: true, min: 1, max: 5 },
  technicalSkillsRating: { type: Number, required: true, min: 1, max: 5 },
  professionalismRating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 2000, default: "" },
}, { timestamps: true, versionKey: false });
schema.index({ project: 1, reviewer: 1, reviewee: 1 }, { unique: true });
export default mongoose.model("Review", schema);
