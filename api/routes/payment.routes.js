import { Router } from "express";
import { verifyUser } from "../utils/verifyUser.js";
import { createOrder, verifyPayment } from "../controllers/payment.controller.js";

const router = Router();

router.post("/order", verifyUser, createOrder);
router.post("/verify", verifyUser, verifyPayment);

export default router;