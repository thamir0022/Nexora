export class AppError extends Error {
  constructor(message = "Internal server error", statusCode = 500, statusText = "error") {
    super(message);
    
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.isOperational = true;  // Flag to distinguish operational errors
    
    // Capture stack trace (preserves proper line numbers for debugging)
    Error.captureStackTrace(this, this.constructor);
  }
}