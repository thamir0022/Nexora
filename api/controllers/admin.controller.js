import { isValidObjectId } from "mongoose";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import { AppError } from "../utils/apperror.js";
import Coupon from "../models/coupon.model.js";
import Payment from "../models/payment.model.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const {
      status = "all",
      role,
      sort = "desc",
      search,
      limit = 10,
    } = req.query;
    const { role: userRole } = req.user;

    if (userRole !== "admin") {
      throw new AppError("You should be an admin to access this API", 403);
    }

    const filter = {
      ...(status === "all"
        ? {} // no filter on status
        : status
        ? { status } // filter by provided status
        : { status: { $ne: "pending" } }), // default: exclude pending
      ...(role && { role }),
    };

    // Add search logic
    if (search) {
      if (isValidObjectId(search)) {
        filter._id = search;
      } else {
        filter.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
    }

    const query = User.find(filter)
      .select("-password -__v -wallet")
      .sort({ createdAt: sort === "asc" ? 1 : -1 });

    if (limit) {
      query.limit(Number(limit));
    }

    const users = await query;

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().select("-__v");
    if (!coupons) throw new AppError("No coupons found", 404);
    res
      .status(200)
      .json({
        success: true,
        message: "Coupons fetched successfully",
        coupons,
      });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      validFrom,
      validTill,
      usageLimitPerUser,
    } = req.body;

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      validFrom,
      validTill,
      usageLimitPerUser,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const { couponId } = req.params;
    if (!isValidObjectId(couponId))
      throw new AppError("Invalid coupon ID", 400);

    const updated = await Coupon.findByIdAndUpdate(couponId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) throw new AppError("Coupon not found", 404);

    res.status(200).json({ success: true, coupon: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const { couponId } = req.params;
    if (!isValidObjectId(couponId))
      throw new AppError("Invalid coupon ID", 400);

    const deleted = await Coupon.findByIdAhtndDelete(couponId);
    if (!deleted) throw new AppError("Coupon not found", 404);

    res
      .status(200)
      .json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (req, res, next) => {
  try {
    const { role } = req.user;
    if (role !== "admin")
      throw new AppError("You should be a admin for accessing this API", 403);

    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    let totalRevenue = await Payment.aggregate([
      {
        $match: {
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    totalRevenue = totalRevenue[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue,
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentStatsByMonth = async (req, res, next) => {
  try {
    const { role } = req.user;
    if (role !== "admin")
      throw new AppError("You should be an admin to access this API", 403);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const startOfYear = new Date(`${currentYear}-01-01`);
    const endOfMonth = new Date(currentYear, currentMonth, 0);

    const result = await Enrollment.aggregate([
      {
        $match: {
          enrolledAt: {
            $gte: startOfYear,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: { $month: "$enrolledAt" },
          enrollments: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          enrollments: 1,
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);

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
    ];

    const chartData = months.slice(0, currentMonth).map((m, index) => {
      const data = result.find((r) => r.month === index + 1);
      return { month: m, enrollments: data ? data.enrollments : 0 };
    });

    res.json(chartData);
  } catch (err) {
    next(err);
  }
};

export const getUserStatsByMonth = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const startOfYear = new Date(`${currentYear}-01-01`);
    const endOfMonth = new Date(currentYear, currentMonth, 0);

    const result = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lte: endOfMonth,
          },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          users: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          users: 1,
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);

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
    ];

    const chartData = months.slice(0, currentMonth).map((m, index) => {
      const data = result.find((r) => r.month === index + 1);
      return { month: m, users: data ? data.users : 0 };
    });

    res.json(chartData);
  } catch (err) {
    next(err);
  }
};

export const getRevenueStats = async (req, res, next) => {
  try {
    const { role } = req.user;
    if (role !== "admin")
      throw new AppError("You should be an admin to access this API", 403);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth(); // 0-based

    const startOfYear = new Date(`${currentYear}-01-01`);
    const today = new Date();

    const result = await Payment.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          createdAt: {
            $gte: startOfYear,
            $lte: today,
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          revenue: 1,
          average: { $round: [{ $divide: ["$revenue", "$count"] }, 0] }, // Round to whole number
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);

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
    ];

    const chartData = months.slice(0, currentMonthIndex + 1).map((m, index) => {
      const data = result.find((r) => r.month === index + 1);
      return {
        month: m,
        revenue: data ? data.revenue : 0,
        average: data ? data.average : 0,
      };
    });

    res.json(chartData);
  } catch (error) {
    next(error);
  }
};

export const getAllEnrollments = async (req, res, next) => {
  try {
    const { role } = req.user;
    const { limit } = req.query;
    if (role !== "admin")
      throw new AppError("You should be an admin to access this API", 403);

    const query = Enrollment.find()
      .select("-__v")
      .populate([
        {
          path: "course",
          select: "title thumbnailImage",
        },
        {
          path: "user",
          select: "fullName profilePicture",
        },
      ])
      .sort({ createdAt: -1 });

    if (limit) {
      query.limit(Number(limit));
    }

    const enrollments = await query;
    if (!enrollments) throw new AppError("No enrollments found", 404);
    res
      .status(200)
      .json({
        success: true,
        message: "Enrollments fetched successfully",
        enrollments,
      });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { role } = req.user;
    const { limit, status, from, to } = req.query;
    if (role !== "admin")
      throw new AppError("You should be an admin to access this API", 403);

    let filter = {};

    if (status) {
      filter.paymentStatus = status;
    }

    if (from) {
      filter.createdAt = {
        $gte: from,
      };
    }

    if (to) {
      filter.createdAt = {
        $lte: to,
      };
    }

    const query = Payment.find(filter)
      .select("-__v")
      .populate([
        {
          path: "course",
          select: "title thumbnailImage",
        },
        {
          path: "user",
          select: "fullName profilePicture",
        },
      ])
      .sort({ createdAt: -1 });

    if (limit) {
      query.limit(Number(limit));
    }

    const orders = await query;

    if (!orders) throw new AppError("No orders found", 404);
    res
      .status(200)
      .json({ success: true, message: "Orders fetched successfully", orders });
  } catch (error) {
    next(error);
  }
};
