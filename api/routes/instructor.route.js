import { Router } from "express";
import {
  addInstructorQualification,
  approveInstructor,
  getAllInstructorRequests,
  getInstructorAnalytics,
  getInstructorCourses,
  getInstructorQualifications,
  getInstructorRequest,
  rejectInstructor,
  updateInstructorQualification,
} from "../controllers/instructor.controller.js";
import { verifyUser } from "../utils/verifyUser.js";

const router = Router();

router.get("/courses", verifyUser, getInstructorCourses);
router.get("/analytics", verifyUser, getInstructorAnalytics)
router.post("/qualifications", addInstructorQualification);
router.get("/qualifications/:userId", verifyUser, getInstructorQualifications);
router.patch("/qualifications/:userId", verifyUser, updateInstructorQualification);
router.get("/requests", verifyUser, getAllInstructorRequests);
router.get("/requests/:userId", verifyUser, getInstructorRequest);
router.patch("/:userId/approve", verifyUser, approveInstructor);
router.patch("/:userId/reject", verifyUser, rejectInstructor);

export default router;