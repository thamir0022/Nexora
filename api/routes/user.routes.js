import {Router} from "express";
import { verifyUser } from "../utils/verifyUser.js";
import { deleteUser, getUserCart, getUser, updateUser, addToCart, removeFromCart } from "../controllers/user.controller.js";

const router = Router();

router.get("/:userId", verifyUser, getUser);
router.patch("/:userId", verifyUser, updateUser);
router.delete("/:userId", verifyUser, deleteUser);

router.get("/:userId/cart", verifyUser, getUserCart);
router.post("/:userId/cart/:courseId", verifyUser, addToCart);
router.delete("/:userId/cart/:courseId", verifyUser, removeFromCart);

export default router;