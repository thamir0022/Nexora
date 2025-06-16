import { isValidObjectId } from "mongoose";
import Review from "../models/review.model.js";
import { AppError } from "../utils/apperror.js";

export const getAllReviews = async (req, res, next) => {
  const { targetId, targetType } = req.query;
  let filter = {};
  if (targetId) filter.targetId = targetId;
  if (targetType) filter.targetType = targetType;

  try {
    const reviews = await Review.find(filter).select("-__v").sort({ createdAt: -1 });
    if (!reviews) throw new AppError("No reviews found", 404);
    res.status(200).json({ success: true, message: "Reviews fetched successfully", reviews });
  } catch (error) {
    next(error);
  }
}

export const createReview = async (req, res, next) => {
  try {
    const { targetId, targetType } = req.query;
    const { rating, comment } = req.body;

    const newReview = new Review({
      targetId,
      targetType,
      rating,
      comment,
      user: req.user._id,
    });

    newReview.save();

    res.status(201).json({ success: true, message: "Review created successfully", review: newReview });
  } catch (error) {
    next(error);
  }
}

export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!reviewId || !isValidObjectId(reviewId))
      throw new AppError(reviewId ? "Invalid review ID" : "Review ID is required", 400);

    const review = await Review.findById(reviewId);

    if (!review) throw new AppError("Review not found", 404);

    if (review.user.toString() !== req.user._id.toString())
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

    if (!reviewId || !isValidObjectId(reviewId))
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