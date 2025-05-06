import mongoose, { Schema, Types } from "mongoose";

const enrollmentSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "users",
      required: true,
    },
    courseId: {
      type: Types.ObjectId,
      ref: "courses",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    progress: {
      type: Number,
      default: 0, // Percentage (0–100)
      min: 0,
      max: 100,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    lastAccessed: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Enrollment = mongoose.model("enrollments", enrollmentSchema);

export default Enrollment;
