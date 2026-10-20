import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function LoginScreen() {
  const { signup, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div
      className="min-h-screen flex items-center justify-center text-white relative bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl w-full max-w-sm space-y-4">
        <h1 className="text-3xl font-bold text-center">SmartPal AI</h1>
        <p className="text-center text-white/60 text-sm">Your AI Study Assistant</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-xl bg-slate-900/80 border border-slate-700 outline-none focus:border-blue-500 text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login(email, password)}
          className="w-full p-3 rounded-xl bg-slate-900/80 border border-slate-700 outline-none focus:border-blue-500 text-sm"
        />
        <button
          onClick={() => signup(email, password)}
          className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-xl font-semibold text-sm"
        >
          Sign Up
        </button>
        <button
          onClick={() => login(email, password)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 transition p-3 rounded-xl font-semibold text-sm"
        >
          Login
        </button>
      </div>
    </div>
  );
}
