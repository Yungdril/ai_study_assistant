
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const requireValidPdf = require("../middleware/requireValidPdf");
const {
  makeTempDir,
  removeDir,
} = require("./helpers.pdfUploadTestUtils");

function makeResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function waitForDeletion(filePath) {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const check = () => {
      if (!fs.existsSync(filePath)) return resolve();
      if (Date.now() - started > 2000) {
        return reject(new Error("Uploaded file was not deleted."));
      }
      setTimeout(check, 20);
    };

    check();
  });
}

async function run() {
  const dir = makeTempDir("smartpal-requirevalidpdf-");
  const originalValidator = requireValidPdf.validate;

  try {
    // Reject a fake PDF and delete its temporary upload.
    const fakePath = path.join(dir, "fake.pdf");
    fs.writeFileSync(fakePath, "This is not a PDF");

    requireValidPdf.validate = async () => false;

    const fakeReq = { file: { path: fakePath } };
    const fakeRes = makeResponse();
    let fakeNextCalled = false;

    await requireValidPdf(fakeReq, fakeRes, () => {
      fakeNextCalled = true;
    });

    assert.equal(fakeRes.statusCode, 400);
    assert.equal(
      fakeRes.body.error,
      "Only valid PDF files are supported."
    );
    assert.equal(fakeNextCalled, false);
    await waitForDeletion(fakePath);

    // Accept a valid PDF.
    const validPath = path.join(dir, "valid.pdf");
    fs.writeFileSync(validPath, "%PDF-1.7\n");

    requireValidPdf.validate = async () => true;

    const validReq = { file: { path: validPath } };
    const validRes = makeResponse();
    let validNextCalled = false;

    await requireValidPdf(validReq, validRes, () => {
      validNextCalled = true;
    });

    assert.equal(validNextCalled, true);
    assert.equal(validRes.statusCode, null);
    assert.equal(fs.existsSync(validPath), true);

    // Reject and clean up if the validator throws.
    const throwingPath = path.join(dir, "throwing.pdf");
    fs.writeFileSync(throwingPath, "invalid");

    requireValidPdf.validate = async () => {
      throw new Error("Simulated validator failure");
    };

    const throwingRes = makeResponse();

    await requireValidPdf(
      { file: { path: throwingPath } },
      throwingRes,
      () => assert.fail("next() must not be called")
    );

    assert.equal(throwingRes.statusCode, 400);
    await waitForDeletion(throwingPath);

    // Requests without a file pass through.
    let noFileNextCalled = false;

    await requireValidPdf(
      {},
      makeResponse(),
      () => {
        noFileNextCalled = true;
      }
    );

    assert.equal(noFileNextCalled, true);

    // .after() runs validation after the upload middleware.
    requireValidPdf.validate = async () => false;

    const wrappedPath = path.join(dir, "wrapped.pdf");
    fs.writeFileSync(wrappedPath, "not a PDF");

    const uploadMiddleware = (req, res, next) => {
      req.file = { path: wrappedPath };
      next();
    };

    const wrapped = requireValidPdf.after(uploadMiddleware);
    const wrappedRes = makeResponse();
    let wrappedNextCalled = false;

wrapped({}, wrappedRes, () => {
  wrappedNextCalled = true;
});

await waitForDeletion(wrappedPath);

    // Give the async validator and cleanup callback time to finish.
    await waitForDeletion(wrappedPath);

    assert.equal(wrappedNextCalled, false);
    assert.equal(wrappedRes.statusCode, 400);

    // Upload middleware errors must pass through without validation.
    let validationCalled = false;
    const uploadError = new Error("Upload failed");

    requireValidPdf.validate = async () => {
      validationCalled = true;
      return true;
    };

    const failingUpload = (req, res, next) => next(uploadError);
    const failingWrapped = requireValidPdf.after(failingUpload);

    await new Promise((resolve) => {
      failingWrapped({}, makeResponse(), (error) => {
        assert.equal(error, uploadError);
        resolve();
      });
    });

    assert.equal(validationCalled, false);

    console.log("requireValidPdf tests passed.");
  } finally {
    requireValidPdf.validate = originalValidator;
    removeDir(dir);
  }
}

module.exports = run();
