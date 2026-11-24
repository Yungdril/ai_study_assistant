const multer = require("multer");
const path = require("path");

const MAX_PDF_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

const upload = multer({
  dest: "uploads",
  limits: {
    fileSize: MAX_PDF_UPLOAD_BYTES,
    files: 1,
  },
  fileFilter(req, file, callback) {
    const hasPdfExtension =
      path.extname(file.originalname || "").toLowerCase() === ".pdf";

    if (file.mimetype !== "application/pdf" || !hasPdfExtension) {
      const error = new Error("Only PDF files are supported.");
      error.code = "INVALID_FILE_TYPE";
      return callback(error);
    }

    callback(null, true);
  },
});

module.exports = upload;
module.exports.MAX_PDF_UPLOAD_BYTES = MAX_PDF_UPLOAD_BYTES;