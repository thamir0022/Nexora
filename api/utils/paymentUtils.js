import Course from "../models/course.model.js"
import Cart from "../models/cart.model.js"
import Coupon from "../models/coupon.model.js"
import User from "../models/user.model.js"
import Wallet from "../models/wallet.model.js"
import WalletTransactions from "../models/walletTransaction.model.js"
import razorpayInstance from "../config/razorpay.js"

// Updated getProductsAndEffectiveAmount function to handle both cart and single course
export const getProductsAndEffectiveAmount = async (isCart, courseIds, userId) => {
  
  let courseIdsToFetch = []

  if (isCart) {
    // Get user's cart items
    const cart = await Cart.findOne({ userId }).populate({
      path: "items",
      match: { status: "published" },
    })

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error("Cart is empty")
    }

    courseIdsToFetch = cart.items.map((item) => item._id)
  } else {
    // Use provided course IDs for single course purchase
    if (!courseIds || courseIds.length === 0) {
      throw new Error("No course IDs provided")
    }
    courseIdsToFetch = Array.isArray(courseIds) ? courseIds : [courseIds]
  }

  // Fetch courses with their current data
  const courses = await Course.find({
    _id: { $in: courseIdsToFetch },
    status: "published", // Only published courses
  })

  if (courses.length === 0) {
    throw new Error("No valid courses found")
  }

  // Check if all requested courses were found
  if (courses.length !== courseIdsToFetch.length) {
    const foundIds = courses.map((c) => c._id.toString())
    const missingIds = courseIdsToFetch.filter((id) => !foundIds.includes(id.toString()))
    throw new Error(`Some courses are not available: ${missingIds.join(", ")}`)
  }

  const productIds = courses.map((course) => course._id)

  // Calculate amounts
  let originalAmount = 0
  let effectiveAmount = 0

  courses.forEach((course) => {
    const price = course.price || 0
    originalAmount += price

    // Use effectivePrice if available (already calculated with offers)
    if (course.effectivePrice !== undefined && course.effectivePrice !== null) {
      effectiveAmount += course.effectivePrice
    } else if (course.hasDiscount && course.offer) {
      // Calculate effective price from offer data
      let discountAmount = 0

      if (course.offer.discountPercentage) {
        discountAmount = (price * course.offer.discountPercentage) / 100
      } else if (course.offer.discountAmount) {
        discountAmount = course.offer.discountAmount
      }

      const effectivePrice = Math.max(price - discountAmount, 0)
      effectiveAmount += effectivePrice
    } else {
      effectiveAmount += price
    }
  })

  const offerSavings = originalAmount - effectiveAmount

  return {
    productIds,
    originalAmount,
    effectiveAmount,
    offerSavings,
    courses, // Return courses for additional processing if needed
  }
}

// Calculate coupon discount amount
export const calculateDiscountAmount = async (baseAmount, couponCode, userId) => {
  if (!couponCode) return 0

  try {
    // Get coupon details
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      validFrom: { $lte: new Date() },
      validTill: { $gte: new Date() },
    })

    if (!coupon) {
      throw new Error("Invalid or expired coupon")
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && baseAmount < coupon.minOrderAmount) {
      throw new Error(`Minimum order amount of ₹${coupon.minOrderAmount} required`)
    }

    // Check if user has already used this coupon (from user's usedCoupons array)
    const user = await User.findById(userId).select("usedCoupons")
    if (!user) {
      throw new Error("User not found")
    }

    const existingUsage = user.usedCoupons.find((usage) => usage.code === couponCode.toUpperCase())
    const usageCount = existingUsage ? existingUsage.usedCount : 0

    if (usageCount >= coupon.usageLimitPerUser) {
      throw new Error("Coupon usage limit exceeded for this user")
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discountType === "percentage") {
      discountAmount = (baseAmount * coupon.discountValue) / 100
      // Apply max discount cap if specified
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount)
      }
    } else if (coupon.discountType === "flat") {
      discountAmount = coupon.discountValue
    }

    return Math.min(discountAmount, baseAmount)
  } catch (error) {
    throw new Error(`Coupon error: ${error.message}`)
  }
}

// Validate wallet amount
export const validateWalletAmount = async (requestedWalletAmount, availableAmount, userId) => {
  if (!requestedWalletAmount || requestedWalletAmount <= 0) return 0

  try {
    // Get user's wallet balance (using 'user' field as per your schema)
    const wallet = await Wallet.findOne({ user: userId })
    const walletBalance = wallet?.balance || 0

    if (walletBalance <= 0) {
      throw new Error("Insufficient wallet balance")
    }

    // Return the minimum of requested amount, available amount, and wallet balance
    return Math.min(requestedWalletAmount, availableAmount, walletBalance)
  } catch (error) {
    throw new Error(`Wallet error: ${error.message}`)
  }
}

// Create Razorpay order
export const createRazorpayOrder = async (amount, notes) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notes,
    }

    const order = await razorpayInstance.orders.create(options)
    return order
  } catch (error) {
    throw new Error(`Payment gateway error: ${error.message}`)
  }
}

// Record coupon usage in user's usedCoupons array
export const recordCouponUsage = async (userId, couponCode, orderId) => {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error("User not found")
    }

    const upperCaseCode = couponCode.toUpperCase()
    const existingUsage = user.usedCoupons.find((usage) => usage.code === upperCaseCode)

    if (existingUsage) {
      // Increment usage count
      existingUsage.usedCount += 1
      existingUsage.usedAt = new Date()
    } else {
      // Add new usage record
      user.usedCoupons.push({
        code: upperCaseCode,
        usedAt: new Date(),
        usedCount: 1,
      })
    }

    await user.save()
  } catch (error) {
    console.error("Error recording coupon usage:", error)
    throw error
  }
}

// Deduct wallet balance and create transaction
export const deductWalletBalance = async (userId, amount, transactionId, description = "Payment deduction") => {
  try {
    if (amount <= 0) return null

    const wallet = await Wallet.findOne({ user: userId })
    if (!wallet || wallet.balance < amount) {
      throw new Error("Insufficient wallet balance")
    }

    // Create wallet transaction record first
    const transaction = await WalletTransactions.create({
      user: userId,
      wallet: wallet._id,
      type: "debit",
      amount,
      status: "success",
      meta: {
        transactionId,
        description,
        paymentType: "course_purchase",
      },
    })

    // Update wallet balance
    wallet.balance -= amount
    wallet.transactions.push(transaction._id)
    await wallet.save()

    return transaction
  } catch (error) {
    // If transaction creation fails, mark it as failed
    try {
      await WalletTransactions.create({
        user: userId,
        wallet: null,
        type: "debit",
        amount,
        status: "failed",
        meta: {
          transactionId,
          description,
          error: error.message,
        },
      })
    } catch (logError) {
      console.error("Error logging failed wallet transaction:", logError)
    }
    throw new Error(`Wallet deduction error: ${error.message}`)
  }
}

// Add credit to wallet balance
export const addWalletBalance = async (userId, amount, transactionId, description = "Wallet credit") => {
  try {
    if (amount <= 0) return null

    const wallet = await Wallet.findOne({ user: userId })
    if (!wallet) {
      throw new Error("Wallet not found")
    }

    // Create wallet transaction record
    const transaction = await WalletTransactions.create({
      user: userId,
      wallet: wallet._id,
      type: "credit",
      amount,
      status: "success",
      meta: {
        transactionId,
        description,
        paymentType: "refund",
      },
    })

    // Update wallet balance
    wallet.balance += amount
    wallet.transactions.push(transaction._id)
    await wallet.save()

    return transaction
  } catch (error) {
    throw new Error(`Wallet credit error: ${error.message}`)
  }
}

// Clear user cart after successful payment
export const clearUserCart = async (userId) => {
  try {
    const result = await Cart.findOneAndUpdate({ userId }, { items: [] }, { new: true })
    if (!result) {
      console.warn(`No cart found for user ${userId}`)
    }
    return result
  } catch (error) {
    console.error("Error clearing cart:", error)
    throw error
  }
}

// Validate course availability
export const validateCourseAvailability = async (courseIds) => {
  try {
    const courses = await Course.find({
      _id: { $in: courseIds },
      status: "published",
    })

    if (courses.length !== courseIds.length) {
      const foundIds = courses.map((c) => c._id.toString())
      const missingIds = courseIds.filter((id) => !foundIds.includes(id.toString()))
      throw new Error(`Some courses are no longer available: ${missingIds.join(", ")}`)
    }

    return courses
  } catch (error) {
    throw new Error(`Course validation error: ${error.message}`)
  }
}

// Enroll user in courses after successful payment
export const enrollUserInCourses = async (userId, courseIds) => {
  try {
    // Update course enrollment count
    await Course.updateMany({ _id: { $in: courseIds } }, { $inc: { enrolledCount: 1 } })

    // If you have an enrolledCourses field in User schema, update it
    // await User.findByIdAndUpdate(userId, {
    //   $addToSet: { enrolledCourses: { $each: courseIds } }
    // })

    // Or if you have a separate Enrollment model, create enrollment records
    // const enrollments = courseIds.map(courseId => ({
    //   user: userId,
    //   course: courseId,
    //   enrolledAt: new Date(),
    //   status: 'active'
    // }))
    // await Enrollment.insertMany(enrollments)

    console.log(`User ${userId} enrolled in courses: ${courseIds.join(", ")}`)
    return true
  } catch (error) {
    console.error("Error enrolling user in courses:", error)
    throw error
  }
}

// Rollback operations in case of payment failure
export const rollbackPaymentOperations = async (userId, couponCode, walletTransactionId) => {
  try {
    // Rollback coupon usage
    if (couponCode) {
      const user = await User.findById(userId)
      if (user) {
        const couponUsage = user.usedCoupons.find((usage) => usage.code === couponCode.toUpperCase())
        if (couponUsage) {
          if (couponUsage.usedCount > 1) {
            couponUsage.usedCount -= 1
          } else {
            user.usedCoupons = user.usedCoupons.filter((usage) => usage.code !== couponCode.toUpperCase())
          }
          await user.save()
        }
      }
    }

    // Rollback wallet transaction
    if (walletTransactionId) {
      const transaction = await WalletTransactions.findById(walletTransactionId)
      if (transaction && transaction.type === "debit") {
        await addWalletBalance(userId, transaction.amount, `rollback_${walletTransactionId}`, "Payment rollback")
      }
    }

    console.log(`Rollback completed for user ${userId}`)
  } catch (error) {
    console.error("Error during rollback:", error)
  }
}
