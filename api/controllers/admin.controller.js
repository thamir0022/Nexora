import User from "../models/user.model.js";
import { AppError } from "../utils/apperror.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const { status, role, sort } = req.query;

    if (req.user.role !== "admin")
      throw new AppError("You should be a admin for accessing this API", 403);

    const filter = {
      ...(status ? { status } : role ? { role } : {}),
    };

    const order = sort === "asc" ? 1 : -1;

    const users = await User.find(filter)
      .select("-password -__v")
      .sort({ createdAt: order });

    if (!users) throw new AppError("No users found", 404);

    res.status(200).json({
      status: "success",
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    next(error);
  }
};
