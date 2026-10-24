
import express from "express";
import rateLimit from "express-rate-limit";

import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

const projectWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many project changes. Please try again later.",
  },
});

// Public: browse projects
router.get("/", getProjects);
router.get("/:projectId", getProjectById);

// Clients only: create projects
router.post(
  "/",
  protect,
  authorize("client"),
  projectWriteLimiter,
  createProject
);

// Clients only: update their own projects
router.put(
  "/:projectId",
  protect,
  authorize("client"),
  projectWriteLimiter,
  updateProject
);

// Clients only: delete their own projects
router.delete(
  "/:projectId",
  protect,
  authorize("client"),
  projectWriteLimiter,
  deleteProject
);

export default router;
