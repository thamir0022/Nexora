import { Router } from "express";
import { verifyUser } from "../utils/verifyUser.js";
import {
  deleteUser,
  getUserCart,
  getUser,
  getUserCourses,
  updateUser,
  addToCart,
  removeFromCart,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  addToCartFromWishlist,
  moveToWishlistFromCart,
  applyCoupon,
  getUserCoupon,
} from "../controllers/user.controller.js";
import { getUserCertificates } from "../controllers/certificate.controller.js";

const router = Router();

router.get("/:userId", verifyUser, getUser);
router.get("/:userId/courses", verifyUser, getUserCourses);
router.patch("/:userId", verifyUser, updateUser);
router.delete("/:userId", verifyUser, deleteUser);

router.get("/:userId/cart", verifyUser, getUserCart);
router.post("/:userId/cart/:courseId", verifyUser, addToCart);
router.patch("/:userId/cart/:courseId", verifyUser, moveToWishlistFromCart);
router.delete("/:userId/cart/:courseId", verifyUser, removeFromCart);

router.get("/:userId/wishlist", verifyUser, getUserWishlist);
router.post("/:userId/wishlist/:courseId", verifyUser, addToWishlist);
router.patch("/:userId/wishlist/:courseId", verifyUser, addToCartFromWishlist);
router.delete("/:userId/wishlist/:courseId", verifyUser, removeFromWishlist);

router.get("/:userId/coupon", verifyUser, getUserCoupon);
router.post("/:userId/coupon", verifyUser, applyCoupon);

router.get("/:userId/certificates", verifyUser, getUserCertificates);

export default router;
