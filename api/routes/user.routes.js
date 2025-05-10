import {Router} from "express";
import { verifyUser } from "../utils/verifyUser.js";
import { deleteUser, getUser, updateUser } from "../controllers/user.controller.js";

const router = Router();

router.get("/", verifyUser, getUser);
router.patch("/:userId", verifyUser, updateUser);
router.delete("/:userId", verifyUser, deleteUser);

export default router;