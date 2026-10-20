
import { SUGGESTED_PROMPTS } from "../../constants/suggestedPrompts";

export default function ChatWelcomeScreen({ onSelectSuggestion }) {
  return (
    <div className="flex min-h-full w-full min-w-0 flex-col items-center justify-center px-4 py-5 text-center sm:py-8">
      <div className="mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl shadow-lg shadow-blue-900/30 sm:mb-5 sm:h-12 sm:w-12">
        📚
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">
        What are you learning today?
      </h2>

      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Ask a question, paste your notes, or pick a starting point below.
      </p>

      <div className="mt-5 grid w-full max-w-lg grid-cols-1 gap-2.5 sm:mt-8 sm:grid-cols-2 sm:gap-3">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => onSelectSuggestion(prompt.modeId)}
            className="group min-w-0 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-900 sm:py-3.5"
          >
            <span className="text-lg">{prompt.icon}</span>

            <p className="mt-1.5 text-sm font-medium text-slate-200 transition-colors group-hover:text-white">
              {prompt.title}
            </p>

            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {prompt.subtitle}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
