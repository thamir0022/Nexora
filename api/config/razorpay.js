import { config } from "dotenv";
config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

import Razorpay from "razorpay";

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

export default instance;
