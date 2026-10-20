import apiClient from "./client";

export async function summarizePdf(pdfFile) {
  const formData = new FormData();
  formData.append("pdf", pdfFile);
  const response = await apiClient.post("/upload-pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.summary;
}

export async function generateFlashcardsFromPdf(pdfFile) {
  const formData = new FormData();
  formData.append("pdf", pdfFile);
  const response = await apiClient.post("/generate-flashcards", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.flashcards;
}

// PDF Intelligence v2 — document-aware Q&A. Separate endpoints from the
// two above (POST /documents, POST /documents/:documentId/chat); neither
// summarizePdf nor generateFlashcardsFromPdf changed.

/**
 * Creates a temporary, in-memory document session from a PDF so follow-up
 * questions can be asked about it. Same multipart upload pattern as
 * summarizePdf/generateFlashcardsFromPdf.
 * @returns {Promise<{documentId: string, fileName: string, pageCount: number, chunkCount: number}>}
 */
export async function createDocumentSession(pdfFile) {
  const formData = new FormData();
  formData.append("pdf", pdfFile);
  const response = await apiClient.post("/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

/**
 * Asks a question about a previously created document session. Never goes
 * through the general /chat endpoint — this is a distinct, document-scoped
 * contract.
 * @returns {Promise<{answer: string, sources: {chunkIndex: number}[]}>}
 */
export async function askDocumentQuestion(documentId, question) {
  const response = await apiClient.post(`/documents/${documentId}/chat`, {
    question,
  });
  return response.data;
}

// Milestone 4 — "Explain this document". Separate endpoint from the Q&A
// chat above (POST /documents/:documentId/explain); askDocumentQuestion is
// unchanged.

/**
 * Asks for a tutor-style explanation grounded in a previously created
 * document session. Distinct, document-scoped contract — never goes
 * through /chat or the Q&A endpoint.
 * @returns {Promise<{answer: string, sources: {chunkIndex: number}[]}>}
 */
export async function explainDocument(documentId, question) {
  const response = await apiClient.post(`/documents/${documentId}/explain`, {
    question,
  });
  return response.data;
}

// Milestone 5, Phase 1 — Study Chat. A third, distinct document-scoped
// endpoint (POST /documents/:documentId/study-chat); explainDocument and
// askDocumentQuestion are unchanged. Unlike those two (one question in,
// one answer out), this one is multi-turn: the caller sends the full
// conversation so far each time, since nothing is persisted server-side
// beyond the document's chunks.

/**
 * Sends the full Study Chat conversation so far and gets the next
 * assistant turn, grounded in the document session. The backend uses the
 * latest `{role: "user", ...}` message for retrieval and the rest of the
 * history to understand follow-ups.
 * @param {string} documentId
 * @param {{role: "user"|"assistant", content: string}[]} messages - full conversation so far, oldest first
 * @returns {Promise<{answer: string, sources: {chunkIndex: number}[]}>}
 */
export async function studyChat(documentId, messages) {
  const response = await apiClient.post(`/documents/${documentId}/study-chat`, {
    messages,
  });
  return response.data;
}
