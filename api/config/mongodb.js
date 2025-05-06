import mongoose from "mongoose";
import { MONGODB_URI } from "../utils/env.js";

export const connectMongodb = () => {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("Mongodb Connected");
    })
    .catch((err) => {
      console.log("Mongodb connection error : ", err);
    });
};
