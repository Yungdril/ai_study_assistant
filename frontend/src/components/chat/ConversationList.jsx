
import { useConversations } from "../../hooks/useConversations";
import ConversationListItem from "./ConversationListItem";

export default function ConversationList({ className = "" }) {
  const {
    conversations,
    activeConversationId,
    startNewConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
  } = useConversations();

  return (
    <aside
      className={`flex w-full min-w-0 shrink-0 flex-col border-b border-white/[0.07] bg-[#0b0f19] lg:h-full lg:w-64 lg:border-b-0 lg:border-r ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-3 pb-2 pt-3 sm:px-4 lg:pt-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-200">
            Conversations
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {conversations.length}{" "}
            {conversations.length === 1 ? "chat" : "chats"}
          </p>
        </div>

        <button
          type="button"
          onClick={startNewConversation}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 transition hover:border-blue-400/40 hover:bg-blue-500/15"
        >
          <span className="text-base leading-none">+</span>
          New chat
        </button>
      </div>

      <div className="flex max-h-32 min-h-0 flex-col gap-0.5 overflow-y-auto overscroll-y-contain px-2 pb-2 sm:max-h-36 lg:max-h-none lg:flex-1 lg:pb-3">
        {conversations.length === 0 && (
          <p className="px-3 py-4 text-center text-xs leading-relaxed text-slate-500">
            No conversations yet — start a new chat above.
          </p>
        )}

        {conversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onSelect={() => selectConversation(conversation.id)}
            onRename={(newTitle) =>
              renameConversation(conversation.id, newTitle)
            }
            onDelete={() => deleteConversation(conversation.id)}
          />
        ))}
      </div>
    </aside>
  );
}
