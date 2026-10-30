import mongoose from "mongoose";
const schema = new mongoose.Schema({ recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, type: { type: String, required: true }, message: { type: String, required: true }, resourceId: { type: mongoose.Schema.Types.ObjectId, default: null }, dedupeKey: { type: String, unique: true, sparse: true }, readAt: { type: Date, default: null } }, { timestamps: true, versionKey: false });
export default mongoose.model("Notification", schema);
