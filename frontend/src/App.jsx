import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const API = "https://smartpal.onrender.com";

const tabs = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "pdf", label: "PDF", icon: "📄" },
  { id: "quiz", label: "Quiz", icon: "🧠" },
  { id: "flashcards", label: "Cards", icon: "🃏" },
  { id: "planner", label: "Planner", icon: "📅" },
];

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfSummary, setPdfSummary] = useState("");

  const [quiz, setQuiz] = useState("");
  const [quizTopic, setQuizTopic] = useState("");

  const [flashcards, setFlashcards] = useState([]);

  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [studyPlan, setStudyPlan] = useState("");

  const [activeTab, setActiveTab] = useState("chat");
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loggedIn && user) loadMessages();
  }, [loggedIn, user]);

  const loadMessages = async () => {
    try {
      const q = query(
        collection(db, "messages"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const loaded = [];
      querySnapshot.forEach((doc) => loaded.push(doc.data()));
      setMessages(loaded);
    } catch (error) {
      console.log(error);
    }
  };

  const signup = async () => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      setLoggedIn(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const login = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      setLoggedIn(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const currentMessage = message;
    setMessage("");
    try {
      setLoading(true);
      const response = await axios.post(`${API}/chat`, { message: currentMessage });
      const newMessage = {
        userMessage: currentMessage,
        aiReply: response.data.reply,
      };
      setMessages((prev) => [...prev, newMessage]);
      await addDoc(collection(db, "messages"), {
        userId: user.uid,
        ...newMessage,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.log(error);
      alert("Message failed. Backend may be waking up, try again in 30 seconds.");
    } finally {
      setLoading(false);
    }
  };

  const uploadPDF = async () => {
    if (!pdfFile) return alert("Select a PDF first");
    const formData = new FormData();
    formData.append("pdf", pdfFile);
    try {
      setLoading(true);
      const response = await axios.post(`${API}/upload-pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPdfSummary(response.data.summary);
    } catch (error) {
      console.log(error);
      alert("PDF upload failed");
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!quizTopic) return alert("Enter a topic first");
    try {
      setLoading(true);
      const response = await axios.post(`${API}/quiz`, { topic: quizTopic });
      setQuiz(response.data.quiz);
    } catch (error) {
      console.log(error);
      alert("Quiz generation failed");
    } finally {
      setLoading(false);
    }
  };

  const generateFlashcards = async () => {
    if (!pdfFile) return alert("Select a PDF first");
    const formData = new FormData();
    formData.append("pdf", pdfFile);
    try {
      setLoading(true);
      const response = await axios.post(`${API}/generate-flashcards`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFlashcards(response.data.flashcards);
    } catch (error) {
      console.log(error);
      alert("Flashcard generation failed");
    } finally {
      setLoading(false);
    }
  };

  const generateStudyPlan = async () => {
    if (!subject || !examDate || !hoursPerDay)
      return alert("Fill in all fields");
    try {
      setLoading(true);
      const response = await axios.post(`${API}/study-plan`, {
        subject,
        examDate,
        hoursPerDay,
      });
      setStudyPlan(response.data.plan);
    } catch (error) {
      console.log(error);
      alert("Study plan failed");
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported");
    const recognition = new SpeechRecognition();
    recognition.start();
    setIsListening(true);
    recognition.onresult = (event) => {
      setMessage(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
  };

  // ── LOGIN SCREEN ─────────────────────────────────────────────
  if (!loggedIn) {
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
            onKeyDown={(e) => e.key === "Enter" && login()}
            className="w-full p-3 rounded-xl bg-slate-900/80 border border-slate-700 outline-none focus:border-blue-500 text-sm"
          />
          <button
            onClick={signup}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-xl font-semibold text-sm"
          >
            Sign Up
          </button>
          <button
            onClick={login}
            className="w-full bg-emerald-600 hover:bg-emerald-700 transition p-3 rounded-xl font-semibold text-sm"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN APP ─────────────────────────────────────────────────
  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">

      {/* Top Header (mobile) */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 md:hidden flex-shrink-0">
        <h1 className="text-lg font-bold">📚 SmartPal AI</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-2xl"
        >
          ☰
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — desktop always visible, mobile overlay */}
        <div
          className={`
            fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity
            ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
          `}
          onClick={() => setSidebarOpen(false)}
        />

        <div
          className={`
            fixed top-0 left-0 h-full z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-5 transition-transform duration-300
            md:static md:translate-x-0 md:z-auto md:flex
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <h1 className="text-2xl font-bold mb-8 hidden md:block">📚 SmartPal AI</h1>

          <div className="space-y-2 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition text-sm ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setLoggedIn(false);
              setUser(null);
              setMessages([]);
            }}
            className="mt-4 text-slate-500 hover:text-red-400 text-sm transition"
          >
            Sign Out
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tab Header */}
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-900 flex-shrink-0 hidden md:block">
            <h2 className="text-xl font-bold">
              {tabs.find((t) => t.id === activeTab)?.icon}{" "}
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
          </div>

          {/* ── CHAT ── */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-slate-500 mt-20">
                    <p className="text-4xl mb-3">💬</p>
                    <p className="font-semibold">Ask SmartPal anything!</p>
                    <p className="text-xs mt-1">Maths, Science, History — anything study related</p>
                  </div>
                )}
                {messages.map((msg, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-end">
                      <div className="max-w-xs md:max-w-2xl bg-blue-600 px-4 py-3 rounded-2xl text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.userMessage}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-xs md:max-w-2xl bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.aiReply}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 px-4 py-3 rounded-2xl text-sm text-slate-400">
                      AI is thinking...
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask anything..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition px-4 py-3 rounded-xl text-sm font-semibold"
                >
                  Send
                </button>
                <button
                  onClick={startListening}
                  className={`px-3 py-3 rounded-xl transition ${
                    isListening ? "bg-red-600" : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  🎤
                </button>
              </div>
            </div>
          )}

          {/* ── PDF ── */}
          {activeTab === "pdf" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-slate-300 text-sm">Upload a PDF to get a summary</h3>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="text-sm text-slate-300 w-full"
                />
                <button
                  onClick={uploadPDF}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition py-3 rounded-xl text-sm font-semibold"
                >
                  {loading ? "Summarising..." : "Summarise PDF"}
                </button>
              </div>
              {pdfSummary && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="font-bold mb-3">Summary</h3>
                  <div className="prose prose-invert max-w-none text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{pdfSummary}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── QUIZ ── */}
          {activeTab === "quiz" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-slate-300 text-sm">Enter a topic to generate a quiz</h3>
                <input
                  type="text"
                  placeholder="e.g. Photosynthesis, World War 2..."
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateQuiz()}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm"
                />
                <button
                  onClick={generateQuiz}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition py-3 rounded-xl text-sm font-semibold"
                >
                  {loading ? "Generating..." : "Generate Quiz"}
                </button>
              </div>
              {quiz && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="font-bold mb-3">Quiz</h3>
                  <div className="prose prose-invert max-w-none text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{quiz}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FLASHCARDS ── */}
          {activeTab === "flashcards" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-slate-300 text-sm">Upload a PDF to generate flashcards</h3>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="text-sm text-slate-300 w-full"
                />
                <button
                  onClick={generateFlashcards}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition py-3 rounded-xl text-sm font-semibold"
                >
                  {loading ? "Generating..." : "Generate Flashcards"}
                </button>
              </div>
              {flashcards.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flashcards.map((card, index) => (
                    <div
                      key={index}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                    >
                      <p className="text-blue-400 font-bold text-xs mb-1">QUESTION</p>
                      <p className="text-sm mb-4">{card.question}</p>
                      <p className="text-emerald-400 font-bold text-xs mb-1">ANSWER</p>
                      <p className="text-sm">{card.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PLANNER ── */}
          {activeTab === "planner" && (
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
                  <div className="prose prose-invert max-w-none text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{studyPlan}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Bottom Nav (mobile only) */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-900 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs transition ${
              activeTab === tab.id
                ? "text-blue-400"
                : "text-slate-500"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}

export default App;