import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ["percentage", "flat"],
    default: "percentage",
  },
  discountValue: { type: Number, required: true }, // e.g. 20 means 20% or ₹20
  minOrderAmount: { type: Number, default: 0 }, // optional
  maxDiscount: { type: Number }, // cap for percentage coupons

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Admin for now, but supports future user-gen coupons
  },

  validFrom: { type: Date, default: Date.now },
  validTill: { type: Date, required: true },

  usageLimitPerUser: { type: Number, default: 1 }, // For your "once per user" rule

  createdAt: { type: Date, default: Date.now },
});

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
