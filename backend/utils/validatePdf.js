const fs = require("fs");

function validatePdf(filePath) {
  if (!filePath) return false;

  let fd;

  try {
    fd = fs.openSync(filePath, "r");

    const header = Buffer.alloc(1024);
    const bytesRead = fs.readSync(fd, header, 0, header.length, 0);
    const content = header.subarray(0, bytesRead).toString("latin1");

    return content.includes("%PDF-");
  } catch {
    return false;
  } finally {
    if (fd !== undefined) {
      fs.closeSync(fd);
    }
  }
}

module.exports = validatePdf;