import { getIo } from "../config/socketio.js";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Notification from "../models/notification.model.js";
import { AppError } from "./apperror.js";

export const getSort = (sortBy) => {
  switch (sortBy) {
    case "price_asc":
      return { price: 1 };
    case "price_desc":
      return { price: -1 };
    case "name_asc":
      return { name: 1 };
    case "name_desc":
      return { name: -1 };
    default:
      return { createdAt: -1 }; // default sort by latest
  }
};

export const hasAccess = async (courseId, userId, userRole) => {
  const course = await Course.findById(courseId)
    .select("instructor") // only fetch what you need
    .lean();

  if (!course) throw new AppError("Course not found!", 404);

  // Grant access if the user is an admin
  if (userRole === "admin") return true;

  // Grant access if the user is the course instructor
  if (course.instructor.toString() === userId) return true;

  // Grant access if the user has purchased the course
  const isEnrolled = await Enrollment.exists({ user: userId, course: courseId });
  return !!isEnrolled;
};


export const generateNotification = async (sender, receiver, message, type) => {
  const notification = new Notification({
    sender,
    receiver,
    message,
    type,
    isRead: false
  });

  await notification.save();

  // Emit to user's personal socket room
  getIo().to(receiver).emit('new_notification', {
    _id: notification._id,
    message,
    type,
    createdAt: notification.createdAt
  });
};