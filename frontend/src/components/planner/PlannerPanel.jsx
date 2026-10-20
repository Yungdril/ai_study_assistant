import { useState } from "react";
import { generateStudyPlan as generateStudyPlanRequest } from "../../api/plannerService";
import PlannerPlan from "./PlannerPlan";

export default function PlannerPanel() {
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [studyPlan, setStudyPlan] = useState("");
  const [loading, setLoading] = useState(false);

  const generateStudyPlan = async () => {
    if (!subject || !examDate || !hoursPerDay) return alert("Fill in all fields");
    try {
      setLoading(true);
      const plan = await generateStudyPlanRequest(subject, examDate, hoursPerDay);
      setStudyPlan(plan);
    } catch (error) {
      console.log(error);
      alert("Study plan failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-slate-300 text-sm">Create a personalised study plan</h3>
        <input
          type="text"
          placeholder="Subject (e.g. Biology)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm"
        />
        <input
          type="text"
          placeholder="Exam Date (e.g. June 30, 2025)"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm"
        />
        <input
          type="number"
          placeholder="Hours per day (e.g. 3)"
          value={hoursPerDay}
          onChange={(e) => setHoursPerDay(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm"
        />
        <button
          onClick={generateStudyPlan}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition py-3 rounded-xl text-sm font-semibold"
        >
          {loading ? "Generating..." : "Generate Study Plan"}
        </button>
      </div>
     {studyPlan && (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
    <h3 className="font-bold mb-3">Your Study Plan</h3>

    <div className="min-w-0 text-sm">
      <PlannerPlan>{studyPlan}</PlannerPlan>
    </div>
  </div>
)}
    </div>
  );
}
