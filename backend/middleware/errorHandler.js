// Basic centralized error handler. Individual routes still catch their own
// errors and respond with the same shapes as before (to keep response
// contracts unchanged); this only catches anything that slips through.
function errorHandler(err, req, res, next) {
  console.log("Unhandled error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Something went wrong" });
}

module.exports = errorHandler;
