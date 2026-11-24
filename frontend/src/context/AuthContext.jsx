import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { signUp, logIn } from "../firebase/auth";
import { auth } from "../firebase/config";
import { AuthContext } from "./authContextObject";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoggedIn(Boolean(firebaseUser));
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

const signup = (email, password) => signUp(email, password);

const login = (email, password) => logIn(email, password);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loggedIn, authLoading, signup, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}