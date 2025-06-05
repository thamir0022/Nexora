import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    // User who wrote the review
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Review target (course or instructor)
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },

    // Can be either 'Course' or 'Instructor'
    targetType: {
      type: String,
      required: true,
      enum: ['Course', 'Instructor'],
    },

    // Review rating (1 to 5)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Review content
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Review = mongoose.model('Review', reviewSchema);
export default Review;
