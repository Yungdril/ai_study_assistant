import { useState } from "react";
import ChatMarkdown from "../chat/ChatMarkdown";

/**
 * Milestone 5, Phase 1 — Study Chat (core document Q&A, multi-turn). Same
 * document session as "Ask about this document" and "Explain this
 * document" (see PdfAskQuestion.jsx / PdfExplain.jsx), but through a
 * dedicated POST /documents/:documentId/study-chat endpoint that accepts
 * and returns a real back-and-forth conversation rather than one
 * question/answer at a time — the full `messages` history is sent on every
 * turn so SmartPal can resolve follow-ups ("why 4.50?") using what was
 * already discussed, while still grounding answers in the PDF.
 *
 * `messages` is owned by the parent (PdfSummaryPanel), not this component,
 * so switching to another study action and back preserves the
 * conversation for as long as the document session is open — no extra
 * persistence layer needed.
 */
export default function PdfStudyChat({
  documentId,
  messages = [],
  onSendMessage,
  loading = false,
  sessionError = "",
}) {
  const [draft, setDraft] = useState("");

  const canSend = Boolean(documentId) && !loading;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !canSend) return;
    onSendMessage(trimmed);
    setDraft("");
  };

  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
        Study Chat
      </h3>

      {messages.length > 0 && (
        <div className="space-y-2.5 mb-3">
          {messages.map((msg, idx) =>
            msg.role === "user" ? (
              <p
                key={idx}
                className="text-sm text-slate-200 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 ml-6"
              >
                {msg.content}
              </p>
            ) : (
              <div
                key={idx}
                className="text-[15px] text-slate-200 bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 mr-6"
              >
                <ChatMarkdown>{msg.content}</ChatMarkdown>
              </div>
            )
          )}
        </div>
      )}

      {loading && (
        <p className="text-xs text-slate-500 mb-2">SmartPal is thinking...</p>
      )}

      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-2xl px-3 py-2 ${
          canSend ? "" : "opacity-60"
        }`}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!canSend}
          placeholder="Ask a question about this document..."
          className="flex-1 bg-transparent outline-none text-sm px-2 py-2 text-slate-200 placeholder:text-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!canSend || !draft.trim()}
          className="flex-shrink-0 h-9 px-4 rounded-xl flex items-center justify-center text-sm font-medium bg-blue-600 text-white disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>

      {!documentId && !sessionError && (
        <p className="text-xs text-slate-600 mt-2">
          Preparing this document for Study Chat...
        </p>
      )}

      {!documentId && sessionError && (
        <p className="text-xs text-amber-400 mt-2">{sessionError}</p>
      )}

      {documentId && !loading && messages.length === 0 && (
        <p className="text-xs text-slate-600 mt-2">
          Ask about this document, then keep asking follow-up questions — SmartPal
          remembers this conversation.
        </p>
      )}
    </div>
  );
}
