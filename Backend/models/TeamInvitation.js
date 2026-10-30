import mongoose from "mongoose";
const schema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  invitee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending", index: true },
}, { timestamps: true, versionKey: false });
schema.index({ team: 1, invitee: 1 }, { unique: true, partialFilterExpression: { status: "pending" } });
export default mongoose.model("TeamInvitation", schema);
