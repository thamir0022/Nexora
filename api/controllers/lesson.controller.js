import Course from "../models/course.model.js";
import Lesson from "../models/lesson.model.js";
import { AppError } from "../utils/apperror.js";

export const createLesson = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const {
      title, description, duration, thumbnailImage, videoUrl, noteUrls = [],
    } = req.body;

    if (!["instructor", "admin"].includes(req.user.role)) {
      throw new AppError("Only instructors can create lessons", 403);
    }

    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found", 404);

    if (!title || !description || !duration || !thumbnailImage || !videoUrl) {
      throw new AppError("Missing required lesson fields", 400);
    }

    const lesson = await Lesson.create({
      title,
      description,
      duration,
      thumbnailImage,
      videoUrl,
      noteUrls,
    });

    course.lessons.push(lesson._id);
    await course.save();

    res.status(201).json({
      success: true,
      message: "Lesson created and added to course",
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};


export const getLessonInCourse = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found", 404);

    if (!course.lessons.includes(lessonId)) {
      throw new AppError("Lesson not part of this course", 400);
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new AppError("Lesson not found", 404);

    res.status(200).json({
      success: true,
      message: "Lesson fetched successfully",
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};


export const getLessonsInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).exec();
    if (!course) throw new AppError("Course not found", 404);

    if (!Array.isArray(course.lessons) || course.lessons.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No lessons found in this course",
        count: 0,
        data: [],
      });
    }

    const lessons = await Lesson.find({ _id: { $in: course.lessons } }).exec();

    res.status(200).json({
      success: true,
      message: "Lessons fetched successfully",
      count: lessons.length,
      data: lessons,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLessonInCourse = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;

    if (req.user.role !== "instructor") {
      throw new AppError("Only instructors can delete lessons", 403);
    }

    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found", 404);

    if (!course.lessons.includes(lessonId)) {
      throw new AppError("Lesson not part of this course", 400);
    }

    course.lessons = course.lessons.filter(
      id => id.toString() !== lessonId
    );
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

    if (req.user.role !== "instructor") {
      throw new AppError("Only instructors can update lessons", 403);
    }

    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found", 404);

    if (!course.lessons.includes(lessonId)) {
      throw new AppError("Lesson not part of this course", 400);
    }

    const allowedFields = [
      "title", "description", "duration", "thumbnailImage", "videoUrl", "noteUrls",
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
      data: updatedLesson,
    });
  } catch (error) {
    next(error);
  }
};
