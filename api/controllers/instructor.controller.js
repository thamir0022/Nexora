import { isValidObjectId, Types } from "mongoose";
import InstructorQualification from "../models/instructorQualification.model.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/apperror.js";
import Course from "../models/course.model.js";

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

export const getInstructorQualifications = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || !isValidObjectId(userId)) {
      throw new AppError(
        userId ? "Invalid user Id" : "User Id is required",
        400
      );
    }

    if (req.user.role !== "admin" && String(req.user._id) !== String(userId))
      throw new AppError("You are not allowed to access this API", 403);

    const instructorQualifications = await InstructorQualification.findOne({
      userId,
    }).lean();

    if (!instructorQualifications)
      throw new AppError("No qualifications found", 404);

    res.status(200).json({
      success: true,
      message: "Qualifications fetched successfully",
      qualifications: instructorQualifications,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllInstructorRequests = async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      throw new AppError("You are not admin to access this API", 403);

    const { query } = req.query;

    const filter = {
      role: "instructor",
      status: { $in: ["pending", "rejected"] },
    };

    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    const pendingInstructors = await User.aggregate([
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "instructorqualifications",
          localField: "_id",
          foreignField: "userId",
          as: "qualifications",
        },
      },
      {
        $sort: {
          createdAt: -1,
        }
      }
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

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          status: "active",
          joineDate: Date.now()
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) throw new AppError("Instructor not found", 404);

    res.status(200).json({
      success: true,
      message: "Instructor approved successfully",
      instructor: updatedUser,
    });
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

export const getInstructorCourses = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    if (role !== "instructor")
      throw new AppError("You are not allowed to access this API", 403);

    const courses = await Course.find({ instructor: _id }).populate([{
      path: "category",
      select: "name",
    }, {
      path: "instructor",
      select: "fullName email profilePicture",

    }]).sort({ createdAt: -1 }).lean();

    res.status(200).json({ success: true, message: "Course fetched successfully", courses });
  } catch (error) {
    next(error);
  }
};


export const updateInstructorQualification = async (req, res, next) => {
  try {
    const {
      userId,
      qualifications,
      experienceSummary,
      portfolioLink,
      socialLinks,
    } = req.body;

    if (userId != req.user._id) throw new AppError("You are not allowed to update this qualification", 403);

    const user = await User.findById(userId).lean();

    if (!user || user.role !== "instructor") {
      throw new AppError("Only instructors can update qualifications", 403);
    }

    // Input validation (reuse same logic as add)
    if (
      !Array.isArray(qualifications) ||
      qualifications.length === 0 ||
      !experienceSummary ||
      !Array.isArray(socialLinks)
    ) {
      throw new AppError("Missing or invalid fields in request body", 400);
    }

    const updatedQualification = await InstructorQualification.findOneAndUpdate(
      { userId },
      {
        $set: {
          qualifications,
          experienceSummary,
          portfolioLink,
          socialLinks,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedQualification) {
      throw new AppError("Instructor qualification not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Qualification updated successfully.",
      data: updatedQualification,
    });
  } catch (error) {
    next(error);
  }
};