import ChatMarkdown from "./ChatMarkdown";

/**
 * Renders one message. Deliberately avoids heavy "pill" bubble styling —
 * subtle borders/backgrounds and a small role label create the
 * user/assistant distinction instead of saturated rounded-full colors.
 */
export default function MessageBubble({ role, content, pending = false }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] md:max-w-2xl lg:max-w-3xl ${pending ? "opacity-70" : ""}`}>
        <p
          className={`text-[11px] font-medium uppercase tracking-wide mb-1 px-1 ${
            isUser ? "text-blue-400/80 text-right" : "text-slate-500"
          }`}
        >
          {isUser ? "You" : "SmartPal"}
        </p>
        <div
          className={`rounded-xl px-4 py-3 text-[15px] ${
            isUser
              ? "bg-blue-600/15 border border-blue-500/30 text-slate-100"
              : "bg-slate-900/60 border border-slate-800 text-slate-200"
          }`}
        >
          <ChatMarkdown>{content}</ChatMarkdown>
        </div>
      </div>
    </div>
  );
}
