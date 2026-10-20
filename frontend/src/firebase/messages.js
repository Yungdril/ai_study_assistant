import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import { CONVERSATIONS_COLLECTION } from "./conversations";

function messagesRef(conversationId) {
  return collection(db, CONVERSATIONS_COLLECTION, conversationId, "messages");
}

/**
 * Subscribes to a conversation's messages, ordered oldest-first.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(conversationId, onChange, onError) {
  const q = query(messagesRef(conversationId), orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onChange(messages);
    },
    onError
  );
}

/**
 * Appends both sides of a turn (user message + assistant reply) as two
 * separate message documents, role-tagged, so history can be sent straight
 * through to the AI provider without reshaping. Also bumps the parent
 * conversation's `updatedAt` in the same atomic batch, so the sidebar's
 * most-recently-active ordering stays consistent with a single write.
 */
export async function appendTurn(conversationId, { userText, aiReply }) {
  const batch = writeBatch(db);
  const ref = messagesRef(conversationId);
  const now = Date.now();

  const userDocRef = doc(ref);
  batch.set(userDocRef, {
    role: "user",
    content: userText,
    createdAt: now,
  });

  const aiDocRef = doc(ref);
  batch.set(aiDocRef, {
    role: "assistant",
    content: aiReply,
    createdAt: now + 1, // keep assistant strictly after user in orderBy
  });

  const conversationDocRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  batch.update(conversationDocRef, { updatedAt: now });

  await batch.commit();
}

/**
 * Deletes every message document under a conversation. Firestore doesn't
 * cascade-delete subcollections when the parent doc is deleted, so this
 * must be called explicitly before/alongside deleting the conversation doc.
 */
export async function deleteAllMessages(conversationId) {
  const snapshot = await getDocs(messagesRef(conversationId));
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
}
