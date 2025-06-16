import express from "express";
import { getNotifications, sendNotification, markAsRead, deleteNotification, markAllAsRead } from "../controllers/notification.controller.js";
import { verifyUser } from "../utils/verifyUser.js";

const router = express.Router();

router.get("/", verifyUser, getNotifications);
router.post("/", verifyUser, sendNotification);
router.patch("/:notificationId/mark-as-read", verifyUser, markAsRead);
router.delete("/:notificationId", verifyUser, deleteNotification);
router.post("/mark-all-as-read", verifyUser, markAllAsRead);

export default router;