import { Router } from "express";
import {
  googleAuth,
  refreshToken,
  registerUser,
  resetPassword,
  sendResetPasswordLink,
  sentOtp,
  signIn,
  signOut,
  verifyOtp,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/send-otp", sentOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", registerUser);
router.post("/sign-in", signIn);
router.get("/sign-out", signOut);
router.get("/refresh", refreshToken);
router.post("/google", googleAuth); // Google sign-in route
router.post("/forgot-password", sendResetPasswordLink); 
router.post("/reset-password/:token", resetPassword);

export default router;
