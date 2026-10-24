
import mongoose from "mongoose";
import Team from "../models/Team.js";
import {
  createTeamSchema,
  updateTeamSchema,
  listTeamsQuerySchema,
} from "../utils/teamValidation.js";

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const isValidTeamId = (id) => mongoose.isValidObjectId(id);

const getValidationMessage = (error) =>
  error.details.map((detail) => detail.message).join("; ");

// POST /api/v1/teams
// Create a team. Only students can create teams.
export const createTeam = async (req, res, next) => {
  try {
    const { error, value } = createTeamSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false,
    });

    if (error) {
      return sendError(res, 400, getValidationMessage(error));
    }

    const team = await Team.create({
      ...value,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "owner",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Team created successfully.",
      data: { team },
    });
  } catch (error) {
    console.error("createTeam error:", error);
    return next(error);
  }
};

// GET /api/v1/teams
// Public team listing with pagination, status filtering and search.
export const getTeams = async (req, res, next) => {
  try {
    const { error, value } = listTeamsQuerySchema.validate(req.query, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return sendError(res, 400, getValidationMessage(error));
    }

    const { page, limit, status, search } = value;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    // Search team name, description and skills without requiring
    // a MongoDB text index.
    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { skills: searchRegex },
      ];
    }

    const [teams, total] = await Promise.all([
      Team.find(filter)
        .populate("owner", "name role")
        .populate("members.user", "name role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Team.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        teams,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("getTeams error:", error);
    return next(error);
  }
};

// GET /api/v1/teams/:teamId
// Retrieve one team by its ID.
export const getTeamById = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    if (!isValidTeamId(teamId)) {
      return sendError(res, 400, "Invalid team ID.");
    }

    const team = await Team.findById(teamId)
      .populate("owner", "name role")
      .populate("members.user", "name role")
      .lean();

    if (!team) {
      return sendError(res, 404, "Team not found.");
    }

    return res.status(200).json({
      success: true,
      data: { team },
    });
  } catch (error) {
    console.error("getTeamById error:", error);
    return next(error);
  }
};

// PATCH /api/v1/teams/:teamId
// Only the team owner can update the team.
export const updateTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    if (!isValidTeamId(teamId)) {
      return sendError(res, 400, "Invalid team ID.");
    }

    const { error, value } = updateTeamSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false,
    });

    if (error) {
      return sendError(res, 400, getValidationMessage(error));
    }

    const team = await Team.findById(teamId);

    if (!team || team.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 404, "Team not found.");
    }

    if (team.status === "disbanded") {
      return sendError(
        res,
        400,
        "A disbanded team cannot be updated."
      );
    }

    Object.assign(team, value);
    await team.save();

    return res.status(200).json({
      success: true,
      message: "Team updated successfully.",
      data: { team },
    });
  } catch (error) {
    console.error("updateTeam error:", error);
    return next(error);
  }
};

// PATCH /api/v1/teams/:teamId/disband
// Only the team owner can disband the team.
export const disbandTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    if (!isValidTeamId(teamId)) {
      return sendError(res, 400, "Invalid team ID.");
    }

    const team = await Team.findById(teamId);

    if (!team || team.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 404, "Team not found.");
    }

    if (team.status === "disbanded") {
      return sendError(res, 400, "Team is already disbanded.");
    }

    team.status = "disbanded";
    await team.save();

    return res.status(200).json({
      success: true,
      message: "Team disbanded successfully.",
      data: { team },
    });
  } catch (error) {
    console.error("disbandTeam error:", error);
    return next(error);
  }
};
