import User from "../models/user.model.js";

export const getUser = async (req, res, next) => {
  try {
    const { userId } = req.query;
    let targetId;

    if (userId && req.user === "admin") {
      targetId = userId;
    } else {
      targetId = req.user._id;
    }

    const user = await User.findById(targetId).select("-password -__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requester = req.user;

    // Only allow if admin or deleting their own account
    if (requester._id !== userId && requester.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this user" });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// PAtCH /api/users/:id
// Update user details
export const updateUser = async (req, res, next) => {
  try {
    const { userId: targetUserId } = req.params;
    const requester = req.user; // populated by verifyUser middleware

    const allowedFields = ["fullName", "mobile", "profilePicture", "password"];
    if (requester.role === "admin") {
      allowedFields.push("status", "role", "emailVerified", "mobileVerified");
    }

    // Pick only allowed fields
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid fields to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(targetUserId, updates, {
      new: true,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
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
