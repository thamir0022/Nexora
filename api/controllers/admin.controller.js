import { isValidObjectId } from "mongoose";
import User from "../models/user.model.js";
import { AppError } from "../utils/apperror.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const { status, role, sort, search } = req.query;

    if (req.user.role !== "admin")
      throw new AppError("You should be a admin for accessing this API", 403);

    const filter = {
      ...(status ? { status } : { status: { $ne: "pending" } }),
      ...(role && { role }),
    };    
    

    const order = sort === "asc" ? 1 : -1;

    // Search logic
    if (search) {
      const isObjectId = isValidObjectId(search);
      if (isObjectId) {
        filter._id = search;
      } else {
        filter.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
    }

    const users = await User.find(filter)
      .select("-password -__v")
      .sort({ createdAt: order });

    if (!users) throw new AppError("No users found", 404);

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    next(error);
  }
};
