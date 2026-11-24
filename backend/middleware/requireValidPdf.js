const validatePdf = require("../utils/validatePdf");
const cleanupUpload = require("../utils/cleanupUpload");

const INVALID_PDF_MESSAGE = "Only valid PDF files are supported.";

async function requireValidPdf(req, res, next) {
  if (!req.file) return next();

  const filePath = req.file.path;
  let isValid = false;

  try {
    isValid = Boolean(await requireValidPdf.validate(filePath));
  } catch {
    isValid = false;
  }

  if (!isValid) {
    cleanupUpload(filePath);
    return res.status(400).json({
      error: INVALID_PDF_MESSAGE,
    });
  }

  return next();
}

requireValidPdf.validate = validatePdf;
requireValidPdf.INVALID_PDF_MESSAGE = INVALID_PDF_MESSAGE;

requireValidPdf.after = function after(uploadMiddleware) {
  return function uploadThenValidate(req, res, next) {
    uploadMiddleware(req, res, (err) => {
      if (err) return next(err);
      return requireValidPdf(req, res, next);
    });
  };
};

module.exports = requireValidPdf;