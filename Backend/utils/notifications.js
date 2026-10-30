import mongoose from "mongoose";
import Notification from "../models/Notification.js";

// Avoid buffering notifications when a controller is exercised without a DB.
export async function createNotification({ recipient, type, message, resourceId, session }) {
  if (!recipient || mongoose.connection.readyState !== 1) return null;
  const [notification] = await Notification.create(
    [{ recipient, type, message, resourceId: resourceId ?? null }],
    session ? { session } : undefined
  );
  return notification;
}

export async function createNotifications(items, options = {}) {
  const unique = [...new Map(items.filter((item) => item.recipient).map((item) => [String(item.recipient), item])).values()];
  if (!unique.length || mongoose.connection.readyState !== 1) return [];
  return Notification.insertMany(unique, options);
}
