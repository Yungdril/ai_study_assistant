const Groq = require("groq-sdk");
const env = require("../config/env");

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

// Kept identical to the original implementation — all routes used this model.
const MODEL = "openai/gpt-oss-120b";

module.exports = { groq, MODEL };
