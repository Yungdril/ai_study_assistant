
import { tabs } from "../../constants/tabs";
import { useAuth } from "../../hooks/useAuth";
import { useConversations } from "../../hooks/useConversations";

export default function Sidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
}) {
  const { logout } = useAuth();
  const { resetConversations } = useConversations();

  const handleSignOut = () => {
    logout();
    resetConversations();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        tabIndex={sidebarOpen ? 0 : -1}
        className={`fixed inset-0 z-40 bg-black/70 transition-opacity lg:hidden ${
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        id="smartpal-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] min-w-0 flex-col border-r border-white/[0.07] bg-[#0c101c] p-4 transition-transform duration-300 lg:static lg:z-auto lg:w-60 lg:shrink-0 lg:translate-x-0 lg:p-5 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab("chat");
            setSidebarOpen(false);
          }}
          className="mb-8 flex items-center gap-3 rounded-xl px-2 py-3 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl shadow-lg shadow-blue-950/40">
            ✦
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold tracking-tight text-white">
              SmartPal
            </span>
            <span className="block text-xs text-slate-500">
              Your AI study partner
            </span>
          </span>
        </button>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Workspace
        </p>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-blue-400/15 bg-blue-500/10 text-blue-300"
                    : "border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                }`}
              >
                <span className="flex w-6 shrink-0 items-center justify-center text-lg">
                  {tab.icon}
                </span>
                <span className="truncate">{tab.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-white/[0.07] pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <span className="w-6 text-center">↪</span>
            Sign out
          </button>
          <p className="mt-3 px-3 text-[10px] text-slate-600">
            SmartPal 2.0
          </p>
        </div>
      </aside>
    </>
  );
}
