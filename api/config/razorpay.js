import Razorpay from "razorpay";
import { RAZORPAY_API_KEY, RAZORPAY_API_SECRET } from "../utils/env.js";

console.log("RAZORPAY_API_KEY:", RAZORPAY_API_KEY);
console.log("RAZORPAY_API_SECRET:", RAZORPAY_API_SECRET);

const instance = new Razorpay({
  key_id: RAZORPAY_API_KEY,
  key_secret: RAZORPAY_API_SECRET,
});

export default instance;
