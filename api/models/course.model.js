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
    },
    instructor: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
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
        default: [],
        required: true,
      },
    ],
    thumbnailImage: {
      type: String,
      trim: true,
    },
    hashtags: {
      type: [String],
      required: true,
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
