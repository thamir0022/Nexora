import nodemailer from "nodemailer";
import { NODEMAILER_EMAIL, NODEMAILER_EMAIL_PASSWORD } from "../utils/env.js";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: NODEMAILER_EMAIL,
    pass: NODEMAILER_EMAIL_PASSWORD,
  },
});
