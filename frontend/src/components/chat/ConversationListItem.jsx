import { useState } from "react";

export default function ConversationListItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);

  const commitRename = () => {
    setIsEditing(false);
    if (draftTitle.trim() && draftTitle.trim() !== conversation.title) {
      onRename(draftTitle);
    } else {
      setDraftTitle(conversation.title);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${conversation.title}"? This can't be undone.`)) {
      onDelete();
    }
  };

  if (isEditing) {
    return (
      <div className="px-2.5 py-1">
        <input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setDraftTitle(conversation.title);
              setIsEditing(false);
            }
          }}
          className="w-full bg-slate-900 border border-blue-500/60 rounded-lg px-2.5 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-blue-500/40"
        />
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-1 px-3 py-2.5 rounded-lg cursor-pointer text-xs transition-colors ${
        isActive
          ? "bg-blue-600/15 border border-blue-500/30 text-slate-100"
          : "border border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200"
      }`}
    >
      <span className="flex-1 truncate">{conversation.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:text-blue-400 px-1"
        title="Rename"
      >
        ✏️
      </button>
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:text-red-400 px-1"
        title="Delete"
      >
        🗑️
      </button>
    </div>
  );
}
