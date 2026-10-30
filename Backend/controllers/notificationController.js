import mongoose from "mongoose";
import Notification from "../models/Notification.js";

export const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const filter = { recipient: req.user._id };
    const [notifications, total, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, readAt: null }),
    ]);

    return res.json({
      success: true,
      message: "Notifications retrieved.",
      data: {
        notifications: notifications.map((item) => ({
          id: String(item._id),
          type: item.type,
          message: item.message,
          resourceId: item.resourceId ? String(item.resourceId) : null,
          readAt: item.readAt,
          createdAt: item.createdAt,
        })),
        unread,
      },
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.notificationId)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID.", errors: [] });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipient: req.user._id },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found.", errors: [] });
    return res.json({ success: true, message: "Notification marked as read.", data: { id: String(notification._id), readAt: notification.readAt } });
  } catch (error) {
    return next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    return res.json({ success: true, message: "Notifications marked as read.", data: {} });
  } catch (error) {
    return next(error);
  }
};
