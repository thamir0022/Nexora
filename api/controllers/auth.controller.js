/* eslint-disable no-unused-vars */
import { AppError } from "../utils/apperror.js";
import { signInSchema } from "../utils/validators/user.validator.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwtGenerator.js";
import jwt from "jsonwebtoken";
import {
  CLIENT_BASE_URL,
  GOOGLE_CLIENT_ID,
  JWT_REFRESH_TOKEN_SECRET,
  NODEMAILER_EMAIL,
} from "../utils/env.js";
import { handleZodError } from "../utils/handleZodError.js";
import { googleAuthClient } from "../config/googleAuth.js";
import { transporter } from "../config/nodemailer.js";
import { generateOtp } from "../utils/otpgenerator.js";
import Otp from "../models/otp.model.js";
import User from "../models/user.model.js";
import Wallet from "../models/wallet.model.js";
import { generateNotification } from "../utils/lib.js";

export const sentOtp = async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (!email) throw new AppError("Email is required", 400);

    const user = await User.findOne({ email }).lean();

    if (user) throw new AppError("User already exists", 409);

    const existingOtp = await Otp.findOne({ email }).lean();

    if (existingOtp)
      throw new AppError("OTP already send, Try again after some time", 429);

    const newOTP = await Otp.create({
      email,
      otp: generateOtp(),
    });

    await transporter.sendMail({
      from: `"Nexora" <${NODEMAILER_EMAIL}>`,
      to: `${email}`,
      subject: "OTP for your email verification",
      text: `Greetings`, // plain‑text body
      html: `<p>Here is your OTP to verify your email : <b>${newOTP.otp}</b></p>`, // HTML body
    });

    res.status(200).json({ success: true, message: "Otp send successfully" });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body || {};

    if (!otp || !email) throw new AppError("Email and Otp are required", 400);

    const existingOtp = await Otp.findOne({ email });

    if (!existingOtp) throw new AppError("Otp expired, Try resend OTP", 404);

    if (existingOtp.otp !== parseInt(otp))
      throw new AppError("Incorrect Otp, Try again", 400);

    await existingOtp.deleteOne();

    const newUser = await User.create({
      email,
      emailVerified: true,
    });

    res.status(201).json({
      success: true,
      message: "OTP verified successfully",
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

export const registerUser = async (req, res, next) => {
  try {
    const { userId, fullName, email, mobile, password, role } = req.body;

    // Validate required fields
    if (!userId || !fullName || !email || !mobile || !password || !role)
      throw new AppError("All fields are required", 400);

    if (!["student", "instructor"].includes(role))
      throw new AppError("Invalid role selected", 400);

    // Find user by ID
    const existingUser = await User.findById(userId);
    if (!existingUser || existingUser.email !== email)
      throw new AppError("User not found or email mismatch", 404);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user details
    existingUser.fullName = fullName;
    existingUser.mobile = mobile;
    existingUser.password = hashedPassword;
    existingUser.role = role;
    existingUser.status = role === "student" ? "active" : "pending";
    existingUser.availableCoupons =
      role === "student" ? ["684a75668970c56456b8ee57"] : [];

    const updatedUser = await existingUser.save();

    const { password: _, ...userResponse } = updatedUser.toObject();

    // If student, generate tokens
    if (role === "student") {
      await Wallet.create({ user: updatedUser._id });
      await generateNotification(
        null,
        updatedUser._id,
        `Welcome to Nexora, ${updatedUser.fullName}`,
        "system"
      );
      const accessToken = generateAccessToken({ id: updatedUser._id, role });
      const refreshToken = generateRefreshToken({ id: updatedUser._id });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None", // important for frontend/backend on different domains
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        success: true,
        message: "Student registered successfully",
        user: userResponse,
        accessToken,
      });
    }

    // If instructor, prompt profile completion
    return res.status(201).json({
      success: true,
      message:
        "Instructor registered successfully. Please complete your profile.",
      user: userResponse,
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

    const { status } = user._doc;

    if (status !== "active") {
      throw new AppError(`Your account is ${status}`, 403, `account-${status}`);
    }

    // ✅ Generate tokens
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    // ✅ Set refresh token in HTTP-only secure cookie
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
    } catch (error) {
      next(
        new AppError(
          "Refresh token expired, Sign In Again",
          401,
          "invalid-refresh-token"
        )
      );
    }

    const user = await User.findById(decoded.id).lean();

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

export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res
        .status(400)
        .json({ success: false, message: "No credential provided" });
    }

    // Verify Google ID token
    const ticket = await googleAuthClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email)
      throw new AppError("Invalid Google token", 401);

    let user = await User.findOne({ email: payload.email });

    // If user does not exist, create one
    if (!user) {
      user = new User({
        fullName: payload.name,
        email: payload.email,
        password: "", // no password for Google sign-in
        role: "student", // default role, adjust as needed
        profilePicture: payload.picture,
        emailVerified: true,
      });
      await user.save();
    }

    if (user.status !== "active")
      throw new AppError(
        `Your account is ${user.status}`,
        403,
        `account-${user.status}`
      );

    if (user.isNew) {
      await generateNotification(
        null,
        user._id,
        `Welcome to Nexora ${user.fullName}`,
        "system"
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    // Set refresh token cookie
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { password, ...userData } = user.toObject();

    return res.status(200).json({
      success: true,
      message: user.isNew
        ? "Google sign-up successful"
        : "Google sign-in successful",
      user: userData,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const signOut = (req, res, next) => {
  try {
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res
      .status(200)
      .json({ success: true, message: "Signed out successfully" });
  } catch (err) {
    next(err);
  }
};

export const sendResetPasswordLink = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) throw new AppError("User not found", 404);

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 min
    await user.save();

    const resetUrl = `${CLIENT_BASE_URL}/reset-password/${token}`;

    const info = await transporter.sendMail({
      from: `"Nexora" <${NODEMAILER_EMAIL}>`,
      to: `${email}`,
      subject: "Password Reset Request",
      text: `Hello, ${user.fullName || "User"}`, // plain‑text body
      html: `<p>Here is your link for reset your password : <b><a href="${resetUrl}" target="_blank">Reset Password</a></b></p>`, // HTML body
    });

    res
      .status(200)
      .json({ success: true, message: "Password reset link has been sent" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password: newPassword } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) throw new AppError("Invalid or expired token", 400);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  await generateNotification(
    null,
    user._id,
    `Your password has been reset successfully`,
    "system"
  );

  res.status(200).json({ success: true, message: "Password has been reset" });
};
