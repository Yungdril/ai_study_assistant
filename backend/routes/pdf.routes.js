const express = require("express");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const upload = require("../middleware/upload");
const { groq, MODEL } = require("../services/groqClient");
const env = require("../config/env");
const { getGeminiClient } = require("../services/geminiClient");
const {
  PDF_SUMMARY_SYSTEM_PROMPT,
  FLASHCARDS_SYSTEM_PROMPT,
} = require("../services/prompts");
const cleanupUpload = require("../utils/cleanupUpload");

const router = express.Router();


router.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text.slice(0, 4000);

    if (!text.trim()) {
      return res.status(400).json({
        error: "No readable text found in this PDF",
      });
    }

    const ai = getGeminiClient();

   
let response;

try {
  response = await ai.models.generateContent({
    model: env.QUIZ_MODEL,
    contents: text,
    config: {
      systemInstruction: PDF_SUMMARY_SYSTEM_PROMPT,
    },
  });
} catch (error) {
  // Retry with the fallback model only for temporary availability errors.
  if (error.status !== 503 && error.status !== 429) {
    throw error;
  }

  console.warn("Primary Gemini model unavailable. Trying fallback model.");

  response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: text,
    config: {
      systemInstruction: PDF_SUMMARY_SYSTEM_PROMPT,
    },
  });
}


    const summary = response.text;

    if (!summary) {
      throw new Error("Gemini returned an empty PDF summary");
    }

    return res.json({ summary });
  } catch (error) {
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
  upload.single("pdf"),
  async (req, res) => {
    try {
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
