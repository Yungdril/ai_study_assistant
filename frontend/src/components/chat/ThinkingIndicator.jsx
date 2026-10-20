/**
 * Replaces the plain "AI is thinking..." text with a small animated
 * indicator. Pure Tailwind utility animations (animate-bounce) with
 * staggered delays — no new dependencies.
 */
export default function ThinkingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-3">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
        </span>
        <span className="text-xs text-slate-500">SmartPal is thinking</span>
      </div>
    </div>
  );
}
