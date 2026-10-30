
import express from "express";
import rateLimit from "express-rate-limit";

import {
  register,
  login,
  getMe,
  changePassword,
  logout,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  googleSignIn,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
} from "../utils/authValidation.js";

const router = express.Router();

// Limit repeated login and registration attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again in 15 minutes.",
  },
});

// Public routes
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/forgot-password", authLimiter, requestPasswordReset);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/google", authLimiter, googleSignIn);

// Protected routes
router.get("/me", protect, getMe);
router.patch("/change-password", protect, changePassword);
router.post("/logout", protect, logout);

export default router;
