const assert = require("node:assert/strict");
const http = require("node:http");

// Same reasoning as documentsExplainRoute.test.js: the Groq SDK throws at
// construction time without GROQ_API_KEY, and documents.routes.js requires
// it. The 400/404 tests below never reach Groq at all. The "successful
// request" test DOES need a working groq.chat.completions.create — rather
// than make a real network call (which would make this test depend on a
// live key and network access, which the spec explicitly forbids), we
// swap a mock into Node's module cache before requiring documents.routes.js,
// so the route calls our fake implementation instead of the real SDK.
if (!process.env.GROQ_API_KEY) {
  process.env.GROQ_API_KEY = "test-placeholder-key-not-used";
}

const express = require("express");
const documentStore = require("../services/documentStore");

async function withServer(app, fn) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

/**
 * Requires a fresh copy of documents.routes.js with services/groqClient
 * swapped for a mock, then restores the module cache to what it was
 * before. Returns both the router and the array of `create()` calls the
 * mock recorded, so tests can inspect exactly what was sent to "Groq".
 */
function withMockedGroqRoutes(mockAnswer, fn) {
  const groqClientPath = require.resolve("../services/groqClient");
  const documentsRoutesPath = require.resolve("../routes/documents.routes");

  const originalGroqCacheEntry = require.cache[groqClientPath];
  const calls = [];

  require.cache[groqClientPath] = {
    id: groqClientPath,
    filename: groqClientPath,
    loaded: true,
    exports: {
      groq: {
        chat: {
          completions: {
            create: async (payload) => {
              calls.push(payload);
              return { choices: [{ message: { content: mockAnswer } }] };
            },
          },
        },
      },
      MODEL: "mock-model",
    },
  };
  // Force documents.routes.js to re-require groqClient under the mock,
  // whether or not it was already cached (e.g. by documentsExplainRoute.test.js).
  delete require.cache[documentsRoutesPath];

  try {
    const documentsRoutes = require(documentsRoutesPath);
    return fn(documentsRoutes, calls);
  } finally {
    // Restore real groqClient for any test file that runs after this one.
    if (originalGroqCacheEntry) {
      require.cache[groqClientPath] = originalGroqCacheEntry;
    } else {
      delete require.cache[groqClientPath];
    }
    // Force a fresh require next time too, so it doesn't pick up the mock.
    delete require.cache[documentsRoutesPath];
  }
}

async function run() {
  documentStore._resetForTests();

  // --- 404: missing/expired document, mocked Groq never called ---------
  await withMockedGroqRoutes("unused", async (documentsRoutes, calls) => {
    const app = express();
    app.use(express.json());
    app.use(documentsRoutes);

    await withServer(app, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/documents/does-not-exist/study-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.match(body.error, /Document not found/);
    });

    assert.equal(calls.length, 0, "Groq should never be called for a missing document");
  });

  // --- 400: missing/empty messages array --------------------------------
  const doc = documentStore.createDocument({
    fileName: "pricing.pdf",
    pageCount: 1,
    chunks: [
      "SURCHARGE_RATE = 0.10 is applied to all late orders to offset rush processing costs.",
    ],
  });

  await withMockedGroqRoutes("unused", async (documentsRoutes, calls) => {
    const app = express();
    app.use(express.json());
    app.use(documentsRoutes);

    await withServer(app, async (baseUrl) => {
      const missingRes = await fetch(`${baseUrl}/documents/${doc.documentId}/study-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert.equal(missingRes.status, 400);

      const emptyRes = await fetch(`${baseUrl}/documents/${doc.documentId}/study-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });
      assert.equal(emptyRes.status, 400);

      const noUserRes = await fetch(`${baseUrl}/documents/${doc.documentId}/study-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "assistant", content: "nothing to respond to" }] }),
      });
      assert.equal(noUserRes.status, 400);
    });

    assert.equal(calls.length, 0, "Groq should never be called when messages fail validation");
  });

  // --- success: mocked Groq, multi-turn history, retrieval + structure --
  await withMockedGroqRoutes("Because 4.50 is the per-unit rate from the document.", async (
    documentsRoutes,
    calls
  ) => {
    const app = express();
    app.use(express.json());
    app.use(documentsRoutes);

    const conversation = [
      { role: "user", content: "Explain the surcharge." },
      { role: "assistant", content: "The surcharge is 10% of the order total." },
      { role: "user", content: "Why did you multiply by 4.50?" },
    ];

    await withServer(app, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/documents/${doc.documentId}/study-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.answer, "Because 4.50 is the per-unit rate from the document.");
      assert.ok(Array.isArray(body.sources));
      assert.ok(body.sources.length > 0);
      assert.ok(Object.prototype.hasOwnProperty.call(body.sources[0], "chunkIndex"));
    });

    // Exactly one Groq call was made, and we can inspect exactly what was
    // sent: the full conversation history (proving it reached the prompt)
    // and document context built from retrieval against the LATEST user
    // message ("Why did you multiply by 4.50?"), not the first one.
    assert.equal(calls.length, 1);
    const sentMessages = calls[0].messages;

    const historySent = sentMessages.slice(-conversation.length);
    assert.deepEqual(historySent, conversation);

    const contextMessage = sentMessages.find((m) => m.content.startsWith("DOCUMENT CONTEXT:"));
    assert.ok(contextMessage, "a document-context system message should be sent");
    assert.ok(
      contextMessage.content.includes("SURCHARGE_RATE = 0.10"),
      "retrieval should have pulled in the only chunk, found via the latest user message"
    );
  });

  // --- practice-material fix: explicit generation requests go through ----
  // Regression test for the bug report: "Give me a similar question to
  // practice" was being refused because it wasn't verbatim in the PDF.
  // There's no backend-side filtering of question types — this is a
  // prompt-design fix — so what we verify here is that (a) the route
  // never blocks or special-cases this kind of request, it reaches Groq
  // like any other turn, and (b) the system prompt actually sent for this
  // request contains the updated rules that permit generating new
  // practice material. The missing-information case is covered by the
  // existing 400 tests above and by the prompt-content assertions in
  // buildStudyChatPrompt.test.js.
  await withMockedGroqRoutes(
    "Here's a new practice question (not from the document): ...",
    async (documentsRoutes, calls) => {
      const app = express();
      app.use(express.json());
      app.use(documentsRoutes);

      const conversation = [
        { role: "user", content: "Explain Question 1." },
        { role: "assistant", content: "Question 1 asks you to..." },
        { role: "user", content: "Give me a similar question to practice" },
      ];

      await withServer(app, async (baseUrl) => {
        const res = await fetch(`${baseUrl}/documents/${doc.documentId}/study-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: conversation }),
        });

        assert.equal(res.status, 200, "an explicit practice-material request should not be blocked");
        const body = await res.json();
        assert.match(body.answer, /practice question/i);
      });

      assert.equal(calls.length, 1);
      const systemPrompt = calls[0].messages[0].content;
      assert.match(systemPrompt, /do not refuse/i);
      assert.match(systemPrompt, /label/i);
      assert.match(systemPrompt, /do not reveal the solution/i);
    }
  );

  documentStore._resetForTests();
  console.log("documentStudyChatRoute.test.js: all assertions passed");
}

// Exported so tests/runAll.js awaits this async test before reporting
// overall pass/fail (same pattern as documentsExplainRoute.test.js).
module.exports = run();
