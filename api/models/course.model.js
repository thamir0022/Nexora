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
    price: {
      type: Number,
      required: true,
    },
    features: {
      type: [String],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    instructor: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    enrolledCount: {
      type: Number,
      default: 0,
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
    thumbnailImage: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    keywords: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);

// Text index for searching
courseSchema.index({
  title: "text",
  description: "text",
  keywords: "text",
  tags: "text",
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
