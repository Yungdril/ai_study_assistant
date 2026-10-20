/**
 * Loading state shown while the existing /upload-pdf call is in flight.
 * Purely presentational — no polling, no fake progress percentages, since
 * the backend returns one response at the end rather than streaming steps.
 */
export default function PdfProcessingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="relative w-14 h-14 mb-5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 animate-ping" />
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
          📄
        </div>
      </div>
      <h2 className="text-lg font-semibold text-slate-100">
        Analyzing your document...
      </h2>
      <div className="mt-3 space-y-1.5 text-sm text-slate-500">
        <p className="flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Extracting study material
        </p>
        <p className="flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse [animation-delay:0.3s]" />
          Preparing your study workspace
        </p>
      </div>
    </div>
  );
}
