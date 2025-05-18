// backend/routes/cloudinary.js
import express from "express";
import cloudinary from "../config/cloudinary.js";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../utils/env.js";

const router = express.Router();

router.get("/signature", (req, res) => {
  const { public_id } = req.query;

  const timestamp = Math.floor(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      public_id,
      overwrite: true,
    },
    CLOUDINARY_API_SECRET
  );

  res.json({
    signature,
    timestamp,
    public_id,
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
  });
});

export default router;
