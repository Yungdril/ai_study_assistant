import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./config";

export async function signUp(email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logIn(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}
