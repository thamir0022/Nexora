import crypto from "crypto";

export const generateOtp = () => {
  return crypto.randomInt(100000, 1000000);
}