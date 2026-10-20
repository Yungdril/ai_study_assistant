import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./config";

export async function loadUserMessages(userId) {
  const q = query(collection(db, "messages"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const loaded = [];
  querySnapshot.forEach((doc) => loaded.push(doc.data()));
  return loaded;
}

export async function saveMessage(userId, { userMessage, aiReply }) {
  return addDoc(collection(db, "messages"), {
    userId,
    userMessage,
    aiReply,
    createdAt: Date.now(),
  });
}
