import mongoose, { isValidObjectId } from "mongoose";
import Course from "../models/course.model.js";
import Lesson from "../models/lesson.model.js";
import { AppError } from "../utils/apperror.js";
import natural from "natural";
import sw from "stopword";
import { getSort, hasAccess } from "../utils/lib.js";
import User from "../models/user.model.js";
import CourseProgress from "../models/progress.model.js";


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
      priceType, // 'free', 'paid', 'discounted'
      dateFrom,
      dateTo,
      hasOffer,
    } = req.query

    // Validate status
    if (!["draft", "published", "archived", "all"].includes(status)) {
      throw new AppError("Invalid status filter", 400)
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, Number.parseInt(page))
    const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit))) // Max 50 items per page
    const skip = (pageNum - 1) * limitNum

    // Build aggregation pipeline
    const pipeline = []

    // Match stage - build filter conditions
    const matchConditions = {}

    // Status filter
    if (status !== "all") {
      matchConditions.status = status
    }

    // Text search
    if (query.trim()) {
      matchConditions.$text = { $search: query.trim() }
    }

    // Category filter
    if (category) {
      const categoryIds = Array.isArray(category) ? category : [category]
      const validCategoryIds = categoryIds.filter(isValidObjectId)
      if (validCategoryIds.length > 0) {
        matchConditions.category = {
          $in: validCategoryIds.map((id) => new mongoose.Types.ObjectId(id)),
        }
      }
    }

    // Instructor filter
    if (instructor) {
      if (isValidObjectId(instructor)) {
        matchConditions.instructor = new mongoose.Types.ObjectId(instructor)
      }
    }

    // Price filters
    if (minPrice !== undefined || maxPrice !== undefined || priceType) {
      const priceConditions = {}

      if (priceType === "free") {
        priceConditions.price = 0
      } else if (priceType === "paid") {
        priceConditions.price = { $gt: 0 }
      } else if (priceType === "discounted") {
        priceConditions.offerPrice = { $exists: true, $ne: null }
      } else {
        if (minPrice !== undefined) {
          priceConditions.price = { ...priceConditions.price, $gte: Number.parseFloat(minPrice) }
        }
        if (maxPrice !== undefined) {
          priceConditions.price = { ...priceConditions.price, $lte: Number.parseFloat(maxPrice) }
        }
      }

      Object.assign(matchConditions, priceConditions)
    }

    // Rating filter
    if (minRating !== undefined || maxRating !== undefined) {
      const ratingConditions = {}
      if (minRating !== undefined) {
        ratingConditions["rating.averageRating"] = {
          ...ratingConditions["rating.averageRating"],
          $gte: Number.parseFloat(minRating),
        }
      }
      if (maxRating !== undefined) {
        ratingConditions["rating.averageRating"] = {
          ...ratingConditions["rating.averageRating"],
          $lte: Number.parseFloat(maxRating),
        }
      }
      Object.assign(matchConditions, ratingConditions)
    }

    // Features filter
    if (features) {
      const featuresArray = Array.isArray(features) ? features : [features]
      matchConditions.features = { $in: featuresArray }
    }

    // Hashtags filter
    if (hashtags) {
      const hashtagsArray = Array.isArray(hashtags) ? hashtags : [hashtags]
      matchConditions.hashtags = { $in: hashtagsArray }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const dateConditions = {}
      if (dateFrom) {
        dateConditions.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        dateConditions.$lte = new Date(dateTo)
      }
      matchConditions.createdAt = dateConditions
    }

    // Has offer filter
    if (hasOffer === "true") {
      matchConditions.offerPrice = { $exists: true, $ne: null }
    } else if (hasOffer === "false") {
      matchConditions.$or = [{ offerPrice: { $exists: false } }, { offerPrice: null }]
    }

    // Add match stage
    pipeline.push({ $match: matchConditions })

    // Add text score for relevance sorting
    if (query.trim() && sortBy === "relevance") {
      pipeline.push({ $addFields: { score: { $meta: "textScore" } } })
    }

    // Add calculated fields - FIXED the $exists issue
    pipeline.push({
      $addFields: {
        effectivePrice: {
          $cond: {
            if: { $ne: [{ $type: "$offerPrice" }, "missing"] },
            then: "$offerPrice",
            else: "$price",
          },
        },
        discountPercentage: {
          $cond: {
            if: {
              $and: [
                { $ne: [{ $type: "$offerPrice" }, "missing"] },
                { $ne: ["$offerPrice", null] },
                { $gt: ["$price", 0] },
              ],
            },
            then: {
              $round: [{ $multiply: [{ $divide: [{ $subtract: ["$price", "$offerPrice"] }, "$price"] }, 100] }, 0],
            },
            else: 0,
          },
        },
        totalLessons: { $size: "$lessons" },
        isPopular: { $gte: ["$enrolledCount", 100] }, // Consider popular if 100+ enrollments
        isFree: { $eq: ["$price", 0] },
        hasDiscount: {
          $and: [{ $ne: [{ $type: "$offerPrice" }, "missing"] }, { $ne: ["$offerPrice", null] }],
        },
      },
    })

    // Lookup stages for population
    pipeline.push(
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "instructor",
          foreignField: "_id",
          as: "instructor",
          pipeline: [{ $project: { _id: 1, fullName: 1, profilePicture: 1, bio: 1 } }],
        },
      },
      { $unwind: { path: "$instructor", preserveNullAndEmptyArrays: true } },
    )

    // Project stage - select fields (maintain compatibility with existing client)
    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        category: 1,
        description: 1,
        price: 1,
        offerPrice: 1,
        offerPercentage: 1,
        effectivePrice: 1,
        discountPercentage: 1,
        features: 1,
        instructor: 1,
        status: 1,
        enrolledCount: 1,
        rating: 1,
        thumbnailImage: 1,
        hashtags: 1,
        totalLessons: 1,
        isPopular: 1,
        isFree: 1,
        hasDiscount: 1,
        createdAt: 1,
        updatedAt: 1,
        // Include score only if text search is used
        ...(query.trim() && sortBy === "relevance" && { score: 1 }),
      },
    })

    // Sort stage
    pipeline.push({ $sort: getSort(sortBy) })

    // Get total count before pagination
    const countPipeline = [...pipeline, { $count: "total" }]
    const totalResult = await Course.aggregate(countPipeline)
    const totalCourses = totalResult.length > 0 ? totalResult[0].total : 0

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limitNum })

    // Execute aggregation
    const courses = await Course.aggregate(pipeline)

    // Calculate pagination info
    const totalPages = Math.ceil(totalCourses / limitNum)
    const hasNextPage = pageNum < totalPages
    const hasPrevPage = pageNum > 1

    // Response (maintaining compatibility with existing client structure)
    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      courses,
      totalCourses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    })
  } catch (error) {
    console.error("Error fetching courses:", error)
    next(error)
  }
}

// GET: Single Course
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

    // 3. Fetch course
    const course = await Course.findById(courseId)
      .select("-keywords")
      .populate([
        { path: "category", select: "name" },
        { path: "instructor", select: "fullName email profilePicture" },
        {
          path: "lessons",
          select: hasUserAccess ? "" : "title description thumbnailImage",
        },
      ])
      .lean();

    if (!course) throw new AppError("Course not found!", 404);

    // 4. Fetch progress if user has access
    let progress = null;
    if (hasUserAccess) {
      progress = await CourseProgress.findOne({ user: userId, course: courseId })
        .select("-_id completedLessons progressPercentage lastCompletedLesson")
        .lean();

      // default fallback
      if (!progress) {
        progress = {
          completedLessons: [],
          progressPercentage: 0,
          lastCompletedLesson: null,
        };
      }
    }

    // 5. Send response
    res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      course,
      hasAccess: hasUserAccess,
      ...(hasUserAccess && { progress }),
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!courseId || !isValidObjectId(courseId)) {
      const message = courseId ? "Invalid course ID" : "Course ID is required";
      throw new AppError(message, 400);
    }

    let progress = await CourseProgress.findOne({ user: req.user._id, course: courseId })
      .select("-_id completedLessons progressPercentage lastCompletedLesson")
      .lean();

    if (!progress) {
      progress = {
        completedLessons: [],
        progressPercentage: 0,
        lastCompletedLesson: null,
      };
    }

    res.status(200).json({
      success: true,
      message: "Course progress fetched successfully",
      progress,
    });
  } catch (error) {
    next(error);
  }
}

export const updateLessonProgress = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    // ✅ Validate input
    if (!['completed', 'uncompleted'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    if (!isValidObjectId(courseId) || !isValidObjectId(lessonId)) {
      return res.status(400).json({ success: false, message: "Invalid course or lesson ID" });
    }

    // ✅ Fetch or initialize progress document
    let progress = await CourseProgress.findOne({ user: userId, course: courseId });

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
