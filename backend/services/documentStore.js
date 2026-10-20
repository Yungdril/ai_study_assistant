const crypto = require("crypto");

// In-memory only, by design for v2 — no Firebase, no external DB. Documents
// (and their extracted chunks) live only in this process's memory and are
// lost on restart. A future phase can swap this for persistent/vector
// storage without changing the routes that call it, since they only see
// createDocument/getDocument.
const documents = new Map();

const DOCUMENT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // sweep every 15 minutes

function isExpired(doc) {
  return Date.now() - doc.createdAt > DOCUMENT_TTL_MS;
}

/**
 * Stores a newly processed document and returns its full record (including
 * the generated documentId). Chunks are plain strings; retrieval re-derives
 * chunkIndex from their position in this array.
 */
function createDocument({ fileName, pageCount, chunks }) {
  const documentId = crypto.randomUUID();
  const doc = {
    documentId,
    fileName,
    pageCount,
    chunks,
    createdAt: Date.now(),
  };
  documents.set(documentId, doc);
  return doc;
}

/**
 * Returns the document, or undefined if it doesn't exist or has expired.
 * Checking expiry here (not just in the periodic sweep) means an expired
 * document can never be read back even in the window before the next
 * sweep runs.
 */
function getDocument(documentId) {
  const doc = documents.get(documentId);
  if (!doc) return undefined;
  if (isExpired(doc)) {
    documents.delete(documentId);
    return undefined;
  }
  return doc;
}

function deleteDocument(documentId) {
  documents.delete(documentId);
}

function cleanupExpiredDocuments() {
  for (const [documentId, doc] of documents) {
    if (isExpired(doc)) documents.delete(documentId);
  }
}

let cleanupTimer = null;

function startCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(cleanupExpiredDocuments, CLEANUP_INTERVAL_MS);
  // Don't let this timer keep the process alive on its own.
  cleanupTimer.unref?.();
}

function stopCleanupTimer() {
  if (!cleanupTimer) return;
  clearInterval(cleanupTimer);
  cleanupTimer = null;
}

// Test-only escape hatches (used by backend/tests/documentStore.test.js),
// never called from route code.
function _resetForTests() {
  documents.clear();
}

function _size() {
  return documents.size;
}

module.exports = {
  createDocument,
  getDocument,
  deleteDocument,
  cleanupExpiredDocuments,
  startCleanupTimer,
  stopCleanupTimer,
  DOCUMENT_TTL_MS,
  _resetForTests,
  _size,
};
