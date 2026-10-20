const multer = require("multer");

// Scoped to the new /documents route only — deliberately separate from
// middleware/upload.js (used by the existing /upload-pdf and
// /generate-flashcards routes) so adding a size limit here can't change
// behavior for those already-working endpoints.
const MAX_DOCUMENT_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

const documentUpload = multer({
  dest: "uploads",
  limits: { fileSize: MAX_DOCUMENT_UPLOAD_BYTES },
});

module.exports = { documentUpload, MAX_DOCUMENT_UPLOAD_BYTES };
