
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { ConversationProvider } from "./context/ConversationsContext";
import LoginScreen from "./components/auth/LoginScreen";
import AppShell from "./components/layout/AppShell";

function AppContent() {
  const { loggedIn, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080d1b] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <p className="text-sm text-slate-400">
            Restoring your session...
          </p>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginScreen />;
  }

  return (
    <ConversationProvider>
      <AppShell />
    </ConversationProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
