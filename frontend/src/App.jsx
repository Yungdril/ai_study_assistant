import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

const API = "https://smartpal.onrender.com";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfSummary, setPdfSummary] = useState("");

  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [studyPlan, setStudyPlan] = useState("");

  const [quiz, setQuiz] = useState("");
  const [quizTopic, setQuizTopic] = useState("");

  const [flashcards, setFlashcards] = useState([]);

  const [isListening, setIsListening] = useState(false);

  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    if (loggedIn && user) {
      loadMessages();
    }
  }, [loggedIn, user]);

  const loadMessages = async () => {
    try {
      const q = query(
        collection(db, "messages"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const loadedMessages = [];
      querySnapshot.forEach((doc) => {
        loadedMessages.push({ sender: "user", text: doc.data().userMessage });
        loadedMessages.push({ sender: "ai", text: doc.data().aiReply });
      });
      setMessages(loadedMessages);
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

  const createNewChat = () => {
    const newChat = { id: Date.now(), title: "New Chat", messages: [] };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const currentMessage = message;
    const userMessage = { sender: "user", text: currentMessage };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    try {
      setLoading(true);

      const response = await axios.post(`${API}/chat`, { message: currentMessage });

      const aiMessage = { sender: "ai", text: response.data.reply };

      setMessages((prev) => [...prev, aiMessage]);

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: [...chat.messages, userMessage, aiMessage],
              title:
                chat.messages.length === 0
                  ? currentMessage.slice(0, 30)
                  : chat.title,
            };
          }
          return chat;
        })
      );

      await addDoc(collection(db, "messages"), {
        userId: user.uid,
        userMessage: currentMessage,
        aiReply: response.data.reply,
        createdAt: new Date(),
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const uploadPDF = async () => {
    if (!pdfFile) return alert("Please select a PDF first.");
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

  // Fixed: uses /quiz endpoint with topic text (matches backend)
  const generateQuiz = async () => {
    if (!quizTopic.trim()) return alert("Please enter a quiz topic.");
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
    if (!pdfFile) return alert("Please select a PDF first.");
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
      return alert("Please fill in all study plan fields.");
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
    if (!SpeechRecognition) return alert("Speech Recognition not supported");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      setMessage(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  // ── Login Screen ──────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="bg-slate-900 p-10 rounded-2xl w-[350px] space-y-4 border border-slate-800">
          <h1 className="text-3xl font-bold text-center">AI Study Assistant</h1>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
          />

          <button
            onClick={signup}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-xl font-semibold"
          >
            Sign Up
          </button>

          <button
            onClick={login}
            className="w-full bg-emerald-600 hover:bg-emerald-700 transition p-3 rounded-xl font-semibold"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // ── Main App ──────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">

      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-lg font-bold mb-3">📚 SmartPal</h1>
          <button
            onClick={createNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-2 rounded-xl font-semibold text-sm"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                setCurrentChatId(chat.id);
                setMessages(chat.messages);
                setActiveTab("chat");
              }}
              className={`p-3 rounded-xl cursor-pointer transition text-sm ${
                currentChatId === chat.id
                  ? "bg-slate-700"
                  : "hover:bg-slate-800"
              }`}
            >
              {chat.title}
            </div>
          ))}
          {chats.length === 0 && (
            <p className="text-slate-500 text-xs text-center mt-4">
              No chats yet. Start one!
            </p>
          )}
        </div>

        {/* Nav Tabs */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          {["chat", "pdf", "quiz", "flashcards", "planner"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              {tab === "chat" && "💬 "}
              {tab === "pdf" && "📄 "}
              {tab === "quiz" && "🧠 "}
              {tab === "flashcards" && "🃏 "}
              {tab === "planner" && "📅 "}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="border-b border-slate-800 p-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold capitalize">
            {activeTab === "chat" && "💬 Chat"}
            {activeTab === "pdf" && "📄 PDF Summary"}
            {activeTab === "quiz" && "🧠 Quiz Generator"}
            {activeTab === "flashcards" && "🃏 Flashcards"}
            {activeTab === "planner" && "📅 Study Planner"}
          </h2>
          <span className="text-sm text-slate-400">Powered by Groq AI</span>
        </div>

        {/* ── CHAT TAB ── */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-2xl px-5 py-4 rounded-2xl shadow-lg ${
                      msg.sender === "user" ? "bg-blue-600" : "bg-slate-800"
                    }`}
                  >
                    <div className="prose prose-invert max-w-none text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-slate-400 text-sm">AI is thinking...</div>
              )}
              {messages.length === 0 && (
                <div className="text-center text-slate-500 mt-20">
                  <p className="text-4xl mb-4">📚</p>
                  <p className="text-lg font-semibold">Ask me anything to study!</p>
                  <p className="text-sm mt-1">Start a new chat from the sidebar first.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex gap-3 flex-shrink-0">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask any study question..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition px-5 rounded-xl font-semibold text-sm"
              >
                Send
              </button>
              <button
                onClick={startListening}
                className={`px-4 rounded-xl font-semibold transition ${
                  isListening
                    ? "bg-red-600"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isListening ? "🔴" : "🎤"}
              </button>
            </div>
          </div>
        )}

        {/* ── PDF TAB ── */}
        {activeTab === "pdf" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-slate-300">Upload a PDF to summarize</h3>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                className="text-sm text-slate-300"
              />
              <button
                onClick={uploadPDF}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition px-5 py-2 rounded-xl text-sm font-semibold"
              >
                {loading ? "Summarizing..." : "Summarize PDF"}
              </button>
            </div>

            {pdfSummary && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-3">Summary</h3>
                <div className="prose prose-invert max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{pdfSummary}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── QUIZ TAB ── */}
        {activeTab === "quiz" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-slate-300">Enter a topic to generate a quiz</h3>
              <input
                type="text"
                placeholder="e.g. Photosynthesis, World War 2, Python loops..."
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm"
              />
              <button
                onClick={generateQuiz}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition px-5 py-2 rounded-xl text-sm font-semibold"
              >
                {loading ? "Generating..." : "Generate Quiz"}
              </button>
            </div>

            {quiz && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-3">Quiz</h3>
                <div className="prose prose-invert max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{quiz}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FLASHCARDS TAB ── */}
        {activeTab === "flashcards" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-slate-300">Upload a PDF to generate flashcards</h3>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                className="text-sm text-slate-300"
              />
              <button
                onClick={generateFlashcards}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition px-5 py-2 rounded-xl text-sm font-semibold"
              >
                {loading ? "Generating..." : "Generate Flashcards"}
              </button>
            </div>

            {flashcards.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {flashcards.map((card, index) => (
                  <div
                    key={index}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                  >
                    <h3 className="font-bold text-blue-400 mb-2 text-sm">Question</h3>
                    <p className="mb-4 text-sm">{card.question}</p>
                    <h3 className="font-bold text-emerald-400 mb-2 text-sm">Answer</h3>
                    <p className="text-sm">{card.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STUDY PLANNER TAB ── */}
        {activeTab === "planner" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-slate-300">Create a personalised study plan</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-blue-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Exam Date (e.g. June 30)"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-blue-500 text-sm"
                />
                <input
                  type="number"
                  placeholder="Hours Per Day"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                  className="bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <button
                onClick={generateStudyPlan}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition px-5 py-3 rounded-xl text-sm font-semibold"
              >
                {loading ? "Generating..." : "Generate Study Plan"}
              </button>
            </div>

            {studyPlan && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-3">Your Study Plan</h3>
                <div className="prose prose-invert max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{studyPlan}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;