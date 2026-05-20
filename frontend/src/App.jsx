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
} from "firebase/firestore";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] =
    useState(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);

  const [pdfFile, setPdfFile] = useState(null);

  const [pdfSummary, setPdfSummary] =
    useState("");

    const [subject, setSubject] = useState("");

const [examDate, setExamDate] =
  useState("");

const [hoursPerDay, setHoursPerDay] =
  useState("");

const [studyPlan, setStudyPlan] =
  useState("");

  const [quiz, setQuiz] = useState("");

  const [flashcards, setFlashcards] =
    useState([]);
 
     const [isListening, setIsListening] =
  useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "messages")
      );

      const loadedMessages = [];

      querySnapshot.forEach((doc) => {
        loadedMessages.push({
          sender: "user",
          text: doc.data().userMessage,
        });

        loadedMessages.push({
          sender: "ai",
          text: doc.data().aiReply,
        });
      });

      setMessages(loadedMessages);
    } catch (error) {
      console.log(error);
    }
  };

  const signup = async () => {
    try {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      setLoggedIn(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const login = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      setLoggedIn(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
    };

    setChats((prev) => [newChat, ...prev]);

    setCurrentChatId(newChat.id);

    setMessages([]);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const currentMessage = message;

    const userMessage = {
      sender: "user",
      text: currentMessage,
    };

    setMessages((prev) => [...prev, userMessage]);

    setMessage("");

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/chat",
        {
          message: currentMessage,
        }
      );

      const aiMessage = {
        sender: "ai",
        text: response.data.reply,
      };

      setMessages((prev) => [...prev, aiMessage]);

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: [
                ...chat.messages,
                userMessage,
                aiMessage,
              ],
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
    if (!pdfFile) return;

    const formData = new FormData();

    formData.append("pdf", pdfFile);

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/upload-pdf",
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
    if (!pdfFile) return;

    const formData = new FormData();

    formData.append("pdf", pdfFile);

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/generate-quiz",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setQuiz(response.data.quiz);
    } catch (error) {
      console.log(error);

      alert("Quiz generation failed");
    } finally {
      setLoading(false);
    }
  };

  const generateFlashcards = async () => {
    if (!pdfFile) return;

    const formData = new FormData();

    formData.append("pdf", pdfFile);

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/generate-flashcards",
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

      alert(
        "Flashcard generation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="bg-slate-900 p-10 rounded-2xl w-[350px] space-y-4">
          <h1 className="text-3xl font-bold text-center">
            AI Study Assistant
          </h1>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700"
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
const startListening = () => {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert(
      "Speech Recognition not supported"
    );
    return;
  }

  const recognition =
    new SpeechRecognition();

  recognition.lang = "en-US";

  recognition.start();

  setIsListening(true);

  recognition.onresult = (event) => {
    const transcript =
      event.results[0][0].transcript;

    setMessage(transcript);

    setIsListening(false);
  };

  recognition.onerror = () => {
    setIsListening(false);
  };

  recognition.onend = () => {
    setIsListening(false);
  };
};

  <div className="mx-4 mt-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">

  <h2 className="text-2xl font-bold mb-4">
    AI Study Planner
  </h2>

  <div className="grid md:grid-cols-3 gap-3">

    <input
      type="text"
      placeholder="Subject"
      value={subject}
      onChange={(e) =>
        setSubject(e.target.value)
      }
      className="bg-slate-800 p-3 rounded-xl"
    />

    <input
      type="text"
      placeholder="Exam Date"
      value={examDate}
      onChange={(e) =>
        setExamDate(e.target.value)
      }
      className="bg-slate-800 p-3 rounded-xl"
    />

    <input
      type="text"
      placeholder="Hours Per Day"
      value={hoursPerDay}
      onChange={(e) =>
        setHoursPerDay(e.target.value)
      }
      className="bg-slate-800 p-3 rounded-xl"
    />
  </div>

  <button
    onClick={generateStudyPlan}
    className="mt-4 bg-orange-600 hover:bg-orange-700 transition px-5 py-3 rounded-xl"
  >
    Generate Study Plan
  </button>
</div>

  return (
    <><div className="flex h-screen bg-slate-950 text-white">

      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">

        <div className="p-4 border-b border-slate-800">
          <button
            onClick={createNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-xl font-semibold"
          >
            + New Chat
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => {
              setCurrentChatId(chat.id);
              setMessages(chat.messages);
            } }
            className={`p-3 rounded-xl cursor-pointer transition ${currentChatId === chat.id
                ? "bg-slate-700"
                : "hover:bg-slate-800"}`}
          >
            {chat.title}
          </div>
        ))}
      </div>
    </div><div className="flex-1 flex flex-col">

        <div className="border-b border-slate-800 p-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            AI Study Assistant
          </h1>

          <div className="text-sm text-slate-400">
            Powered by AI
          </div>
        </div>

        <div className="p-4 border-b border-slate-800 flex flex-wrap gap-3 items-center">

          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
            className="text-sm" />

          <button
            onClick={uploadPDF}
            className="bg-emerald-600 hover:bg-emerald-700 transition px-4 py-2 rounded-lg"
          >
            Upload PDF
          </button>

          <button
            onClick={generateQuiz}
            className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg"
          >
            Generate Quiz
          </button>

          <button
            onClick={generateFlashcards}
            className="bg-purple-600 hover:bg-purple-700 transition px-4 py-2 rounded-lg"
          >
            Generate Flashcards
          </button>
        </div>

        {pdfSummary && (
          <div className="mx-4 mt-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 overflow-y-auto max-h-60">
            <h2 className="text-xl font-bold mb-3">
              PDF Summary
            </h2>

            <div className="prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {pdfSummary}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {quiz && (
          <div className="mx-4 mt-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 overflow-y-auto max-h-72">
            <h2 className="text-xl font-bold mb-3">
              Generated Quiz
            </h2>

            <div className="prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {quiz}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {flashcards.length > 0 && (
          <div className="mx-4 mt-4">
            <h2 className="text-2xl font-bold mb-4">
              Flashcards
            </h2>

            <div className="grid md:grid-cols-2 gap-4">

              {flashcards.map((card, index) => (
                <div
                  key={index}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                >
                  <h3 className="font-bold text-blue-400 mb-2">
                    Question
                  </h3>

                  <p className="mb-4">
                    {card.question}
                  </p>

                  <h3 className="font-bold text-emerald-400 mb-2">
                    Answer
                  </h3>

                  <p>{card.answer}</p>
                </div>
              ))}

            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === "user"
                  ? "justify-end"
                  : "justify-start"}`}
            >
              <div
                className={`max-w-2xl px-5 py-4 rounded-2xl shadow-lg ${msg.sender === "user"
                    ? "bg-blue-600"
                    : "bg-slate-800"}`}
              >
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-slate-400">
              AI is thinking...
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-800 flex gap-3">

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask any study question..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />

          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 transition px-6 rounded-xl font-semibold"
          >
            Send
          </button>
          <button
  onClick={startListening}
  className={`px-5 rounded-xl font-semibold ${
    isListening
      ? "bg-red-600"
      : "bg-purple-600 hover:bg-purple-700"
  }`}
>
  {isListening ? "Listening..." : "🎤"}
</button>
        </div>
      </div></>
    
  );
}
 const generateStudyPlan = async () => {
  try {
    setLoading(true);

    const response = await axios.post(
      "http://localhost:5000/study-plan",
      {
        subject,
        examDate,
        hoursPerDay,
      }
    );

    setStudyPlan(response.data.plan);
  } catch (error) {
    console.log(error);

    alert("Study plan failed");
  } finally {
    setLoading(false);
  }
};
{studyPlan && (
  <div className="mx-4 mt-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
    
    <h2 className="text-2xl font-bold mb-4">
      Your Study Plan
    </h2>

    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
      >
        {studyPlan}
      </ReactMarkdown>
    </div>
  </div>
)}
export default App;