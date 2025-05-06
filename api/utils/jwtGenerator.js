import jwt from "jsonwebtoken";
import {
  JWT_ACCESS_TOKEN_EXPIRES_IN,
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_EXPIRES_IN,
  JWT_REFRESH_TOKEN_SECRET,
} from "./env.js";

export const generateAccessToken = (userData) => {
  return jwt.sign(userData, JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
  });
};

export const generateRefreshToken = (userData) => {
  return jwt.sign(userData, JWT_REFRESH_TOKEN_SECRET, {
    expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN,
  });
};
