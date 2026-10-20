
const dotenv = require("dotenv");

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is missing from the backend .env file");
}

const env = {
  // Existing Groq configuration — Chat and Flashcards still use this.
  GROQ_API_KEY: process.env.GROQ_API_KEY,

  // Quiz — Google Gemini
  QUIZ_API_KEY: process.env.QUIZ_API_KEY,
  QUIZ_MODEL: process.env.QUIZ_MODEL || "gemini-2.5-flash",
  
  // PDF summaries — OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PDF_MODEL: process.env.PDF_MODEL || "gpt-4.1-mini",


  PORT: process.env.PORT || 5000,
  SELF_URL: process.env.SELF_URL || "https://smartpal.onrender.com",
};

module.exports = env;

