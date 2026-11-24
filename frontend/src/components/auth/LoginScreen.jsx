import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { resetPassword } from "../../firebase/auth";

function SmartPalLogo({ className = "h-12 w-12" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="smartpal-gradient" x1="8" y1="8" x2="56" y2="56">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="19" fill="#151D38" />
      <path
        d="M13 23.5C20 20 26 21 32 25V47C26 43 20 42 13 45V23.5Z"
        fill="url(#smartpal-gradient)"
      />
      <path
        d="M51 23.5C44 20 38 21 32 25V47C38 43 44 42 51 45V23.5Z"
        fill="url(#smartpal-gradient)"
        opacity=".75"
      />
      <path d="M32 25V47" stroke="#E0F2FE" strokeWidth="2" />
      <path
        d="M43 10L45.5 16.5L52 19L45.5 21.5L43 28L40.5 21.5L34 19L40.5 16.5L43 10Z"
        fill="#67E8F9"
      />
      <circle cx="19" cy="15" r="2" fill="#A5B4FC" />
    </svg>
  );
}

function getFriendlyError(error, mode) {
  const code = error?.code;

  const messages = {
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-not-found": "No account was found with that email. You can create one below.",
    "auth/wrong-password": "That password doesn't match this account.",
    "auth/invalid-credential": "Your email or password is incorrect. Please try again.",
    "auth/email-already-in-use": "An account already exists with this email. Try signing in.",
    "auth/weak-password": "Choose a password with at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a little and try again.",
    "auth/network-request-failed": "Network error. Check your internet connection and retry.",
    "auth/user-disabled": "This account has been disabled. Please contact support.",
    "auth/operation-not-allowed": "This sign-in method is not enabled yet.",
  };

  return (
    messages[code] ||
    (mode === "signup"
      ? "We couldn't create your account. Please check your details and try again."
      : "We couldn't sign you in. Check your details and try again.")
  );
}

export default function LoginScreen() {
  const { signup, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [success, setSuccess] = useState("");

  const isSignup = mode === "signup";

function changeMode(nextMode) {
  setMode(nextMode);
  setError("");
  setSuccess("");
  setPassword("");
}

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    if (isSignup && password.length < 6) {
      setError("Choose a password with at least 6 characters.");
      return;
    }

    setBusy(true);

    try {
      if (isSignup) {
        await signup(cleanEmail, password);
      } else {
        await login(cleanEmail, password);
      }
    } catch (authError) {
      setError(getFriendlyError(authError, mode));
    } finally {
      setBusy(false);
    }
  }
async function handlePasswordReset() {
  const cleanEmail = email.trim();

  setError("");
  setSuccess("");

  if (!cleanEmail) {
    setError("Enter your email address first.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    setError("Enter a valid email address.");
    return;
  }

  setResetBusy(true);

  try {
    await resetPassword(cleanEmail);

    setSuccess(
      "If an account exists for this email, a password reset link will be sent. Check your inbox."
    );
  } catch (resetError) {
    const messages = {
      "auth/invalid-email": "Enter a valid email address.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "auth/network-request-failed": "Network error. Check your internet connection.",
    };

    setError(
      messages[resetError?.code] ||
      "We couldn't send the reset email. Please try again."
    );
  } finally {
    setResetBusy(false);
  }
}
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080D1B] px-4 py-8 text-white sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0E1528] shadow-2xl shadow-black/30 lg:min-h-[620px] lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-[#111D3A] to-[#0B2638] p-10 lg:flex xl:p-14">
          <div
            aria-hidden="true"
            className="absolute -right-24 top-24 h-64 w-64 rounded-full border border-cyan-300/10"
          />
          <div
            aria-hidden="true"
            className="absolute -right-12 top-36 h-40 w-40 rounded-full border border-indigo-300/20"
          />

          <div className="relative flex items-center gap-3">
            <SmartPalLogo />
            <div>
              <p className="text-lg font-bold tracking-tight">SmartPal</p>
              <p className="text-xs text-slate-400">Your AI study companion</p>
            </div>
          </div>

          <div className="relative max-w-md py-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 text-xs font-medium text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Your next learning breakthrough starts here
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Learn smarter.
              <span className="mt-2 block bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Go further.
              </span>
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-slate-300">
              Turn difficult topics into clear explanations, practice questions,
              and study sessions that work for you.
            </p>

            <div className="mt-9 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold text-white">Understand</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Break down complex ideas
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold text-white">Practice</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Build confidence as you learn
                </p>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-slate-500">
            A little progress every day adds up.
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <SmartPalLogo className="h-11 w-11" />
              <div>
                <p className="text-lg font-bold">SmartPal</p>
                <p className="text-xs text-slate-400">Your AI study companion</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm font-medium text-cyan-300">
                YOUR LEARNING JOURNEY
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                {isSignup ? "Create your account" : "Welcome back"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {isSignup
                  ? "Create an account and make every study session count."
                  : "Sign in to pick up where your learning left off."}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => changeMode("login")}
                aria-pressed={!isSignup}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  !isSignup
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => changeMode("signup")}
                aria-pressed={isSignup}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isSignup
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="smartpal-email"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Email address
                </label>
                <input
                  id="smartpal-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck="false"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-[#080D1B]/80 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="smartpal-password"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="smartpal-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder={isSignup ? "At least 6 characters" : "Enter your password"}
                    className="w-full rounded-xl border border-white/10 bg-[#080D1B]/80 px-4 py-3.5 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-3 my-auto rounded-md px-2 text-xs font-medium text-slate-400 transition hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
{!isSignup && (
  <div className="flex justify-end -mt-2">
    <button
      type="button"
      onClick={handlePasswordReset}
      disabled={busy || resetBusy}
      className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200 disabled:opacity-50"
    >
      {resetBusy ? "Sending reset link..." : "Forgot password?"}
    </button>
  </div>
)}
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm leading-5 text-rose-200"
                >
                  {error}
                </div>
              )}
{success && (
  <div
    role="status"
    aria-live="polite"
    className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-5 text-emerald-200"
  >
    {success}
  </div>
)}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:from-indigo-400 hover:to-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-400/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy && (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                )}
                {busy
                  ? isSignup
                    ? "Creating account..."
                    : "Signing in..."
                  : isSignup
                    ? "Create your account"
                    : "Sign in to SmartPal"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              By continuing, you agree to use SmartPal responsibly as a learning
              assistant.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
