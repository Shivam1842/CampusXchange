import mongoose from "mongoose";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";

const authorizeWorkspace = async (projectId, userId) => {
  if (!mongoose.isValidObjectId(projectId)) return { error: "Invalid project ID.", status: 400 };
  const project = await Project.findById(projectId);
  if (!project) return { error: "Project not found.", status: 404 };
  const allowed = String(project.owner) === String(userId) || project.participants.some((id) => String(id) === String(userId));
  if (!allowed) return { error: "You do not have access to this workspace.", status: 403 };
  return { project };
};
const taskJson = (task) => ({ id: String(task._id), title: task.title, description: task.description, assignee: task.assignee ? String(task.assignee) : null, status: task.status, dueDate: task.dueDate?.toISOString?.() ?? null, createdAt: task.createdAt, updatedAt: task.updatedAt });
const messageJson = (message, userMap = new Map()) => ({ id: String(message._id), sender: userMap.get(String(message.sender)) || { id: String(message.sender) }, text: message.text, readBy: message.readBy.map(String), createdAt: message.createdAt });

export const getWorkspaceProject = async (req, res, next) => {
  try { const result = await authorizeWorkspace(req.params.projectId, req.user._id); if (result.error) return res.status(result.status).json({ success: false, message: result.error, errors: [] }); const project = result.project; await project.populate("owner", "name isVerified"); return res.json({ success: true, message: "Workspace retrieved.", data: { project: { id: String(project._id), title: project.title, description: project.description, status: project.status, client: { id: String(project.owner._id), name: project.owner.name, businessName: null, isVerified: project.owner.isVerified, rating: null }, skills: project.skillsRequired, deadline: project.applicationDeadline?.toISOString?.() ?? null, progress: project.progress } } }); } catch (error) { return next(error); }
};

export const getTasks = async (req, res, next) => {
  try { const result = await authorizeWorkspace(req.params.projectId, req.user._id); if (result.error) return res.status(result.status).json({ success: false, message: result.error, errors: [] }); return res.json({ success: true, message: "Tasks retrieved.", data: { tasks: result.project.tasks.map(taskJson), progress: result.project.progress } }); } catch (error) { return next(error); }
};
export const createTask = async (req, res, next) => {
  try { const result = await authorizeWorkspace(req.params.projectId, req.user._id); if (result.error) return res.status(result.status).json({ success: false, message: result.error, errors: [] }); const title = req.body?.title?.trim(); if (!title || title.length > 200) return res.status(400).json({ success: false, message: "Task title is required.", errors: [{ field: "title", message: "Use 1 to 200 characters." }] }); const assignee = req.body.assignee || null; if (assignee && String(assignee) !== String(result.project.owner) && !result.project.participants.some((id) => String(id) === String(assignee))) return res.status(403).json({ success: false, message: "Assignee must be a project participant.", errors: [{ field: "assignee", message: "Choose a project participant." }] }); result.project.tasks.push({ title, description: req.body.description || "", assignee, status: "not_started", dueDate: req.body.dueDate || null }); const done = result.project.tasks.filter((item) => item.status === "completed").length; result.project.progress = Math.round(done / result.project.tasks.length * 100); await result.project.save(); const task = result.project.tasks[result.project.tasks.length - 1]; return res.status(201).json({ success: true, message: "Task created.", data: { task: taskJson(task), progress: result.project.progress } }); } catch (error) { return next(error); }
};
export const updateTask = async (req, res, next) => {
  try { const result = await authorizeWorkspace(req.params.projectId, req.user._id); if (result.error) return res.status(result.status).json({ success: false, message: result.error, errors: [] }); const task = result.project.tasks.id(req.params.taskId); if (!task) return res.status(404).json({ success: false, message: "Task not found.", errors: [] }); if (Object.hasOwn(req.body, "assignee") && req.body.assignee && String(req.body.assignee) !== String(result.project.owner) && !result.project.participants.some((id) => String(id) === String(req.body.assignee))) return res.status(403).json({ success: false, message: "Assignee must be a project participant.", errors: [{ field: "assignee", message: "Choose a project participant." }] }); for (const key of ["title", "description", "assignee", "dueDate"]) if (Object.hasOwn(req.body, key)) task[key] = req.body[key]; if (Object.hasOwn(req.body, "status")) { if (!["not_started", "in_progress", "completed"].includes(req.body.status)) return res.status(422).json({ success: false, message: "Invalid task status.", errors: [{ field: "status", message: "Choose a canonical task status." }] }); task.status = req.body.status; } const done = result.project.tasks.filter((item) => item.status === "completed").length; result.project.progress = result.project.tasks.length ? Math.round(done / result.project.tasks.length * 100) : 0; await result.project.save(); return res.json({ success: true, message: "Task updated.", data: { task: taskJson(task), progress: result.project.progress } }); } catch (error) { return next(error); }
};
export const deleteTask = async (req, res, next) => {
  try { const result = await authorizeWorkspace(req.params.projectId, req.user._id); if (result.error) return res.status(result.status).json({ success: false, message: result.error, errors: [] }); const task = result.project.tasks.id(req.params.taskId); if (!task) return res.status(404).json({ success: false, message: "Task not found.", errors: [] }); task.deleteOne(); const done = result.project.tasks.filter((item) => item.status === "completed").length; result.project.progress = result.project.tasks.length ? Math.round(done / result.project.tasks.length * 100) : 0; await result.project.save(); return res.json({ success: true, message: "Task deleted.", data: { id: req.params.taskId, progress: result.project.progress } }); } catch (error) { return next(error); }
};
export const updateProgress = async (req, res, next) => {
  try { const result = await authorizeWorkspace(req.params.projectId, req.user._id); if (result.error) return res.status(result.status).json({ success: false, message: result.error, errors: [] }); const done = result.project.tasks.filter((item) => item.status === "completed").length; result.project.progress = result.project.tasks.length ? Math.round(done / result.project.tasks.length * 100) : 0; await result.project.save(); return res.json({ success: true, message: "Progress recalculated.", data: { progress: result.project.progress } }); } catch (error) { return next(error); }
};
export const getParticipants = async (req, res, next) => {
  try { const result = await authorizeWorkspace(req.params.projectId, req.user._id); if (result.error) return res.status(result.status).json({ success: false, message: result.error, errors: [] }); await result.project.populate("participants", "name avatar role"); return res.json({ success: true, message: "Participants retrieved.", data: { participants: result.project.participants.map((user) => ({ id: String(user._id), name: user.name, avatar: user.avatar, role: user.role })) } }); } catch (error) { return next(error); }
};
export const getMessages = async (req, res, next) => {
  try { const result = await authorizeWorkspace(req.params.projectId, req.user._id); if (result.error) return res.status(result.status).json({ success: false, message: result.error, errors: [] }); const ids = [...new Set(result.project.messages.map((message) => String(message.sender)))]; const User = mongoose.model("User"); const users = await User.find({ _id: { $in: ids } }).select("name avatar role").lean(); const map = new Map(users.map((user) => [String(user._id), { id: String(user._id), name: user.name, avatar: user.avatar, role: user.role }])); return res.json({ success: true, message: "Messages retrieved.", data: { messages: result.project.messages.map((message) => messageJson(message, map)) } }); } catch (error) { return next(error); }
};
export const createMessage = async (req, res, next) => {
  try {
    const result = await authorizeWorkspace(req.params.projectId, req.user._id);
    if (result.error) return res.status(result.status).json({ success: false, message: result.error, errors: [] });
    const text = req.body?.text?.trim();
    if (!text || text.length > 5000) return res.status(400).json({ success: false, message: "Message is required.", errors: [{ field: "text", message: "Use 1 to 5000 characters." }] });
    result.project.messages.push({ sender: req.user._id, text, readBy: [req.user._id] });
    await result.project.save();
    const message = result.project.messages[result.project.messages.length - 1];
    const recipients = [...new Set([String(result.project.owner), ...result.project.participants.map(String)])]
      .filter((recipient) => recipient !== String(req.user._id));
    if (recipients.length) {
      await Notification.insertMany(recipients.map((recipient) => ({
        recipient,
        type: "project_message",
        message: "A new message was posted in a project workspace.",
        resourceId: message._id,
      })));
    }
    return res.status(201).json({
      success: true,
      message: "Message saved.",
      data: { message: { ...messageJson(message), sender: { id: String(req.user._id), name: req.user.name, avatar: req.user.avatar, role: req.user.role } } },
    });
  } catch (error) { return next(error); }
};
export const markMessagesRead = async (req, res, next) => {
  try { const result = await authorizeWorkspace(req.params.projectId, req.user._id); if (result.error) return res.status(result.status).json({ success: false, message: result.error, errors: [] }); let count = 0; for (const message of result.project.messages) if (!message.readBy.some((id) => String(id) === String(req.user._id))) { message.readBy.push(req.user._id); count += 1; } await result.project.save(); return res.json({ success: true, message: "Messages marked as read.", data: { updated: count } }); } catch (error) { return next(error); }
};
