export const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let statusText = err.statusText || 'error';

  const isDevelopment = process.env.NODE_ENV === 'development';

  let errorLocation = '';
  if (err.stack) {
    const stackLines = err.stack.split('\n');
    const locationLine = stackLines.find((line, index) => index > 0 && line.includes('at '));
    if (locationLine) {
      errorLocation = locationLine.trim();
    }
  }

  console.error(`🚨 [ERROR] ${req.method} ${req.path} - ${statusCode}`);
  console.error(`Message: ${message}`);
  if (errorLocation) console.error(`Location: ${errorLocation}`);
  if (isDevelopment) console.error('Stack:', err.stack);

  // MongoDB CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    statusText = 'bad request';
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    statusText = 'validation error';
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(statusCode).json({
      success: false,
      message,
      statusText,
      errors,
      ...(isDevelopment && { errorLocation })
    });
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate value for ${field}. This ${field} already exists.`;
    statusText = 'duplicate';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
    statusText = 'invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
    statusText = 'token expired';
  }

  // Multer file size
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large. Maximum file size allowed is 2MB.';
    statusText = 'file too large';
  }

  // Multer unexpected field
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected field. Please check your form data.';
    statusText = 'unexpected field';
  }

  const errorResponse = {
    success: false,
    message,
    statusCode,
    statusText,
    ...(isDevelopment && {
      stack: err.stack,
      errorLocation,
      path: req.path,
      method: req.method,
      name: err.name,
      code: err.code
    })
  };

  return res.status(statusCode).json(errorResponse);
};
