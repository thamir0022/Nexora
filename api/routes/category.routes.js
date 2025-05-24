import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import { verifyUser } from "../utils/verifyUser.js";

const router = Router();

router.get("/", getAllCategories);
router.post("/", verifyUser, createCategory);
router.patch("/:categoryId", verifyUser, updateCategory);
router.delete("/:categoryId", verifyUser, deleteCategory);

export default router;
