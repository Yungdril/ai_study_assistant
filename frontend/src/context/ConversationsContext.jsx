import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  subscribeToConversations,
  createConversation,
  renameConversation as renameConversationDoc,
  deleteConversationDoc,
} from "../firebase/conversations";
import {
  subscribeToMessages,
  appendTurn,
  deleteAllMessages,
} from "../firebase/messages";
import { sendChatMessage } from "../api/chatService";
import { generateTitleFromMessage } from "../utils/generateTitle";
import { MODEL } from "../constants/model";
import { ConversationsContext } from "./conversationsContextObject";

// Number of most-recent messages (across both roles) sent to the backend as
// context. A simple bounded-window strategy for Phase 1 — flagged as a spot
// to revisit once summarization/RAG-style memory is added later.
const MAX_HISTORY_MESSAGES = 20;

export function ConversationProvider({ children }) {
  const { user, loggedIn } = useAuth();

  const [conversations, setConversations] = useState([]);
  // null activeConversationId represents a draft: either the initial
  // landing state or right after "New Chat" — no Firestore doc exists yet.
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pendingUserMessage, setPendingUserMessage] = useState(null);
  const [sending, setSending] = useState(false);

  // Subscribe to the user's conversation list for the sidebar. Logging out
  // already clears local state via resetConversations() (called from
  // Sidebar's sign-out handler), so this effect only needs to subscribe
  // when there's someone to subscribe for — it doesn't also need to reset
  // state on the "logged out" branch.
  useEffect(() => {
    if (!(loggedIn && user)) return;
    const unsubscribe = subscribeToConversations(
      user.uid,
      setConversations,
      (error) => console.log(error)
    );
    return unsubscribe;
  }, [loggedIn, user]);

  // Subscribe to the active conversation's messages. Switching conversations
  // (startNewConversation / selectConversation, below) already clears
  // `messages` synchronously at the point of switching, so this effect only
  // needs to subscribe when there's an active conversation to follow.
  useEffect(() => {
    if (!activeConversationId) return;
    const unsubscribe = subscribeToMessages(
      activeConversationId,
      setMessages,
      (error) => console.log(error)
    );
    return unsubscribe;
  }, [activeConversationId]);

  const startNewConversation = () => {
    setMessages([]);
    setActiveConversationId(null);
  };

  const selectConversation = (conversationId) => {
    setMessages([]);
    setActiveConversationId(conversationId);
  };

  const renameConversation = async (conversationId, newTitle) => {
    try {
      await renameConversationDoc(conversationId, newTitle);
    } catch (error) {
      console.log(error);
      alert("Couldn't rename conversation. Try again.");
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      await deleteAllMessages(conversationId);
      await deleteConversationDoc(conversationId);
      if (conversationId === activeConversationId) {
        startNewConversation();
      }
    } catch (error) {
      console.log(error);
      alert("Couldn't delete conversation. Try again.");
    }
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setPendingUserMessage(trimmed);
    setSending(true);

    try {
      let conversationId = activeConversationId;

      if (!conversationId) {
        conversationId = await createConversation(user.uid, {
          title: generateTitleFromMessage(trimmed),
          model: MODEL,
        });
        setActiveConversationId(conversationId);
      }

      const recentHistory = messages
        .slice(-MAX_HISTORY_MESSAGES)
        .map(({ role, content }) => ({ role, content }));

      const historyForApi = [
        ...recentHistory,
        { role: "user", content: trimmed },
      ];
      console.log(
  "HISTORY FOR API:",
  JSON.stringify(historyForApi, null, 2)
);

      const aiReply = await sendChatMessage(historyForApi);

      await appendTurn(conversationId, { userText: trimmed, aiReply });
    } catch (error) {
      console.log(error);
      alert(
        "Message failed. Backend may be waking up, try again in 30 seconds."
      );
    } finally {
      setSending(false);
      setPendingUserMessage(null);
    }
  };

  const resetConversations = () => {
    setConversations([]);
    setActiveConversationId(null);
    setMessages([]);
    setPendingUserMessage(null);
  };

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        activeConversationId,
        messages,
        pendingUserMessage,
        sending,
        startNewConversation,
        selectConversation,
        renameConversation,
        deleteConversation,
        sendMessage,
        resetConversations,
      }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}
