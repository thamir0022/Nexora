import { lessonFields } from "../constants/userFields.js";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Lesson from "../models/lesson.model.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/apperror.js";
import { hasAccess } from "../utils/lib.js";

export const createLesson = async (req, res, next) => {
  const { role: reqUserRole, _id: reqUserId } = req.user;

  if (!req.body || typeof req.body !== "object")
    throw new AppError("Invalid or missing request body", 400);

  try {
    const { courseId } = req.params;

    // Authorization
    if (reqUserRole !== "instructor")
      throw new AppError("Only instructors can create lessons", 403);

    // Check if course exists
    const course = await Course.findById(courseId);

    if (!course) throw new AppError("Course not found", 404);


    if (String(reqUserId) !== String(course.instructor))
      throw new AppError(
        "Only the course instructor can add lessons to this course.",
        403
      );

    let lessonData = {};

    for (let key of lessonFields) {
      if (req.body[key] != undefined) lessonData[key] = req.body[key];
    }

    const newLesson = await Lesson.create(lessonData);

    course.lessons.push(newLesson._id);

    await course.save();


    res.status(201).json({
      success: true,
      message: "Lesson created and added to course",
      lesson: newLesson,
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonInCourse = async (req, res, next) => {
  try {
    const { _id, role } = req.user;
    const { courseId, lessonId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId);

    if (!course) throw new AppError("Course not found", 404);

    if (!hasAccess(courseId, _id, role)) {
      throw new AppError(
        "You are not enrolled in this course. Please purchase or enroll to access the content.",
        403,
        "not-purchased"
      );
    }

    if (!course.lessons.includes(lessonId))
      throw new AppError("Lesson not part of this course", 400);

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new AppError("Lesson not found", 404);

    await Enrollment.updateOne({user: _id, course: courseId}, {$set: {lastAccessed: Date.now()}});
    
    res.status(200).json({
      success: true,
      message: "Lesson fetched successfully",
      lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonsInCourse = async (req, res, next) => {
  try {
    const { _id, role } = req.user;
    const { courseId } = req.params;

    const course = await Course.findById(courseId).lean();
    if (!course) throw new AppError("Course not found", 404);

    if (!hasAccess(courseId, _id, role))
      throw new AppError("You are not allowed to get this course data", 403);

    if (course.lessons.length === 0)
      throw new AppError("No lessons found in this course", 404);

    const lessons = await Lesson.find({ _id: { $in: course.lessons } }).lean();


    res.status(200).json({
      success: true,
      message: "Lessons fetched successfully",
      count: lessons.length,
      lessons,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLessonInCourse = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const { role, _id } = req.user;

    if (role !== "instructor")
      throw new AppError("Only instructors can delete lessons", 403);

    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found", 404);

    if (course.instructor.toString() !== _id) throw new AppError("You are not allowed to delete this lesson", 403);

    if (!course.lessons.includes(lessonId)) {
      throw new AppError("Lesson not part of this course", 400);
    }

    course.lessons = course.lessons.filter((id) => id.toString() !== lessonId);
    await course.save();

    const deletedLesson = await Lesson.findByIdAndDelete(lessonId);
    if (!deletedLesson) throw new AppError("Lesson not found", 404);

    res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateLessonInCourse = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const { role, _id } = req.user;

    if (role !== "instructor")
      throw new AppError("Only instructors can update lessons", 403);

    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found", 404);

    if (!course.lessons.includes(lessonId)) {
      throw new AppError("Lesson not part of this course", 400);
    }

    const allowedFields = [
      "title",
      "description",
      "duration",
      "thumbnailImage",
      "videoUrl",
      "noteUrls",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(lessonId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedLesson) throw new AppError("Lesson not found", 404);

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      updatedLesson,
    });
  } catch (error) {
    next(error);
  }
};
