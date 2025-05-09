import mongoose, { Schema, Types } from "mongoose";

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: [
      {
        type: Types.ObjectId,
        ref: "Category",
        required: true,
      },
    ],
    description: {
      type: String,
      required: true,
      trim: true,
    },
    features: {
      type: [String],
      required: true,
      validate: v => Array.isArray(v) && v.length > 0,
    },
    instructor: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    enrolledCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      ratingCount: {
        type: Number,
        default: 0,
      },
    },
    lessons: [
      {
        type: Types.ObjectId,
        ref: "Lesson",
        required: true,
      },
    ],
    lessonCount: {
      type: Number,
      default: 0
    },
    thumbnailImage: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;
