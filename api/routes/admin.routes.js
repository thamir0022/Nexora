import { Router } from "express";
import { createCoupon, deleteCoupon, getAllCoupons, getAllEnrollments, getAllOrders, getAllUsers, getEnrollmentStatsByMonth, getRevenueStats, getStatistics, getUserStatsByMonth, updateCoupon } from "../controllers/admin.controller.js";
import { verifyUser } from "../utils/verifyUser.js";

const router = Router();

router.get("/users", verifyUser, getAllUsers);
router.get("/coupons", getAllCoupons);
router.post("/coupons", verifyUser, createCoupon);
router.get("/enrollments", verifyUser, getAllEnrollments);
router.put("/coupons/:couponId", verifyUser, updateCoupon);
router.delete("/coupons/:couponId", verifyUser, deleteCoupon);
router.get("/stats/platform", verifyUser, getStatistics);
router.get("/stats/users/monthly", verifyUser, getUserStatsByMonth);
router.get("/stats/enrollments/monthly", verifyUser, getEnrollmentStatsByMonth);
router.get("/stats/revenue", verifyUser, getRevenueStats);
router.get("/orders", verifyUser, getAllOrders);

export default router;
