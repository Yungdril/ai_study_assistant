import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./config";

const CONVERSATIONS_COLLECTION = "conversations";

/**
 * Subscribes to a user's conversations, ordered by most recently updated.
 * Returns an unsubscribe function.
 *
 * Note: this query (userId == and orderBy updatedAt) needs a composite
 * Firestore index. Firestore will log a console link to auto-create it
 * the first time this runs against a real project.
 */
export function subscribeToConversations(userId, onChange, onError) {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onChange(conversations);
    },
    onError
  );
}

/**
 * Creates a new conversation document. Used on the first sent message of a
 * draft conversation (lazy creation) — not called when the user just clicks
 * "New Chat".
 */
export async function createConversation(userId, { title, model }) {
  const now = Date.now();
  const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), {
    userId,
    title,
    model,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function renameConversation(conversationId, newTitle) {
  const trimmed = newTitle.trim();
  if (!trimmed) return;
  await updateDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId), {
    title: trimmed,
    updatedAt: Date.now(),
  });
}

export async function touchConversation(conversationId) {
  await updateDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId), {
    updatedAt: Date.now(),
  });
}

export async function deleteConversationDoc(conversationId) {
  await deleteDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId));
}

export { CONVERSATIONS_COLLECTION };
