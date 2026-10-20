const express = require("express");
const { groq, MODEL } = require("../services/groqClient");
const { CHAT_SYSTEM_PROMPT } = require("../services/prompts");

const router = express.Router();

router.get("/chat", (req, res) => {
  res.send("Chat endpoint is working. Use POST requests.");
});

router.post("/chat", async (req, res) => {
  try {
    const { messages, message } = req.body;

    const incomingMessages = Array.isArray(messages)
      ? messages
      : [{ role: "user", content: message }];

    console.log(
  "RAW INCOMING:",
  incomingMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
    contentType: typeof msg.content,
  }))
);

const chatMessages = incomingMessages.map((msg) => ({
  role: msg.role === "assistant" ? "assistant" : "user",
  content:
    typeof msg.content === "string"
      ? msg.content
      : JSON.stringify(msg.content ?? ""),
}));

    const groqMessages = [
      {
        role: "system",
        content: String(CHAT_SYSTEM_PROMPT),
      },
      ...chatMessages,
    ];

    console.log(
      "MESSAGE TYPES:",
      groqMessages.map((msg) => ({
        role: msg.role,
        contentType: typeof msg.content,
        content: msg.content,
      }))
    );

    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model: MODEL,
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.log(
      "CHAT ERROR:",
      error.response?.data || error.message || error
    );

    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

module.exports = router;