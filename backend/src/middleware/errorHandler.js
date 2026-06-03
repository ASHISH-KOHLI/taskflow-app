// Centralized error handler - Express calls this when next(error) is called
// or when an async route throws

const errorHandler = (err, req, res, next) => {
  // Log the full error for debugging
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Response shape is always consistent
  const response = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      // Only show stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };

  // Don't expose internal errors to clients in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    response.error.message = 'Internal Server Error';
  }

  res.status(statusCode).json(response);
};

// Wrap async route handlers to catch promise rejections
// Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
