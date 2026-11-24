const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

// HTTP integration test for the security behavior of POST /documents (the
// PDF upload route): content-based PDF validation, the missing-file error,
// the existing parser-failure response, and the 20 MB limit.
//
// Same approach as documentStudyChatRoute.test.js:
//  - documents.routes.js requires services/groqClient, whose SDK throws at
//    construction without GROQ_API_KEY. Rather than rely on a placeholder
//    key, a mock is swapped into Node's module cache before the route is
//    required. Every upload case below must return BEFORE any Groq call, so
//    the mock records its calls and the test fails if one ever happens —
//    nothing here can reach an external AI service or the network.
//  - The cache entries touched are restored in `finally`.
//  - server.js is never required (it starts the real server and background
//    services); a small Express app mounts only documents.routes.js.
const express = require("express");
const { documentUpload } = require("../middleware/documentUpload");
const documentStore = require("../services/documentStore");

const MB = 1024 * 1024;
const FETCH_TIMEOUT_MS = 30000;

// Messages the route / middleware are expected to keep returning.
const INVALID_PDF_MESSAGE = /only valid pdf files are supported/i;
const MISSING_FILE_ERROR = "No PDF uploaded";
const TOO_LARGE_ERROR = "PDF is too large. Please upload a file under 20MB.";
const PROCESSING_ERROR = /could not process this pdf/i;

function form(fieldName, filename, content, type) {
  const body = new FormData();
  body.append(fieldName, new Blob([content], { type }), filename);
  return body;
}

function post(baseUrl, body) {
  return fetch(`${baseUrl}/documents`, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}

// Directory multer writes temp uploads into. Asked of the real uploader so
// the test follows the project's config instead of guessing a path; falls
// back to the conventional relative "uploads" folder.
function getUploadDir() {
  let dir;
  try {
    documentUpload.storage.getDestination(null, null, (err, destination) => {
      if (!err) dir = destination;
    });
  } catch {
    // multer internals differ — use the fallback below
  }
  return path.resolve(dir || "uploads");
}

function listFiles(dir) {
  try {
    return fs.readdirSync(dir).filter((name) => name !== ".gitkeep");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

// cleanupUpload deletes asynchronously (fire-and-forget), so the file can
// legitimately still exist for a few ms after the response was sent. Poll
// until every file in `dir` is one that existed before the request.
async function waitForCleanup(dir, before, timeoutMs = 3000) {
  const known = new Set(before);
  const start = Date.now();
  let leftovers = listFiles(dir).filter((name) => !known.has(name));
  while (leftovers.length > 0 && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 25));
    leftovers = listFiles(dir).filter((name) => !known.has(name));
  }
  return leftovers;
}

/**
 * Requires a fresh documents.routes.js with services/groqClient mocked, runs
 * `fn(router, groqCalls)`, and ALWAYS restores the module cache afterwards
 * (even if an assertion throws), so later test files in the same process
 * get the real modules.
 */
async function withMockedGroqRoutes(fn) {
  const groqClientPath = require.resolve("../services/groqClient");
  const routesPath = require.resolve("../routes/documents.routes");
  const originalGroq = require.cache[groqClientPath];
  const originalRoutes = require.cache[routesPath];
  const groqCalls = [];

  require.cache[groqClientPath] = {
    id: groqClientPath,
    filename: groqClientPath,
    loaded: true,
    exports: {
      groq: {
        chat: {
          completions: {
            create: async (payload) => {
              groqCalls.push(payload);
              throw new Error("Unexpected AI call from the upload test");
            },
          },
        },
      },
      MODEL: "mock-model",
    },
  };
  delete require.cache[routesPath]; // re-require under the mock

  try {
    return await fn(require(routesPath), groqCalls);
  } finally {
    if (originalGroq) require.cache[groqClientPath] = originalGroq;
    else delete require.cache[groqClientPath];
    if (originalRoutes) require.cache[routesPath] = originalRoutes;
    else delete require.cache[routesPath];
  }
}

// Temporary Express app: injects a test user, mounts only the documents
// router, listens on an ephemeral port, and ALWAYS closes the server.
async function withServer(documentsRoutes, fn) {
  const app = express();
  app.use((req, res, next) => {
    req.user = { uid: "test-user-1" };
    next();
  });
  app.use(express.json());
  app.use(documentsRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeIdleConnections?.();
    });
    server.closeAllConnections?.();
  }
}

async function run() {
  // Guard rail only: the 20 MB limit is existing behavior and is NOT changed
  // here — the oversized case below is sized from the configured limit.
  const limitBytes = documentUpload.limits.fileSize;
  assert.equal(limitBytes, 20 * MB, "documentUpload limit should still be 20MB");

  const uploadDir = getUploadDir();
  documentStore._resetForTests();

  try {
    await withMockedGroqRoutes((documentsRoutes, groqCalls) =>
      withServer(documentsRoutes, async (baseUrl) => {
        const before = listFiles(uploadDir);

        // 1) Fake PDF: plain text named fake.pdf with an application/pdf
        //    MIME type. Passes any name/MIME check, must fail on content.
        const fakeRes = await post(
          baseUrl,
          form("pdf", "fake.pdf", "This is ordinary text, not a PDF.", "application/pdf")
        );
        assert.equal(fakeRes.status, 400, "fake PDF should be rejected with 400");
        const fakeBody = await fakeRes.json();
        assert.match(fakeBody.error, INVALID_PDF_MESSAGE);
        assert.deepEqual(
          await waitForCleanup(uploadDir, before),
          [],
          "fake PDF's temp upload should be deleted"
        );

        // 2) Missing file: multipart request with no `pdf` field.
        const noFile = new FormData();
        noFile.append("note", "no pdf attached");
        const missingRes = await post(baseUrl, noFile);
        assert.equal(missingRes.status, 400, "missing file should be 400");
        assert.deepEqual(await missingRes.json(), { error: MISSING_FILE_ERROR });
        assert.deepEqual(await waitForCleanup(uploadDir, before), []);

        // 3) Malformed PDF: starts with %PDF- (so it passes signature
        //    validation) but the body is garbage, so it reaches the parser
        //    and the route's existing processing-error response. A 400 here
        //    would mean validation rejected it; a 201 would mean the parser
        //    accepted it — in that case make this fixture more broken.
        const malformedRes = await post(
          baseUrl,
          form(
            "pdf",
            "malformed.pdf",
            "%PDF-1.4\n1 0 obj\n<< this is not a valid pdf structure >>\n%%EOF\n",
            "application/pdf"
          )
        );
        assert.equal(malformedRes.status, 500, "malformed PDF should reach the parser and fail");
        const malformedBody = await malformedRes.json();
        assert.match(malformedBody.error, PROCESSING_ERROR);
        assert.doesNotMatch(malformedBody.error, INVALID_PDF_MESSAGE);
        assert.deepEqual(
          await waitForCleanup(uploadDir, before),
          [],
          "malformed PDF's temp upload should be deleted by the route's finally"
        );

        // 4) Oversized: valid signature, but 1 KB over the configured limit.
        //    Multer aborts and deletes the partial file; the route's
        //    existing 413 message must be preserved.
        const oversized = Buffer.alloc(limitBytes + 1024, 0x20);
        oversized.write("%PDF-1.4\n", 0, "latin1");
        const bigRes = await post(baseUrl, form("pdf", "huge.pdf", oversized, "application/pdf"));
        assert.equal(bigRes.status, 413, "oversized PDF should be 413");
        assert.deepEqual(await bigRes.json(), { error: TOO_LARGE_ERROR });
        assert.deepEqual(
          await waitForCleanup(uploadDir, before),
          [],
          "oversized upload should leave no temp file"
        );

        // None of the failed uploads may have created a document session,
        // and nothing may have reached the (mocked) AI client.
        assert.equal(documentStore._size(), 0, "no document should be stored");
        assert.equal(groqCalls.length, 0, "upload route must not call the AI client");
      })
    );
  } finally {
    documentStore._resetForTests();
  }

  console.log("documentsUploadRoute.test.js: all assertions passed");
}

// Exported so tests/runAll.js awaits it, like the other HTTP route tests.
module.exports = run();
