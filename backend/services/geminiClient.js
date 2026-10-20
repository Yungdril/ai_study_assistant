
const { GoogleGenAI } = require("@google/genai");
const env = require("../config/env");

let client;

function getGeminiClient() {
  if (!env.QUIZ_API_KEY) {
    const error = new Error("Gemini API key is not configured");
    error.code = "QUIZ_API_KEY_MISSING";
    throw error;
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: env.QUIZ_API_KEY,
    });
  }

  return client;
}

module.exports = { getGeminiClient };
