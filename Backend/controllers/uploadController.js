import User from "../models/User.js";
import { cloudinaryConfig, signCloudinaryParams, validCloudinaryAsset } from "../utils/cloudinary.js";

const issue = (res, resource, folder) => {
  const config = cloudinaryConfig();
  if (!config) return res.status(503).json({ success: false, message: "File uploads are not configured.", errors: [] });
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const params = { public_id: publicId, timestamp, ...(folder.includes("/verifications/") ? { type: "authenticated" } : {}), ...(resource === "image" ? { transformation: "c_limit,w_1200,h_1200,q_auto" } : {}) };
  return res.json({ success: true, data: { url: `https://api.cloudinary.com/v1_1/${config.cloudName}/${resource}/upload`, cloudName: config.cloudName, apiKey: config.apiKey, params, signature: signCloudinaryParams(params, config.apiSecret) } });
};

export const createAvatarUpload = (req, res) => issue(res, "image", `campusxchange/avatars/${req.user._id}`);
export const createVerificationUpload = (req, res) => issue(res, "auto", `campusxchange/verifications/${req.user._id}`);

export const updateAvatar = async (req, res, next) => {
  try {
    const { avatar, publicId } = req.body || {};
    if (!validCloudinaryAsset(avatar, publicId, `campusxchange/avatars/${req.user._id}`)) return res.status(400).json({ success: false, message: "Provide a valid uploaded profile image.", errors: [] });
    const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true });
    return res.json({ success: true, data: { avatar: user.avatar } });
  } catch (error) { return next(error); }
};
