export class AppError extends Error {
  constructor(message = "Internal server error", statusCode = 500) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = true;  // Flag to distinguish operational errors
    
    // Capture stack trace (preserves proper line numbers for debugging)
    Error.captureStackTrace(this, this.constructor);
  }
}