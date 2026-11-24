const multer = require("multer");
const upload = require("./upload");
const requireValidPdf = require("./requireValidPdf");

function handlePdfUpload(req, res, next) {
  upload.single("pdf")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "PDF is too large. Please upload a file under 20MB.",
      });
    }

    if (error.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({
        error: "Only PDF files are supported.",
      });
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        error: "The PDF upload could not be processed.",
      });
    }

    console.error("PDF UPLOAD ERROR:", error.message || error);

    return res.status(400).json({
      error: "The PDF upload could not be processed.",
    });
  });
}

module.exports = requireValidPdf.after(handlePdfUpload);
