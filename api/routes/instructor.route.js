import { Router } from "express";
import {
  addInstructorQualification,
  approveInstructor,
  getAllInstructorRequests,
  getInstructorRequest,
  rejectInstructor,
} from "../controllers/instructor.controller.js";
import { verifyUser } from "../utils/verifyUser.js";

const router = Router();

router.post("/qualifications", addInstructorQualification);
router.get("/requests", verifyUser, getAllInstructorRequests);
router.get("/requests/:userId", verifyUser, getInstructorRequest);
router.patch("/:userId/approve", verifyUser, approveInstructor);
router.patch("/:userId/reject", verifyUser, rejectInstructor);

export default router;