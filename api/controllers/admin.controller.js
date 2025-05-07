import {AppError} from "../utils/apperror.js";

export const getUsers = async(req, res, next) => {
  try {
    if(req.user.role !== "admin") throw new AppError("You should be a admin fot accessing this API", 403);
  } catch (error) {
    next(error);
  }
}