import express from "express";
import {
  getMyProfile,
  createOrUpdateMyProfile,
  discoverPartners,
} from "../controllers/profileController.js";
import { createAvatarUpload, updateAvatar } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  updateStudentProfileSchema,
  updateClientProfileSchema,
  partnerQuerySchema,
} from "../utils/profileValidation.js";

const router = express.Router();

const validateProfileUpdate = (req, res, next) => {
  if (req.user.role === "student") {
    return validate(updateStudentProfileSchema)(req, res, next);
  }

  if (req.user.role === "client") {
    return validate(updateClientProfileSchema)(req, res, next);
  }

  return res.status(403).json({
    success: false,
    message: "Your role cannot create or update a profile here.",
    errors: [],
  });
};

const validatePartnerQuery = (req, res, next) => {
  const { error, value } = partnerQuerySchema.validate(req.query, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid partner search parameters.",
      errors: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  req.partnerQuery = value;
  next();
};

// Discover active student partners using real profile and skill data
router.get("/partners", protect, validatePartnerQuery, discoverPartners);

// Get the logged-in user's profile
router.get("/me", protect, getMyProfile);

// Create or update the logged-in user's profile
router.put("/me", protect, validateProfileUpdate, createOrUpdateMyProfile);
router.get("/me/avatar-upload", protect, createAvatarUpload);
router.post("/me/avatar", protect, updateAvatar);

export default router;
