// Pure, dependency-free prompt construction for the "Explain this document"
// feature (Milestone 4). Factored out of routes/documents.routes.js so it
// can be unit tested without a live Groq key or network access — the route
// handler is the only caller, and calling it a second time with the same
// inputs always returns the same messages.
const { DOCUMENT_EXPLAIN_SYSTEM_PROMPT } = require("../services/prompts");

/**
 * Builds the same "[Chunk N]\n<text>" context block used by the Q&A
 * endpoint, so retrieved chunks are presented to the model consistently
 * across both document-aware features.
 * @param {{chunkIndex: number, text: string}[]} chunks
 * @returns {string}
 */
function buildContextBlock(chunks) {
  return chunks.map((chunk) => `[Chunk ${chunk.chunkIndex}]\n${chunk.text}`).join("\n\n");
}

/**
 * Builds the Groq chat messages for an explanation request: the dedicated
 * tutor system prompt plus a user message carrying the retrieved document
 * context and the student's request.
 * @param {{chunkIndex: number, text: string}[]} chunks - top retrieved chunks
 * @param {string} question - the student's explanation request (already trimmed/validated)
 * @returns {{role: string, content: string}[]}
 */
function buildExplainMessages(chunks, question) {
  const context = buildContextBlock(chunks);
  return [
    { role: "system", content: DOCUMENT_EXPLAIN_SYSTEM_PROMPT },
    {
      role: "user",
      content: `DOCUMENT CONTEXT:\n${context}\n\nSTUDENT REQUEST:\n${question}`,
    },
  ];
}

module.exports = { buildContextBlock, buildExplainMessages };
