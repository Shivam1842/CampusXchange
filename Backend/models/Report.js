import mongoose from "mongoose";
const schema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  targetType: { type: String, enum: ["user", "project", "team", "message", "review"], required: true },
  target: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ["open", "investigating", "action_taken", "closed"], default: "open", index: true },
  adminNote: { type: String, trim: true, maxlength: 2000, default: "" },
}, { timestamps: true, versionKey: false });
export default mongoose.model("Report", schema);
