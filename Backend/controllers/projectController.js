
import mongoose from "mongoose";
import Project from "../models/Project.js";
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
} from "../utils/projectValidation.js";

export const createProject = async (req, res, next) => {
  try {
    const { error, value } = createProjectSchema.validate(req.body, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Project validation failed.",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const project = await Project.create({
      ...value,
      owner: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { error, value } = listProjectsQuerySchema.validate(req.query, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid project filters.",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { page, limit, status, category, search, owner } = value;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = new RegExp(
      `^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i"
    );
    if (owner) filter.owner = owner;

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate("owner", "name role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const project = await Project.findById(projectId)
      .populate("owner", "name role")
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const { error, value } = updateProjectSchema.validate(req.body, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Project validation failed.",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const project = await Project.findOneAndUpdate(
      { _id: projectId, owner: req.user._id },
      { $set: value },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you are not its owner.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const project = await Project.findOneAndDelete({
      _id: projectId,
      owner: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you are not its owner.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
