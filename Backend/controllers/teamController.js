import mongoose from "mongoose";

import Team from "../models/Team.js";
import TeamInvitation from "../models/TeamInvitation.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { createNotification } from "../utils/notifications.js";

import {
  createTeamSchema,
  updateTeamSchema,
  updateTeamStatusSchema,
  listTeamsQuerySchema,
} from "../utils/teamValidation.js";

// Shared response helpers.
const sendValidationError = (res, error) => {
  return res.status(400).json({
    success: false,
    message:
      error.details?.map((detail) => detail.message).join(", ") ||
      "Invalid request data.",
    errors: (error.details || []).map((detail) => ({ field: detail.path.join("."), message: detail.message })),
  });
};

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const populateTeam = (query) =>
  query
    .populate("owner", "name role")
    .populate("members.user", "name role");

const serializeTeam = (team) => {
  if (!team) return null;
  const value = team.toObject ? team.toObject() : team;
  const formatUser = (user) => user && typeof user === "object" ? { id: String(user._id), name: user.name, role: user.role } : { id: String(user) };
  return { id: String(value._id), name: value.name, description: value.description, owner: formatUser(value.owner), members: (value.members || []).map((member) => ({ id: String(member._id), user: formatUser(member.user), role: member.role, joinedAt: member.joinedAt })), skills: value.skills || [], status: value.status, maxMembers: value.maxMembers ?? 5, createdAt: value.createdAt, updatedAt: value.updatedAt };
};

// Create a new team.
export const createTeam = async (req, res, next) => {
  try {
    const { error, value } = createTeamSchema.validate(req.body, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return sendValidationError(res, error);
    }

    const team = await Team.create({
      name: value.name,
      description: value.description,
      skills: value.skills,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "owner",
        },
      ],
      status: "forming",
    });

    const populatedTeam = await populateTeam(Team.findById(team._id));

    return res.status(201).json({
      success: true,
      message: "Team created successfully.",
      data: { team: populatedTeam },
    });
  } catch (error) {
    next(error);
  }
};

// Get teams with pagination, optional status filtering, and search.
export const getTeams = async (req, res, next) => {
  try {
    const { error, value } = listTeamsQuerySchema.validate(req.query, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return sendValidationError(res, error);
    }

    const { page, limit, status, search } = value;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { skills: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [teams, total] = await Promise.all([
      Team.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Team.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Teams retrieved successfully.",
      data: {
        teams,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single team by ID.
export const getTeamById = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    if (!validateObjectId(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID.",
      });
    }

    const team = await populateTeam(Team.findById(teamId));

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team retrieved successfully.",
      data: {
        team,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update team details.
// Only the team owner can update the details.
// Lifecycle status changes use the dedicated status endpoint.
export const updateTeam = async (req, res, next) => {
  try {
    // Preserve the API's specific error message for status changes.
    if (Object.hasOwn(req.body ?? {}, "status")) {
      return res.status(400).json({
        success: false,
        message: "Use the dedicated status endpoint to change team status.",
      });
    }

    const { teamId } = req.params;

    if (!validateObjectId(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID.",
      });
    }

    // noDefaults prevents Joi from inserting default fields
    // into an update request.
    const { error, value } = updateTeamSchema.validate(req.body, {
      abortEarly: false,
      convert: true,
      noDefaults: true,
    });

    if (error) {
      return sendValidationError(res, error);
    }

    const team = await Team.findOne({
      _id: teamId,
      owner: req.user._id,
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    if (team.status === "disbanded") {
      return res.status(400).json({
        success: false,
        message: "A disbanded team cannot be updated.",
      });
    }

    Object.assign(team, value);

    await team.save();

    const populatedTeam = await populateTeam(Team.findById(team._id));

    return res.status(200).json({
      success: true,
      message: "Team updated successfully.",
      data: {
        team: serializeTeam(populatedTeam),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update team lifecycle status.
// Allowed transitions:
// forming -> active
// forming -> completed
// active -> completed
export const updateTeamStatus = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    if (!validateObjectId(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID.",
      });
    }

    const { error, value } = updateTeamStatusSchema.validate(req.body, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return sendValidationError(res, error);
    }

    const team = await Team.findOne({
      _id: teamId,
      owner: req.user._id,
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    if (team.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "A completed team cannot change status.",
      });
    }

    if (team.status === "disbanded") {
      return res.status(400).json({
        success: false,
        message: "A disbanded team cannot change status.",
      });
    }

    const nextStatus = value.status;

    const allowed = team.status === "forming" ? ["active", "completed"] : team.status === "active" ? ["completed"] : [];
    if (!allowed.includes(nextStatus)) return res.status(400).json({ success: false, message: team.status === "active" ? "An active team can only be completed." : `Cannot change team status from '${team.status}' to '${nextStatus}'.`, errors: [] });

    if (team.status === "active" && nextStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "An active team can only be completed.",
      });
    }

    team.status = nextStatus;

    await team.save();

    const populatedTeam = await populateTeam(Team.findById(team._id));

    return res.status(200).json({
      success: true,
      message: "Team status updated successfully.",
      data: {
        team: serializeTeam(populatedTeam),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Disband a team.
// Only the owner can disband a team.
export const disbandTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    if (!validateObjectId(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID.",
      });
    }

    const team = await Team.findOne({
      _id: teamId,
      owner: req.user._id,
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    if (team.status === "disbanded") {
      return res.status(400).json({
        success: false,
        message: "Team is already disbanded.",
      });
    }

    team.status = "disbanded";

    await team.save();

    const populatedTeam = await populateTeam(Team.findById(team._id));

    return res.status(200).json({
      success: true,
      message: "Team disbanded successfully.",
      data: {
        team: serializeTeam(populatedTeam),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Join a forming or active team.
export const joinTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    if (!validateObjectId(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID.",
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found." });
    }
    if (["completed", "disbanded"].includes(team.status)) return res.status(400).json({ success: false, message: "You cannot join a completed or disbanded team." });
    const userId = String(req.user._id);
    if (team.members.some((member) => String(member.user?._id ?? member.user) === userId)) return res.status(409).json({ success: false, message: "You are already a member of this team." });
    if (team.members.length >= (team.maxMembers ?? 5)) return res.status(409).json({ success: false, message: "This team is full." });
    team.members.push({ user: req.user._id, role: "member" });
    await team.save();
    await createNotification({ recipient: team.owner, type: "team_member_joined", message: `${req.user.name || "A student"} joined your team.`, resourceId: team._id });
    const populatedTeam = await populateTeam(Team.findById(team._id));

    return res.status(200).json({
      success: true,
      message: "You joined the team successfully.",
      data: {
        team: serializeTeam(populatedTeam),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Leave a team.
// The owner must disband the team instead of leaving it.
export const leaveTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    if (!validateObjectId(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID.",
      });
    }

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    const userId = req.user._id.toString();

    if (team.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "The team owner cannot leave. Disband the team instead.",
      });
    }

    const memberIndex = team.members.findIndex(
      (member) => member.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "You are not a member of this team.",
      });
    }

    team.members.splice(memberIndex, 1);

    await team.save();

    const populatedTeam = await populateTeam(Team.findById(team._id));

    return res.status(200).json({
      success: true,
      message: "You left the team successfully.",
      data: {
        team: serializeTeam(populatedTeam),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTeams = async (req, res, next) => {
  try {
    const teams = await populateTeam(Team.find({ $or: [{ owner: req.user._id }, { "members.user": req.user._id }] }).sort({ updatedAt: -1 }));
    return res.json({ success: true, message: "Your teams retrieved.", data: { teams: teams.map(serializeTeam) }, meta: { page: 1, limit: teams.length, total: teams.length, totalPages: teams.length ? 1 : 0 } });
  } catch (error) { return next(error); }
};

export const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findOneAndDelete({ _id: req.params.teamId, owner: req.user._id });
    if (!team) return res.status(404).json({ success: false, message: "Team not found.", errors: [] });
    return res.json({ success: true, message: "Team deleted successfully.", data: { id: String(team._id) } });
  } catch (error) { return next(error); }
};

export const removeTeamMember = async (req, res, next) => {
  try {
    const team = await Team.findOneAndUpdate({ _id: req.params.teamId, owner: req.user._id, members: { $elemMatch: { user: req.params.userId, role: "member" } } }, { $pull: { members: { user: req.params.userId, role: "member" } } }, { new: true });
    if (!team) return res.status(404).json({ success: false, message: "Team or member not found.", errors: [] });
    const populated = await populateTeam(Team.findById(team._id));
    return res.json({ success: true, message: "Team member removed.", data: { team: serializeTeam(populated) } });
  } catch (error) { return next(error); }
};

export const sendTeamInvitation = async (req, res, next) => {
  try {
    const team = await Team.findOne({ _id: req.params.teamId, owner: req.user._id, status: { $in: ["forming", "active"] } });
    if (!team) return res.status(404).json({ success: false, message: "Team not found or inactive.", errors: [] });
    const inviteeId = req.body.userId;
    if (!mongoose.isValidObjectId(inviteeId) || String(inviteeId) === String(req.user._id)) return res.status(400).json({ success: false, message: "Provide a valid student to invite.", errors: [{ field: "userId", message: "A valid student ID is required." }] });
    const invitee = await User.findOne({ _id: inviteeId, role: "student", status: "active" }).select("_id");
    if (!invitee) return res.status(404).json({ success: false, message: "Student not found.", errors: [] });
    const invitation = await TeamInvitation.create({ team: team._id, inviter: req.user._id, invitee: invitee._id });
    await Notification.create({ recipient: invitee._id, type: "team_invitation", message: `You were invited to join ${team.name}.`, resourceId: invitation._id });
    return res.status(201).json({ success: true, message: "Invitation sent.", data: { invitation: { id: String(invitation._id), team: String(team._id), invitee: String(invitee._id), status: invitation.status, createdAt: invitation.createdAt } } });
  } catch (error) { if (error.code === 11000) return res.status(409).json({ success: false, message: "A pending invitation already exists.", errors: [] }); return next(error); }
};

export const getMyTeamInvitations = async (req, res, next) => {
  try {
    const invitations = await TeamInvitation.find({ invitee: req.user._id, status: "pending" }).populate("team", "name description skills status").populate("inviter", "name avatar").sort({ createdAt: -1 }).lean();
    return res.json({ success: true, message: "Invitations retrieved.", data: { invitations: invitations.map((item) => ({ id: String(item._id), team: item.team ? { id: String(item.team._id), name: item.team.name, description: item.team.description, skills: item.team.skills } : null, inviter: item.inviter ? { id: String(item.inviter._id), name: item.inviter.name, avatar: item.inviter.avatar } : null, status: item.status, createdAt: item.createdAt })) }, meta: { page: 1, limit: invitations.length, total: invitations.length, totalPages: invitations.length ? 1 : 0 } });
  } catch (error) { return next(error); }
};

export const respondToTeamInvitation = async (req, res, next) => {
  try {
    if (!["accept", "reject"].includes(req.params.action)) return res.status(422).json({ success: false, message: "Invalid invitation action.", errors: [{ field: "action", message: "Choose accept or reject." }] });
    const nextStatus = req.params.action === "accept" ? "accepted" : "rejected";
    const invitation = await TeamInvitation.findOneAndUpdate({ _id: req.params.invitationId, invitee: req.user._id, status: "pending" }, { status: nextStatus }, { new: true });
    if (!invitation) return res.status(404).json({ success: false, message: "Pending invitation not found.", errors: [] });
    if (nextStatus === "accepted") {
      const member = await Team.findOneAndUpdate({ _id: invitation.team, status: { $in: ["forming", "active"] }, "members.user": { $ne: req.user._id }, $expr: { $lt: [{ $size: "$members" }, { $ifNull: ["$maxMembers", 5] }] } }, { $push: { members: { user: req.user._id, role: "member" } } }, { new: true });
      if (!member) { invitation.status = "rejected"; await invitation.save(); return res.status(409).json({ success: false, message: "Team is full or inactive.", errors: [] }); }
    }
    await createNotification({ recipient: invitation.inviter, type: `team_invitation_${nextStatus}`, message: `${req.user.name} ${nextStatus} your team invitation.`, resourceId: invitation._id });
    return res.json({ success: true, message: `Invitation ${nextStatus}.`, data: { invitation: { id: String(invitation._id), team: String(invitation.team), status: invitation.status } } });
  } catch (error) { return next(error); }
};
