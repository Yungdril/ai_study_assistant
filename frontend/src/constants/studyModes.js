// Smart Study Mode configuration. Each mode's `instruction` is prepended to
// the user's message before it goes to the existing chat flow (see
// ChatPanel's composePrompt) — never exposed as a new endpoint or a
// separate code path. Kept in one place so the wording is easy to tune
// later without touching components.
export const STUDY_MODES = [
  {
    id: "general",
    label: "General",
    icon: "💬",
    placeholder: "Ask anything...",
    instruction: null,
  },
  {
    id: "explain",
    label: "Explain",
    icon: "💡",
    placeholder: "What topic should I explain?",
    instruction:
      "Explain the following topic clearly and step-by-step for a student. Start with the basic idea, then give a simple example.",
  },
  {
    id: "study",
    label: "Study",
    icon: "🎓",
    placeholder: "What do you want to study?",
    instruction:
      "Act as a patient study tutor. Teach the following topic progressively, checking understanding where appropriate.",
  },
  {
    id: "quiz",
    label: "Quiz",
    icon: "🧠",
    placeholder: "What should I quiz you on?",
    instruction:
      "Act as a quiz tutor. Create questions about the following topic and test the student. Do not reveal answers immediately.",
  },
  {
    id: "summarize",
    label: "Summarize",
    icon: "📝",
    placeholder: "What should I summarize?",
    instruction:
      "Summarize the following material into clear, concise study notes. Highlight key concepts, definitions, and important points.",
  },
  {
    id: "flashcards",
    label: "Flashcards",
    icon: "🃏",
    placeholder: "What topic needs flashcards?",
    instruction:
      "Turn the following topic/material into useful study flashcards. Format them clearly as question and answer pairs.",
  },
];

export const DEFAULT_STUDY_MODE_ID = "general";

export function getStudyMode(id) {
  return STUDY_MODES.find((mode) => mode.id === id) || STUDY_MODES[0];
}

/**
 * Builds the text actually sent to the AI for a given mode + the user's
 * typed topic. Returns the plain topic unchanged for General (or any mode
 * with no instruction), so default behavior is byte-identical to before
 * Smart Study Mode existed.
 */
export function composeModePrompt(modeId, topicText) {
  const mode = getStudyMode(modeId);
  if (!mode.instruction) return topicText;
  return `${mode.instruction}\n\nTopic: ${topicText}`;
}
