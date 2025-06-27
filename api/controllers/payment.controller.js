import crypto from "crypto";
import { RAZORPAY_API_SECRET } from "../utils/env.js";
import { AppError } from "../utils/apperror.js";
import Payment from "../models/payment.model.js";
import Cart from "../models/cart.model.js";
import Enrollment from "../models/enrollment.model.js";
import Progress from "../models/progress.model.js";
import Course from "../models/course.model.js";
import Wallet from "../models/wallet.model.js";
import WalletTransactions from "../models/walletTransaction.model.js";
import razorpay from "../config/razorpay.js";

// Create Razorpay order
export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({
      message: "Order creation failed",
      error: error.message,
    });
  }
};

// Verify Payment Controller
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      isCart,
      course,
      wallet,
      amount
    } = req.body;

    const userId = req.user._id;

    // 1. Verify Razorpay signature if payment was made
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
      await checkDuplicatePayment(razorpay_payment_id);
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // 2. Handle wallet payment
    if (wallet) {
      await processWalletPayment(userId);
    }

    // 3. Enroll courses
    if (isCart) {
      await enrollCartCourses(userId);
    } else {
      await enrollSingleCourse(userId, course);
    }

    // 4. Create payment record
    await createPaymentRecord({
      userId,
      amount: (amount / 100),
      isCart,
      course,
      razorpay_payment_id,
      razorpay_order_id,
      wallet,
      method: payment.method
    });

    res.status(200).json({
      success: true,
      message: "Payment verified and courses enrolled successfully",
    });
  } catch (error) {
    console.error("Payment verification failed:", error);
    next(error);
  }
};

// Get Payment History Controller
export const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ user: req.user._id })
        .populate("course", "title thumbnailImage")
        .sort({ paymentDate: -1 })
        .limit(Number.parseInt(limit))
        .skip(skip)
        .lean(),
      Payment.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPayments: total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper Functions
function verifyRazorpaySignature(orderId, paymentId, signature) {
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    )
  ) {
    throw new AppError("Invalid payment signature", 400);
  }
}

async function checkDuplicatePayment(paymentId) {
  const existingPayment = await Payment.findOne({ transactionId: paymentId });
  if (existingPayment) {
    throw new AppError("Payment already verified", 409);
  }
}

async function processWalletPayment(userId) {
  const wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  // Set wallet balance to 0
  const deductedAmount = wallet.balance;
  wallet.balance = 0;
  await wallet.save();

  // Create wallet transaction record
  await WalletTransactions.create({
    user: userId,
    wallet: wallet._id,
    type: "debit",
    amount: deductedAmount,
    status: "success",
    meta: {
      description: "Full wallet balance used for course purchase",
      transactionType: "course_purchase",
    },
  });

  console.log(
    `Wallet balance cleared for user ${userId}, amount: ${deductedAmount}`
  );
}

async function enrollCartCourses(userId) {
  const cart = await Cart.findOne({ userId }).populate("items");

  if (!cart || !cart.items?.length) {
    throw new AppError("Cart is empty", 400);
  }

  // Enroll in all cart courses
  await Promise.all(
    cart.items.map((course) => enrollUserInCourse(userId, course._id))
  );

  // Clear cart
  cart.items = [];
  await cart.save();

  console.log(
    `Enrolled user ${userId} in ${cart.items.length} courses from cart`
  );
}

async function enrollSingleCourse(userId, courseId) {
  if (!courseId) {
    throw new AppError("Course ID is required", 400);
  }

  await enrollUserInCourse(userId, courseId);
  console.log(`Enrolled user ${userId} in course ${courseId}`);
}

async function enrollUserInCourse(userId, courseId) {
  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    user: userId,
    course: courseId,
  });

  if (existingEnrollment) {
    console.log(`User ${userId} already enrolled in course ${courseId}`);
    return;
  }

  const course = await Course.findById(courseId).select(
    "lessons enrolledCount"
  );
  if (!course) {
    throw new AppError(`Course ${courseId} not found`, 404);
  }

  const now = new Date();

  // Create enrollment and progress
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
      completedLessons: [],
      lastAccessed: null,
    }),
    Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } }),
  ]);
}

async function createPaymentRecord(data) {
  const {
    userId,
    isCart,
    course,
    razorpay_payment_id,
    razorpay_order_id,
    amount,
    method
  } = data;

  const paymentData = {
    user: userId,
    amount,
    course: isCart ? [] : [course], // Will be populated based on actual enrollment
    transactionId: razorpay_payment_id || `wallet_${Date.now()}`,
    orderId: razorpay_order_id || `order_${Date.now()}`,
    paymentDate: new Date(),
    paymentMethod: method || "razorpay",
    paymentStatus: "completed",
  };

  await Payment.create(paymentData);
  console.log(`Payment record created for user ${userId}`);
}
