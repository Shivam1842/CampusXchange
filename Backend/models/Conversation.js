import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  type: { type: String, enum: ["direct", "project_team"], default: "direct" },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
