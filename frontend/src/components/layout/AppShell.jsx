
import { useState } from "react";
import Sidebar from "./Sidebar";
import MobileTopBar from "./MobileTopBar";
import TabHeader from "./TabHeader";
import BottomNav from "./BottomNav";
import ChatPanel from "../chat/ChatPanel";
import PdfSummaryPanel from "../pdf/PdfSummaryPanel";
import QuizPanel from "../quiz/QuizPanel";
import FlashcardsPanel from "../flashcards/FlashcardsPanel";
import PlannerPanel from "../planner/PlannerPanel";

export default function AppShell() {
  const [activeTab, setActiveTab] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden bg-[#080b14] text-slate-100">
      <MobileTopBar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <TabHeader activeTab={activeTab} />

          {activeTab === "chat" && <ChatPanel />}
          {activeTab === "pdf" && <PdfSummaryPanel />}
          {activeTab === "quiz" && <QuizPanel />}
          {activeTab === "flashcards" && <FlashcardsPanel />}
          {activeTab === "planner" && <PlannerPanel />}
        </main>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
