// Welcome-screen suggestion cards. Selecting one selects the matching
// Study Mode (see constants/studyModes.js) and focuses the composer — it
// does not send anything and does not prefill text, so the user always
// types their own topic. The mode's instruction is what actually steers
// the AI once they send; the card itself only picks the mode.
export const SUGGESTED_PROMPTS = [
  {
    id: "explain",
    modeId: "explain",
    icon: "💡",
    title: "Explain a concept",
    subtitle: "Break a topic down step by step",
  },
  {
    id: "quiz",
    modeId: "quiz",
    icon: "🧠",
    title: "Quiz me",
    subtitle: "Practice with a few questions",
  },
  {
    id: "summarize",
    modeId: "summarize",
    icon: "📝",
    title: "Summarize a topic",
    subtitle: "Get a clear, concise overview",
  },
  {
    id: "flashcards",
    modeId: "flashcards",
    icon: "🃏",
    title: "Create flashcards",
    subtitle: "Turn key points into flashcards",
  },
];
