import VerificationDocument from "../models/VerificationDocument.js";
import { authenticatedDownloadUrl, cloudinaryConfig, validCloudinaryAsset } from "../utils/cloudinary.js";

export async function submitVerification(req, res, next) {
  try {
    const { documentType, documentUrl, publicId, format, resourceType } = req.body || {};
    const validTypes = req.user.role === "student"
      ? ["student_id", "enrollment_letter", "other"]
      : ["business_registration", "other"];
    if (!validTypes.includes(documentType) || !["image", "raw"].includes(resourceType) || typeof format !== "string" || !/^[a-z0-9]{1,12}$/i.test(format) || !validCloudinaryAsset(documentUrl, publicId, `campusxchange/verifications/${req.user._id}`)) {
      return res.status(400).json({ success: false, message: "Provide a supported document type and a valid uploaded verification document.", errors: [] });
    }
    const document = await VerificationDocument.create({ owner: req.user._id, documentType, documentUrl, publicId, format, resourceType });
    return res.status(201).json({ success: true, message: "Verification document submitted for review.", data: { document: { id: String(document._id), documentType, status: document.status, createdAt: document.createdAt } } });
  } catch (error) { return next(error); }
}

export async function createVerificationDownload(req, res, next) {
  try {
    const config = cloudinaryConfig();
    if (!config) return res.status(503).json({ success: false, message: "Document downloads are not configured.", errors: [] });
    const document = await VerificationDocument.findById(req.params.id).select("publicId format resourceType");
    if (!document) return res.status(404).json({ success: false, message: "Verification document not found.", errors: [] });
    const url = authenticatedDownloadUrl({ ...config, publicId: document.publicId, format: document.format, resourceType: document.resourceType });
    return res.json({ success: true, data: { url, expiresInSeconds: 300 } });
  } catch (error) { return next(error); }
}

export async function listMyVerificationDocuments(req, res, next) {
  try {
    const documents = await VerificationDocument.find({ owner: req.user._id }).sort({ createdAt: -1 }).select("documentType status adminNote createdAt reviewedAt").lean();
    return res.json({ success: true, data: { documents: documents.map(({ _id, ...item }) => ({ id: String(_id), ...item })) } });
  } catch (error) { return next(error); }
}

