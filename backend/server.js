const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Groq = require("groq-sdk");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.log("❌ GROQ_API_KEY is missing in .env file");
}
const app = express();
const upload = multer({
  dest: "uploads",
});

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
app.get("/chat", (req, res) => {
  res.send("Chat endpoint is working. Use POST requests.");
});

app.get("/", (req, res) => {
  res.json({
    message: "AI Study Assistant API Running",
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
  role: "system",
  content: `
You are an intelligent AI Study Assistant.

Your job:
- Explain concepts clearly
- Teach students step-by-step
- Simplify difficult topics
- Generate examples
- Help with quizzes and revision
- Be friendly and educational

Rules:
- Keep explanations concise but clear
- Use bullet points when helpful
- Give examples
- Encourage learning
- Format responses using markdown
- Use headings and bullet points when useful
`,
},

        {
          role: "user",
          content: message,
        },
      ],
      model: "llama-3.1-8b-instant",
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.log("QUIZ ERROR:", error.response?.data || error.message || error);

    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.post("/quiz", async (req, res) => {
  try {
    const { topic } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a quiz generator. Always return 5 multiple choice questions with answers clearly labeled A, B, C, D.",
        },
        {
          role: "user",
          content: `Topic: ${topic}`,
        },
      ],
      model: "llama-3.1-8b-instant",
    });

    res.json({
      quiz: completion.choices[0].message.content,
    });
  } catch (error) {
    console.log("QUIZ ERROR:", error);

    res.status(500).json({
      error: "Quiz generation failed",
    });
  }
});
app.post(
  "/upload-pdf",
  upload.single("pdf"),
  async (req, res) => {
    try {
      console.log("FILE:", req.file);

      const filePath = req.file.path;

      const dataBuffer = fs.readFileSync(filePath);

      console.log("PDF READ SUCCESS");

      const pdfData = await pdfParse(dataBuffer);

      console.log("PDF PARSED");

      const extractedText = pdfData.text;

      console.log(
        "TEXT LENGTH:",
        extractedText.length
      );

      const completion =
        await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                "You summarize study materials clearly for students.",
            },
            {
              role: "user",
              content: `
Summarize this study material:

${extractedText.slice(0, 3000)}
`,
            },
          ],
          model: "llama-3.1-8b-instant",
        });

      fs.unlinkSync(filePath);

      res.json({
        summary:
          completion.choices[0].message.content,
      });
    } catch (error) {
      console.log("PDF ERROR:", error);

      res.status(500).json({
        error: "PDF processing failed",
      });
    }
  }
);
app.post(
  "/generate-flashcards",
  upload.single("pdf"),

  async (req, res) => {
    try {
      const filePath = req.file.path;

      const dataBuffer =
        fs.readFileSync(filePath);

      const pdfData =
        await pdfParse(dataBuffer);

      const extractedText =
        pdfData.text;

      const completion =
        await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `
Generate study flashcards.

Return ONLY JSON format like this:

[
  {
    "question": "...",
    "answer": "..."
  }
]
`,
            },
            {
              role: "user",
              content: `
Create flashcards from this:

${extractedText.slice(0, 3000)}
`,
            },
          ],
          model: "llama-3.1-8b-instant",
        });

      fs.unlinkSync(filePath);

      const rawResponse =
        completion.choices[0].message.content;

      const flashcards =
        JSON.parse(rawResponse);

      res.json({
        flashcards,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        error:
          "Flashcard generation failed",
      });
    }
  }
);

app.post("/study-plan", async (req, res) => {
  try {
    const {
      subject,
      examDate,
      hoursPerDay,
    } = req.body;

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `
You are an expert study planner.

Create a detailed daily study schedule.

Rules:
- Break study into days
- Include revision
- Include practice questions
- Make it realistic
- Keep it organized
`,
          },
          {
            role: "user",
            content: `
Subject: ${subject}

Exam Date: ${examDate}

Hours Per Day: ${hoursPerDay}
`,
          },
        ],
        model: "llama-3.1-8b-instant",
      });

    res.json({
      plan:
        completion.choices[0].message.content,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Study plan failed",
    });
  }
});