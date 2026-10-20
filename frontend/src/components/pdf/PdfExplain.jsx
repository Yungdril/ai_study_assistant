import { useState } from "react";
import ChatMarkdown from "../chat/ChatMarkdown";

// Reuses the existing chat markdown renderer so tutor-style explanations
// read consistently with the rest of SmartPal 2.0 (same component PdfSummary
// uses for the summary text).

const SUGGESTED_PROMPTS = [
  "Explain Question 1 like I'm a beginner",
  "Explain the main concept in simple terms",
  "Walk me through the solution step by step",
  "Explain the difficult parts of this document",
];

/**
 * Milestone 4 — "Explain this document". Grounded, tutor-style explanations
 * driven by the existing document session (same documentId, chunking and
 * retrieval as "Ask about this document" — see PdfAskQuestion.jsx), but
 * through a dedicated POST /documents/:documentId/explain endpoint and a
 * teaching-focused system prompt. Mirrors PdfAskQuestion's three states:
 * preparing (no documentId yet, no error), unavailable (sessionError set),
 * and ready (documentId present).
 */
export default function PdfExplain({
  documentId,
  messages = [],
  onAskExplanation,
  loading = false,
  sessionError = "",
}) {
  const [question, setQuestion] = useState("");

  const canAsk = Boolean(documentId) && !loading;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || !canAsk) return;
    onAskExplanation(trimmed);
    setQuestion("");
  };

  // Suggested prompts populate the input rather than auto-sending, so the
  // student can tweak them (e.g. swap "Question 1" for the one they mean)
  // before submitting.
  const handleSuggestionClick = (prompt) => {
    if (!canAsk) return;
    setQuestion(prompt);
  };

  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
        Explain this document
      </h3>

      {messages.length > 0 && (
        <div className="space-y-3 mb-3">
          {messages.map((msg, idx) => (
            <div key={idx} className="space-y-1.5">
              <p className="text-sm text-slate-200 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2">
                {msg.question}
              </p>
              <div className="text-[15px] text-slate-200 bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3">
                <ChatMarkdown>{msg.answer}</ChatMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-xs text-slate-500 mb-2">Preparing an explanation...</p>
      )}

      {messages.length === 0 && !loading && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={!canAsk}
              onClick={() => handleSuggestionClick(prompt)}
              className="text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-full px-3 py-1.5 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900/60 disabled:hover:text-slate-400"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-2xl px-3 py-2 ${
          canAsk ? "" : "opacity-60"
        }`}
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!canAsk}
          placeholder="What would you like explained?"
          className="flex-1 bg-transparent outline-none text-sm px-2 py-2 text-slate-200 placeholder:text-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!canAsk || !question.trim()}
          className="flex-shrink-0 h-9 px-4 rounded-xl flex items-center justify-center text-sm font-medium bg-blue-600 text-white disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          Explain
        </button>
      </form>

      {!documentId && !sessionError && (
        <p className="text-xs text-slate-600 mt-2">
          Preparing this document for explanations...
        </p>
      )}

      {!documentId && sessionError && (
        <p className="text-xs text-amber-400 mt-2">{sessionError}</p>
      )}

      {documentId && !loading && messages.length === 0 && (
        <p className="text-xs text-slate-600 mt-2">
          Tap a suggestion above, or ask about any question or concept in this document.
        </p>
      )}
    </div>
  );
}
