const fs = require("fs");

/**
 * Safely deletes a temp uploaded file (from multer's disk storage).
 * Swallows errors so cleanup failures never crash a request — the original
 * /generate-flashcards route called fs.unlinkSync directly, which would
 * throw if the file was already gone. This is used in a finally block so
 * the file is removed whether the request succeeded or failed.
 */
function cleanupUpload(filePath) {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.log("Cleanup error:", err.message);
    }
  });
}

module.exports = cleanupUpload;
