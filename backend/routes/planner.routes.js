const express = require("express");
const { groq, MODEL } = require("../services/groqClient");
const { STUDY_PLAN_SYSTEM_PROMPT } = require("../services/prompts");

const router = express.Router();

router.post("/study-plan", async (req, res) => {
  try {
    const { subject, examDate, hoursPerDay } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: STUDY_PLAN_SYSTEM_PROMPT,
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
      model: MODEL,
    });

    res.json({
      plan: completion.choices[0].message.content,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Study plan failed",
    });
  }
});

module.exports = router;
