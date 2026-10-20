import { tabs } from "../../constants/tabs";

export default function TabHeader({ activeTab }) {
  const current = tabs.find((t) => t.id === activeTab);
  return (
    <div className="px-5 py-4 border-b border-slate-800 bg-slate-900 flex-shrink-0 hidden lg:block">
      <h2 className="text-xl font-bold">
        {current?.icon} {current?.label}
      </h2>
    </div>
  );
}
