import { isValidObjectId, Types } from "mongoose";
import InstructorQualification from "../models/instructorQualification.model.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/apperror.js";
import Course from "../models/course.model.js";
import Wallet from "../models/wallet.model.js";
import Enrollment from "../models/enrollment.model.js";

export const addInstructorQualification = async (req, res, next) => {
  try {
    const {
      userId,
      qualifications,
      experienceSummary,
      portfolioLink,
      socialLinks,
    } = req.body;

    const user = await User.findById(userId).lean();

    if (user.role !== "instructor")
      throw new AppError("Only instructor can access this api", 403);

    // Basic input validation
    if (
      !Array.isArray(qualifications) ||
      qualifications.length === 0 ||
      !experienceSummary ||
      !Array.isArray(socialLinks)
    )
      throw new AppError("Missing or invalid fields in request body", 400);

    // Check if instructor already submitted qualifications
    const existing = await InstructorQualification.findOne({ userId });
    if (existing) throw new AppError("Qualification already submitted", 409);

    const newQualification = new InstructorQualification({
      userId,
      qualifications,
      experienceSummary,
      portfolioLink,
      socialLinks,
    });

    await newQualification.save();

    res.status(201).json({
      success: true,
      message: "Qualification submitted successfully.",
      data: newQualification,
    });
  } catch (error) {
    next(error);
  }
};

export const getInstructorQualifications = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || !isValidObjectId(userId)) {
      throw new AppError(
        userId ? "Invalid user Id" : "User Id is required",
        400
      );
    }

    if (req.user.role !== "admin" && String(req.user._id) !== String(userId))
      throw new AppError("You are not allowed to access this API", 403);

    const instructorQualifications = await InstructorQualification.findOne({
      userId,
    }).lean();

    if (!instructorQualifications)
      throw new AppError("No qualifications found", 404);

    res.status(200).json({
      success: true,
      message: "Qualifications fetched successfully",
      qualifications: instructorQualifications,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllInstructorRequests = async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      throw new AppError("You are not admin to access this API", 403);

    const { query } = req.query;

    const filter = {
      role: "instructor",
      status: { $in: ["pending", "rejected"] },
    };

    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    const pendingInstructors = await User.aggregate([
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "instructorqualifications",
          localField: "_id",
          foreignField: "userId",
          as: "qualifications",
        },
      },
      {
        $sort: {
          createdAt: -1,
        }
      }
    ]);

    if (!pendingInstructors)
      throw new AppError("No pending instructors found", 404);

    res.status(200).json({
      success: true,
      message: "Pending instructors fetched successfully",
      pendingInstructors,
    });
  } catch (error) {
    next(error);
  }
};

export const getInstructorRequest = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || !isValidObjectId(userId)) {
      throw new AppError(
        userId ? "Invalid user Id" : "User Id is required",
        400
      );
    }

    const [instructorReq] = await User.aggregate([
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "instructorqualifications",
          localField: "_id",
          foreignField: "userId",
          as: "qualification",
        },
      },
      {
        $addFields: {
          qualification: { $arrayElemAt: ["$qualification", 0] },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$qualification", "$$ROOT"],
          },
        },
      },
      {
        $project: {
          password: 0,
          qualification: 0, // already merged
          __v: 0,
        },
      },
    ]);

    if (!instructorReq) throw new AppError("No instructor request found", 404);

    res.status(200).json({
      success: true,
      message: "Instructor request fetched successfully",
      request: instructorReq,
    });
  } catch (error) {
    next(error);
  }
};

export const approveInstructor = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== "admin")
      throw new AppError("Your are not allowed to access this api", 403);

    if (!userId || !isValidObjectId(userId))
      throw new AppError(
        userId ? "Invalid user id" : "User Id is required",
        400
      );

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          status: "active",
          joineDate: Date.now()
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) throw new AppError("Instructor not found", 404);

    await Wallet.create({ user: updatedUser._id });

    res.status(200).json({
      success: true,
      message: "Instructor approved successfully",
      instructor: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectInstructor = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== "admin")
      throw new AppError("Your are not allowed to access this api", 403);

    if (!userId || !isValidObjectId(userId))
      throw new AppError(
        userId ? "Invalid user id" : "User Id is required",
        400
      );

    await User.findByIdAndUpdate(userId, {
      $set: {
        status: "rejected",
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Instructor rejected successfully" });
  } catch (error) {
    next(error);
  }
};

export const getInstructorCourses = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    if (role !== "instructor")
      throw new AppError("You are not allowed to access this API", 403);

    const courses = await Course.find({ instructor: _id })
      .populate([{
        path: "category",
        select: "name",
      }, {
        path: "instructor",
        select: "fullName email profilePicture",
      }]).select("-keywords").sort({ createdAt: -1 }).lean();

    res.status(200).json({ success: true, message: "Course fetched successfully", courses });
  } catch (error) {
    next(error);
  }
};


export const updateInstructorQualification = async (req, res, next) => {
  try {
    const {
      userId,
      qualifications,
      experienceSummary,
      portfolioLink,
      socialLinks,
    } = req.body;

    if (userId != req.user._id) throw new AppError("You are not allowed to update this qualification", 403);

    const user = await User.findById(userId).lean();

    if (!user || user.role !== "instructor") {
      throw new AppError("Only instructors can update qualifications", 403);
    }

    // Input validation (reuse same logic as add)
    if (
      !Array.isArray(qualifications) ||
      qualifications.length === 0 ||
      !experienceSummary ||
      !Array.isArray(socialLinks)
    ) {
      throw new AppError("Missing or invalid fields in request body", 400);
    }

    const updatedQualification = await InstructorQualification.findOneAndUpdate(
      { userId },
      {
        $set: {
          qualifications,
          experienceSummary,
          portfolioLink,
          socialLinks,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedQualification) {
      throw new AppError("Instructor qualification not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Qualification updated successfully.",
      data: updatedQualification,
    });
  } catch (error) {
    next(error);
  }
};

// Get Instructor Analytics
export const getInstructorAnalytics = async (req, res, next) => {
  try {
    const instructorId = req.user._id

    // Get current year for filtering
    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59)

    // 1. Get all instructor courses with enrollment counts
    const coursesWithEnrollments = await Course.aggregate([
      {
        $match: {
          instructor: instructorId,
          status: { $ne: "archived" },
        },
      },
      {
        $lookup: {
          from: "enrollments",
          localField: "_id",
          foreignField: "course",
          as: "enrollments",
        },
      },
      {
        $addFields: {
          totalEnrollments: { $size: "$enrollments" },
          completedEnrollments: {
            $size: {
              $filter: {
                input: "$enrollments",
                cond: { $eq: ["$$this.completed", true] },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          thumbnailImage: 1,
          price: 1,
          offerPrice: 1,
          status: 1,
          enrolledCount: 1,
          totalEnrollments: 1,
          completedEnrollments: 1,
          rating: 1,
          createdAt: 1,
          lessons: { $size: "$lessons" },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ])

    // 2. Get course creation data by month (current year)
    const coursesByMonth = await Course.aggregate([
      {
        $match: {
          instructor: instructorId,
          createdAt: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          courses: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    // 3. Get student enrollment data by month (current year)
    const courseIds = coursesWithEnrollments.map((course) => course._id)

    const enrollmentsByMonth = await Enrollment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          enrolledAt: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: { $month: "$enrolledAt" },
          students: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    // 4. Get total statistics
    const totalCourses = coursesWithEnrollments.length
    const totalStudents = coursesWithEnrollments.reduce((sum, course) => sum + course.totalEnrollments, 0)
    const totalCompletedEnrollments = coursesWithEnrollments.reduce(
      (sum, course) => sum + course.completedEnrollments,
      0,
    )
    const totalRevenue = coursesWithEnrollments.reduce((sum, course) => {
      const coursePrice = course.offerPrice || course.price
      return sum + coursePrice * course.totalEnrollments
    }, 0)

    // 5. Get recent enrollments for activity feed
    const recentEnrollments = await Enrollment.find({
      course: { $in: courseIds },
    })
      .populate("user", "fullName profilePicture")
      .populate("course", "title thumbnailImage")
      .sort({ enrolledAt: -1 })
      .limit(10)
      .lean()

    // 6. Format graph data
    const courseGraphData = formatMonthlyData(coursesByMonth, "courses")
    const studentGraphData = formatMonthlyData(enrollmentsByMonth, "students")

    // 7. Calculate completion rate
    const completionRate = totalStudents > 0 ? Math.round((totalCompletedEnrollments / totalStudents) * 100) : 0

    // 8. Get top performing courses
    const topCourses = coursesWithEnrollments.sort((a, b) => b.totalEnrollments - a.totalEnrollments).slice(0, 5)

    const analyticsData = {
      // Overview stats
      overview: {
        totalCourses,
        totalStudents,
        totalRevenue,
        completionRate,
        averageRating: calculateAverageRating(coursesWithEnrollments),
        publishedCourses: coursesWithEnrollments.filter((course) => course.status === "published").length,
        draftCourses: coursesWithEnrollments.filter((course) => course.status === "draft").length,
      },

      // Courses with enrollment data
      courses: coursesWithEnrollments,

      // Graph data for charts
      graphData: {
        courses: courseGraphData,
        students: studentGraphData,
      },

      // Top performing courses
      topCourses,

      // Recent activity
      recentEnrollments: recentEnrollments.map((enrollment) => ({
        _id: enrollment._id,
        studentName: enrollment.user?.fullName || "Unknown Student",
        studentAvatar: enrollment.user?.profilePicture,
        courseTitle: enrollment.course?.title || "Unknown Course",
        courseThumbnail: enrollment.course?.thumbnailImage,
        enrolledAt: enrollment.enrolledAt,
        completed: enrollment.completed,
      })),

      // Additional metrics
      metrics: {
        averageEnrollmentsPerCourse: totalCourses > 0 ? Math.round(totalStudents / totalCourses) : 0,
        monthlyGrowth: calculateMonthlyGrowth(enrollmentsByMonth),
        courseGrowth: calculateMonthlyGrowth(coursesByMonth, "courses"),
      },
    }

    res.status(200).json({
      success: true,
      message: "Instructor analytics fetched successfully",
      data: analyticsData,
    })
  } catch (error) {
    console.error("Error fetching instructor analytics:", error)
    next(error)
  }
}

// Helper function to format monthly data for graphs
function formatMonthlyData(data, valueKey) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Create array with all months initialized to 0
  const formattedData = months.map((month, index) => ({
    month,
    [valueKey]: 0,
  }))

  // Fill in actual data
  data.forEach((item) => {
    const monthIndex = item._id - 1 // MongoDB months are 1-based
    if (monthIndex >= 0 && monthIndex < 12) {
      formattedData[monthIndex][valueKey] = item[valueKey] || item.courses || item.students || 0
    }
  })

  return formattedData
}

// Helper function to calculate average rating
function calculateAverageRating(courses) {
  if (courses.length === 0) return 0

  const totalRating = courses.reduce((sum, course) => {
    return sum + (course.rating?.averageRating || 0)
  }, 0)

  return Math.round((totalRating / courses.length) * 10) / 10 // Round to 1 decimal place
}

// Helper function to calculate monthly growth
function calculateMonthlyGrowth(monthlyData, valueKey = "students") {
  if (monthlyData.length < 2) return 0

  const currentMonth = monthlyData[monthlyData.length - 1]
  const previousMonth = monthlyData[monthlyData.length - 2]

  if (!previousMonth || previousMonth[valueKey] === 0) return 0

  const growth = ((currentMonth[valueKey] - previousMonth[valueKey]) / previousMonth[valueKey]) * 100
  return Math.round(growth * 10) / 10 // Round to 1 decimal place
}

// Get Instructor Course Performance (detailed view for specific course)
export const getCoursePerformance = async (req, res, next) => {
  try {
    const { courseId } = req.params
    const instructorId = req.user._id

    // Verify course belongs to instructor
    const course = await Course.findOne({
      _id: courseId,
      instructor: instructorId,
    }).populate("category", "name")

    if (!course) {
      throw new AppError("Course not found or access denied", 404)
    }

    // Get detailed enrollment data
    const enrollments = await Enrollment.find({ course: courseId })
      .populate("user", "fullName profilePicture email")
      .sort({ enrolledAt: -1 })
      .lean()

    // Get enrollment trends (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const enrollmentTrends = await Enrollment.aggregate([
      {
        $match: {
          course: course._id,
          enrolledAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$enrolledAt" },
            month: { $month: "$enrolledAt" },
          },
          enrollments: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    const coursePerformance = {
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        thumbnailImage: course.thumbnailImage,
        price: course.price,
        offerPrice: course.offerPrice,
        status: course.status,
        category: course.category,
        rating: course.rating,
        createdAt: course.createdAt,
      },
      stats: {
        totalEnrollments: enrollments.length,
        completedEnrollments: enrollments.filter((e) => e.completed).length,
        activeStudents: enrollments.filter((e) => !e.completed).length,
        completionRate:
          enrollments.length > 0
            ? Math.round((enrollments.filter((e) => e.completed).length / enrollments.length) * 100)
            : 0,
        revenue: (course.offerPrice || course.price) * enrollments.length,
      },
      enrollments: enrollments.map((enrollment) => ({
        _id: enrollment._id,
        student: {
          _id: enrollment.user._id,
          name: enrollment.user.fullName,
          email: enrollment.user.email,
          avatar: enrollment.user.profilePicture,
        },
        enrolledAt: enrollment.enrolledAt,
        completed: enrollment.completed,
        lastAccessed: enrollment.lastAccessed,
      })),
      trends: formatEnrollmentTrends(enrollmentTrends),
    }

    res.status(200).json({
      success: true,
      message: "Course performance data fetched successfully",
      data: coursePerformance,
    })
  } catch (error) {
    console.error("Error fetching course performance:", error)
    next(error)
  }
}

// Helper function to format enrollment trends
function formatEnrollmentTrends(trends) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return trends.map((trend) => ({
    month: `${months[trend._id.month - 1]} ${trend._id.year}`,
    enrollments: trend.enrollments,
  }))
}
