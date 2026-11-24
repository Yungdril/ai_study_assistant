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

app.use((req, res, next) => {
  req.user = {
    uid: req.headers["x-test-user"] || "test-user-1",
  };
  next();
});

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
    const explainUrl = `${baseUrl}/documents/test-document/explain`;

    // Empty/whitespace-only question -> 400, before any retrieval or Groq call.
    const emptyRes = await fetch(explainUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "   " }),
    });
    assert.equal(emptyRes.status, 400);
    const emptyBody = await emptyRes.json();
    assert.match(emptyBody.error, /enter what you'd like explained/i);

    // Missing `question` key entirely -> also 400, same validation path.
    const noQuestionRes = await fetch(explainUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(noQuestionRes.status, 400);
  });

  documentStore._resetForTests();
  console.log("documentsExplainRoute.test.js: all assertions passed");

// Exported (rather than caught-and-swallowed) so tests/runAll.js can await
// this before reporting overall pass/fail — this file does real async work
// (an in-process HTTP server + fetch), unlike the other, synchronous test
// files.
module.exports = run()}