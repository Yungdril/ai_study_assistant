import { useRef, useState } from "react";

function isPdfFile(file) {
  if (!file) return false;
  if (file.type === "application/pdf") return true;
  // Fallback for browsers/drag sources that don't set a MIME type.
  return file.name?.toLowerCase().endsWith(".pdf");
}

/**
 * Drag-and-drop + file-picker upload area. Only calls onFileSelected with a
 * validated PDF File object — never touches the network itself (the
 * existing endpoints are only called once the user explicitly analyzes the
 * selected file, same as before this redesign).
 */
export default function PdfUpload({ onFileSelected }) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState("");
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!isPdfFile(file)) {
      setValidationError(
        `"${file.name}" isn't a PDF. Please choose a .pdf file.`
      );
      return;
    }
    setValidationError("");
    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`w-full max-w-xl rounded-2xl border-2 border-dashed p-8 md:p-12 flex flex-col items-center text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-500/5"
            : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl mb-5 shadow-lg shadow-blue-900/30">
          📄
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-slate-100">
          Upload your study material
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          Drop a PDF here or choose a file
        </p>
        <p className="text-slate-600 text-xs mt-1">
          Lecture notes, textbooks, assignments, etc.
        </p>

        <button
          onClick={() => inputRef.current?.click()}
          className="mt-6 bg-blue-600 hover:bg-blue-700 transition-colors px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          Choose a file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />

        {validationError && (
          <p className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {validationError}
          </p>
        )}
      </div>
    </div>
  );
}
