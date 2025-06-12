import { Router } from "express";
import { createCoupon, deleteCoupon, getAllCoupons, getAllUsers, updateCoupon } from "../controllers/admin.controller.js";
import { verifyUser } from "../utils/verifyUser.js";

const router = Router();

router.get("/users", verifyUser, getAllUsers);
router.get("/coupons", getAllCoupons);
router.post("/coupons", verifyUser, createCoupon);
router.put("/coupons/:couponId", verifyUser, updateCoupon);
router.delete("/coupons/:couponId", verifyUser, deleteCoupon);

export default router;
