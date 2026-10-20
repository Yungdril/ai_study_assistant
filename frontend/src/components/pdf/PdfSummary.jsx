import ChatMarkdown from "../chat/ChatMarkdown";

// Reuses the Chat redesign's markdown renderer (headings, lists, code
// blocks, tables) so the PDF summary reading area matches the rest of
// SmartPal 2.0's visual language, per the "visually consistent with
// SmartPal's new Chat UI" requirement. This does not change what the
// backend returns — /upload-pdf's response contract is untouched; only how
// that same markdown string is rendered improves.
export default function PdfSummary({ summary }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
        Summary
      </h3>
      <div className="text-[15px] text-slate-200">
        <ChatMarkdown>{summary}</ChatMarkdown>
      </div>
    </div>
  );
}
