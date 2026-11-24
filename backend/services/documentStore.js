
const crypto = require("crypto");

const documents = new Map();

const DOCUMENT_TTL_MS = 2 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

function isExpired(doc) {
  return Date.now() - doc.createdAt > DOCUMENT_TTL_MS;
}

function createDocument({ fileName, pageCount, chunks, userId }) {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new Error("A valid userId is required to create a document.");
  }

  const documentId = crypto.randomUUID();
  const doc = {
    documentId,
    userId,
    fileName,
    pageCount,
    chunks,
    createdAt: Date.now(),
  };

  documents.set(documentId, doc);
  return doc;
}

function getDocument(documentId) {
  const doc = documents.get(documentId);
  if (!doc) return undefined;

  if (isExpired(doc)) {
    documents.delete(documentId);
    return undefined;
  }

  return doc;
}

function getDocumentForUser(documentId, userId) {
  if (typeof userId !== "string" || !userId.trim()) {
    return undefined;
  }

  const doc = getDocument(documentId);
  if (!doc || doc.userId !== userId) return undefined;

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

  cleanupTimer = setInterval(
    cleanupExpiredDocuments,
    CLEANUP_INTERVAL_MS
  );

  cleanupTimer.unref?.();
}

function stopCleanupTimer() {
  if (!cleanupTimer) return;

  clearInterval(cleanupTimer);
  cleanupTimer = null;
}

function _resetForTests() {
  documents.clear();
}

function _size() {
  return documents.size;
}

module.exports = {
  createDocument,
  getDocument,
  getDocumentForUser,
  deleteDocument,
  cleanupExpiredDocuments,
  startCleanupTimer,
  stopCleanupTimer,
  DOCUMENT_TTL_MS,
  _resetForTests,
  _size,
};
