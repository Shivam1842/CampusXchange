
import express from "express";
import {
  getMyProfile,
  createOrUpdateMyProfile,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get the logged-in user's profile
router.get("/me", protect, getMyProfile);

// Create or update the logged-in user's profile
router.put("/me", protect, createOrUpdateMyProfile);

export default router;
