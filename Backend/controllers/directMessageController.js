import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import DirectMessage from "../models/DirectMessage.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Application from "../models/Application.js";
import Team from "../models/Team.js";
import { createNotifications } from "../utils/notifications.js";

const id = (value) => String(value?._id || value);
const isId = (value) => mongoose.isValidObjectId(value);

export async function listConversations(req, res, next) {
  try {
    const conversations = await Conversation.find({ participants: req.user._id }).sort({ lastMessageAt: -1 }).populate("participants", "name role avatar").populate("project", "title").lean();
    const rows = await Promise.all(conversations.map(async (item) => {
      const latest = await DirectMessage.findOne({ conversation: item._id }).sort({ createdAt: -1 }).lean();
      return { id: String(item._id), type: item.type, project: item.project, participants: item.participants, lastMessageAt: item.lastMessageAt, latestMessage: latest ? { text: latest.text, createdAt: latest.createdAt, sender: String(latest.sender) } : null };
    }));
    return res.json({ success: true, data: { conversations: rows } });
  } catch (error) { return next(error); }
}

export async function startDirectConversation(req, res, next) {
  try {
    const { recipientId, projectId } = req.body || {};
    if (!isId(recipientId) || id(recipientId) === id(req.user) || !["student", "client"].includes(req.user.role)) return res.status(400).json({ success: false, message: "Choose another student or client.", errors: [] });
    const recipient = await User.findOne({ _id: recipientId, status: "active", role: { $in: ["student", "client"] } }).select("_id");
    if (!recipient) return res.status(404).json({ success: false, message: "Account not found.", errors: [] });
    let project = null;
    if (projectId) {
      if (!isId(projectId)) return res.status(400).json({ success: false, message: "Invalid project identifier.", errors: [] });
      project = await Project.findById(projectId).select("_id owner");
      if (!project || id(project.owner) !== id(req.user) || req.user.role !== "client") return res.status(403).json({ success: false, message: "You cannot start a project conversation for this project.", errors: [] });
      const application = await Application.findOne({ project: project._id, applicant: recipient._id, status: "selected" }).select("_id");
      if (!application) return res.status(403).json({ success: false, message: "Project conversations are available to selected applicants.", errors: [] });
    }
    const participants = [req.user._id, recipient._id].sort((a, b) => id(a).localeCompare(id(b)));
    let conversation = await Conversation.findOne({ type: "direct", participants: { $all: participants, $size: 2 } });
    if (!conversation) conversation = await Conversation.create({ type: "direct", participants, ...(project ? { project: project._id } : {}) });
    return res.status(200).json({ success: true, data: { conversationId: String(conversation._id) } });
  } catch (error) { return next(error); }
}

export async function startProjectTeamConversation(req, res, next) {
  try {
    const { projectId } = req.body || {};
    if (!isId(projectId)) return res.status(400).json({ success: false, message: "A valid project is required.", errors: [] });
    const project = await Project.findById(projectId).select("_id owner");
    if (!project) return res.status(404).json({ success: false, message: "Project not found.", errors: [] });
    const selected = await Application.find({ project: project._id, status: "selected" }).select("applicant team").lean();
    if (!selected.length) return res.status(409).json({ success: false, message: "Select an applicant before starting a project conversation.", errors: [] });
    const participantIds = new Set([id(req.user)]);
    for (const application of selected) {
      if (application.team) {
        const team = await Team.findById(application.team).select("members.user").lean();
        for (const member of team?.members || []) participantIds.add(id(member.user));
      } else participantIds.add(id(application.applicant));
    }
    if (id(project.owner) !== id(req.user) && !participantIds.has(id(req.user))) return res.status(403).json({ success: false, message: "Only the project client or selected team members can start this conversation.", errors: [] });
    const participants = [...participantIds];
    let conversation = await Conversation.findOne({ type: "project_team", project: project._id });
    if (!conversation) conversation = await Conversation.create({ type: "project_team", project: project._id, participants });
    else {
      conversation.participants = [...new Set([...conversation.participants.map(id), ...participants])];
      await conversation.save();
    }
    return res.status(200).json({ success: true, data: { conversationId: String(conversation._id) } });
  } catch (error) { return next(error); }
}

async function getConversation(req, res) {
  if (!isId(req.params.id)) return null;
  return Conversation.findOne({ _id: req.params.id, participants: req.user._id });
}

export async function getMessages(req, res, next) {
  try {
    const conversation = await getConversation(req, res);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found.", errors: [] });
    await DirectMessage.updateMany({ conversation: conversation._id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } }, { $addToSet: { readBy: req.user._id } });
    const messages = await DirectMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 }).limit(200).populate("sender", "name role avatar").lean();
    return res.json({ success: true, data: { messages: messages.map((message) => ({ id: String(message._id), text: message.text, sender: message.sender, createdAt: message.createdAt, read: message.readBy.some((userId) => id(userId) === id(req.user)) })) } });
  } catch (error) { return next(error); }
}

export async function sendMessage(req, res, next) {
  try {
    const conversation = await getConversation(req, res);
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found.", errors: [] });
    if (!text || text.length > 5000) return res.status(400).json({ success: false, message: "Message must contain between 1 and 5000 characters.", errors: [] });
    const message = await DirectMessage.create({ conversation: conversation._id, sender: req.user._id, text, readBy: [req.user._id] });
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    const recipients = conversation.participants.filter((participant) => id(participant) !== id(req.user)).map((recipient) => ({ recipient, type: "new_message", message: `${req.user.name || "A participant"} sent you a message.`, resourceId: conversation._id }));
    await createNotifications(recipients);
    return res.status(201).json({ success: true, data: { message: { id: String(message._id), text: message.text, sender: id(message.sender), createdAt: message.createdAt, read: true } } });
  } catch (error) { return next(error); }
}
