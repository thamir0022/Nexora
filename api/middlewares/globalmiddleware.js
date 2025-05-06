/**
 * Global error handling middleware
 * Processes all errors caught or thrown within the application
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Set defaults and extract error details
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  
  // Determine environment-specific error details
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Extract error location from stack trace if available
  let errorLocation = '';
  if (err.stack) {
    const stackLines = err.stack.split('\n');
    // The first line with 'at' usually contains the error location
    const locationLine = stackLines.find((line, index) => index > 0 && line.includes('at '));
    if (locationLine) {
      errorLocation = locationLine.trim();
    }
  }
  
  // Log detailed error information
  console.error(`🚨 [ERROR] ${req.method} ${req.path} - ${statusCode}`);
  console.error(`Message: ${message}`);
  if (errorLocation) {
    console.error(`Location: ${errorLocation}`);
  }
  if (isDevelopment) {
    console.error('Stack:', err.stack);
  }
  
  // Handle MongoDB specific errors
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      ...(isDevelopment && { errorLocation })
    });
  }
  
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate value for ${field}. This ${field} already exists.`;
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large. Maximum file size allowed is 2MB.';
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected field. Please check your form data.';
  }
  
  // Prepare the error response
  const errorResponse = {
    success: false,
    message,
    statusCode,
    ...(isDevelopment && { 
      stack: err.stack,
      errorLocation,
      path: req.path,
      method: req.method,
      name: err.name,
      code: err.code
    })
  };
  
  // Send the error response
  return res.status(statusCode).json(errorResponse);
};