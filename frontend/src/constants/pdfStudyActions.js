// PDF study workspace action cards. `status: "available"` actions call a
// real existing backend endpoint (see PdfSummaryPanel.jsx); `status:
// "comingSoon"` actions have no backend support yet (no PDF-aware /quiz)
// and are intentionally inert rather than faked.
export const PDF_STUDY_ACTIONS = [
  {
    // Milestone 4: now backed by POST /documents/:documentId/explain.
    id: "explain",
    icon: "🧠",
    title: "Explain",
    subtitle: "Understand this",
    status: "available",
  },
  {
    id: "summarize",
    icon: "📝",
    title: "Summarize",
    subtitle: "Key points",
    status: "available",
  },
  {
    id: "flashcards",
    icon: "🃏",
    title: "Flashcards",
    subtitle: "Practice memory",
    status: "available",
  },
  {
    id: "quiz",
    icon: "❓",
    title: "Quiz",
    subtitle: "Test yourself",
    status: "comingSoon",
  },
  {
    // Milestone 5, Phase 1: backed by POST /documents/:documentId/study-chat.
    id: "studyChat",
    icon: "💬",
    title: "Study Chat",
    subtitle: "Ask & follow up",
    status: "available",
  },
];
