import { useState } from "react";
import { generateQuiz as generateQuizRequest } from "../../api/quizService";
import { parseQuizText, groupQuizItems, quizToPlainText } from "./parseQuizText";

// Same request/response shape as always (POST /quiz -> { quiz: "<text>" }),
// same validation (a topic is required). The backend returns free-form text,
// so it is parsed by parseQuizText.js (plain string matching, no HTML/markdown
// parsing) and shown as structured question/option/answer blocks.
export default function QuizPanel() {
  const [quizTopic, setQuizTopic] = useState("");
  const [quiz, setQuiz] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generateQuiz = async () => {
    if (loading) return;
    const trimmed = quizTopic.trim();
    if (!trimmed) {
      setValidationError("Enter a topic first.");
      return;
    }
    setValidationError("");
    setError("");
    try {
      setLoading(true);
      const result = await generateQuizRequest(trimmed);
      setQuiz(result);
    } catch (err) {
      console.log(err);
      setError("Quiz generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const parsed = quiz ? groupQuizItems(parseQuizText(quiz)) : null;

  const handleCopy = async () => {
    if (!parsed) return;
    try {
      await navigator.clipboard.writeText(quizToPlainText(parsed));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access denied/unavailable — leave the button as-is.
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full p-3 sm:p-4 md:p-6 space-y-5">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 sm:p-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-xl mb-4 shadow-lg shadow-blue-950/40">
            🧠
          </div>
          <h2 className="text-lg font-semibold text-slate-100">Generate a quiz</h2>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Enter a topic and SmartPal will put together 5 multiple-choice questions to test yourself with.
          </p>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="e.g. Photosynthesis, World War 2..."
              value={quizTopic}
              onChange={(e) => {
                setQuizTopic(e.target.value);
                if (validationError) setValidationError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && generateQuiz()}
              aria-label="Quiz topic"
              className="w-full min-h-[44px] bg-field border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-violet-500/25"
            />

            {validationError && (
              <p className="text-xs text-amber-400">{validationError}</p>
            )}

            <button
              onClick={generateQuiz}
              disabled={loading}
              className="w-full min-h-[44px] bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-800 disabled:text-slate-500 transition-colors py-3 rounded-xl text-sm font-semibold text-white shadow-sm"
            >
              {loading ? "Generating..." : quiz ? "Generate Another Quiz" : "Generate Quiz"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="relative w-12 h-12 mb-4">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 opacity-20 animate-ping" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-lg shadow-lg shadow-blue-950/40">
                🧠
              </div>
            </div>
            <p className="text-sm text-slate-400">Writing your questions...</p>
          </div>
        )}

        {!loading && error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 break-words">
            {error}
          </p>
        )}

        {!loading && quiz && parsed && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 sm:px-5 py-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Quiz
              </h3>
              <button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 min-h-[32px] flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-slate-200"
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-violet-300" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                      <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 013.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0121 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 017.5 16.125V3.375z" />
                      <path d="M15 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0017.25 7.5h-1.875A.375.375 0 0115 7.125V5.25zM4.875 6H6v10.125A3.375 3.375 0 009.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V7.875C3 6.839 3.84 6 4.875 6z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="space-y-5">
              {parsed.preamble.length > 0 && (
                <p className="text-sm text-slate-400 break-words whitespace-pre-wrap">
                  {parsed.preamble.join("\n")}
                </p>
              )}

              {parsed.groups.map((group, index) => (
                <div
                  key={index}
                  className="pb-5 last:pb-0 border-b border-white/[0.06] last:border-b-0"
                >
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-[11px] font-semibold text-white">
                      {group.number || index + 1}
                    </span>
                    <p className="text-sm font-medium text-slate-100 break-words leading-relaxed pt-0.5">
                      {group.text}
                    </p>
                  </div>

                  {group.options.length > 0 && (
                    <div className="mt-3 ml-9 space-y-2">
                      {group.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex gap-2.5 text-sm">
                          <span className="flex-shrink-0 font-semibold text-blue-400">
                            {opt.letter}.
                          </span>
                          <span className="text-slate-300 break-words">{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {group.answer && (
                    <div className="mt-3 ml-9">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                        Answer: {group.answer}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {parsed.trailingAnswers.length > 0 && (
                <div className="pt-1">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Answer Key
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {parsed.trailingAnswers.map((ans, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400"
                      >
                        {ans}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}