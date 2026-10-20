import FlashcardItem from "../flashcards/FlashcardItem";

// Reuses the existing FlashcardItem presentational component (no logic
// coupling to the Flashcards tab) so PDF-generated flashcards look
// identical to the ones already shown elsewhere in the app. The data shape
// is exactly what /generate-flashcards already returns — unchanged.
export default function PdfFlashcardsResult({ flashcards }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
        Flashcards
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {flashcards.map((card, index) => (
          <FlashcardItem key={index} question={card.question} answer={card.answer} />
        ))}
      </div>
    </div>
  );
}
