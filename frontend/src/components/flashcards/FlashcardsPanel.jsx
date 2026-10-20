import { useState } from "react";
import { generateFlashcardsFromPdf } from "../../api/pdfService";
import FlashcardItem from "./FlashcardItem";

export default function FlashcardsPanel() {
  const [pdfFile, setPdfFile] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateFlashcards = async () => {
    if (!pdfFile) return alert("Select a PDF first");
    try {
      setLoading(true);
      const result = await generateFlashcardsFromPdf(pdfFile);
      setFlashcards(result);
    } catch (error) {
      console.log(error);
      alert("Flashcard generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-slate-300 text-sm">Upload a PDF to generate flashcards</h3>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setPdfFile(e.target.files[0])}
          className="text-sm text-slate-300 w-full"
        />
        <button
          onClick={generateFlashcards}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition py-3 rounded-xl text-sm font-semibold"
        >
          {loading ? "Generating..." : "Generate Flashcards"}
        </button>
      </div>
      {flashcards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flashcards.map((card, index) => (
            <FlashcardItem key={index} question={card.question} answer={card.answer} />
          ))}
        </div>
      )}
    </div>
  );
}
