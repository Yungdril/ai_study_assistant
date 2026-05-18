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

  const [quiz, setQuiz] = useState("");

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

  if (!loggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        <div
          style={{
            background: "#1e293b",
            padding: "40px",
            borderRadius: "20px",
            width: "350px",
          }}
        >
          <h1>AI Study Assistant</h1>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button onClick={signup}>
            Sign Up
          </button>

          <button onClick={login}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0f172a",
        color: "white",
      }}
    >
      <div
        style={{
          width: "260px",
          background: "#111827",
          padding: "20px",
        }}
      >
        <button onClick={createNewChat}>
          + New Chat
        </button>

        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => {
              setCurrentChatId(chat.id);
              setMessages(chat.messages);
            }}
          >
            {chat.title}
          </div>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "20px",
        }}
      >
        <h1>AI Study Assistant</h1>

        <div style={{ marginBottom: "20px" }}>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setPdfFile(e.target.files[0])
            }
          />

          <button onClick={uploadPDF}>
            Upload PDF
          </button>

          <button onClick={generateQuiz}>
            Generate Quiz
          </button>
        </div>

        {pdfSummary && (
          <div>
            <h3>PDF Summary</h3>

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
            >
              {pdfSummary}
            </ReactMarkdown>
          </div>
        )}

        {quiz && (
          <div>
            <h3>Generated Quiz</h3>

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
            >
              {quiz}
            </ReactMarkdown>
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {messages.map((msg, index) => (
            <div key={index}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          ))}
        </div>

        <div>
          <input
            type="text"
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Ask something..."
          />

          <button onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;