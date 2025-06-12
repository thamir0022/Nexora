import { Router } from "express";
import { verifyUser } from "../utils/verifyUser.js";
import { createOrder, verifyOrder } from "../controllers/payment.controller.js";

const router = Router();

router.post("/order", verifyUser, createOrder);
router.post("/verify", verifyUser, verifyOrder);

export default router;