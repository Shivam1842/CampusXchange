
import mongoose from "mongoose";
import Project from "../models/Project.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import { createNotifications } from "../utils/notifications.js";
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
      status: "open",
    });

    if (mongoose.connection.readyState === 1) {
      const students = await User.find({ role: "student", status: "active" }).select("_id").lean();
      await createNotifications(students.map(({ _id }) => ({ recipient: _id, type: "new_project", message: `A new project is available: ${project.title}.`, resourceId: project._id })));
    }

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

    const { page, limit, status, category, owner } = value;
    const search = value.search ?? value.q;
    if (status && status !== "open") {
      return res.status(200).json({ success: true, data: { projects: [], pagination: { total: 0, page, limit, totalPages: 0 } } });
    }
    const filter = { status: "open" };

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

export const getMyProjects = async (req, res, next) => {
  try {
    const { error, value } = listProjectsQuerySchema.validate(req.query, { abortEarly: false, convert: true });
    if (error) return res.status(400).json({ success: false, message: "Invalid project filters." });
    const { page, limit, status } = value;
    const filter = { owner: req.user._id };
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [projects, total] = await Promise.all([
      Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Project.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, data: { projects, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { return next(error); }
};

export const getMyProjectById = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.isValidObjectId(projectId)) return res.status(400).json({ success: false, message: "Invalid project ID." });
    const project = await Project.findOne({ _id: projectId, owner: req.user._id }).lean();
    if (!project) return res.status(404).json({ success: false, message: "Project not found or you are not its owner." });
    return res.status(200).json({ success: true, data: { project } });
  } catch (error) { return next(error); }
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

    const project = await Project.findOne({ _id: projectId, status: "open" })
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

    const project = await Project.findOne({ _id: projectId, owner: req.user._id });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you are not its owner.",
      });
    }

    const previousStatus = project.status;
    if ((project.status === "completed" || project.status === "cancelled") && value.status !== previousStatus) {
      return res.status(400).json({ success: false, message: `Cannot change project status from '${project.status}' to '${value.status}'.` });
    }
    if (value.status === "completed") {
      const selected = await mongoose.model("Application").countDocuments({ project: project._id, status: { $in: ["selected", "accepted"] } });
      if (!selected) return res.status(400).json({ success: false, message: "A project must have at least one selected applicant before it can be completed." });
    }
    Object.assign(project, value);
    if (value.studentsRequired !== undefined) project.maxTeamSize = value.studentsRequired;
    if (value.maxTeamSize !== undefined) project.studentsRequired = value.maxTeamSize;
    await project.save();
    if (value.status && value.status !== previousStatus && mongoose.connection.readyState === 1) {
      const applications = await Application.find({ project: project._id }).select("applicant").lean();
      await createNotifications([
        project.owner,
        ...(project.participants || []),
        ...applications.map((application) => application.applicant),
      ].map((recipient) => ({ recipient, type: `project_${value.status}`, message: `Project “${project.title}” is now ${value.status.replaceAll("_", " ")}.`, resourceId: project._id })));
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

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you are not its owner.",
      });
    }

    const hasApplications = await mongoose.model("Application").exists({ project: project._id });
    if (hasApplications) return res.status(409).json({ success: false, message: "This project has application history and cannot be deleted. Cancel the project instead." });
    await project.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
