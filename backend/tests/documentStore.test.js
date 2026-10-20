const assert = require("node:assert/strict");
const documentStore = require("../services/documentStore");

function run() {
  documentStore._resetForTests();

  // Create + retrieve round-trip.
  const created = documentStore.createDocument({
    fileName: "notes.pdf",
    pageCount: 3,
    chunks: ["chunk one", "chunk two"],
  });
  assert.ok(created.documentId);
  assert.equal(created.fileName, "notes.pdf");
  assert.equal(created.pageCount, 3);
  assert.equal(created.chunks.length, 2);

  const fetched = documentStore.getDocument(created.documentId);
  assert.ok(fetched);
  assert.equal(fetched.documentId, created.documentId);

  // Unknown documentId returns undefined (the route turns this into 404).
  assert.equal(documentStore.getDocument("does-not-exist"), undefined);

  // Explicit delete removes it.
  documentStore.deleteDocument(created.documentId);
  assert.equal(documentStore.getDocument(created.documentId), undefined);

  // Expiry: a document older than the TTL is treated as gone, both via
  // getDocument's lazy check and the periodic sweep.
  const old = documentStore.createDocument({
    fileName: "old.pdf",
    pageCount: 1,
    chunks: ["x"],
  });
  // Reach into the store's internal state via a second create + manual
  // backdating isn't exposed by the public API (intentionally), so we
  // verify expiry logic through the exported TTL constant and a stubbed
  // clock-independent check instead: simulate "already expired" by
  // creating, then monkey-patching Date.now for the duration of the check.
  const realNow = Date.now;
  Date.now = () => realNow() + documentStore.DOCUMENT_TTL_MS + 1000;
  try {
    assert.equal(documentStore.getDocument(old.documentId), undefined);
  } finally {
    Date.now = realNow;
  }

  // cleanupExpiredDocuments sweeps out anything past the TTL.
  documentStore._resetForTests();
  documentStore.createDocument({ fileName: "a.pdf", pageCount: 1, chunks: ["y"] });
  documentStore.createDocument({ fileName: "b.pdf", pageCount: 1, chunks: ["z"] });
  assert.equal(documentStore._size(), 2, "both documents should be stored before the sweep");

  const nowDuringSweep = Date.now;
  Date.now = () => nowDuringSweep() + documentStore.DOCUMENT_TTL_MS + 1000;
  try {
    documentStore.cleanupExpiredDocuments();
  } finally {
    Date.now = nowDuringSweep;
  }
  assert.equal(documentStore._size(), 0, "sweep should remove documents once they're past the TTL");

  documentStore._resetForTests();
  console.log("documentStore.test.js: all assertions passed");
}

run();
