import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },

  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
  lastCompletedLesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
  totalLessons: { type: Number, default: 0 },

  progressPercentage: { type: Number, default: 0 },

}, { timestamps: true });

const CourseProgress = mongoose.model("CourseProgress", courseProgressSchema);

export default CourseProgress;
