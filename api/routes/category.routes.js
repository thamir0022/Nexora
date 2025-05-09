import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
} from "../controllers/category.controller.js";

const router = Router();

router.get("/", getAllCategories);
router.post("/", createCategory);
router.patch("/", updateCategory);
router.delete("/:categoryId", deleteCategory);

export default router;
