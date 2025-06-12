import Razorpay from "../config/razorpay.js";
import crypto from "crypto";
import { RAZORPAY_API_SECRET } from "../utils/env.js";
import { AppError } from "../utils/apperror.js";
import Payment from "../models/payment.model.js";
import Cart from "../models/cart.model.js";
import Enrollment from "../models/enrollment.model.js";
import Progress from "../models/progress.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import Coupon from "../models/coupon.model.js";

export const createOrder = async (req, res, next) => {
  try {
    const { isCart, couponCode } = req.body;
    let amount = req.body.amount; // fallback if not cart

    //  1. Get total price from cart if it's a cart purchase
    if (isCart) {
      const cart = await Cart.findOne({ userId: req.user._id })
        .populate("items", "price")
        .lean();

      if (!cart || !cart.items?.length) {
        throw new AppError("Cart is empty or not found", 400);
      }

      amount = cart.items.reduce((sum, item) => sum + item.price, 0);
    }

    let discountAmount = 0;

    //  2. Handle coupon if present
    // if (couponCode) {
    //   const [userDoc, coupon] = await Promise.all([
    //     User.findById(req.user._id).select("usedCoupons").lean(),
    //     Coupon.findOne({ code: couponCode }).lean()
    //   ]);

    //   if (!coupon) throw new AppError("Invalid coupon code", 400);

    //   const usedCoupon = userDoc?.usedCoupons?.find(c => c.code === couponCode);

    //   if (coupon.usageLimitPerUser === 1 && usedCoupon) {
    //     throw new AppError("Coupon already used", 400);
    //   }

    //   if (coupon.usageLimitPerUser > 1 && usedCoupon?.usedCount >= coupon.usageLimitPerUser) {
    //     throw new AppError("Coupon usage limit exceeded", 400);
    //   }

    //   if (coupon.discountType === "percentage") {
    //     discountAmount = (coupon.discountValue / 100) * amount;
    //     if (coupon.maxDiscount) {
    //       discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    //     }
    //   } else if (coupon.discountType === "flat") {
    //     discountAmount = coupon.discountValue;
    //     if (coupon.maxDiscount) {
    //       discountAmount = Math.min(discountAmount, coupon.maxDiscount); // safe fallback
    //     }
    //   }
    // }

    // const finalAmount = Math.max(amount - discountAmount, 0);

    //  3. Create Razorpay order
    const order = await Razorpay.orders.create({
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

  } catch (error) {
    next(error);
  }
};



// POST: Verify Order
const enrollUserToCourse = async (userId, courseId) => {
  const course = await Course.findById(courseId).select("lessons").lean();

  if (!course) throw new AppError("Course not found", 404);

  const now = new Date();

  await Promise.all([
    Enrollment.create({
      user: userId,
      course: courseId,
      enrolledAt: now,
      completed: false,
      lastAccessed: null,
    }),
    Progress.create({
      user: userId,
      course: courseId,
      completed: false,
      totalLessons: course.lessons?.length || 0,
      lastAccessed: null,
    }),
    Course.findByIdAndUpdate(courseId, {
      $inc: { enrolledCount: 1 },
    })
  ]);
};

export const verifyOrder = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user,
      course,
      amount,
      isCart,
      couponCode,
    } = req.body;

    // 🧾 Step 1: Validate Payment Details
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !user?._id || !amount) {
      throw new AppError("Missing required payment details", 400);
    }

    // 🔐 Step 2: Verify Razorpay Signature
    const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(signaturePayload)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new AppError("Payment verification failed: invalid signature", 400);
    }

    // 💳 Step 3: Create Payment Record
    const payment = await Payment.create({
      user: user._id,
      course: isCart ? undefined : course,
      amount,
      transactionId: razorpay_payment_id,
      paymentDate: new Date(),
      paymentMethod: "razorpay",
      paymentStatus: "completed",
    });

    // 🎓 Step 4: Enroll User to Course(s)
    if (isCart) {
      const cart = await Cart.findOne({ userId: user._id }).populate("items", "_id").lean();
      if (!cart?.items?.length) throw new AppError("Cart is empty or not found", 400);

      const courseIds = cart.items.map(item => item._id);
      await Promise.all(courseIds.map(courseId => enrollUserToCourse(user._id, courseId)));
      await Cart.deleteOne({ userId: user._id });
    } else {
      if (!course) throw new AppError("Course ID is required for single enrollment", 400);
      await enrollUserToCourse(user._id, course);
    }

    // 🎟️ Step 5: Handle Coupon Usage (if applicable)
    if (couponCode) {
      const [userDoc, coupon] = await Promise.all([
        User.findById(user._id),
        Coupon.findOne({ code: couponCode }),
      ]);

      if (!coupon) throw new AppError("Invalid coupon code", 400);

      const usedCoupon = userDoc.usedCoupons?.find(c => c.code === couponCode);

      if (coupon.usageLimitPerUser === 1 && usedCoupon) {
        throw new AppError("Coupon already used", 400);
      }

      if (coupon.usageLimitPerUser > 1) {
        if (usedCoupon) {
          if (usedCoupon.usedCount >= coupon.usageLimitPerUser) {
            throw new AppError("Coupon usage limit exceeded", 400);
          }
          usedCoupon.usedCount += 1;
          usedCoupon.usedAt = new Date();
        } else {
          userDoc.usedCoupons.push({
            code: couponCode,
            usedCount: 1,
            usedAt: new Date(),
          });
        }
      } else if (!usedCoupon) {
        userDoc.usedCoupons.push({
          code: couponCode,
          usedCount: 1,
          usedAt: new Date(),
        });
      }

      await userDoc.save();
    }

    // ✅ Step 6: Final Response
    return res.status(200).json({
      success: true,
      message: "Payment verified and enrollment completed",
      payment,
    });

  } catch (error) {
    next(error);
  }
};

