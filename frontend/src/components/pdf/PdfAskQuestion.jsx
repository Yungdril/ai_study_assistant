import { useState } from "react";

/**
 * Document-aware Q&A for the PDF workspace (PDF Intelligence v2). Enabled
 * once a document session exists (`documentId` is set by PdfSummaryPanel
 * after POST /documents succeeds). Questions are sent through
 * `onAskQuestion`, which calls POST /documents/:documentId/chat — this
 * component never talks to the API directly and never touches /chat.
 *
 * Three states:
 * - No documentId yet, no error: the document session is still being
 *   created in the background (it runs alongside the summary request), so
 *   this shows a lightweight "preparing" placeholder rather than an error.
 * - No documentId, sessionError set: document-session creation failed.
 *   This is surfaced here only — it never blocks the summary/flashcards,
 *   which depend on a separate request.
 * - documentId present: full Q&A UI — history of question/answer pairs
 *   plus an input to ask more, kept entirely in React state for this
 *   session (no persistence).
 */
export default function PdfAskQuestion({
  documentId,
  messages = [],
  onAskQuestion,
  loading = false,
  sessionError = "",
}) {
  const [question, setQuestion] = useState("");

  const canAsk = Boolean(documentId) && !loading;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || !canAsk) return;
    onAskQuestion(trimmed);
    setQuestion("");
  };

  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
        Ask about this document
      </h3>

      {messages.length > 0 && (
        <div className="space-y-3 mb-3">
          {messages.map((msg, idx) => (
            <div key={idx} className="space-y-1.5">
              <p className="text-sm text-slate-200 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2">
                {msg.question}
              </p>
              <p className="text-sm text-slate-300 bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2 whitespace-pre-wrap">
                {msg.answer}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-xs text-slate-500 mb-2">Thinking...</p>
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
          placeholder="What is the main topic of this lecture?"
          className="flex-1 bg-transparent outline-none text-sm px-2 py-2 text-slate-200 placeholder:text-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!canAsk || !question.trim()}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-blue-600 text-white disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>

      {!documentId && !sessionError && (
        <p className="text-xs text-slate-600 mt-2">
          Preparing this document for questions...
        </p>
      )}

      {!documentId && sessionError && (
        <p className="text-xs text-amber-400 mt-2">{sessionError}</p>
      )}

      {documentId && !loading && messages.length === 0 && (
        <p className="text-xs text-slate-600 mt-2">
          Ask follow-up questions grounded in this exact PDF.
        </p>
      )}
    </div>
  );
}
