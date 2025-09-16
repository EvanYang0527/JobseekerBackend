function notFound(req, res) {
  res.status(404).json({
    message: 'Resource not found',
  });
}

function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Unexpected server error';

  if (status >= 500) {
    console.error('Unhandled error:', err);
  }

  res.status(status).json({
    message,
  });
}

module.exports = {
  notFound,
  errorHandler,
};
