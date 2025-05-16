import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 60,
  }
});

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
