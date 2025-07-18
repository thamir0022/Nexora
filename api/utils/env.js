import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

export const {
  NODE_ENV,
  PORT,
  MONGODB_URI,
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
  JWT_ACCESS_TOKEN_EXPIRES_IN,
  JWT_REFRESH_TOKEN_EXPIRES_IN,
  GOOGLE_CLIENT_ID,
  NODEMAILER_EMAIL,
  NODEMAILER_EMAIL_PASSWORD,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLIENT_BASE_URL,
  RAZORPAY_API_SECRET,
  RAZORPAY_API_KEY,
  ARCJET_KEY,
  ARCJET_ENV,
} = process.env;
