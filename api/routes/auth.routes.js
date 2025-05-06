import {Router} from "express";
import { refreshToken, signIn, signUp } from "../controllers/auth.controller.js";

const router = Router();

router.post("/sign-up", signUp);
router.post("/sign-in", signIn);
router.get("/refresh", refreshToken);

export default router;