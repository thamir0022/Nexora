import { isValidObjectId } from "mongoose";
import User from "../models/user.model.js";
import { AppError } from "../utils/apperror.js";
import Coupon from "../models/coupon.model.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const { status, role, sort, search } = req.query;

    if (req.user.role !== "admin")
      throw new AppError("You should be a admin for accessing this API", 403);

    const filter = {
      ...(status ? { status } : { status: { $ne: "pending" } }),
      ...(role && { role }),
    };


    const order = sort === "asc" ? 1 : -1;

    // Search logic
    if (search) {
      const isObjectId = isValidObjectId(search);
      if (isObjectId) {
        filter._id = search;
      } else {
        filter.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
    }

    const users = await User.find(filter)
      .select("-password -__v")
      .sort({ createdAt: order });

    if (!users) throw new AppError("No users found", 404);

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
    res.status(200).json({ success: true, message: "Coupons fetched successfully", coupons });
  } catch (error) {
    next(error);
  }
}


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
    if (!isValidObjectId(couponId)) throw new AppError("Invalid coupon ID", 400);

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
    if (!isValidObjectId(couponId)) throw new AppError("Invalid coupon ID", 400);

    const deleted = await Coupon.findByIdAhtndDelete(couponId);
    if (!deleted) throw new AppError("Coupon not found", 404);

    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    next(error);
  }
};