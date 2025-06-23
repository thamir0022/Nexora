import Certificate from "../models/certificate.model.js";
import CourseProgress from "../models/progress.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/apperror.js";

export const getCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      return next(new AppError('Certificate not found.', 404));
    }
    res.status(200).json({
      success: true,
      message: 'Certificate retrieved successfully',
      certificate,
    });
  } catch (error) {
    next(error);
  }
};

export const createCertificate = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const {_id:userId} = req.user;

    // Check progress
    const progress = await CourseProgress.findOne({ user: userId, course: courseId });

    if (!progress) {
      return next(new AppError('Course progress not found for this user.', 404));
    }

    if (progress.progressPercentage < 100) {
      return next(new AppError('Course not completed. Certificate can only be generated at 100% completion.', 400));
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({ userId, courseId });
    if (existingCertificate) {
      return next(new AppError('Certificate already exists for this course.', 400));
    }

    // Get course and user info
    const course = await Course.findById(courseId).select('title');
    const user = await User.findById(userId).select('fullName');

    if (!course || !user) {
      return next(new AppError('Invalid course or user.', 400));
    }

    const certificate = await Certificate.create({
      userId,
      courseId,
      courseName: course.title,
      studentName: user.fullName,
      completionDate: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      certificate,
    });
  } catch (error) {
    next(error);
  }
};


export const getUserCertificates = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const certificates = await Certificate.find({ userId });
    res.status(200).json({
      success: true,
      message: 'Certificates retrieved successfully',
      certificates,
    });
  } catch (error) {
    next(error);
  }
};
