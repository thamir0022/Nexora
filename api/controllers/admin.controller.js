import { User } from "../models/user.model.js";
import {AppError} from "../utils/apperror.js";

export const getAllUsers = async(req, res, next) => {
  try {
    if(req.user.role !== "admin") throw new AppError("You should be a admin for accessing this API", 403);

    const users = await User.find().select("-password -__v").sort({createdAt: -1});

    if(!users) throw new AppError("No users found", 404);

    res.status(200).json({
      status: "success",
      message: "Users fetched successfully",
      users
    });
  } catch (error) {
    next(error);
  }
}