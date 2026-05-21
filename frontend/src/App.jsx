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

  const [activeTab, setActiveTab] =
    useState("chat");

  const [isListening, setIsListening] =
    useState(false);

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

      const querySnapshot =
        await getDocs(q);

      const loadedMessages = [];

      querySnapshot.forEach((doc) => {
        loadedMessages.push(doc.data());
      });

      setMessages(loadedMessages);
    } catch (error) {
      console.log(error);
    }
  };

  const signup = async () => {
    try {
      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      setUser(result.user);
      setLoggedIn(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const login = async () => {
    try {
      const result =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

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

      const response = await axios.post(
        `${API}/chat`,
        {
          message: currentMessage,
        }
      );

      const newMessage = {
        userMessage: currentMessage,
        aiReply: response.data.reply,
      };

      setMessages((prev) => [
        ...prev,
        newMessage,
      ]);

      await addDoc(
        collection(db, "messages"),
        {
          userId: user.uid,
          ...newMessage,
          createdAt: Date.now(),
        }
      );
    } catch (error) {
      console.log(error);
      alert("Message failed");
    } finally {
      setLoading(false);
    }
  };

  const uploadPDF = async () => {
    if (!pdfFile)
      return alert("Select a PDF");

    const formData = new FormData();

    formData.append("pdf", pdfFile);

    try {
      setLoading(true);

      const response = await axios.post(
        `${API}/upload-pdf`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setPdfSummary(response.data.summary);
    } catch (error) {
      console.log(error);
      alert("PDF upload failed");
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!quizTopic)
      return alert("Enter topic");

    try {
      setLoading(true);

      const response = await axios.post(
        `${API}/quiz`,
        {
          topic: quizTopic,
        }
      );

      setQuiz(response.data.quiz);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const generateFlashcards =
    async () => {
      if (!pdfFile)
        return alert("Select PDF");

      const formData = new FormData();

      formData.append("pdf", pdfFile);

      try {
        setLoading(true);

        const response =
          await axios.post(
            `${API}/generate-flashcards`,
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        setFlashcards(
          response.data.flashcards
        );
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

  const generateStudyPlan =
    async () => {
      try {
        setLoading(true);

        const response =
          await axios.post(
            `${API}/study-plan`,
            {
              subject,
              examDate,
              hoursPerDay,
            }
          );

        setStudyPlan(response.data.plan);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition)
      return alert(
        "Speech recognition unsupported"
      );

    const recognition =
      new SpeechRecognition();

    recognition.start();

    setIsListening(true);

    recognition.onresult = (event) => {
      setMessage(
        event.results[0][0].transcript
      );

      setIsListening(false);
    };

    recognition.onend = () =>
      setIsListening(false);
  };

  if (!loggedIn) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white relative bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/login-bg.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 p-10 rounded-3xl w-[350px] space-y-4">

          <h1 className="text-3xl font-bold text-center">
            SmartPal AI
          </h1>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700"
          />

          <button
            onClick={signup}
            className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-xl"
          >
            Sign Up
          </button>

          <button
            onClick={login}
            className="w-full bg-emerald-600 hover:bg-emerald-700 p-3 rounded-xl"
          >
            Login
          </button>

        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center text-white"
      style={{
        backgroundImage:
          "url('/ai-bg.jpg')",
      }}
    >
      <div className="min-h-screen bg-black/70 backdrop-blur-sm flex">

        {/* SIDEBAR */}
        <div className="w-72 hidden md:flex flex-col bg-white/10 backdrop-blur-md border-r border-white/10 p-5">

          <h1 className="text-3xl font-bold mb-8">
            SmartPal AI
          </h1>

          <div className="space-y-3">

            <button
              onClick={() =>
                setActiveTab("chat")
              }
              className="w-full bg-blue-600 p-3 rounded-xl"
            >
              💬 Chat
            </button>

            <button
              onClick={() =>
                setActiveTab("pdf")
              }
              className="w-full bg-emerald-600 p-3 rounded-xl"
            >
              📄 PDF
            </button>

            <button
              onClick={() =>
                setActiveTab("quiz")
              }
              className="w-full bg-purple-600 p-3 rounded-xl"
            >
              🧠 Quiz
            </button>

            <button
              onClick={() =>
                setActiveTab("flashcards")
              }
              className="w-full bg-orange-600 p-3 rounded-xl"
            >
              🃏 Flashcards
            </button>

            <button
              onClick={() =>
                setActiveTab("planner")
              }
              className="w-full bg-pink-600 p-3 rounded-xl"
            >
              📅 Planner
            </button>

          </div>

        </div>

        {/* MAIN */}
        <div className="flex-1 flex flex-col">

          <div className="p-5 border-b border-white/10 bg-white/5 backdrop-blur-md">
            <h2 className="text-2xl font-bold capitalize">
              {activeTab}
            </h2>
          </div>

          {/* CHAT */}
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {messages.map(
                  (msg, index) => (
                    <div
                      key={index}
                      className="space-y-4"
                    >
                      <div className="flex justify-end">
                        <div className="max-w-2xl bg-blue-600 p-4 rounded-2xl">
                          <ReactMarkdown
                            remarkPlugins={[
                              remarkGfm,
                            ]}
                          >
                            {
                              msg.userMessage
                            }
                          </ReactMarkdown>
                        </div>
                      </div>

                      <div className="flex justify-start">
                        <div className="max-w-2xl bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                          <ReactMarkdown
                            remarkPlugins={[
                              remarkGfm,
                            ]}
                          >
                            {msg.aiReply}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {loading && (
                  <div className="text-slate-300">
                    AI is thinking...
                  </div>
                )}

              </div>

              <div className="p-5 border-t border-white/10 bg-white/5 flex gap-3">

                <input
                  type="text"
                  value={message}
                  onChange={(e) =>
                    setMessage(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    sendMessage()
                  }
                  placeholder="Ask SmartPal..."
                  className="flex-1 bg-white/10 border border-white/10 rounded-xl p-4"
                />

                <button
                  onClick={sendMessage}
                  className="bg-blue-600 px-6 rounded-xl"
                >
                  Send
                </button>

                <button
                  onClick={startListening}
                  className={`px-4 rounded-xl ${
                    isListening
                      ? "bg-red-600"
                      : "bg-purple-600"
                  }`}
                >
                  🎤
                </button>

              </div>
            </>
          )}

          {/* PDF */}
          {activeTab === "pdf" && (
            <div className="p-6 space-y-4">

              <input
                type="file"
                accept=".pdf"
                onChange={(e) =>
                  setPdfFile(
                    e.target.files[0]
                  )
                }
              />

              <button
                onClick={uploadPDF}
                className="bg-emerald-600 px-5 py-3 rounded-xl"
              >
                Upload PDF
              </button>

              {pdfSummary && (
                <div className="bg-white/10 p-5 rounded-2xl">
                  <ReactMarkdown
                    remarkPlugins={[
                      remarkGfm,
                    ]}
                  >
                    {pdfSummary}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* QUIZ */}
          {activeTab === "quiz" && (
            <div className="p-6 space-y-4">

              <input
                type="text"
                value={quizTopic}
                onChange={(e) =>
                  setQuizTopic(
                    e.target.value
                  )
                }
                placeholder="Quiz topic..."
                className="w-full bg-white/10 p-4 rounded-xl"
              />

              <button
                onClick={generateQuiz}
                className="bg-blue-600 px-5 py-3 rounded-xl"
              >
                Generate Quiz
              </button>

              {quiz && (
                <div className="bg-white/10 p-5 rounded-2xl">
                  <ReactMarkdown
                    remarkPlugins={[
                      remarkGfm,
                    ]}
                  >
                    {quiz}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;