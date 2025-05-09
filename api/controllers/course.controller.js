import Course from "../models/course.model.js";
import { AppError } from "../utils/apperror.js";

// GET: All courses
export const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .sort({ updatedAt: -1 })
      .select("-lessons")
      .populate("category", "name -_id")
      .populate("instructor", "fullName profilePicture")
      .lean();

    if (!courses) {
      throw new AppError("No courses found", 404);
    }
    // Transform category to string array
    const formattedCourses = courses.map((course) => ({
      ...course,
      category: course.category.map((cat) => cat.name),
    }));

    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      courses: formattedCourses,
    });
  } catch (error) {
    next(error);
  }
};

// GET: Single course
export const getCourseById = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId)
      .populate("category instructor lessons")
      .lean();

    if (!course) {
      throw new AppError("Course not found!", 404);
    }

    res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// POST: Add new course
export const addCourse = async (req, res, next) => {
  try {
    const { title, category, description, features, thumbnailImage } =
      req.body || {};

    // Check role
    if (req.user.role !== "instructor") {
      throw new AppError("Only instructors can create a course.", 403);
    }

    // Validate required fields
    if (
      !title?.trim() ||
      !description?.trim() ||
      !Array.isArray(category) ||
      !category.length ||
      !Array.isArray(features) ||
      !features.length ||
      !thumbnailImage?.trim()
    ) {
      throw new AppError(
        "All required fields must be provided and non-empty.",
        400
      );
    }

    const newCourse = await Course.create({
      title,
      description,
      category,
      features,
      thumbnailImage,
      instructor: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (error) {
    next(error);
  }
};

// PUT: Update course
export const updateCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const allowedFields = [
      "title",
      "category",
      "description",
      "features",
      "lessons",
      "thumbnailImage",
      "rating",
      "enrolledCount",
    ];

    const updates = {};
    for (let key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError("No valid fields provided for update.", 400);
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedCourse) {
      throw new AppError("Course not found for update!", 404);
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE: Remove course
export const deleteCourse = async (req, res, next) => {
  // Check role
  if (req.user.role !== "instructor" || req.user.role !== "admin") {
    throw new AppError("Only instructors can create a course.", 403);
  }

  try {
    const { courseId } = req.params;

    const deletedCourse = await Course.findByIdAndDelete(courseId).lean();

    if (!deletedCourse) {
      throw new AppError("Course not found for deletion!", 404);
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: deletedCourse,
    });
  } catch (error) {
    next(error);
  }
};
