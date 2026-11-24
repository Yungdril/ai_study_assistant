const express = require("express");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { groq, MODEL } = require("../services/groqClient");
const env = require("../config/env");
const { getGeminiClient } = require("../services/geminiClient");
const {
  PDF_SUMMARY_SYSTEM_PROMPT,
  FLASHCARDS_SYSTEM_PROMPT,
} = require("../services/prompts");
const cleanupUpload = require("../utils/cleanupUpload");
const handlePdfUpload = require("../middleware/handlePdfUpload");
const router = express.Router();


router.post("/upload-pdf", handlePdfUpload, async (req, res) => {
  const requestStartedAt = Date.now();

  try {
    console.log("[PDF] Summary request received");

    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    const extractionStartedAt = Date.now();

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);

    console.log(
      `[PDF] Text extraction completed in ${Date.now() - extractionStartedAt} ms`
    );
    const text = pdfData.text.slice(0, 4000);

    if (!text.trim()) {
      return res.status(400).json({
        error: "No readable text found in this PDF",
      });
    }

    const ai = getGeminiClient();

   

let summary;

try {
    const geminiStartedAt = Date.now();
  console.log("[PDF] Gemini summary generation started");
  const response = await ai.models.generateContent({
    model: env.QUIZ_MODEL,
    contents: text,
    config: {
      systemInstruction: PDF_SUMMARY_SYSTEM_PROMPT,
    },
  });

    console.log(
    `[PDF] Gemini completed in ${Date.now() - geminiStartedAt} ms`
  );

  summary = response.text;
} catch (error) {

const isTemporaryGeminiFailure =
  error.status === 429 ||
  error.status === 503 ||
  error.status === 504 ||
  error.name === "TimeoutError" ||
  error.name === "AbortError" ||
  error.code === "ETIMEDOUT" ||
  error.code === "ECONNABORTED" ||
  error.message?.includes("DEADLINE_EXCEEDED");


  if (!isTemporaryGeminiFailure) {
    throw error;
  }

  console.warn(
    "[PDF] Gemini temporarily unavailable or timed out. Falling back to Groq."
  );

  console.warn(
    "Gemini temporarily unavailable. Falling back to Groq for PDF summary."
  );
  const groqStartedAt = Date.now();
  console.log("[PDF] Groq fallback started");

  const completion = await groq.chat.completions.create({

    messages: [
      {
        role: "system",
        content: PDF_SUMMARY_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Summarize the following PDF text:\n\n${text}`,
      },
    ],
    model: MODEL,
  });

  console.log(
    `[PDF] Groq completed in ${Date.now() - groqStartedAt} ms`
  );

  summary = completion.choices[0]?.message?.content;
}

    if (!summary) {
      throw new Error("Gemini returned an empty PDF summary");
    }

        console.log(
      `[PDF] Summary request completed in ${Date.now() - requestStartedAt} ms`
    );

    return res.json({ summary });
  } catch (error) {
        console.error(
      `[PDF] Summary request failed after ${Date.now() - requestStartedAt} ms`
    );
    console.error("PDF SUMMARY ERROR:", {
      status: error.status,
      code: error.code,
      message: error.message,
    });

    return res.status(500).json({
      error: "PDF processing failed",
    });
  } finally {
    if (req.file) {
      cleanupUpload(req.file.path);
    }
  }
});



router.post(
  "/generate-flashcards",
  handlePdfUpload,
  async (req, res) => {
    try {
     if (!req.file) {
  return res.status(400).json({ error: "No PDF uploaded." });
}

const filePath = req.file.path;

      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const extractedText = pdfData.text;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: FLASHCARDS_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `
Create flashcards from this:

${extractedText.slice(0, 3000)}
`,
          },
        ],
        model: MODEL,
      });

      const rawResponse = completion.choices[0].message.content;
      const flashcards = JSON.parse(rawResponse);

      res.json({
        flashcards,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        error: "Flashcard generation failed",
      });
    } finally {
      if (req.file) cleanupUpload(req.file.path);
    }
  }
);

module.exports = router;
