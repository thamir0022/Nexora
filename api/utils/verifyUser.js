import { AppError } from "./apperror.js";
import jwt from "jsonwebtoken";
import { JWT_ACCESS_TOKEN_SECRET } from "./env.js";
import { User } from "../models/user.model.js";

export const verifyUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Unauthorized: No token provided", 401));
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_ACCESS_TOKEN_SECRET);
    } catch {
      return next(new AppError("Invalid or expired token", 401));
    }

    const user = await User.findById(decoded.id).lean();

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.status === "suspended") {
      return next(
        new AppError("Your account is suspended. Please contact support.", 403)
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
