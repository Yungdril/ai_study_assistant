import { useRef, useState } from "react";
import { useConversations } from "../../hooks/useConversations";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import ConversationList from "./ConversationList";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageBubble from "./MessageBubble";
import ThinkingIndicator from "./ThinkingIndicator";
import StudyModeSelector from "./StudyModeSelector";
import {
  DEFAULT_STUDY_MODE_ID,
  composeModePrompt,
  getStudyMode,
} from "../../constants/studyModes";
 
export default function ChatPanel() {
  const { messages, pendingUserMessage, sending, sendMessage } =
    useConversations();
 
  const [message, setMessage] = useState("");
  const [studyModeId, setStudyModeId] = useState(DEFAULT_STUDY_MODE_ID);
  const [historyOpen, setHistoryOpen] = useState(false);
 
  const { isListening, startListening } = useVoiceInput(setMessage);
  const inputRef = useRef(null);
 
  const activeMode = getStudyMode(studyModeId);
  const isEmpty = messages.length === 0 && !pendingUserMessage;
  const canSend = message.trim().length > 0 && !sending;
 
  const handleSend = () => {
    const currentMessage = message.trim();
 
    if (!currentMessage || sending) return;
 
    setMessage("");
 
    const apiText = composeModePrompt(studyModeId, currentMessage);
    sendMessage(currentMessage, { apiText });
  };
 
  const handleSelectSuggestion = (modeId) => {
    setStudyModeId(modeId);
    inputRef.current?.focus();
  };
 
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
      {/* Mobile/tablet history drawer backdrop */}
      {historyOpen && (
        <button
          type="button"
          aria-label="Close conversation history"
          onClick={() => setHistoryOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}
 
      {/* Conversation history: drawer on smaller screens, sidebar on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[min(19rem,88vw)] overflow-hidden border-r border-white/[0.08] bg-[#0b0f19] shadow-2xl transition-transform duration-300 ease-out lg:relative lg:inset-auto lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 lg:shadow-none ${
          historyOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-4 py-3 lg:hidden">
            <span className="text-sm font-semibold text-slate-200">
              Chat history
            </span>
 
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              aria-label="Close history"
              className="rounded-lg px-3 py-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              ✕
            </button>
          </div>
 
          <ConversationList />
        </div>
      </div>
 
      {/* Main chat */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile/tablet chat toolbar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#080b14]/90 px-3 py-2.5 lg:hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
            aria-label="Open conversation history"
          >
            <span aria-hidden="true">☰</span>
            <span>History</span>
          </button>
 
          <span className="truncate text-xs text-slate-500">
            {activeMode.label ?? "Study mode"}
          </span>
        </div>
 
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain">
          {isEmpty ? (
            <ChatWelcomeScreen onSelectSuggestion={handleSelectSuggestion} />
          ) : (
            <div className="mx-auto w-full min-w-0 max-w-3xl space-y-5 p-3 sm:p-4 md:p-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
              ))}
 
              {pendingUserMessage && (
                <MessageBubble role="user" content={pendingUserMessage} pending />
              )}
 
              {sending && <ThinkingIndicator />}
            </div>
          )}
        </div>
 
        {/* Message composer */}
        <div className="shrink-0 border-t border-white/[0.07] bg-[#080b14]/95 p-3 backdrop-blur-xl sm:p-4">
          <div className="mx-auto w-full min-w-0 max-w-3xl space-y-2.5">
            <StudyModeSelector
              selectedModeId={studyModeId}
              onSelectMode={setStudyModeId}
            />
 
            <div className="flex min-w-0 items-end gap-2 rounded-2xl border border-white/[0.1] bg-[#101522] px-2.5 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-colors focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-violet-500/25 sm:px-3">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={activeMode.placeholder}
                aria-label="Message SmartPal"
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base text-slate-100 outline-none placeholder:text-slate-500 sm:text-sm"
              />
 
              <button
                type="button"
                onClick={startListening}
                title="Voice input"
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isListening
                    ? "bg-red-600 text-white shadow-[0_0_0_4px_rgba(239,68,68,0.15)]"
                    : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"
                }`}
              >
                🎤
              </button>
 
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                title="Send message"
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-sm transition-colors hover:from-blue-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
 
            <p className="hidden text-center text-[11px] text-slate-600 sm:block">
              SmartPal can make mistakes. Check important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
 
