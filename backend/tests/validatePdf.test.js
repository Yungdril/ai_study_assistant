const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const validatePdf = require("../utils/validatePdf");
const { makeTempDir, removeDir } = require("./helpers.pdfUploadTestUtils");

async function run() {
  const dir = makeTempDir("smartpal-validatepdf-");

  try {
    const write = (name, content) => {
      const filePath = path.join(dir, name);
      fs.writeFileSync(filePath, content);
      return filePath;
    };

    assert.equal(await validatePdf(write("plain.pdf", "%PDF-1.7\n%binary\n")), true);

    const withJunk = Buffer.concat([
      Buffer.alloc(200, 0x20),
      Buffer.from("%PDF-1.4\nrest"),
    ]);
    assert.equal(await validatePdf(write("junk-prefix.pdf", withJunk)), true);

    assert.equal(await validatePdf(write("fake.pdf", "not a PDF")), false);
    assert.equal(await validatePdf(write("empty.pdf", "")), false);
    assert.equal(await validatePdf(write("near-miss.pdf", "%PDF")), false);

    assert.equal(
      await validatePdf(path.join(dir, "missing.pdf")),
      false
    );

    assert.equal(await validatePdf(undefined), false);
    assert.equal(await validatePdf(null), false);
    assert.equal(await validatePdf(""), false);
    assert.equal(await validatePdf(42), false);
    assert.equal(await validatePdf(dir), false);
    assert.equal(await validatePdf("bad\0path.pdf"), false);

    console.log("validatePdf tests passed.");
  } finally {
    removeDir(dir);
  }
}

module.exports = run();