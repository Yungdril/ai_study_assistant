import { initializeApp } from "firebase/app";

import {
  getAuth,
} from "firebase/auth";

import {
  getFirestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0tBDHc-mvopKxMpbO-rF_WMpMSSErq-U",
  authDomain: "ai-study-assistant-75ffb.firebaseapp.com",
  projectId: "ai-study-assistant-75ffb",
  storageBucket: "ai-study-assistant-75ffb.firebasestorage.app",
  messagingSenderId: "1077030335491",
  appId: "1:1077030335491:web:008f7697a9457c1e6e4a36",
  measurementId: "G-RGEMQDD6ZP"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);






