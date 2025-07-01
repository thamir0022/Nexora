import aj from "../config/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";
import { AppError } from "../utils/apperror.js";

export default async function arcjectMiddleware(req, res, next) {
  try {
    const decision = await aj.protect(req, { requested: 1 }); // Deduct 1 tokens from the bucket

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit())
        throw new AppError("Too Many Requests", 429);
      else if (decision.reason.isBot())
        throw new AppError("No bots allowed", 403);
      else throw new AppError("Forbidden", 403);
    } else if (decision.results.some(isSpoofedBot))
      throw new AppError("Forbidden", 403);
    else {
      // If the request is allowed, continue to the next middleware
      next();
    }
  } catch (error) {
    next(error);
  }
}
