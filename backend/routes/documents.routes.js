const express = require("express");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { documentUpload } = require("../middleware/documentUpload");
const { groq, MODEL } = require("../services/groqClient");
const { DOCUMENT_QA_SYSTEM_PROMPT } = require("../services/prompts");
const cleanupUpload = require("../utils/cleanupUpload");
const { chunkText, cleanExtractedText } = require("../utils/chunkText");
const { retrieveRelevantChunks } = require("../utils/retrieveChunks");
const { buildExplainMessages } = require("../utils/buildExplainPrompt");
const {
  sanitizeConversationHistory,
  getLatestUserMessage,
  buildStudyChatMessages,
} = require("../utils/buildStudyChatPrompt");
const documentStore = require("../services/documentStore");

const router = express.Router();

// A cleaned document needs at least this many characters to be worth
// chunking/retrieving over — short of this it's almost certainly a scanned
// image PDF with no extractable text, or a near-empty file.
const MIN_DOCUMENT_TEXT_LENGTH = 50;

// How many chunks of context to send to Groq per question. Kept small and
// fixed so we never send the whole document — only the most relevant slice.
const RETRIEVAL_TOP_N = 4;

// Manually invoke multer so its errors (e.g. file too large) come back in
// the same JSON error shape as the rest of this route, rather than falling
// through to the generic error handler.
function handleDocumentUpload(req, res, next) {
  documentUpload.single("pdf")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "PDF is too large. Please upload a file under 20MB.",
      });
    }
    console.log("DOCUMENT UPLOAD ERROR:", err.message || err);
    return res.status(400).json({ error: "Could not process the uploaded file." });
  });
}

router.post("/documents", handleDocumentUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF uploaded" });
  }

  // multer doesn't validate content type by default; the frontend already
  // restricts to PDFs, but the API must not trust that.
  const isPdf =
    req.file.mimetype === "application/pdf" ||
    req.file.originalname?.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    cleanupUpload(req.file.path);
    return res.status(400).json({ error: "Only PDF files are supported." });
  }

  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const cleanedText = cleanExtractedText(pdfData.text);

    if (cleanedText.length < MIN_DOCUMENT_TEXT_LENGTH) {
      return res.status(422).json({
        error: "This PDF doesn't contain enough readable text to create a study session.",
      });
    }

    const chunks = chunkText(cleanedText);
    if (chunks.length === 0) {
      return res.status(422).json({
        error: "This PDF doesn't contain enough readable text to create a study session.",
      });
    }

    const doc = documentStore.createDocument({
      fileName: req.file.originalname,
      pageCount: pdfData.numpages || 1,
      chunks,
    });

    res.status(201).json({
      documentId: doc.documentId,
      fileName: doc.fileName,
      pageCount: doc.pageCount,
      chunkCount: doc.chunks.length,
    });
  } catch (error) {
    console.log("DOCUMENT CREATE ERROR:", error.message || error);
    res.status(500).json({ error: "Could not process this PDF. Please try again." });
  } finally {
    cleanupUpload(req.file.path);
  }
});

router.post("/documents/:documentId/chat", async (req, res) => {
  const { documentId } = req.params;
  const { question } = req.body || {};

  if (!documentId) {
    return res.status(400).json({ error: "Missing document ID." });
  }

  const doc = documentStore.getDocument(documentId);
  if (!doc) {
    return res.status(404).json({
      error: "Document not found. It may have expired — please upload the PDF again.",
    });
  }

  const trimmedQuestion = typeof question === "string" ? question.trim() : "";
  if (!trimmedQuestion) {
    return res.status(400).json({ error: "Please enter a question." });
  }

  try {
    const topChunks = retrieveRelevantChunks(doc.chunks, trimmedQuestion, {
      topN: RETRIEVAL_TOP_N,
    });

    const context = topChunks
      .map((chunk) => `[Chunk ${chunk.chunkIndex}]\n${chunk.text}`)
      .join("\n\n");

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: DOCUMENT_QA_SYSTEM_PROMPT },
        {
          role: "user",
          content: `DOCUMENT CONTEXT:\n${context}\n\nSTUDENT QUESTION:\n${trimmedQuestion}`,
        },
      ],
      model: MODEL,
    });

    res.json({
      answer: completion.choices[0].message.content,
      sources: topChunks.map((chunk) => ({ chunkIndex: chunk.chunkIndex })),
    });
  } catch (error) {
    console.log("DOCUMENT CHAT ERROR:", error.message || error);
    res.status(500).json({ error: "Answering this question failed. Please try again." });
  }
});

// Milestone 4 — "Explain this document". Reuses the same document session,
// chunking, and lexical retrieval as the Q&A endpoint above (no new
// storage, no embeddings), but answers through a dedicated tutor-style
// prompt (DOCUMENT_EXPLAIN_SYSTEM_PROMPT) aimed at teaching rather than
// answering concisely. Never touches /chat or the Q&A endpoint's behavior.
router.post("/documents/:documentId/explain", async (req, res) => {
  const { documentId } = req.params;
  const { question } = req.body || {};

  if (!documentId) {
    return res.status(400).json({ error: "Missing document ID." });
  }

  const doc = documentStore.getDocument(documentId);
  if (!doc) {
    return res.status(404).json({
      error: "Document not found. It may have expired — please upload the PDF again.",
    });
  }

  const trimmedQuestion = typeof question === "string" ? question.trim() : "";
  if (!trimmedQuestion) {
    return res.status(400).json({ error: "Please enter what you'd like explained." });
  }

  try {
    const topChunks = retrieveRelevantChunks(doc.chunks, trimmedQuestion, {
      topN: RETRIEVAL_TOP_N,
    });

    const messages = buildExplainMessages(topChunks, trimmedQuestion);

    const completion = await groq.chat.completions.create({
      messages,
      model: MODEL,
    });

    res.json({
      answer: completion.choices[0].message.content,
      sources: topChunks.map((chunk) => ({ chunkIndex: chunk.chunkIndex })),
    });
  } catch (error) {
    console.log("DOCUMENT EXPLAIN ERROR:", error.message || error);
    res.status(500).json({ error: "Explaining this failed. Please try again." });
  }
});

// Milestone 5, Phase 1 — Study Chat. Reuses the same document session,
// chunking, and lexical retrieval as the Q&A and Explain endpoints above
// (no new storage, no embeddings, no Firestore), but accepts and returns
// multi-turn conversation: the client sends the full message history each
// time (nothing is persisted server-side beyond the document's chunks),
// the latest user message drives retrieval, and the full history is passed
// to Groq so follow-up questions can be understood in context. Never
// touches /chat, the Q&A endpoint, or the Explain endpoint.
router.post("/documents/:documentId/study-chat", async (req, res) => {
  const { documentId } = req.params;
  const { messages } = req.body || {};

  if (!documentId) {
    return res.status(400).json({ error: "Missing document ID." });
  }

  const doc = documentStore.getDocument(documentId);
  if (!doc) {
    return res.status(404).json({
      error: "Document not found. It may have expired — please upload the PDF again.",
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Please start the conversation with a question." });
  }

  const sanitizedHistory = sanitizeConversationHistory(messages);
  const latestUserMessage = getLatestUserMessage(sanitizedHistory);

  if (!latestUserMessage) {
    return res.status(400).json({ error: "Please enter a question." });
  }

  try {
    const topChunks = retrieveRelevantChunks(doc.chunks, latestUserMessage, {
      topN: RETRIEVAL_TOP_N,
    });

    const groqMessages = buildStudyChatMessages(topChunks, sanitizedHistory);

    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model: MODEL,
    });

    res.json({
      answer: completion.choices[0].message.content,
      sources: topChunks.map((chunk) => ({ chunkIndex: chunk.chunkIndex })),
    });
  } catch (error) {
    console.log("DOCUMENT STUDY CHAT ERROR:", error.message || error);
    res.status(500).json({ error: "Answering this failed. Please try again." });
  }
});

module.exports = router;
