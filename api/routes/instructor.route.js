import {Router} from "express";
import { addInstructorQualification } from "../controllers/instructor.controller.js";

const router = Router();

router.post("/qualifications", addInstructorQualification);

export default router;