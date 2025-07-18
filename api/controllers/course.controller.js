import mongoose, { isValidObjectId } from "mongoose";
import Course from "../models/course.model.js";
import Lesson from "../models/lesson.model.js";
import { AppError } from "../utils/apperror.js";
import natural from "natural";
import sw from "stopword";
import {
  applyFinalFilters,
  applyOffersToCourses,
  applyOfferToCourse,
  broadcastToCourse,
  calculatePagination,
  getActiveOffers,
  getCourses,
  getCourseWithBasicData,
  hasAccess,
  paginateResults,
  validateAndSanitizeFilters,
} from "../utils/lib.js";
import User from "../models/user.model.js";
import CourseProgress from "../models/progress.model.js";
import Message from "../models/message.model.js";

// Main controller function
export const getAllCourses = async (req, res, next) => {
  try {
    const {
      query = "",
      page = 1,
      limit = 12,
      status = "published",
      sortBy = "newest",
      category,
      instructor,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
      features,
      hashtags,
      priceType,
      dateFrom,
      dateTo,
      hasOffer,
    } = req.query;

    // Validate and sanitize inputs
    const filters = validateAndSanitizeFilters({
      status,
      page,
      limit,
      query,
      category,
      instructor,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
      features,
      hashtags,
      priceType,
      dateFrom,
      dateTo,
      hasOffer,
    });

    // Get courses with basic filtering
    const courses = await getCourses(filters, sortBy);

    // Get active offers
    const activeOffers = await getActiveOffers();

    // Apply offers to courses
    const coursesWithOffers = applyOffersToCourses(courses, activeOffers);

    // Apply final filters
    const filteredCourses = applyFinalFilters(coursesWithOffers, filters);

    // Paginate results
    const paginatedCourses = paginateResults(
      filteredCourses,
      filters.page,
      filters.limit
    );

    // Calculate pagination metadata
    const pagination = calculatePagination(
      filteredCourses.length,
      filters.page,
      filters.limit
    );

    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      courses: paginatedCourses,
      totalCourses: filteredCourses.length,
      pagination,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    next(error);
  }
};


// GET: Single Course with Offer Data
export const getCourseById = async (req, res, next) => {
  try {
    const { _id: userId, role } = req.user;
    const { courseId } = req.params;

    // 1. Validate course ID
    if (!courseId || !isValidObjectId(courseId)) {
      const message = courseId ? "Invalid course ID" : "Course ID is required";
      throw new AppError(message, 400);
    }

    // 2. Check access
    const hasUserAccess = await hasAccess(courseId, userId, role);

    // 3. Get course with basic data
    const course = await getCourseWithBasicData(courseId, hasUserAccess);
    
    if (!course) {
      throw new AppError("Course not found!", 404);
    }

    // 4. Get active offers and apply to course
    const activeOffers = await getActiveOffers();
    const courseWithOffer = applyOfferToCourse(course, activeOffers);

    // 5. Fetch progress if user has access
    let progress = null;
    if (hasUserAccess && req.user.role === "student") {
      progress = await getProgress(userId, courseId);
    }

    // 6. Send response
    res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      course: courseWithOffer,
      hasAccess: hasUserAccess,
      ...(hasUserAccess && { progress }),
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    const progress = await CourseProgress.findOne({
      user: userId,
      course: courseId,
    })
      .populate("lastCompletedLesson", "title")
      .populate("completedLessons", "title")
      .lean();

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "No progress found for this course.",
      });
    }

    res.status(200).json({
      success: true,
      progress,
    });
  } catch (err) {
    next(err);
  }
};

async function getProgress(userId, courseId) {
  try {
    const progress = await CourseProgress.findOne({
      user: userId,
      course: courseId,
    })
      .populate("lastCompletedLesson", "title")
      .populate("completedLessons", "title")
      .lean();

    return progress;
  } catch (err) {
    console.error("Error getting course progress:", err);
    throw err;
  }
};


export const updateLessonProgress = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    // ✅ Validate input
    if (!["completed", "uncompleted"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    if (!isValidObjectId(courseId) || !isValidObjectId(lessonId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid course or lesson ID" });
    }

    // ✅ Fetch or initialize progress document
    let progress = await CourseProgress.findOne({
      user: userId,
      course: courseId,
    });

    if (!progress) {
      progress = await CourseProgress.create({
        user: userId,
        course: courseId,
        completedLessons: [],
        totalLessons: 0, // Optional: populate separately
        progressPercentage: 0,
        lastCompletedLesson: null,
      });
    }

    const lessonObjectId = new mongoose.Types.ObjectId(lessonId);
    const isAlreadyCompleted = progress.completedLessons.some(
      (id) => id.toString() === lessonId
    );

    // ✅ Update lesson completion status
    if (status === "completed" && !isAlreadyCompleted) {
      progress.completedLessons.push(lessonObjectId);
      progress.lastCompletedLesson = lessonObjectId;
    }

    if (status === "uncompleted" && isAlreadyCompleted) {
      progress.completedLessons = progress.completedLessons.filter(
        (id) => id.toString() !== lessonId
      );

      // Reset lastCompletedLesson if it was just removed
      if (progress.lastCompletedLesson?.toString() === lessonId) {
        progress.lastCompletedLesson = null;
      }
    }

    // ✅ Recalculate percentage (optional logic if totalLessons is known)
    if (progress.totalLessons > 0) {
      progress.progressPercentage = Math.round(
        (progress.completedLessons.length / progress.totalLessons) * 100
      );
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: `Lesson marked as ${status}`,
      progress,
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

export const getAllMessages = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!courseId || !isValidObjectId(courseId)) {
      throw new AppError("Invalid course ID", 400);
    }

    const messages = await Message.find({ courseId })
      .populate("sender", "fullName profilePicture")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// Send a message to course discussion
export const sendCourseMessage = async (req, res) => {
  try {
    const { courseId } = req.params
    const { content } = req.body
    const { _id: userId } = req.user

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      })
    }

    const newMessage = new Message({
      courseId,
      sender: userId,
      content: content.trim(),
    })

    await newMessage.save()

    // Populate the sender information from database
    await newMessage.populate("sender", "fullName profilePhoto")

    // Create clean message object for broadcasting
    const messageData = {
      _id: newMessage._id.toString(),
      courseId: newMessage.courseId,
      content: newMessage.content,
      sender: {
        _id: newMessage.sender._id.toString(),
        fullName: newMessage.sender.fullName,
        profilePicture: newMessage.sender.profilePhoto,
      },
      createdAt: newMessage.createdAt,
    }

    // Broadcast to course participants
    broadcastToCourse(courseId, "new_course_message", messageData)

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: messageData,
    })
  } catch (error) {
    console.error("Error sending course message:", error)
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    })
  }
}
