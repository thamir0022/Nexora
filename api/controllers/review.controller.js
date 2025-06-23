import mongoose, { isValidObjectId } from "mongoose";
import Review from "../models/review.model.js";
import { AppError } from "../utils/apperror.js";

export const getAllReviews = async (req, res, next) => {
  const { targetId, targetType } = req.query;
  let filter = {};

  if (targetId) {
    if (!isValidObjectId(targetId)) {
      return next(new AppError("Invalid targetId format", 400));
    }
    filter.targetId = new mongoose.Types.ObjectId(targetId);
  }

  if (targetType) filter.targetType = targetType;

  try {
    const reviews = await Review.find(filter).select("-__v").populate("user", "fullName profilePicture").sort({ createdAt: -1 });
    if (!reviews) throw new AppError("No reviews found", 404);
    res.status(200).json({ success: true, message: "Reviews fetched successfully", reviews });
  } catch (error) {
    next(error);
  }
}

export const createReview = async (req, res, next) => {
  try {
    const { _id: user } = req.user;
    const { targetId, targetType } = req.query;
    const { rating, comment } = req.body;

    if(!targetId || !targetType || !rating || !comment)
      throw new AppError("All fields are required", 400);

    if(!isValidObjectId(targetId)) throw new AppError("Invalid targetId format", 400);
    if(targetType !== "course" && targetType !== "instructor") throw new AppError("Invalid targetType format", 400);
    if(rating < 1 || rating > 5) throw new AppError("Invalid rating format", 400);

    const newReview = new Review({
      targetId,
      targetType: targetType === "course" ? "Course" : "Instructor",
      rating,
      comment,
      user,
    });

    await newReview.save();

    const review = await newReview.populate("user", "fullName profilePicture");

    res.status(201).json({ success: true, message: "Review created successfully", review });
  } catch (error) {
    next(error);
  }
}

export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId))
      throw new AppError(reviewId ? "Invalid review ID" : "Review ID is required", 400);

    const review = await Review.findById(reviewId).populate("user", "fullName profilePicture");

    if (!review) throw new AppError("Review not found", 404);

    if (review.user._id.toString() !== req.user._id.toString())
      throw new AppError("You are not allowed to update this review", 403);

    review.rating = rating;
    review.comment = comment;
    await review.save();

    res.status(200).json({ success: true, message: "Review updated successfully", review });
  } catch (error) {
    next(error);
  }
}

export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId))
      throw new AppError(reviewId ? "Invalid review ID" : "Review ID is required", 400);

    const review = await Review.findById(reviewId);

    if (!review) throw new AppError("Review not found", 404);

    if (review.user.toString() !== req.user._id.toString())
      throw new AppError("You are not allowed to delete this review", 403);

    await review.deleteOne();

    res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
}