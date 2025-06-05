import { isValidObjectId } from "mongoose";
import Course from "../models/course.model.js";
import Lesson from "../models/lesson.model.js";
import { AppError } from "../utils/apperror.js";
import natural from "natural";
import sw from "stopword";
import { getSort, hasAccess } from "../utils/lib.js";
import User from "../models/user.model.js";

// GET: All courses
export const getAllCourses = async (req, res, next) => {
  try {
    const {
      query = "",
      page = 1,
      limit = 12,
      status = "published",
      sortBy,
    } = req.query;

    if (!["draft", "published", "archived", "all"].includes(status))
      throw new AppError("Invalid status filter", 400);

    // Build filter
    const filter = {
      ...(status === "all" ? {} : { status }),
      ...(query && { $text: { $search: query } }),
    };

    const skip = (Number(page) - 1) * Number(limit);

    const courses = await Course.find(filter)
      .sort(getSort(sortBy))
      .skip(skip)
      .limit(Number(limit))
      .select("-lessons -keywords -tags")
      .populate("category", "name")
      .populate("instructor", "fullName profilePicture")
      .lean();

    if (!courses.length) throw new AppError("No courses found", 404);

    const totalCourses = courses.length;

    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      courses,
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
    const { _id, role } = req.user;
    const { courseId } = req.params;

    if (!courseId || !isValidObjectId(courseId)) {
      const message = courseId ? "Invalid course Id" : "Course Id is required";
      throw new AppError(message, 400);
    }

    const hasUserAccess = await hasAccess(courseId, _id, role);

    const course = await Course.findById(courseId)
      .populate([
        {
          path: "category",
          select: "name",
        },
        {
          path: "instructor",
          select: "fullName email profilePicture", // only fetch name and email
        },
        {
          path: "lessons",
          select: hasUserAccess ? "" : "title description thumbnailImage",
        },
      ])
      .lean();

    if (!course) throw new AppError("Course not found!", 404);

    res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      course,
      hasAccess: hasUserAccess,
    });
  } catch (error) {
    next(error);
  }
};

// POST: Add new course
const REQFIELDS = ["title", "description", "price", "category", "hashtags"];

export const addCourse = async (req, res, next) => {
  try {
    const { title, description, price, category, hashtags } = req.body || {};

    // Check role
    if (req.user.role != "instructor")
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
      !Array.isArray(hashtags) ||
      !hashtags.length
    )
      throw new AppError(
        "All required fields must be provided and non-empty.",
        400
      );

    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;

    // Combine course content
    const courseText = `${title} ${description} ${hashtags} ${req.user.fullName}`;

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
      hashtags,
      instructor: req.user._id,
      keywords,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { courses: newCourse._id },
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
  console.log(req.body);
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
      "tags",
    ];

    const updates = {};
    for (let key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    console.log(updates);

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
    throw new AppError("Only instructors can delete a course.", 403);

  try {
    const { courseId } = req.params;

    if (!courseId || !isValidObjectId(courseId)) {
      const message = courseId ? "Invalid course Id" : "Course Id is required";
      throw new AppError(message, 400);
    }

    const deletedCourse = await Course.findByIdAndDelete(courseId).lean();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { courses: courseId },
    });

    if (!deletedCourse)
      throw new AppError("Course not found for deletion!", 404);

    await Lesson.deleteMany({ _id: { $in: deletedCourse.lessons } });

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      deletedCourse,
    });
  } catch (error) {
    next(error);
  }
};
