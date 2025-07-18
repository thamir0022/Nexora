import Razorpay from "razorpay";
import { RAZORPAY_API_KEY, RAZORPAY_API_SECRET } from "../utils/env.js";

let instance;

(function () {
  if (RAZORPAY_API_KEY && RAZORPAY_API_SECRET) {
    instance = new Razorpay({
      key_id: RAZORPAY_API_KEY,
      key_secret: RAZORPAY_API_SECRET,
    });
  }
})();

export default instance;
