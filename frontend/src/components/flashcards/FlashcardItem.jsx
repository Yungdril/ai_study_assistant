export default function FlashcardItem({ question, answer }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <p className="text-blue-400 font-bold text-xs mb-1">QUESTION</p>
      <p className="text-sm mb-4">{question}</p>
      <p className="text-emerald-400 font-bold text-xs mb-1">ANSWER</p>
      <p className="text-sm">{answer}</p>
    </div>
  );
}
