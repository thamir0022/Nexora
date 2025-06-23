import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Flat 50% off"
    description: { type: String },
    type: {
      type: String,
      enum: ["category", "course", "instructor", "global", "first-time"],
      required: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",  
    },
    discountValue: { type: Number, required: true }, // 50 for 50% or $50
    applicableTo:{
      type: [
        {
          refModel: {
            type: String,
            enum: ["Course", "Category", "Instructor"],
            required: true,
          },
          refId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },
        },
      ],
      default: [],
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["upcoming", "active", "expired", "inactive", "paused"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
