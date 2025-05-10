import { Router } from "express";
import { getAllUsers } from "../controllers/admin.controller.js";
import { verifyUser } from "../utils/verifyUser.js";

const router = Router();

router.get("/users", verifyUser, getAllUsers);

export default router;
