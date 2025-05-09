import Category from "../models/category.model.js";
import { AppError } from "../utils/apperror.js";

// GET ALL CATEGORIES
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }).exec();

    if(!categories) throw new AppError("No category is found", 404);

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// CREATE CATEGORY
export const createCategory = async (req, res, next) => {
  try {
    // if (req.user?.role !== "admin") {
    //   throw new AppError("Only admins can create categories", 403);
    // }

    const { categoryName, description } = req.body;

    if (!categoryName || typeof categoryName !== "string") {
      throw new AppError("Category name is required and must be a string", 400);
    }

    const categoryExists = await Category.findOne({ categoryName });
    if (categoryExists) {
      throw new AppError("Category with this name already exists", 409);
    }

    const newCategory = await Category.create({
      categoryName: categoryName.trim(),
      description: description?.trim() || "",
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE CATEGORY
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { categoryName, description, status } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        ...(categoryName && { categoryName: categoryName.trim() }),
        ...(description && { description: description.trim() }),
        ...(typeof status === "boolean" && { status }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      throw new AppError("Category not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

//DELETE CATEGORY
export const deleteCategory = async (req, res, next) => {
  try {
    if (req.user?.role !== "admin") {
      throw new AppError("Only admins can delete categories", 403);
    }

    const { id } = req.params;

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      throw new AppError("Category not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: deletedCategory,
    });
  } catch (error) {
    next(error);
  }
};