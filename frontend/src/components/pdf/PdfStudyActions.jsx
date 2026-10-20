import { PDF_STUDY_ACTIONS } from "../../constants/pdfStudyActions";

/**
 * The 4 study action cards. "comingSoon" cards are visually present but
 * inert (no onClick, no network call) — they're not wired to any backend
 * because no PDF-aware /quiz or document-Q&A endpoint exists yet. Only
 * "available" actions call onSelectAction, which PdfSummaryPanel wires to
 * the real existing /upload-pdf and /generate-flashcards endpoints.
 */
export default function PdfStudyActions({ activeActionId, onSelectAction }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PDF_STUDY_ACTIONS.map((action) => {
        const isAvailable = action.status === "available";
        const isActive = action.id === activeActionId;

        return (
          <button
            key={action.id}
            disabled={!isAvailable}
            onClick={() => isAvailable && onSelectAction(action.id)}
            className={`relative text-left rounded-xl px-4 py-3.5 border transition-colors ${
              isActive
                ? "bg-blue-600/15 border-blue-500/40"
                : isAvailable
                  ? "bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700 cursor-pointer"
                  : "bg-slate-900/30 border-slate-800/60 cursor-not-allowed opacity-60"
            }`}
          >
            <span className="text-lg">{action.icon}</span>
            <p
              className={`text-sm font-medium mt-1.5 ${
                isActive ? "text-blue-300" : "text-slate-200"
              }`}
            >
              {action.title}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{action.subtitle}</p>

            {!isAvailable && (
              <span className="absolute top-2.5 right-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-800 border border-slate-700 rounded-full px-1.5 py-0.5">
                Soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
