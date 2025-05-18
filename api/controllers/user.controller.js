import { isValidObjectId } from "mongoose";
import User from "../models/user.model.js";
import { AppError } from "../utils/apperror.js";
import bcrypt from "bcryptjs";

// Helper: Pick only allowed fields from input
const pickAllowedFields = (source, allowed) => {
  return allowed.reduce((obj, key) => {
    if (source[key] !== undefined) {
      obj[key] = source[key];
    }
    return obj;
  }, {});
};

export const getUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId != req.user._id && req.user.role !== "admin")
      throw new AppError("You are not allowed to get this user data", 403);

    if (!userId || !isValidObjectId(userId))
      throw new AppError(
        userId ? "Invalid user Id" : "User Id is required",
        400
      );

    const user = await User.findById(userId).select("-password -__v");

    if (!user) throw new AppError("User not found with this Id", 404);

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// PAtCH /api/users/:id
// Update user details

export const updateUser = async (req, res, next) => {
  try {
    const { userId: targetUserId } = req.params;
    const requester = req.user;

    // Authorization check
    const isAdmin = requester.role === "admin";
    const isSelf = requester._id === targetUserId;

    if (!isSelf && !isAdmin) {
      throw new AppError("You are not allowed to access this API", 403);
    }

    // Determine allowed fields based on role
    const baseFields = ["fullName", "mobile", "profilePicture", "password"];
    const roleBasedFields = {
      admin: ["status", "bio", "role", "emailVerified", "mobileVerified"],
      instructor: ["bio"],
    };

    const allowedFields = [...baseFields];
    if (isAdmin) allowedFields.push(...roleBasedFields.admin);
    if (requester.role === "instructor") allowedFields.push(...roleBasedFields.instructor);

    // Pick only allowed updates
    const updates = pickAllowedFields(req.body, allowedFields);

    if (Object.keys(updates).length === 0) {
      throw new AppError("No valid fields to update", 400);
    }

    // Handle password update securely
    if (updates.password) {
      const existingUser = await User.findById(targetUserId).select("password").lean();

      if (!existingUser) {
        throw new AppError("User not found", 404);
      }

      const {oldPassword} = req.body;

      if(!oldPassword) throw new AppError("Old password is required to update password", 400);

      const isOldPasswordValid = await bcrypt.compare(oldPassword, existingUser.password);

      if (!isOldPasswordValid) {
        throw new AppError("Old password is incorrect", 400);
      }

      if(updates.password.length < 6) throw new AppError("New password must be at least 6 characters long", 400); 

      const salt = await bcrypt.genSalt();
      updates.password = await bcrypt.hash(updates.password, salt); 
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(targetUserId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requester = req.user;

    // Only allow if admin or deleting their own account
    if (requester._id !== userId && requester.role !== "admin")
      throw new AppError("Unauthorized to delete this user", 403);

    if (!userId || !isValidObjectId(userId))
      throw new AppError(
        userId ? "Invalid user Id" : "User Id is required",
        400
      );

    const deletedUser = await User.findByIdAndUpdate(userId, {
      $set: { isDeleted: true },
    });

    if (!deletedUser) throw new AppError("User not found with this Id", 404);

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};
