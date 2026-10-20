import { tabs } from "../../constants/tabs";

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <div className="md:hidden flex border-t border-slate-800 bg-slate-900 flex-shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs transition ${
            activeTab === tab.id ? "text-blue-400" : "text-slate-500"
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
