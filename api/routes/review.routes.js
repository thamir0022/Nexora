import express from "express";
import { createReview, getAllReviews, updateReview, deleteReview } from "../controllers/review.controller.js";
import { verifyUser } from "../utils/verifyUser.js";

const router = express.Router();

router.get("/", getAllReviews);
router.post("/", verifyUser, createReview);
router.patch("/:reviewId", verifyUser, updateReview);
router.delete("/:reviewId", verifyUser, deleteReview);

export default router;