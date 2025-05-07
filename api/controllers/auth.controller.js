/* eslint-disable no-unused-vars */
import { AppError } from "../utils/apperror.js";
import { User } from "../models/user.model.js";
import {
  signInSchema,
  signUpSchema,
} from "../utils/validators/user.validator.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwtGenerator.js";
import jwt from "jsonwebtoken";
import { JWT_REFRESH_TOKEN_EXPIRES_IN, JWT_REFRESH_TOKEN_SECRET } from "../utils/env.js";
import { handleZodError } from "../utils/handleZodError.js";

export const signUp = async (req, res, next) => {
  try {
    // ✅ Validate and parse data
    const parsed = signUpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: handleZodError(parsed.error),
      });
    }

    const { fullName, email, mobile, password, role } = parsed.data;

    // ✅ Check for existing user
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) throw new AppError("User already exists", 409);

    // ✅ Hash password
    const salt = await bcrypt.genSalt(10); // 10 rounds
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Create user
    const newUser = new User({
      fullName,
      email,
      mobile,
      password: hashedPassword,
      role,
    });
    await newUser.save();

    // ✅ Generate tokens
    const accessToken = generateAccessToken({ id: newUser._id, role });
    const refreshToken = generateRefreshToken({ id: newUser._id });

    // ✅ Set refresh token in HTTP-only secure cookie
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 1000 * 60 * 60, //1 hour
    });

    // ✅ Send access token in JSON response
    const { password: _, ...userData } = newUser._doc;

    return res.status(201).json({
      success: true,
      message: "Sign up successful",
      user: userData,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const parsed = signInSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: handleZodError(parsed.error),
      });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError("Invalid email or password", 400);

    // ✅ Generate tokens
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    //  ✅ Set refresh token in HTTP-only secure cookie
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 1000 * 60 * 60, //1 hour
    });

    // ✅ Send access token in JSON response
    const { password: _, ...userData } = user.toObject();

    return res.status(201).json({
      success: true,
      message: "Sign in successful",
      user: userData,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.cookies;

    if (!refresh_token) {
      return next(new AppError("Unauthorized", 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(refresh_token, JWT_REFRESH_TOKEN_SECRET);
    } catch (err) {
      return next(new AppError("Invalid or expired token", 401));
    }

    const user = await User.findById(decoded.id).lean(); // lean() for performance if you're not modifying the doc

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const newAccessToken = generateAccessToken({
      id: user._id,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed",
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};
