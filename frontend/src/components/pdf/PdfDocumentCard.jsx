function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 0.1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

/**
 * Shown once a PDF is selected but before (or instead of) analysis.
 * `onAnalyze` triggers the existing /upload-pdf call — no new endpoint.
 */
export default function PdfDocumentCard({ file, onRemove, onAnalyze, analyzing }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg">
            📄
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-100 truncate">{file.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              PDF Document{file.size ? ` · ${formatFileSize(file.size)}` : ""}
            </p>
          </div>
          <button
            onClick={onRemove}
            disabled={analyzing}
            title="Remove file"
            className="flex-shrink-0 text-slate-500 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs px-2 py-1"
          >
            Remove
          </button>
        </div>

        <button
          onClick={onAnalyze}
          disabled={analyzing}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors py-2.5 rounded-xl text-sm font-semibold"
        >
          {analyzing ? "Analyzing..." : "Analyze PDF"}
        </button>
      </div>
    </div>
  );
}
