// Pure, dependency-free message construction for Study Chat (Milestone 5,
// Phase 1). Factored out of routes/documents.routes.js so the retrieval
// query selection and prompt assembly can be unit tested without a live
// Groq key or network access.
const { buildContextBlock } = require("./buildExplainPrompt");
const { DOCUMENT_STUDY_CHAT_SYSTEM_PROMPT } = require("../services/prompts");

const VALID_ROLES = new Set(["user", "assistant"]);

/**
 * Keeps only well-formed conversation turns: a recognized role and
 * non-empty string content (trimmed). Anything else (missing content,
 * unknown role, a `system` role sneaking in from the client, etc.) is
 * dropped rather than forwarded to Groq as-is.
 * @param {unknown} messages
 * @returns {{role: "user"|"assistant", content: string}[]}
 */
function sanitizeConversationHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m) =>
        m &&
        VALID_ROLES.has(m.role) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .map((m) => ({ role: m.role, content: m.content.trim() }));
}

/**
 * The retrieval query for Study Chat is always the most recent user
 * message — earlier turns are conversation context, not what we search
 * the document for right now.
 * @param {{role: string, content: string}[]} sanitizedHistory - already sanitized via sanitizeConversationHistory
 * @returns {string|null} the latest user message's content, or null if there isn't one
 */
function getLatestUserMessage(sanitizedHistory) {
  for (let i = sanitizedHistory.length - 1; i >= 0; i--) {
    if (sanitizedHistory[i].role === "user") {
      return sanitizedHistory[i].content;
    }
  }
  return null;
}

/**
 * Builds the Groq chat messages for a Study Chat turn: the dedicated
 * system prompt, a second system message carrying the retrieved document
 * context (kept separate from the prompt so it's easy to locate/test), and
 * then the real conversation history in order — so the model can resolve
 * follow-ups ("why 4.50?") using the actual prior turns, not a
 * re-summarized version of them.
 * @param {{chunkIndex: number, text: string}[]} chunks - top retrieved chunks
 * @param {{role: "user"|"assistant", content: string}[]} sanitizedHistory - already sanitized via sanitizeConversationHistory
 * @returns {{role: string, content: string}[]}
 */
function buildStudyChatMessages(chunks, sanitizedHistory) {
  const context = buildContextBlock(chunks);
  return [
    { role: "system", content: DOCUMENT_STUDY_CHAT_SYSTEM_PROMPT },
    { role: "system", content: `DOCUMENT CONTEXT:\n${context}` },
    ...sanitizedHistory,
  ];
}

module.exports = {
  sanitizeConversationHistory,
  getLatestUserMessage,
  buildStudyChatMessages,
};
