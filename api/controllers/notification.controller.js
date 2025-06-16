import { isValidObjectId } from 'mongoose';
import Notification from '../models/notification.model.js';
import { AppError } from '../utils/apperror.js';
import { generateNotification } from '../utils/lib.js';

export const sendNotification = async (req, res) => {
  const { receiver, message, type } = req.body;
  const { _id: sender, role } = req.user;

  if (!["admin", "instructor"].includes(role)) throw new AppError("Unauthorized", 401);

  if (!receiver || !message || !type) throw new AppError("Missing required fields", 400);

  await generateNotification(sender, receiver, message, type);

  res.status(201).json({ success: true, message: "Notification sent successfully" });
};


export const getNotifications = async (req, res, next) => {
  const { _id: receiver } = req.user;
  const { filter } = req.query;
  const query = filter === "unread" ? { isRead: false } : {};
  try {
    const notifications = await Notification.find({ receiver, ...query }).sort({ isRead: 1, createdAt: -1 });
    if (!notifications) throw new AppError("No notifications found", 404);

    res.status(200).json({ success: true, message: "Notifications fetched successfully", notifications });
  } catch (error) {
    next(error);
  }
}


export const markAsRead = async (req, res, next) => {
  const { _id: receiver } = req.user;
  const { notificationId } = req.params;

  console.log(notificationId)
  try {
    if (!notificationId || !isValidObjectId(notificationId)) throw new AppError("Invalid notification id", 400);

    const notification = await Notification.findById(notificationId);

    if (!notification) throw new AppError("Notification not found", 404);

    if (String(notification?.receiver) !== String(receiver)) throw new AppError("Unauthorized", 401);

    notification.isRead = true;
    await notification.save();
    res.status(200).json({ success: true, message: "Notification marked as read successfully" });
  } catch (error) {
    next(error);
  }
}

export const markAllAsRead = async (req, res, next) => {
  const { _id: receiver } = req.user;
  try {
    await Notification.updateMany({ receiver }, { isRead: true });
    res.status(200).json({ success: true, message: "All notifications marked as read successfully" });
  } catch (error) {
    next(error);
  }
}

export const deleteNotification = async (req, res, next) => {
  const { _id: receiver } = req.user;
  const { notificationId } = req.params;
  try {
    if (!notificationId || !isValidObjectId(notificationId)) throw new AppError("Invalid notification id", 400);

    const notification = await Notification.findById(notificationId);

    if (!notification) throw new AppError("Notification not found", 404);

    if (String(notification?.receiver) !== String(receiver)) throw new AppError("Unauthorized", 401);

    await notification.deleteOne();
    res.status(200).json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    next(error);
  }
}