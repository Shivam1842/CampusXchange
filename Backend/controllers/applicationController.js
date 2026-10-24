
import mongoose from "mongoose";
import Application from "../models/Application.js";
import Project from "../models/Project.js";

import {
  createApplicationSchema,
  listApplicationsQuerySchema,
  updateApplicationStatusSchema,
} from "../utils/applicationValidation.js";

const sendValidationError = (res, message) =>
  res.status(400).json({
    success: false,
    message,
  });

// Student: Apply to a project
export const createApplication = async (req, res, next) => {
  try {
    const { error, value } = createApplicationSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false,
    });

    if (error) {
      return sendValidationError(
        res,
        error.details.map((detail) => detail.message).join(" ")
      );
    }

    const { projectId } = req.params;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const project = await Project.findById(projectId).select(
      "_id status applicationDeadline"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (project.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "This project is not accepting applications.",
      });
    }

    if (
      project.applicationDeadline &&
      project.applicationDeadline.getTime() <= Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "The application deadline has passed.",
      });
    }

    const application = await Application.create({
      project: project._id,
      applicant: req.user._id,
      coverLetter: value.coverLetter,
      proposedContribution: value.proposedContribution,
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      data: { application },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this project.",
      });
    }

    return next(error);
  }
};

// Student: View their own applications
export const getMyApplications = async (req, res, next) => {
  try {
    const { error, value } = listApplicationsQuerySchema.validate(
      req.query,
      { abortEarly: false }
    );

    if (error) {
      return sendValidationError(
        res,
        error.details.map((detail) => detail.message).join(" ")
      );
    }

    const filter = { applicant: req.user._id };

    if (value.status) {
      filter.status = value.status;
    }

    const page = value.page;
    const limit = value.limit;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate({
          path: "project",
          select: "title category status owner",
          populate: {
            path: "owner",
            select: "name",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Application.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Client: View applications for a project they own
export const getProjectApplications = async (req, res, next) => {
  try {
    const { error, value } = listApplicationsQuerySchema.validate(
      req.query,
      { abortEarly: false }
    );

    if (error) {
      return sendValidationError(
        res,
        error.details.map((detail) => detail.message).join(" ")
      );
    }

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
    }).select("_id");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const filter = { project: project._id };

    if (value.status) {
      filter.status = value.status;
    }

    const page = value.page;
    const limit = value.limit;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate("applicant", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Application.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Client: Shortlist, accept, or reject an application
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { error, value } = updateApplicationStatusSchema.validate(
      req.body,
      { abortEarly: false }
    );

    if (error) {
      return sendValidationError(
        res,
        error.details.map((detail) => detail.message).join(" ")
      );
    }

    const { applicationId } = req.params;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    const application = await Application.findById(applicationId).populate({
      path: "project",
      select: "owner status",
    });

    if (!application || !application.project) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    if (
      application.project.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    if (application.status === "withdrawn") {
      return res.status(400).json({
        success: false,
        message: "A withdrawn application cannot be updated.",
      });
    }

    if (["accepted", "rejected"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: "This application has already been finalized.",
      });
    }

    if (application.project.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Applications can only be reviewed while the project is open.",
      });
    }

    application.status = value.status;
    await application.save();

    return res.status(200).json({
      success: true,
      message: "Application status updated successfully.",
      data: { application },
    });
  } catch (error) {
    return next(error);
  }
};

// Student: Withdraw their own pending or shortlisted application
export const withdrawApplication = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    const application = await Application.findOne({
      _id: applicationId,
      applicant: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    if (!["pending", "shortlisted"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: "Only pending or shortlisted applications can be withdrawn.",
      });
    }

    application.status = "withdrawn";
    await application.save();

    return res.status(200).json({
      success: true,
      message: "Application withdrawn successfully.",
      data: { application },
    });
  } catch (error) {
    return next(error);
  }
};
