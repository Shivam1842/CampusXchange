
import mongoose from "mongoose";
import Application from "../models/Application.js";
import Project from "../models/Project.js";
import Team from "../models/Team.js";
import Profile from "../models/Profile.js";
import { createNotification } from "../utils/notifications.js";

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

    const projectQuery = Project.findById(projectId);
    const project = await (projectQuery.select
      ? projectQuery.select("_id status applicationDeadline owner title")
      : projectQuery);

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

    let team = null;
    if (value.type === "team") {
      team = await Team.findOne({ _id: value.team, owner: req.user._id, status: { $in: ["forming", "active"] } }).select("_id members");
      if (!team) return res.status(400).json({ success: false, message: "Choose a forming or active team that you own.", errors: [{ field: "team", message: "Team not found or unavailable." }] });
    }

    const application = await Application.create({
      project: project._id,
      applicant: req.user._id,
      coverLetter: value.coverMessage ?? value.coverLetter,
      portfolioLink: value.portfolioLink || "",
      type: value.type,
      team: team?._id ?? null,
      skills: value.skills,
      previousProjects: value.previousProjects,
      availability: value.availability,
      status: "applied",
      proposedContribution: value.proposedContribution,
    });
    await createNotification({
      recipient: project.owner,
      type: "application_received",
      message: `A student applied to ${project.title || "your project"}.`,
      resourceId: application._id,
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
      filter.status = value.status === "applied" ? { $in: ["applied", "pending"] } : value.status;
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
      filter.status = value.status === "applied" ? { $in: ["applied", "pending"] } : value.status;
    }

    const page = value.page;
    const limit = value.limit;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate("applicant", "name email role avatar")
        .populate({ path: "team", select: "name members", populate: { path: "members.user", select: "name avatar" } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Application.countDocuments(filter),
    ]);
    const applicantIds = applications.map((item) => item.applicant?._id).filter(Boolean);
    const profiles = applicantIds.length ? await Profile.find({ user: { $in: applicantIds } }).lean() : [];
    const profilesByUser = new Map(profiles.map((profile) => [String(profile.user), profile]));
    const formattedApplications = applications.map((item) => ({
      ...item,
      id: String(item._id),
      coverMessage: item.coverLetter,
      profile: item.applicant ? profilesByUser.get(String(item.applicant._id)) || null : null,
      team: item.team ? {
        id: String(item.team._id),
        name: item.team.name,
        members: (item.team.members || []).map((member) => ({ id: String(member.user?._id || member.user), name: member.user?.name || "Team member", avatar: member.user?.avatar || "", role: member.role })),
      } : null,
    }));

    return res.status(200).json({
      success: true,
      data: {
        applications: formattedApplications,
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

    const session = await mongoose.startSession();
    let application;
    let responseError;
    try {
      await session.withTransaction(async () => {
        const query = Application.findById(applicationId);
        const sessionQuery = query.session ? query.session(session) : query;
        application = await (sessionQuery.populate ? sessionQuery.populate({ path: "project", select: "owner status studentsRequired maxTeamSize" }) : sessionQuery);
        if (!application || !application.project) { responseError = [404, "Application not found."]; return; }
        if (String(application.project.owner?._id ?? application.project.owner) !== String(req.user._id)) { responseError = [404, "Application not found."]; return; }
        if (["accepted", "rejected", "withdrawn"].includes(application.status)) { responseError = [400, "This application has already been finalized."]; return; }
        if (!["open", "in_progress"].includes(application.project.status)) { responseError = [400, "Applications can only be reviewed while the project is accepting selections."]; return; }
        const transitions = { applied: ["under_review", "rejected"], pending: ["under_review", "rejected"], under_review: ["shortlisted", "rejected"], shortlisted: ["selected", "rejected"] };
        if (!(transitions[application.status] || []).includes(value.status)) { responseError = [400, `Cannot change application status from '${application.status}' to '${value.status}'.`]; return; }
        if (value.status === "selected") {
          const capacity = application.project.studentsRequired ?? application.project.maxTeamSize ?? 1;
          const countQuery = Application.countDocuments({ project: application.project._id, status: { $in: ["selected", "accepted"] } });
          const selectedCount = await (countQuery.session ? countQuery.session(session) : countQuery);
          if (selectedCount >= capacity) { responseError = [409, "Project selection capacity is full."]; return; }
          const participantIds = [application.applicant].filter(Boolean);
          if (application.team) {
            const teamQuery = Team.findById(application.team);
            const team = await (teamQuery.session ? teamQuery.session(session) : teamQuery);
            for (const member of team?.members || []) if (member.user) participantIds.push(member.user._id || member.user);
          }
          const reservation = await Project.updateOne(
            { _id: application.project._id, status: { $in: ["open", "in_progress"] } },
            {
              $set: { status: "in_progress" },
              $inc: { selectionVersion: 1 },
              ...(participantIds.length ? { $addToSet: { participants: { $each: participantIds } } } : {}),
            },
            { session }
          );
          if (reservation.matchedCount === 0) { responseError = [409, "The project is no longer open."]; return; }
          application.status = "selected";
          application.selectedAt = new Date();
          await application.save({ session });
          await createNotification({ recipient: application.applicant, type: "application_selected", message: "Your project application was selected.", resourceId: application._id, session });
        } else {
          application.status = value.status;
          await application.save({ session });
          await createNotification({ recipient: application.applicant, type: `application_${value.status}`, message: `Your project application status changed to ${value.status.replaceAll("_", " ")}.`, resourceId: application._id, session });
        }
      });
    } finally { await session.endSession(); }

    if (responseError) return res.status(responseError[0]).json({ success: false, message: responseError[1] });

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

    if (!["pending", "applied", "shortlisted"].includes(application.status)) {
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
