import { useContext } from "react";
import { ConversationsContext } from "../context/conversationsContextObject";

export function useConversations() {
  const ctx = useContext(ConversationsContext);
  if (!ctx) {
    throw new Error(
      "useConversations must be used within a ConversationProvider"
    );
  }
  return ctx;
}
