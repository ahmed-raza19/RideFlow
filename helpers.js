// utils/helpers.js
// asyncHandler  — wraps async route handlers, forwards errors to Express
// sendSuccess   — standard success envelope
// sendError     — standard error envelope

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const sendSuccess = (res, data, message = 'OK', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const sendError = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, error: message });

// Global Express error handler (register last in server.js)
const globalErrorHandler = (err, req, res, _next) => {
  console.error('💥 Unhandled error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
  });
};

module.exports = { asyncHandler, sendSuccess, sendError, globalErrorHandler };
