import crypto from "crypto";

export const generateOtp = () => {
  const randomInt = crypto.randomInt(100000, 1000000);
  return randomInt.toString();
}