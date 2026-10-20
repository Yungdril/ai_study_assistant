const assert = require("node:assert/strict");
const http = require("node:http");

// The Groq SDK throws at construction time if GROQ_API_KEY isn't set (see
// services/groqClient.js), and documents.routes.js requires it. We only
// exercise validation paths below that return *before* any Groq call is
// made, so a placeholder key is enough — this test never reaches the
// network and never depends on a real/live key.
if (!process.env.GROQ_API_KEY) {
  process.env.GROQ_API_KEY = "test-placeholder-key-not-used";
}

const express = require("express");
const documentsRoutes = require("../routes/documents.routes");
const documentStore = require("../services/documentStore");

async function withServer(fn) {
  const app = express();
  app.use(express.json());
  app.use(documentsRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function run() {
  documentStore._resetForTests();

  await withServer(async (baseUrl) => {
    // Missing/expired document -> 404, same shape as the Q&A endpoint.
    const missingRes = await fetch(`${baseUrl}/documents/does-not-exist/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Explain Question 1" }),
    });
    assert.equal(missingRes.status, 404);
    const missingBody = await missingRes.json();
    assert.match(missingBody.error, /Document not found/);

    // Create a real document session directly through the store (bypassing
    // the upload step, which isn't what this endpoint is testing).
    const doc = documentStore.createDocument({
      fileName: "notes.pdf",
      pageCount: 1,
      chunks: ["SURCHARGE_RATE = 0.10 is applied to all late orders."],
    });

    // Empty/whitespace-only question -> 400, before any retrieval or Groq
    // call happens.
    const emptyRes = await fetch(`${baseUrl}/documents/${doc.documentId}/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "   " }),
    });
    assert.equal(emptyRes.status, 400);
    const emptyBody = await emptyRes.json();
    assert.match(emptyBody.error, /enter what you'd like explained/i);

    // Missing `question` key entirely -> also 400, same validation path.
    const noQuestionRes = await fetch(`${baseUrl}/documents/${doc.documentId}/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(noQuestionRes.status, 400);
  });

  documentStore._resetForTests();
  console.log("documentsExplainRoute.test.js: all assertions passed");
}

// Exported (rather than caught-and-swallowed) so tests/runAll.js can await
// this before reporting overall pass/fail — this file does real async work
// (an in-process HTTP server + fetch), unlike the other, synchronous test
// files.
module.exports = run();
