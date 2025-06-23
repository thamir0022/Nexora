import Razorpay from "../config/razorpay.js"
import crypto from "crypto"
import { RAZORPAY_API_SECRET } from "../utils/env.js"
import { AppError } from "../utils/apperror.js"
import Payment from "../models/payment.model.js"
import Cart from "../models/cart.model.js"
import Enrollment from "../models/enrollment.model.js"
import Progress from "../models/progress.model.js"
import Course from "../models/course.model.js"
import User from "../models/user.model.js"
import Coupon from "../models/coupon.model.js"
import Wallet from "../models/wallet.model.js"
import WalletTransactions from "../models/walletTransaction.model.js"

// Create Order Controller
export const createOrder = async (req, res, next) => {
  try {
    const { isCart, couponCode, walletAmount, course } = req.body

    // 1. Get products and calculate original amount
    const { productIds, originalAmount } = await getProductsAndAmount(isCart, course, req.user._id)

    // 2. Calculate discount amount
    const discountAmount = await calculateDiscountAmount(originalAmount, couponCode, req.user._id)
    const amountAfterCoupon = Math.max(originalAmount - discountAmount, 0)

    // 3. Validate and calculate wallet deduction
    const walletDeduction = await validateWalletAmount(walletAmount, amountAfterCoupon, req.user._id)
    const finalAmount = Math.max(amountAfterCoupon - walletDeduction, 0)

    // 4. Create Razorpay order (only if final amount > 0)
    let order = null
    if (finalAmount > 0) {
      order = await createRazorpayOrder(finalAmount, {
        userId: req.user._id.toString(),
        isCart: isCart.toString(),
        productIds: productIds.join(","),
        ...(couponCode && { couponCode }),
        ...(walletDeduction > 0 && { walletAmount: walletDeduction.toString() }),
      })
    }

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      orderId: order?.id || null,
      amount: order?.amount || 0,
      currency: order?.currency || "INR",
      breakdown: {
        originalAmount,
        discountAmount,
        walletDeduction,
        finalAmount,
        couponCode: couponCode || null,
        needsPayment: finalAmount > 0,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Verify Payment Controller
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isCart, course, couponCode, walletAmount } =
      req.body

    // 1. Verify Razorpay signature (only if payment was made)
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
      await checkDuplicatePayment(razorpay_payment_id)
    }

    // 2. Get products and calculate amounts
    const { productIds, originalAmount } = await getProductsAndAmount(isCart, course, req.user._id)
    const discountAmount = await calculateDiscountAmount(originalAmount, couponCode, req.user._id)
    const walletDeduction = walletAmount || 0
    const finalAmount = Math.max(originalAmount - discountAmount - walletDeduction, 0)

    // 3. Create payment record
    const payment = await createPaymentRecord({
      userId: req.user._id,
      productIds,
      originalAmount,
      discountAmount,
      walletDeduction,
      finalAmount,
      razorpay_payment_id,
      razorpay_order_id,
      couponCode,
    })

    // 4. Process post-payment operations
    await processPostPaymentOperations({
      userId: req.user._id,
      productIds,
      couponCode,
      walletAmount: walletDeduction,
      razorpay_payment_id,
      isCart,
    })

    console.log(`Payment verification completed for user ${req.user._id}:`, {
      originalAmount,
      discountAmount,
      walletDeduction,
      finalAmount,
      coursesCount: productIds.length,
    })

    res.status(200).json({
      success: true,
      message: "Payment verified and courses enrolled successfully",
    })
  } catch (error) {
    console.error("Payment verification failed:", error)
    next(error)
  }
}

// Get Payment History Controller
export const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const [payments, total] = await Promise.all([
      Payment.find({ user: req.user._id })
        .populate("course", "title thumbnailImage")
        .sort({ paymentDate: -1 })
        .limit(Number.parseInt(limit))
        .skip(skip)
        .lean(),
      Payment.countDocuments({ user: req.user._id }),
    ])

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
    })
  } catch (error) {
    next(error)
  }
}

// Helper Functions
async function getProductsAndAmount(isCart, course, userId) {
  let productIds = []
  let originalAmount = 0

  if (isCart) {
    const cart = await Cart.findOne({ userId }).populate("items", "price")

    if (!cart || !cart.items?.length) {
      throw new AppError("Cart is empty", 400)
    }

    productIds = cart.items.map((item) => item._id)
    originalAmount = cart.items.reduce((sum, item) => sum + item.price, 0)
  } else {
    if (!course || !Array.isArray(course) || course.length === 0) {
      throw new AppError("Course ID is required", 400)
    }

    const courses = await Course.find({ _id: { $in: course } }).select("price")

    if (courses.length !== course.length) {
      throw new AppError("Some courses not found", 404)
    }

    productIds = course
    originalAmount = courses.reduce((sum, courseItem) => sum + courseItem.price, 0)
  }

  return { productIds, originalAmount }
}

async function calculateDiscountAmount(originalAmount, couponCode, userId) {
  if (!couponCode) return 0

  const [userDoc, coupon] = await Promise.all([
    User.findById(userId).select("usedCoupons").lean(),
    Coupon.findOne({ code: couponCode }).lean(),
  ])

  if (!coupon) {
    throw new AppError("Invalid or inactive coupon code", 400)
  }

  // Check coupon expiry
  if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
    throw new AppError("Coupon has expired", 400)
  }

  // Check minimum order amount
  if (originalAmount < coupon.minOrderAmount) {
    throw new AppError(`Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`, 400)
  }

  // Check usage limits
  const usedCoupon = userDoc?.usedCoupons?.find((c) => c.code === couponCode)

  if (coupon.usageLimitPerUser === 1 && usedCoupon) {
    throw new AppError("Coupon already used", 400)
  }

  if (coupon.usageLimitPerUser > 1 && usedCoupon?.usedCount >= coupon.usageLimitPerUser) {
    throw new AppError("Coupon usage limit exceeded", 400)
  }

  // Calculate discount
  let discountAmount = 0
  if (coupon.discountType === "percentage") {
    discountAmount = (coupon.discountValue / 100) * originalAmount
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount)
    }
  } else if (coupon.discountType === "flat") {
    discountAmount = Math.min(coupon.discountValue, originalAmount)
  }

  return discountAmount
}

async function validateWalletAmount(walletAmount, amountAfterCoupon, userId) {
  if (!walletAmount || walletAmount <= 0) return 0

  const wallet = await Wallet.findOne({ user: userId }).lean() // Changed from userId to user
  const availableBalance = wallet?.balance || 0

  if (walletAmount > availableBalance) {
    throw new AppError("Insufficient wallet balance", 400)
  }

  if (walletAmount > amountAfterCoupon) {
    throw new AppError("Wallet amount cannot exceed order total", 400)
  }

  return walletAmount
}

async function createRazorpayOrder(amount, notes) {
  return await Razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
    notes,
  })
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const body = orderId + "|" + paymentId
  const expectedSignature = crypto.createHmac("sha256", RAZORPAY_API_SECRET).update(body.toString()).digest("hex")

  if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
    throw new AppError("Invalid payment signature", 400)
  }
}

async function checkDuplicatePayment(paymentId) {
  const existingPayment = await Payment.findOne({ transactionId: paymentId })
  if (existingPayment) {
    throw new AppError("Payment already verified", 409)
  }
}

async function createPaymentRecord(data) {
  const {
    userId,
    productIds,
    originalAmount,
    discountAmount,
    walletDeduction,
    finalAmount,
    razorpay_payment_id,
    razorpay_order_id,
    couponCode,
  } = data

  const paymentData = {
    user: userId,
    course: productIds,
    amount: originalAmount,
    discountAmount,
    walletAmount: walletDeduction,
    finalAmount,
    transactionId: razorpay_payment_id || `free_${Date.now()}`,
    orderId: razorpay_order_id || `order_${Date.now()}`,
    paymentDate: new Date(),
    paymentMethod: finalAmount > 0 ? "razorpay" : "wallet",
    paymentStatus: "completed",
    couponCode: couponCode || null,
  }

  return await Payment.create(paymentData)
}

async function processPostPaymentOperations(data) {
  const { userId, productIds, couponCode, walletAmount, razorpay_payment_id, isCart } = data

  try {
    // 1. Enroll user in all purchased courses
    await Promise.all(productIds.map((courseId) => enrollUserToCourse(userId, courseId)))

    // 2. Process coupon usage if coupon was used
    if (couponCode) {
      await processCouponUsage(userId, couponCode)
    }

    // 3. Process wallet deduction if wallet was used
    if (walletAmount > 0) {
      await processWalletDeduction(userId, walletAmount, razorpay_payment_id)
    }

    // 4. Clear cart if it was a cart purchase
    if (isCart) {
      await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } })
    }
  } catch (error) {
    console.error("Error in post-payment operations:", error)
    // Log error but don't throw to avoid payment verification failure
    // You might want to implement a retry mechanism or manual intervention
  }
}

async function enrollUserToCourse(userId, courseId) {
  try {
    const course = await Course.findById(courseId).select("lessons enrolledCount")

    if (!course) {
      console.error(`Course with ID ${courseId} not found`)
      return
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({ user: userId, course: courseId })
    if (existingEnrollment) {
      console.log(`User ${userId} already enrolled in course ${courseId}`)
      return
    }

    const now = new Date()

    // Create enrollment and progress records
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
    ])

    console.log(`Successfully enrolled user ${userId} in course ${courseId}`)
  } catch (error) {
    console.error(`Failed to enroll user ${userId} in course ${courseId}:`, error)
    throw error
  }
}

async function processCouponUsage(userId, couponCode) {
  try {
    const [userDoc, coupon] = await Promise.all([User.findById(userId), Coupon.findOne({ code: couponCode })])

    if (!coupon) {
      throw new AppError("Invalid coupon code", 400)
    }

    const usedCoupon = userDoc.usedCoupons?.find((c) => c.code === couponCode)
    const now = new Date()

    if (usedCoupon) {
      usedCoupon.usedCount += 1
      usedCoupon.usedAt = now
    } else {
      userDoc.usedCoupons.push({
        code: couponCode,
        usedCount: 1,
        usedAt: now,
      })
    }

    await userDoc.save()
    console.log(`Updated coupon usage for user ${userId}, coupon ${couponCode}`)
  } catch (error) {
    console.error(`Failed to process coupon usage for user ${userId}:`, error)
    throw error
  }
}

async function processWalletDeduction(userId, walletAmount, paymentId) {
  try {
    if (!walletAmount || walletAmount <= 0) return

    // Find the wallet
    const wallet = await Wallet.findOne({ user: userId })
    if (!wallet) {
      throw new AppError("Wallet not found", 404)
    }

    if (wallet.balance < walletAmount) {
      throw new AppError("Insufficient wallet balance", 400)
    }

    // Create wallet transaction record
    const walletTransaction = await WalletTransactions.create({
      user: userId,
      wallet: wallet._id,
      type: "debit",
      amount: walletAmount,
      status: "success", // Changed from "completed" to match schema
      meta: {
        paymentId: paymentId || `order_${Date.now()}`,
        description: `Payment deduction for order`,
        transactionType: "course_purchase",
      },
    })

    // Update wallet balance and add transaction reference
    wallet.balance -= walletAmount
    wallet.transactions.push(walletTransaction._id)

    await wallet.save()

    console.log(`Successfully deducted ₹${walletAmount} from wallet for user ${userId}`)
    console.log(`Wallet transaction created with ID: ${walletTransaction._id}`)

    return walletTransaction
  } catch (error) {
    console.error(`Failed to process wallet deduction for user ${userId}:`, error)
    throw error
  }
}
