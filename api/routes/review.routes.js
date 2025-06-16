import express from "express";
import { createReview, getAllReviews, updateReview, deleteReview } from "../controllers/review.controller.js";

const router = express.Router();

router.get("/", getAllReviews);
router.post("/", createReview);
router.patch("/:reviewId", updateReview);
router.delete("/:reviewId", deleteReview);

export default router;