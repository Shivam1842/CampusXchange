import mongoose from "mongoose";
import SkillRequest from "../models/SkillRequest.js";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import Notification from "../models/Notification.js";
import { createNotification } from "../utils/notifications.js";

const formatRequest = (request) => {
  const value = request.toObject ? request.toObject() : request;
  const { _id, __v, sender, recipient, ...fields } = value;

  const formatUser = (user) => {
    if (!user) return null;
    const id = user._id ?? user.id;

    return {
      id: String(id),
      name: user.name,
      avatar: user.avatar ?? "",
    };
  };

  return {
    id: String(_id),
    ...fields,
    sender: formatUser(sender),
    recipient: formatUser(recipient),
  };
};

const requireStudent = (req, res) => {
  if (req.user.role === "student") return true;

  res.status(403).json({
    success: false,
    message: "Only students can manage skill-partner requests.",
    errors: [],
  });
  return false;
};

export const sendSkillRequest = async (req, res, next) => {
  try {
    if (!requireStudent(req, res)) return;

    const recipientId = req.params.userId || req.body?.recipientId;

    if (!mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient ID.",
        errors: [{ field: "userId", message: "A valid user ID is required." }],
      });
    }

    if (String(req.user._id) === recipientId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a skill request to yourself.",
        errors: [],
      });
    }

    const recipient = await User.findOne({
      _id: recipientId,
      role: "student",
      status: "active",
    }).select("_id");

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Active student recipient not found.",
        errors: [],
      });
    }

    const recipientProfile = await Profile.exists({ user: recipient._id });

    if (!recipientProfile) {
      return res.status(404).json({
        success: false,
        message: "The student does not have a profile yet.",
        errors: [],
      });
    }

    const existing = await SkillRequest.findOne({
      sender: req.user._id,
      recipient: recipient._id,
      status: "pending",
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A pending request already exists for this student.",
        errors: [],
      });
    }

    const request = await SkillRequest.create({
      sender: req.user._id,
      recipient: recipient._id,
    });
    await Notification.create({
      recipient: recipient._id,
      type: "skill_request",
      message: `${req.user.name} sent you a skill-partner request.`,
      resourceId: request._id,
    });

    const savedRequest = await SkillRequest.findById(request._id)
      .populate("sender", "name avatar")
      .populate("recipient", "name avatar");

    return res.status(201).json({
      success: true,
      message: "Skill-partner request sent.",
      data: { request: formatRequest(savedRequest) },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A pending request already exists for this student.",
        errors: [],
      });
    }
    next(error);
  }
};

export const listSkillRequests = async (req, res, next) => {
  try {
    if (!requireStudent(req, res)) return;

    const { status, page, limit } = req.skillRequestQuery;
    const direction = req.skillRequestQuery.box === "sent" ? "outgoing" : req.skillRequestQuery.box === "received" ? "incoming" : req.skillRequestQuery.direction || "incoming";
    const filter = {
      [direction === "outgoing" ? "sender" : "recipient"]: req.user._id,
    };

    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      SkillRequest.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("sender", "name avatar")
        .populate("recipient", "name avatar"),
      SkillRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Skill-partner requests retrieved successfully.",
      data: { requests: requests.map(formatRequest) },
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const respondToSkillRequest = async (req, res, next, nextStatus) => {
  try {
    if (!requireStudent(req, res)) return;

    if (!mongoose.isValidObjectId(req.params.requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill-request ID.",
        errors: [{ field: "requestId", message: "A valid request ID is required." }],
      });
    }

    const request = await SkillRequest.findOneAndUpdate(
      {
        _id: req.params.requestId,
        recipient: req.user._id,
        status: "pending",
      },
      { $set: { status: nextStatus } },
      { new: true, runValidators: true }
    )
      .populate("sender", "name avatar")
      .populate("recipient", "name avatar");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Pending incoming request not found.",
        errors: [],
      });
    }

    await createNotification({ recipient: request.sender?._id ?? request.sender, type: `skill_request_${nextStatus}`, message: `${req.user.name} ${nextStatus} your skill-partner request.`, resourceId: request._id });

    return res.status(200).json({
      success: true,
      message: `Skill-partner request ${nextStatus}.`,
      data: { request: formatRequest(request) },
    });
  } catch (error) {
    next(error);
  }
};

export const acceptSkillRequest = (req, res, next) =>
  respondToSkillRequest(req, res, next, "accepted");

export const rejectSkillRequest = (req, res, next) =>
  respondToSkillRequest(req, res, next, "rejected");
