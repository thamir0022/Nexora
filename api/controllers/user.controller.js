import mongoose, { isValidObjectId } from "mongoose";
import User from "../models/user.model.js";
import { AppError } from "../utils/apperror.js";
import bcrypt from "bcryptjs";
import Cart from "../models/cart.model.js";
import Wishlist from "../models/wishlist.model.js";
import Coupon from "../models/coupon.model.js";
import Enrollment from "../models/enrollment.model.js";
import { buildCartPipeline, calculateCartSummary } from "../utils/lib.js";

// Helper: Pick only allowed fields from input
const pickAllowedFields = (source, allowed) => {
  return allowed.reduce((obj, key) => {
    if (source[key] !== undefined) {
      obj[key] = source[key];
    }
    return obj;
  }, {});
};

export const getUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId != req.user._id && req.user.role !== "admin")
      throw new AppError("You are not allowed to get this user data", 403);

    if (!userId || !isValidObjectId(userId))
      throw new AppError(
        userId ? "Invalid user Id" : "User Id is required",
        400
      );

    const user = await User.findById(userId).select("-password -__v");

    if (!user) throw new AppError("User not found with this Id", 404);

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserCourses = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || !isValidObjectId(userId)) {
      return next(new AppError("Invalid or missing User ID", 400));
    }

    const isAdmin = req.user?.role === "admin";
    const isSameUser = req.user?._id?.toString() === userId;

    if (!isAdmin && !isSameUser) {
      return next(new AppError("Unauthorized access to user data", 403));
    }

    const courses = await Enrollment.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },

      // Join course
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },

      // Join instructor (user)
      {
        $lookup: {
          from: "users",
          let: { instructorId: "$course.instructor" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$instructorId"] },
              },
            },
            {
              $project: {
                _id: 1,
                fullName: 1,
                profilePicture: 1,
              },
            },
          ],
          as: "instructor",
        },
      },
      { $unwind: { path: "$instructor", preserveNullAndEmptyArrays: true } },

      // Join category
      {
        $lookup: {
          from: "categories",
          let: { categoryIds: "$course.category" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$categoryIds"] },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
              },
            },
          ],
          as: "categories",
        },
      },

      // Join progress
      {
        $lookup: {
          from: "courseprogresses",
          let: { courseId: "$course._id", userId: "$user" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$course", "$$courseId"] },
                    { $eq: ["$user", "$$userId"] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                completedLessons: 1,
                totalLessons: 1,
                percentage: 1,
              },
            },
          ],
          as: "progress",
        },
      },
      {
        $unwind: {
          path: "$progress",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Final projection
      {
        $project: {
          _id: 0,
          course: {
            _id: "$course._id",
            title: "$course.title",
            price: "$course.price",
            thumbnailImage: "$course.thumbnailImage",
            instructor: "$instructor",
            categories: "$categories",
          },
          progress: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "User enrolled courses with progress fetched successfully",
      courses,
    });
  } catch (error) {
    next(error); // <-- catch block added to handle errors gracefully
  }
};



// PATCH /api/users/:id

export const updateUser = async (req, res, next) => {
  try {
    const { userId: targetUserId } = req.params;
    const requester = req.user;

    // Authorization check
    const isAdmin = requester.role === "admin";
    const isSelf = requester._id.toString() === targetUserId;

    if (!isSelf && !isAdmin) {
      throw new AppError("You are not allowed to access this API", 403);
    }

    // Determine allowed fields based on role
    const baseFields = ["fullName", "mobile", "profilePicture", "password"];
    const roleBasedFields = {
      admin: ["status", "bio", "role", "emailVerified", "mobileVerified"],
      instructor: ["bio"],
    };

    const allowedFields = [...baseFields];
    if (isAdmin) allowedFields.push(...roleBasedFields.admin);
    if (requester.role === "instructor")
      allowedFields.push(...roleBasedFields.instructor);

    // Pick only allowed updates
    const updates = pickAllowedFields(req.body, allowedFields);

    if (Object.keys(updates).length === 0) {
      throw new AppError("No valid fields to update", 400);
    }

    // Handle password update securely
    if (updates.password) {
      const existingUser = await User.findById(targetUserId)
        .select("password")
        .lean();

      if (!existingUser) {
        throw new AppError("User not found", 404);
      }

      const { oldPassword } = req.body;

      if (!oldPassword)
        throw new AppError("Old password is required to update password", 400);

      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        existingUser.password
      );

      if (!isOldPasswordValid) {
        throw new AppError("Old password is incorrect", 400);
      }

      if (updates.password.length < 6)
        throw new AppError(
          "New password must be at least 6 characters long",
          400
        );

      const salt = await bcrypt.genSalt();
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(targetUserId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requester = req.user;

    // Only allow if admin or deleting their own account
    if (requester._id !== userId && requester.role !== "admin")
      throw new AppError("Unauthorized to delete this user", 403);

    if (!userId || !isValidObjectId(userId))
      throw new AppError(
        userId ? "Invalid user Id" : "User Id is required",
        400
      );

    const deletedUser = await User.findByIdAndUpdate(userId, {
      $set: { isDeleted: true },
    });

    if (!deletedUser) throw new AppError("User not found with this Id", 404);

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getUserCart = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { userId } = req.params;

    if (userId != _id && req.user.role !== "admin")
      throw new AppError("You are not allowed to get this user data", 403);

    const userCart = await Cart.findOne({ userId }).lean();

    if(!userCart || !userCart.items.length){
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        cart: [],
      });
    }

    // Build aggregation pipeline to get cart with offers
    const pipeline = buildCartPipeline(userId);

    // Execute aggregation
    const cartResult = await Cart.aggregate(pipeline);

    if (!cartResult || cartResult.length === 0 || !cartResult[0].items || cartResult[0].items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        cart: [],
      });
    }

    const cart = cartResult[0];

    // Calculate cart totals
    const cartSummary = calculateCartSummary(cart.items);

    res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      cart: cart.items,
      summary: cartSummary
    });
  } catch (error) {
    next(error);
  }
};



export const addToCart = async (req, res, next) => {
  try {
    const { _id: loggedInUserId, role } = req.user;
    const { userId, courseId } = req.params;

    // Authorization check
    if (String(userId) !== String(loggedInUserId) && role !== "admin") {
      throw new AppError("You are not allowed to modify this user's cart", 403);
    }

    // Validate courseId
    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!isValidObjectId(courseId)) {
      throw new AppError("Invalid Course ID", 400);
    }

    // Check if already enrolled
    const isPurchased = await Enrollment.exists({ user: userId, course: courseId });
    if (isPurchased) {
      throw new AppError("Course already purchased", 400);
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId });

    if (cart) {
      const alreadyInCart = cart.items.some(item => item.toString() === courseId);
      if (alreadyInCart) {
        throw new AppError("Course already in cart", 400);
      }

      cart.items.unshift(courseId); // Add course to beginning
    } else {
      cart = new Cart({ userId, items: [courseId] });
    }

    // Save updated cart
    await cart.save();

    const pipeline = buildCartPipeline(userId);

    // Execute aggregation
    const cartResult = await Cart.aggregate(pipeline);

    res.status(200).json({
      success: true,
      message: "Course added to cart successfully",
      cart: cartResult[0].items || [],
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { userId, courseId } = req.params;

    if (userId != _id && req.user.role !== "admin")
      throw new AppError("You are not allowed to get this user data", 403);

    if (!courseId || !isValidObjectId(courseId))
      throw new AppError(
        courseId ? "Invalid course Id" : "Course Id is required",
        400
      );

    const cart = await Cart.findOne({ userId });

    if (!cart) throw new AppError("Cart not found", 404);

    const courseIndex = cart.items.findIndex(
      (item) => item.toString() === courseId
    );

    if (courseIndex === -1) throw new AppError("Course not found in cart", 404);

    cart.items.splice(courseIndex, 1);
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Course removed from cart successfully",
      cart,
    });
  } catch (error) {
    next(error);
  }
};


export const getUserWishlist = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role: reqRole, _id } = req.user;

    if (userId != _id && reqRole !== "admin")
      throw new AppError("You are not allowed to get this user data", 403);

    // Find the user's wishlist and populate the course details
    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: "items",
        populate: {
          path: "instructor",
          model: "User",
          select: "fullName profilePicture",
        },
      })
      .lean();

    res.status(200).json({
      success: true,
      message: "Wishlist retrieved successfully",
      wishlist: wishlist?.items || [],
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { userId, courseId } = req.params;

    if (userId != _id && req.user.role !== "admin")
      throw new AppError("You are not allowed to get this user data", 403);

    if (!courseId || !isValidObjectId(courseId))
      throw new AppError(
        courseId ? "Invalid course Id" : "Course Id is required",
        400
      );

    let wishlist = await Wishlist.findOne({ userId });

    if (wishlist) {
      const isCourseInWishlist = wishlist.items.find(
        (item) => item.toString() === courseId
      );

      if (isCourseInWishlist) throw new AppError("Course already in wishlist", 400);

      wishlist.items.unshift(courseId);
    } else {
      wishlist = new Wishlist({
        userId,
        items: [courseId],
      });
    }

    await wishlist.save();

    const newWishlist = await wishlist.populate({
      path: "items",
      populate: {
        path: "instructor",
        model: "User",
        select: "fullName profilePicture", // populate only needed fields
      },
    });

    res.status(200).json({
      success: true,
      message: "Course added to wishlist successfully",
      wishlist: newWishlist.items,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { userId, courseId } = req.params;

    if (userId != _id && req.user.role !== "admin")
      throw new AppError("You are not allowed to get this user data", 403);

    if (!courseId || !isValidObjectId(courseId))
      throw new AppError(
        courseId ? "Invalid course Id" : "Course Id is required",
        400
      );

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) throw new AppError("Wishlist not found", 404);

    const courseIndex = wishlist.items.findIndex(
      (item) => item.toString() === courseId
    );

    if (courseIndex === -1) throw new AppError("Course not found in wishlist", 404);

    wishlist.items.splice(courseIndex, 1);
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: "Course removed from wishlist successfully",
      wishlist,
    });
  } catch (error) {
    next(error);
  }
};


export const addToCartFromWishlist = async (req, res, next) => {
  try {
    const { _id: authUserId, role } = req.user;
    const { userId, courseId } = req.params;

    if (String(userId) !== String(authUserId) && role !== "admin") {
      throw new AppError("Unauthorized access", 403);
    }

    if (!courseId || !isValidObjectId(courseId)) {
      throw new AppError(courseId ? "Invalid course ID" : "Course ID is required", 400);
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      throw new AppError("Wishlist not found", 404);
    }

    const courseIndex = wishlist.items.findIndex(item => item.toString() === courseId);
    if (courseIndex === -1) {
      throw new AppError("Course not found in wishlist", 404);
    }

    wishlist.items.splice(courseIndex, 1);
    await wishlist.save();

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [courseId] });
    } else {
      const alreadyInCart = cart.items.some(item => item.toString() === courseId);
      if (alreadyInCart) {
        throw new AppError("Course already in cart", 400);
      }
      cart.items.unshift(courseId);
    }

    await cart.save();

    const [populatedCart, populatedWishlist] = await Promise.all([
      Cart.findOne({ userId }).populate({
        path: "items",
        select: "title price rating instructor thumbnailImage",
        populate: { path: "instructor", model: "User", select: "fullName profilePicture" },
      }),
      Wishlist.findOne({ userId }).populate({
        path: "items",
        select: "title price rating instructor thumbnailImage",
        populate: { path: "instructor", model: "User", select: "fullName profilePicture" },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Course moved from wishlist to cart",
      cart: populatedCart?.items || [],
      wishlist: populatedWishlist?.items || [],
    });

  } catch (error) {
    next(error);
  }
};

export const moveToWishlistFromCart = async (req, res, next) => {
  try {
    const { _id: authUserId, role } = req.user;
    const { userId, courseId } = req.params;

    if (String(userId) !== String(authUserId) && role !== "admin") {
      throw new AppError("Unauthorized access", 403);
    }

    if (!courseId || !isValidObjectId(courseId)) {
      throw new AppError(courseId ? "Invalid course ID" : "Course ID is required", 400);
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new AppError("Cart not found", 404);
    }

    const courseIndex = cart.items.findIndex(item => item.toString() === courseId);
    if (courseIndex === -1) {
      throw new AppError("Course not found in cart", 404);
    }

    cart.items.splice(courseIndex, 1);
    await cart.save();

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [courseId] });
    } else {
      const alreadyInWishlist = wishlist.items.some(item => item.toString() === courseId);
      if (alreadyInWishlist) {
        throw new AppError("Course already in wishlist", 400);
      }
      wishlist.items.unshift(courseId);
    }

    await wishlist.save();

    const [populatedCart, populatedWishlist] = await Promise.all([
      Cart.findOne({ userId }).populate({
        path: "items",
        select: "title price rating instructor thumbnailImage",
        populate: { path: "instructor", model: "User", select: "fullName profilePicture" },
      }),
      Wishlist.findOne({ userId }).populate({
        path: "items",
        select: "title price rating instructor thumbnailImage",
        populate: { path: "instructor", model: "User", select: "fullName profilePicture" },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Course moved from cart to wishlist",
      cart: populatedCart?.items || [],
      wishlist: populatedWishlist?.items || [],
    });

  } catch (error) {
    next(error);
  }
};


export const getUserCoupon = async (req, res, next) => {
  try {
    const {_id: userId} = req.user;
    const user = await User.findById(userId).populate("availableCoupons");

    if (!user) throw new AppError("User not found", 404);

    const availableCoupons = user.availableCoupons;

    res.status(200).json({success: true, message: "User coupon fetched successfully", coupons: availableCoupons});
  } catch (error) {
    next(error);
  }
}


export const applyCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || !orderAmount) {
      throw new AppError("Coupon code and order amount are required", 400);
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();

    if (!coupon) throw new AppError("Invalid coupon code", 404);

    const now = new Date();

    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTill)) {
      throw new AppError("Coupon is not valid at this time", 400);
    }

    if (orderAmount < (coupon.minOrderAmount || 0)) {
      throw new AppError(`Minimum order amount is ₹${coupon.minOrderAmount}`, 400);
    }

    const usedCoupons = await User.findOne({ _id: req.user._id}).select("usedCoupons").lean();

    const usedCoupon = usedCoupons?.usedCoupons?.find(c => c.code === code);

    if(coupon.usageLimitPerUser === 1 && usedCoupon) throw new AppError("Coupon already used", 400);

    if(coupon.usageLimitPerUser > 1 && usedCoupon?.usedCount >= coupon.usageLimitPerUser) throw new AppError("Coupon usage limit exceeded", 400);

    let discountAmount = 0;
    let discountPercentage = 0;

    if (coupon.discountType === "percentage") {
      discountPercentage = coupon.discountValue;
      discountAmount = (discountPercentage / 100) * orderAmount;

      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
      discountPercentage = (discountAmount / orderAmount) * 100;
    }

    const finalPrice = Math.max(orderAmount - discountAmount, 0);

    res.status(200).json({
      success: true,
      message: `Coupon applied successfully. You saved ₹${Math.round(discountAmount)}!`,
      originalAmount: Math.round(orderAmount),
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discountAmount),
      discountPercentage: Math.round(discountPercentage),
      finalPrice: Math.round(finalPrice),
      code: coupon.code,
    });
  } catch (error) {
    next(error);
  }
};
