
import express from "express";
import rateLimit from "express-rate-limit";

import {
  createApplication,
  getMyApplications,
  getProjectApplications,
  updateApplicationStatus,
  withdrawApplication,
} from "../controllers/applicationController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

const applicationWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many application requests. Please try again later.",
  },
});

// Student: Apply to a project
router.post(
  "/projects/:projectId",
  protect,
  authorize("student"),
  applicationWriteLimiter,
  createApplication
);

// Student: View their own applications
router.get(
  "/my",
  protect,
  authorize("student"),
  getMyApplications
);
router.get("/mine", protect, authorize("student"), getMyApplications);

// Student: Withdraw their own application
router.patch(
  "/:applicationId/withdraw",
  protect,
  authorize("student"),
  applicationWriteLimiter,
  withdrawApplication
);

// Client: View applications for a project they own
router.get(
  "/projects/:projectId",
  protect,
  authorize("client"),
  getProjectApplications
);

// Client: Update an application's status
router.patch(
  "/:applicationId/status",
  protect,
  authorize("client"),
  applicationWriteLimiter,
  updateApplicationStatus
);

export default router;
