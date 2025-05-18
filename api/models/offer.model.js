import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Flat 50% off"
    description: { type: String },
    type: {
      type: String,
      enum: ["category", "course", "instructor", "global"],
      required: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
    },
    discountValue: { type: Number, required: true }, // 50 for 50% or $50
    applicableTo: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
