
import express from "express";
import rateLimit from "express-rate-limit";

import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  disbandTeam,
} from "../controllers/teamController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

const teamWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many team requests. Please try again later.",
  },
});

// Public endpoints
router.get("/", getTeams);
router.get("/:teamId", getTeamById);

// Authenticated student endpoints
router.post(
  "/",
  protect,
  authorize("student"),
  teamWriteLimiter,
  createTeam
);

router.patch(
  "/:teamId",
  protect,
  authorize("student"),
  teamWriteLimiter,
  updateTeam
);

router.patch(
  "/:teamId/disband",
  protect,
  authorize("student"),
  teamWriteLimiter,
  disbandTeam
);

export default router;
