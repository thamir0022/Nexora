import { Router } from "express";
import {
  addCourse,
  deleteCourse,
  getAllCourses,
  getAllMessages,
  getCourseById,
  getCourseProgress,
  sendCourseMessage,
  updateCourse,
  updateLessonProgress,
} from "../controllers/course.controller.js";
import { verifyUser } from "../utils/verifyUser.js";
import {
  createLesson,
  deleteLessonInCourse,
  getLessonInCourse,
  getLessonsInCourse,
  updateLessonInCourse,
} from "../controllers/lesson.controller.js";

const router = Router();

// Course
router.get("/all", getAllCourses);
router.post("/", verifyUser, addCourse);
router.get("/:courseId", verifyUser, getCourseById);
router.get("/:courseId/progress", verifyUser, getCourseProgress);
router.patch("/:courseId", verifyUser, updateCourse);
router.delete("/:courseId", verifyUser, deleteCourse);

// Course lesson
router.get("/:courseId/lessons", verifyUser, getLessonsInCourse);
router.post("/:courseId/lessons", verifyUser, createLesson);
router.get("/:courseId/lessons/:lessonId", verifyUser, getLessonInCourse);
router.put(
  "/:courseId/lessons/:lessonId/progress",
  verifyUser,
  updateLessonProgress
);
router.patch("/:courseId/lessons/:lessonId", verifyUser, updateLessonInCourse);
router.delete("/:courseId/lessons/:lessonId", verifyUser, deleteLessonInCourse);

router.get("/:courseId/messages", verifyUser, getAllMessages);
router.post("/:courseId/messages", verifyUser, sendCourseMessage);

export default router;
