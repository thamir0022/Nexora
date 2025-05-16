import { isValidObjectId, Types } from "mongoose";
import InstructorQualification from "../models/instructorQualification.model.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/apperror.js";

export const addInstructorQualification = async (req, res, next) => {
  try {
    const {
      userId,
      qualifications,
      experienceSummary,
      portfolioLink,
      socialLinks,
    } = req.body;

    const user = await User.findById(userId).lean();

    if (user.role !== "instructor")
      throw new AppError("Only instructor can access this api", 403);

    // Basic input validation
    if (
      !Array.isArray(qualifications) ||
      qualifications.length === 0 ||
      !experienceSummary ||
      !Array.isArray(socialLinks)
    )
      throw new AppError("Missing or invalid fields in request body", 400);

    // Check if instructor already submitted qualifications
    const existing = await InstructorQualification.findOne({ userId });
    if (existing) throw new AppError("Qualification already submitted", 409);

    const newQualification = new InstructorQualification({
      userId,
      qualifications,
      experienceSummary,
      portfolioLink,
      socialLinks,
    });

    await newQualification.save();

    res.status(201).json({
      success: true,
      message: "Qualification submitted successfully.",
      data: newQualification,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllInstructorRequests = async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      throw new AppError("You are not admin to access this API", 403);

    const pendingInstructors = await User.aggregate([
      {
        $match: {
          role: "instructor",
          status: { $in: ["pending", "rejected"] },
        },
      },
      {
        $lookup: {
          from: "instructorqualifications",
          localField: "_id",
          foreignField: "userId",
          as: "qualifications",
        },
      },
    ]);

    if (!pendingInstructors)
      throw new AppError("No pending instructors found", 404);

    res.status(200).json({
      success: true,
      message: "Pending instructors fetched successfully",
      pendingInstructors,
    });
  } catch (error) {
    next(error);
  }
};

export const getInstructorRequest = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || !isValidObjectId(userId)) {
      throw new AppError(
        userId ? "Invalid user Id" : "User Id is required",
        400
      );
    }

    const [instructorReq] = await User.aggregate([
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "instructorqualifications",
          localField: "_id",
          foreignField: "userId",
          as: "qualification",
        },
      },
      {
        $addFields: {
          qualification: { $arrayElemAt: ["$qualification", 0] },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$qualification", "$$ROOT"],
          },
        },
      },
      {
        $project: {
          password: 0,
          qualification: 0, // already merged
          __v: 0,
        },
      },
    ]);

    if (!instructorReq) throw new AppError("No instructor request found", 404);

    res.status(200).json({
      success: true,
      message: "Instructor request fetched successfully",
      request: instructorReq,
    });
  } catch (error) {
    next(error);
  }
};

export const approveInstructor = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== "admin")
      throw new AppError("Your are not allowed to access this api", 403);

    if (!userId || !isValidObjectId(userId))
      throw new AppError(
        userId ? "Invalid user id" : "User Id is required",
        400
      );

    await User.findByIdAndUpdate(userId, {
      $set: {
        status: "active",
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Instructor approved successfully" });
  } catch (error) {
    next(error);
  }
};

export const rejectInstructor = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== "admin")
      throw new AppError("Your are not allowed to access this api", 403);

    if (!userId || !isValidObjectId(userId))
      throw new AppError(
        userId ? "Invalid user id" : "User Id is required",
        400
      );

    await User.findByIdAndUpdate(userId, {
      $set: {
        status: "rejected",
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Instructor rejected successfully" });
  } catch (error) {
    next(error);
  }
};
