import mongoose from "mongoose";

const verificationDocumentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  documentType: { type: String, required: true, enum: ["student_id", "enrollment_letter", "business_registration", "other"] },
  documentUrl: { type: String, required: true, maxlength: 1000 },
  publicId: { type: String, required: true, maxlength: 300 },
  format: { type: String, required: true, maxlength: 12 },
  resourceType: { type: String, enum: ["image", "raw"], required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  adminNote: { type: String, default: "", maxlength: 1000 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

export default mongoose.model("VerificationDocument", verificationDocumentSchema);
