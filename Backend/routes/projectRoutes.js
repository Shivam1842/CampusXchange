
import express from "express";
import rateLimit from "express-rate-limit";

import {
  createProject,
  getProjects,
  getProjectById,
  getMyProjects,
  getMyProjectById,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { createApplication, getProjectApplications } from "../controllers/applicationController.js";
import { getWorkspaceProject, getTasks, createTask, updateTask, deleteTask, updateProgress, getParticipants, getMessages, createMessage, markMessagesRead } from "../controllers/workspaceController.js";

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

// Public: browse open projects.
router.get("/", getProjects);

// Clients only: list all their projects, including closed projects.
router.get("/mine", protect, authorize("client"), getMyProjects);
router.get("/my", protect, authorize("client"), getMyProjects);

// Clients only: view one of their projects regardless of status.
router.get(
  "/my/:projectId",
  protect,
  authorize("client"),
  getMyProjectById
);

router.get("/:projectId/applications", protect, authorize("client"), getProjectApplications);
router.get("/:projectId/workspace", protect, getWorkspaceProject);
router.get("/:projectId/tasks", protect, getTasks);
router.post("/:projectId/tasks", protect, createTask);
router.patch("/:projectId/tasks/:taskId", protect, updateTask);
router.delete("/:projectId/tasks/:taskId", protect, deleteTask);
router.patch("/:projectId/progress", protect, updateProgress);
router.get("/:projectId/participants", protect, getParticipants);
router.get("/:projectId/messages", protect, getMessages);
router.post("/:projectId/messages", protect, createMessage);
router.patch("/:projectId/messages/read", protect, markMessagesRead);

// Public: view an individual open project.
router.get("/:projectId", getProjectById);

// Clients only: create projects.
router.post(
  "/",
  protect,
  authorize("client"),
  projectWriteLimiter,
  createProject
);

router.post("/:projectId/apply", protect, authorize("student"), projectWriteLimiter, createApplication);

// Clients only: update their own projects.
router.put(
  "/:projectId",
  protect,
  authorize("client"),
  projectWriteLimiter,
  updateProject
);
router.patch("/:projectId", protect, authorize("client"), projectWriteLimiter, updateProject);
router.patch("/:projectId/status", protect, authorize("client"), projectWriteLimiter, updateProject);

// Clients only: delete their own projects.
router.delete(
  "/:projectId",
  protect,
  authorize("client"),
  projectWriteLimiter,
  deleteProject
);

export default router;
