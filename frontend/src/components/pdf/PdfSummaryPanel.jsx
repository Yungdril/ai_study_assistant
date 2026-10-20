import { useState } from "react";
import {
  summarizePdf,
  generateFlashcardsFromPdf,
  createDocumentSession,
  askDocumentQuestion,
  explainDocument,
  studyChat,
} from "../../api/pdfService";
import PdfUpload from "./PdfUpload";
import PdfDocumentCard from "./PdfDocumentCard";
import PdfProcessingState from "./PdfProcessingState";
import PdfStudyActions from "./PdfStudyActions";
import PdfSummary from "./PdfSummary";
import PdfFlashcardsResult from "./PdfFlashcardsResult";
import PdfAskQuestion from "./PdfAskQuestion";
import PdfExplain from "./PdfExplain";
import PdfStudyChat from "./PdfStudyChat";

// Stages of the PDF workspace. "selected" and "ready" both keep the File
// object in state (see `pdfFile` below) so the user never has to reselect
// the same file for a later action (requirement: document session) — this
// is plain React state, no new schema or persistence layer.
const STAGE = {
  UPLOAD: "upload",
  SELECTED: "selected",
  PROCESSING: "processing",
  READY: "ready",
};

export default function PdfSummaryPanel() {
  const [stage, setStage] = useState(STAGE.UPLOAD);
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState("");
  const [flashcards, setFlashcards] = useState(null); // null = not fetched yet
  const [activeActionId, setActiveActionId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // PDF Intelligence v2 — document-aware Q&A session state. Entirely
  // separate from summary/flashcards: a failure here never blocks or
  // clears them, and vice versa. Kept in React state only, per spec (no
  // persistence, no Firestore).
  const [documentId, setDocumentId] = useState(null);
  const [documentSessionError, setDocumentSessionError] = useState("");
  const [qaMessages, setQaMessages] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);

  // Milestone 4 — "Explain this document". Separate history/loading state
  // from the Q&A panel above: the two features share the same documentId
  // and session, but keep independent conversations in React state.
  const [explainMessages, setExplainMessages] = useState([]);
  const [explainLoading, setExplainLoading] = useState(false);

  // Milestone 5, Phase 1 — Study Chat. Unlike qaMessages/explainMessages
  // above (which store {question, answer} pairs purely for display),
  // studyChatMessages stores the actual {role, content} conversation in
  // the exact shape the backend expects, since the full history is resent
  // on every turn. Lives here (the parent) rather than inside
  // PdfStudyChat so it survives switching to another study action and
  // back, for as long as this document session is open.
  const [studyChatMessages, setStudyChatMessages] = useState([]);
  const [studyChatLoading, setStudyChatLoading] = useState(false);

  const resetResults = () => {
    setSummary("");
    setFlashcards(null);
    setActiveActionId(null);
    setError("");
    setDocumentId(null);
    setDocumentSessionError("");
    setQaMessages([]);
    setQaLoading(false);
    setExplainMessages([]);
    setExplainLoading(false);
    setStudyChatMessages([]);
    setStudyChatLoading(false);
  };

  const handleFileSelected = (file) => {
    setPdfFile(file);
    resetResults();
    setStage(STAGE.SELECTED);
  };

  const handleRemove = () => {
    setPdfFile(null);
    resetResults();
    setStage(STAGE.UPLOAD);
  };

  // "Analyze PDF" uses the existing /upload-pdf endpoint exactly as before
  // — same request (the file), same response shape ({ summary }). This is
  // the one real whole-document action the backend supports today, so it
  // doubles as the transition into the study workspace.
  //
  // Alongside it, we kick off a document session (POST /documents) so
  // "Ask about this PDF" can become enabled once it resolves. The two
  // requests are independent: summarizePdf's success/failure behavior is
  // unchanged from before (it alone still decides whether we land on
  // STAGE.READY or bounce back to STAGE.SELECTED with an error), while the
  // document-session outcome only ever affects the Q&A panel, via
  // Promise.allSettled so neither call can block or break the other.
  const handleAnalyze = async () => {
    setStage(STAGE.PROCESSING);
    setError("");
    setDocumentId(null);
    setDocumentSessionError("");

    const [summaryResult, documentResult] = await Promise.allSettled([
      summarizePdf(pdfFile),
      createDocumentSession(pdfFile),
    ]);

    if (summaryResult.status === "fulfilled") {
      setSummary(summaryResult.value);
      setActiveActionId("summarize");
      setStage(STAGE.READY);
    } else {
      console.log(summaryResult.reason);
      setError("Analyzing this PDF failed. Please try again.");
      setStage(STAGE.SELECTED);
    }

    if (documentResult.status === "fulfilled") {
      setDocumentId(documentResult.value.documentId);
    } else {
      console.log(documentResult.reason);
      setDocumentSessionError(
        "Ask-about-this-PDF isn't available for this document right now."
      );
    }
  };

  // Routes a question through the document session's dedicated endpoint
  // (POST /documents/:documentId/chat) — never the general /chat endpoint.
  // History is appended locally so multiple questions can be asked in the
  // same session; nothing is persisted beyond this component's state.
  const handleAskQuestion = async (questionText) => {
    if (!documentId) return;
    setQaLoading(true);
    try {
      const result = await askDocumentQuestion(documentId, questionText);
      setQaMessages((prev) => [
        ...prev,
        { question: questionText, answer: result.answer },
      ]);
    } catch (err) {
      console.log(err);
      setQaMessages((prev) => [
        ...prev,
        {
          question: questionText,
          answer: "Sorry, I couldn't answer that question. Please try again.",
        },
      ]);
    } finally {
      setQaLoading(false);
    }
  };

  // Routes an explanation request through POST /documents/:documentId/explain
  // — a dedicated, tutor-style endpoint, separate from the Q&A chat above.
  // Same pattern as handleAskQuestion: history appended locally, errors
  // shown as a student-friendly message in place of an answer rather than
  // breaking the panel.
  const handleAskExplanation = async (questionText) => {
    if (!documentId) return;
    setExplainLoading(true);
    try {
      const result = await explainDocument(documentId, questionText);
      setExplainMessages((prev) => [
        ...prev,
        { question: questionText, answer: result.answer },
      ]);
    } catch (err) {
      console.log(err);
      setExplainMessages((prev) => [
        ...prev,
        {
          question: questionText,
          answer: "Sorry, I couldn't explain that. Please try again.",
        },
      ]);
    } finally {
      setExplainLoading(false);
    }
  };

  // Routes a Study Chat turn through POST /documents/:documentId/study-chat.
  // Unlike the Q&A and Explain handlers above, the full conversation
  // (including the new user message) is sent on every call — the backend
  // is stateless beyond the document's chunks, so the client is the source
  // of truth for the conversation itself.
  const handleSendStudyChatMessage = async (text) => {
    if (!documentId) return;
    const historyWithNewMessage = [...studyChatMessages, { role: "user", content: text }];
    setStudyChatMessages(historyWithNewMessage);
    setStudyChatLoading(true);
    try {
      const result = await studyChat(documentId, historyWithNewMessage);
      setStudyChatMessages((prev) => [...prev, { role: "assistant", content: result.answer }]);
    } catch (err) {
      console.log(err);
      setStudyChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't answer that. Please try again.",
        },
      ]);
    } finally {
      setStudyChatLoading(false);
    }
  };

  // "summarize" and "flashcards" fetch immediately on selection.
  // "explain" and "studyChat" need no fetch here — they just show their
  // panel, which fetches per-turn via their own handler above, same as the
  // Ask-about-document panel does. The Study Actions grid already prevents
  // comingSoon cards (currently just "quiz") from calling this at all.
  const handleSelectAction = async (actionId) => {
    setActiveActionId(actionId);

    if (actionId === "flashcards" && flashcards === null) {
      setActionLoading(true);
      setError("");
      try {
        const result = await generateFlashcardsFromPdf(pdfFile);
        setFlashcards(result);
      } catch (err) {
        console.log(err);
        setError("Generating flashcards failed. Please try again.");
        setFlashcards([]);
      } finally {
        setActionLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {stage === STAGE.UPLOAD && <PdfUpload onFileSelected={handleFileSelected} />}

        {stage === STAGE.SELECTED && (
          <div className="flex-1 flex flex-col">
            <PdfDocumentCard
              file={pdfFile}
              onRemove={handleRemove}
              onAnalyze={handleAnalyze}
              analyzing={false}
            />
            {error && (
              <p className="text-xs text-red-400 text-center -mt-4 mb-6">{error}</p>
            )}
          </div>
        )}

        {stage === STAGE.PROCESSING && <PdfProcessingState />}

        {stage === STAGE.READY && (
          <div className="max-w-2xl mx-auto w-full p-4 md:p-6 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl mb-3 shadow-lg shadow-blue-900/30">
                📄
              </div>
              <p className="text-sm font-medium text-slate-200 truncate">{pdfFile?.name}</p>
              <p className="text-xs text-emerald-400 mt-1">Ready to study</p>
            </div>

            <PdfStudyActions
              activeActionId={activeActionId}
              onSelectAction={handleSelectAction}
            />

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {actionLoading && (
              <p className="text-sm text-slate-500 text-center py-4">Generating flashcards...</p>
            )}

            {!actionLoading && activeActionId === "summarize" && summary && (
              <PdfSummary summary={summary} />
            )}

            {!actionLoading && activeActionId === "flashcards" && flashcards?.length > 0 && (
              <PdfFlashcardsResult flashcards={flashcards} />
            )}

            {activeActionId === "explain" && (
              <PdfExplain
                documentId={documentId}
                messages={explainMessages}
                onAskExplanation={handleAskExplanation}
                loading={explainLoading}
                sessionError={documentSessionError}
              />
            )}

            {activeActionId === "studyChat" && (
              <PdfStudyChat
                documentId={documentId}
                messages={studyChatMessages}
                onSendMessage={handleSendStudyChatMessage}
                loading={studyChatLoading}
                sessionError={documentSessionError}
              />
            )}

            <PdfAskQuestion
              documentId={documentId}
              messages={qaMessages}
              onAskQuestion={handleAskQuestion}
              loading={qaLoading}
              sessionError={documentSessionError}
            />

            <button
              onClick={handleRemove}
              className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-2"
            >
              Upload a different PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
