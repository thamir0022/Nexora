import {Router} from "express";
import { googleAuth, refreshToken, signIn, signOut, signUp } from "../controllers/auth.controller.js";

const router = Router();

router.post("/sign-up", signUp);
router.post("/sign-in", signIn);
router.get("/sign-out", signOut);
router.get("/refresh", refreshToken);
router.post("/google", googleAuth); // Google sign-in route

export default router;