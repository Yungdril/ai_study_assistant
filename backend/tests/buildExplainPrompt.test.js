const assert = require("node:assert/strict");
const { buildContextBlock, buildExplainMessages } = require("../utils/buildExplainPrompt");
const { DOCUMENT_EXPLAIN_SYSTEM_PROMPT } = require("../services/prompts");

// Pure prompt-construction logic for Milestone 4 ("Explain this document").
// No Groq client involved here at all, so this needs no API key and makes
// no network call.
function run() {
  const chunks = [
    { chunkIndex: 0, text: "SURCHARGE_RATE = 0.10 is applied to all late orders." },
    { chunkIndex: 2, text: "The surcharge exists to offset rush processing costs." },
  ];

  // buildContextBlock labels each chunk with its index and preserves text,
  // separated by a blank line, same format as the existing Q&A endpoint.
  const context = buildContextBlock(chunks);
  assert.match(context, /\[Chunk 0\]\nSURCHARGE_RATE = 0.10 is applied to all late orders\./);
  assert.match(context, /\[Chunk 2\]\nThe surcharge exists to offset rush processing costs\./);
  assert.ok(context.includes("\n\n"), "chunks should be separated by a blank line");

  // buildExplainMessages produces exactly one system + one user message,
  // using the dedicated explain prompt (not the Q&A one), with the
  // student's request and the retrieved context both present in the user
  // message.
  const question = "Why is the surcharge 10%?";
  const messages = buildExplainMessages(chunks, question);

  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, "system");
  assert.equal(messages[0].content, DOCUMENT_EXPLAIN_SYSTEM_PROMPT);

  assert.equal(messages[1].role, "user");
  assert.match(messages[1].content, /^DOCUMENT CONTEXT:\n/);
  assert.ok(messages[1].content.includes("SURCHARGE_RATE = 0.10"));
  assert.ok(messages[1].content.includes("STUDENT REQUEST:\n" + question));

  // Empty chunk list doesn't crash — still produces a well-formed (if
  // context-free) message pair, matching "say so explicitly" behavior the
  // model is instructed to follow when context is insufficient.
  const emptyMessages = buildExplainMessages([], "Explain anything");
  assert.equal(emptyMessages.length, 2);
  assert.ok(emptyMessages[1].content.includes("STUDENT REQUEST:\nExplain anything"));

  console.log("buildExplainPrompt.test.js: all assertions passed");
}

run();
