
const BR_TAG = /<br\s*\/?>/gi;

function normalize(raw) {
  let text = raw.replace(BR_TAG, "\n");

  // Normalize line endings and common Markdown formatting.
  text = text.replace(/\r\n?/g, "\n");
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, "\n");

  // Keep numbered answer-key entries from being mistaken for questions.
  text = text.replace(
    /(^|\n)\s*(\d{1,2})[.)]\s*([A-D])\s*[:.)-]\s*/gi,
    "$1$2. $3) "
  );

  // Put Question N headings on their own lines.
  text = text.replace(
    /(^|\n)\s*(Question\s+\d{1,2}\s*[:.)-]?\s*)/gi,
    "$1\n$2"
  );

  // Split inline options such as A) ... B) ... C) ... D) ...
  text = text.replace(
    /[ \t]+(?=(?:\*\*)?[A-D][.)](?:\*\*)?\s+)/g,
    "\n"
  );

  // Normalize option markers.
  text = text.replace(
    /(^|\n)\s*(?:\*\*)?([A-D])[.)](?:\*\*)?\s*/g,
    "$1$2) "
  );

  // Move answer-key headers onto their own lines.
  text = text.replace(
    /(^|\n)\s*(?:#{1,6}\s*)?(Answer\s*Key|Answers)\s*:?\s*/gi,
    "$1\nAnswer Key:\n"
  );

  // Normalize inline answer labels.
  text = text.replace(
    /(^|\n)\s*(Correct answer|Answer)\s*:\s*/gi,
    "$1Answer: "
  );

  return text;
}

const QUESTION_HEADER = /^Question\s+(\d{1,2})\s*[:.)-]?\s*$/i;
const ANSWER_KEY_HEADER = /^Answer\s*Key\s*:?\s*$/i;

function stripFormatting(value) {
  return value
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/, "")
    .trim();
}

export function parseQuizText(raw) {
  if (typeof raw !== "string" || !raw.trim()) return [];

  const lines = normalize(raw)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const items = [];

  for (const line of lines) {
    if (ANSWER_KEY_HEADER.test(line)) {
      items.push({ type: "answerKeyHeader" });
      continue;
    }

    const questionHeader = line.match(QUESTION_HEADER);
    if (questionHeader) {
      items.push({
        type: "questionHeader",
        number: questionHeader[1],
      });
      continue;
    }

    const answerKeyEntry = line.match(
      /^(\d{1,2})[.)]\s*([A-D])\s*[\).:-]\s*(.*)$/i
    );

    if (answerKeyEntry) {
      items.push({
        type: "answerKeyEntry",
        number: answerKeyEntry[1],
        text: `${answerKeyEntry[2].toUpperCase()}${answerKeyEntry[3] ? ` (${answerKeyEntry[3].replace(/^\(|\)$/g, "").trim()})` : ""}`,
      });
      continue;
    }

    const option = line.match(/^([A-D])[.)]\s*(.+)$/i);
    if (option) {
      items.push({
        type: "option",
        letter: option[1].toUpperCase(),
        text: stripFormatting(option[2]),
      });
      continue;
    }

    const answer = line.match(/^(?:Correct answer|Answer)\s*:\s*(.+)$/i);
    if (answer) {
      items.push({
        type: "answer",
        text: stripFormatting(answer[1]),
      });
      continue;
    }

    items.push({
      type: "text",
      text: stripFormatting(line),
    });
  }

  return items;
}

export function groupQuizItems(items) {
  const preamble = [];
  const groups = [];
  const trailingAnswers = [];

  let current = null;
  let inAnswerKey = false;
  let pendingQuestionNumber = null;

  for (const item of items) {
    if (item.type === "answerKeyHeader") {
      inAnswerKey = true;
      current = null;
      pendingQuestionNumber = null;
      continue;
    }

    if (item.type === "answerKeyEntry") {
      inAnswerKey = true;
      trailingAnswers.push(`${item.number}. ${item.text}`);
      continue;
    }

    if (item.type === "questionHeader") {
      pendingQuestionNumber = item.number;
      continue;
    }

    if (item.type === "text" && /^Question\s+\d{1,2}\b/i.test(item.text)) {
      const match = item.text.match(/^Question\s+(\d{1,2})\s*[:.)-]?\s*(.*)$/i);
      if (match) {
        if (inAnswerKey) {
          trailingAnswers.push(item.text);
          continue;
        }

        pendingQuestionNumber = match[1];

        if (match[2]) {
          current = {
            number: pendingQuestionNumber,
            text: match[2],
            options: [],
            answer: null,
          };
          groups.push(current);
          pendingQuestionNumber = null;
        }
        continue;
      }
    }

    if (inAnswerKey) {
      if (item.type === "answer") {
        trailingAnswers.push(item.text);
      } else if (item.text) {
        trailingAnswers.push(item.text);
      }
      continue;
    }

    if (item.type === "option") {
      if (current) current.options.push(item);
      else preamble.push(item.text);
      continue;
    }

    if (item.type === "answer") {
      if (current && current.answer === null) {
        current.answer = item.text;
      } else {
        trailingAnswers.push(item.text);
      }
      continue;
    }

    if (item.type === "text" && item.text) {
      if (pendingQuestionNumber !== null) {
        current = {
          number: pendingQuestionNumber,
          text: item.text,
          options: [],
          answer: null,
        };
        groups.push(current);
        pendingQuestionNumber = null;
      } else if (current) {
        current.text = `${current.text} ${item.text}`.trim();
      } else {
        preamble.push(item.text);
      }
    }
  }

  return { preamble, groups, trailingAnswers };
}

export function quizToPlainText({ preamble, groups, trailingAnswers }) {
  const parts = [];

  if (preamble.length) parts.push(preamble.join("\n"));

  for (const group of groups) {
    const lines = [`Question ${group.number}: ${group.text}`];

    for (const option of group.options) {
      lines.push(`${option.letter}) ${option.text}`);
    }

    if (group.answer) lines.push(`Answer: ${group.answer}`);

    parts.push(lines.join("\n"));
  }

  if (trailingAnswers.length) {
    parts.push(["Answer Key:", ...trailingAnswers].join("\n"));
  }

  return parts.join("\n\n");
}
