
const express = require("express");
const env = require("../config/env");
const { getGeminiClient } = require("../services/geminiClient");
const { QUIZ_SYSTEM_PROMPT } = require("../services/prompts");

const router = express.Router();

router.post("/quiz", async (req, res) => {
  try {
    const { topic } = req.body;

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: env.QUIZ_MODEL,
      contents: `Topic: ${topic}`,
      config: {
        systemInstruction: QUIZ_SYSTEM_PROMPT,
      },
    });

    res.json({
      quiz: response.text,
    });
  } catch (error) {
    // Log diagnostic information without exposing prompts or user content.
    console.error("QUIZ ERROR:", {
      code: error.code,
      status: error.status,
      message: error.message,
    });

    res.status(500).json({
      error: "Quiz generation failed",
    });
  }
});

module.exports = router;
