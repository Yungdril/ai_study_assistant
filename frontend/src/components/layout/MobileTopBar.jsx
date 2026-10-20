export default function MobileTopBar({ sidebarOpen, setSidebarOpen }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 md:hidden flex-shrink-0">
      <h1 className="text-lg font-bold">📚 SmartPal AI</h1>
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl">
        ☰
      </button>
    </div>
  );
}
