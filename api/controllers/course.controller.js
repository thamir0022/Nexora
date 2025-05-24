import { isValidObjectId } from "mongoose";
import Course from "../models/course.model.js";
import { AppError } from "../utils/apperror.js";
import natural from "natural";
import sw from "stopword";

// GET: All courses
export const getAllCourses = async (req, res, next) => {
  try {
    const { query = "", page = 1, limit = 12 } = req.query;

    const filter = query ? { $text: { $search: query } } : {};

    const skip = (Number(page) - 1) * Number(limit);

    const courses = await Course.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-lessons -keywords -tags")
      .populate("category", "name")
      .populate("instructor", "fullName profilePicture")
      .lean();

    if (!courses.length) throw new AppError("No courses found", 404);

    const formattedCourses = courses.map((course) => ({
      ...course,
      category: Array.isArray(course.category)
        ? course.category.map((cat) => cat.name)
        : [course.category?.name].filter(Boolean),
    }));

    const totalCourses = formattedCourses.length;

    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      courses: formattedCourses,
      totalCourses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCourses / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET: Single course
export const getCourseById = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!courseId || !isValidObjectId(courseId)) {
      const message = courseId ? "Invalid course Id" : "Course Id is required";
      throw new AppError(message, 400);
    }

    const course = await Course.findById(courseId)
      .populate([
        {
          path: "category",
          select: "name -_id",
        },
        {
          path: "instructor",
          select: "fullName email profilePicture -_id", // only fetch name and email
        },
        {
          path: "lessons",
          select: "-_id",
        },
      ])
      .lean();

    if (!course) throw new AppError("Course not found!", 404);

    const formattedData = {
      ...course,
      category: course.category.map((cat) => cat.name),
    };

    res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      course: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

// POST: Add new course
const REQFIELDS = [
  "title",
  "description",
  "price",
  "category",
  "features",
  "thumbnailImage",
];

export const addCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      category,
      features,
      thumbnailImage,
      tags = [
        "react",
        "javascript",
        "developing",
        "web",
        "programming",
        "frontend",
      ],
    } = req.body || {};

    // Check role
    if (!["instructor", "admin"].includes(req.user.role))
      throw new AppError("Only instructors can create a course.", 403);

    const missingFields = REQFIELDS.filter((field) => !req.body[field]);

    if (missingFields.length)
      throw new AppError(
        `Missing required fields: ${missingFields.join(", ")}`,
        400
      );

    // Validate required fields
    if (
      !title?.trim() ||
      !description?.trim() ||
      !Array.isArray(category) ||
      !category.length ||
      !Array.isArray(features) ||
      !features.length ||
      !thumbnailImage?.trim()
    )
      throw new AppError(
        "All required fields must be provided and non-empty.",
        400
      );

    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;

    // Combine course content
    const courseText = `${title} ${description} ${tags}`;

    // 1. Tokenize
    const tokens = tokenizer.tokenize(courseText.toLowerCase());

    // 2. Remove stopwords
    const filtered = sw.removeStopwords(tokens);

    // 3. Stem the filtered words
    const stemmed = filtered.map((word) => stemmer.stem(word));

    // 4. Remove duplicates
    const keywords = [...new Set(stemmed.filter((word) => word.length > 2))];

    const newCourse = await Course.create({
      title,
      description,
      price,
      category,
      tags,
      features,
      thumbnailImage,
      instructor: req.user._id,
      keywords,
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error) {
    next(error);
  }
};

// PUT: Update course
export const updateCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!courseId || !isValidObjectId(courseId)) {
      const message = courseId ? "Invalid course Id" : "Course Id is required";
      throw new AppError(message, 400);
    }

    const allowedFields = [
      "title",
      "category",
      "description",
      "features",
      "lessons",
      "thumbnailImage",
      "rating",
      "enrolledCount",
      "keywords",
      "tags"
    ];

    const updates = {};
    for (let key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0)
      throw new AppError("No valid fields provided for update.", 400);

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedCourse) throw new AppError("Course not found for update!", 404);
    
    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      updatedCourse,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE: Remove course
export const deleteCourse = async (req, res, next) => {
  // Check role
  if (!["instructor", "admin"].includes(req.user.role))
    throw new AppError("Only instructors can create a course.", 403);

  try {
    const { courseId } = req.params;

    if (!courseId || !isValidObjectId(courseId)) {
      const message = courseId ? "Invalid course Id" : "Course Id is required";
      throw new AppError(message, 400);
    }

    const deletedCourse = await Course.findByIdAndDelete(courseId).lean();

    if (!deletedCourse)
      throw new AppError("Course not found for deletion!", 404);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      deletedCourse,
    });
  } catch (error) {
    next(error);
  }
};
