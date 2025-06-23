import express from "express";
import { createCertificate, getCertificate } from "../controllers/certificate.controller.js";
import { verifyUser } from "../utils/verifyUser.js";

const router = express.Router();

router.post("/:courseId", verifyUser, createCertificate);
router.get("/:certificateId", verifyUser, getCertificate);

export default router;
