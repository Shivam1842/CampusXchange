
import express from "express";
import rateLimit from "express-rate-limit";

import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  updateTeamStatus,
  disbandTeam,
  joinTeam,
  leaveTeam,
  getMyTeams,
  deleteTeam,
  removeTeamMember,
  sendTeamInvitation,
  getMyTeamInvitations,
  respondToTeamInvitation,
} from "../controllers/teamController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Rate limit write operations to help prevent abuse.
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

// Public endpoints.
router.get("/mine", protect, authorize("student"), getMyTeams);
router.get("/invitations/mine", protect, authorize("student"), getMyTeamInvitations);
router.get("/", getTeams);
router.get("/:teamId", getTeamById);

// Authenticated student endpoints.
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
router.put("/:teamId", protect, authorize("student"), teamWriteLimiter, updateTeam);
router.delete("/:teamId", protect, authorize("student"), teamWriteLimiter, deleteTeam);
router.delete("/:teamId/members/:userId", protect, authorize("student"), teamWriteLimiter, removeTeamMember);
router.post("/:teamId/invitations", protect, authorize("student"), teamWriteLimiter, sendTeamInvitation);
router.patch("/invitations/:invitationId/:action", protect, authorize("student"), teamWriteLimiter, respondToTeamInvitation);

// Change team lifecycle status.
// Allowed transitions: forming -> active, forming -> completed,
// and active -> completed.
router.patch(
  "/:teamId/status",
  protect,
  authorize("student"),
  teamWriteLimiter,
  updateTeamStatus
);

// Join a forming or active team.
router.post(
  "/:teamId/join",
  protect,
  authorize("student"),
  teamWriteLimiter,
  joinTeam
);

// Leave a team.
router.post(
  "/:teamId/leave",
  protect,
  authorize("student"),
  teamWriteLimiter,
  leaveTeam
);

// Disband a team.
router.patch(
  "/:teamId/disband",
  protect,
  authorize("student"),
  teamWriteLimiter,
  disbandTeam
);

export default router;
