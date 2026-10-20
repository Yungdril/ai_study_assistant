import { useState } from "react";
import { STUDY_MODES, getStudyMode } from "../../constants/studyModes";

export default function StudyModeSelector({
  selectedModeId,
  onSelectMode,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedMode = getStudyMode(selectedModeId);

  const handleSelect = (modeId) => {
    onSelectMode(modeId);
    setIsOpen(false);
  };

  return (
    <div className="relative flex min-w-0 shrink-0">
      {isOpen && (
        <button
          type="button"
          aria-label="Close study mode menu"
          tabIndex={-1}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-10 cursor-default"
        />
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Choose study mode"
        className={`relative z-20 flex min-h-10 max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-400 ${
          isOpen
            ? "border-blue-400/40 bg-blue-500/10 text-blue-200"
            : "border-white/[0.08] bg-white/[0.035] text-slate-300 hover:border-white/[0.14] hover:bg-white/[0.07]"
        }`}
      >
        <span className="shrink-0 text-base leading-none">
          {selectedMode.icon}
        </span>

        <span className="truncate">
          {selectedMode.label}
        </span>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Choose a study mode"
          className="absolute bottom-full left-0 z-30 mb-2 max-h-[min(18rem,55vh)] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.1] bg-[#101522] py-2 shadow-2xl shadow-black/50"
        >
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Choose your approach
          </p>

          {STUDY_MODES.map((mode) => {
            const isSelected = mode.id === selectedModeId;

            return (
              <button
                key={mode.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(mode.id)}
                className={`flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-400 ${
                  isSelected
                    ? "bg-blue-500/10 text-blue-200"
                    : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-base">
                  {mode.icon}
                </span>

                <span className="min-w-0 flex-1 truncate font-medium">
                  {mode.label}
                </span>

                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-blue-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}