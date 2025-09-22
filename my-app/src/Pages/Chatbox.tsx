import React, { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import { RotateCw, Send } from "lucide-react";
import { motion } from "framer-motion";
import "../CSS/chatbot.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatSession = {
  id: number;
  title: string;
  messages: Message[];
};

const STORAGE_KEY = "chatbox_sessions";

const agricultureQuestions = [
  "What is the best fertilizer for rice?",
  "How can I prevent pests in corn farming?",
  "What are the common diseases in tomatoes?",
  "How do I improve soil fertility?",
  "What are the benefits of crop rotation?",
  "When is the best time to plant maize?",
  "How can I conserve water in farming?",
  "What are the best practices for organic farming?",
  "How do I increase rice yield?",
  "What livestock are suitable for small farms?",
  "What is the importance of irrigation in farming?",
  "How do I control weeds naturally?",
  "Which soil type is best for growing vegetables?",
  "How does climate change affect agriculture?",
  "What are drought-resistant crops?",
  "What are common pests in mango trees?",
  "How do I store harvested crops safely?",
  "What is hydroponic farming?",
  "How do I prevent soil erosion?",
  "What are the advantages of greenhouse farming?",
  "Which plants improve soil fertility?",
  "What is integrated pest management?",
  "How do I know if my soil is healthy?",
  "What are high-value crops in the Philippines?",
  "What are the challenges in poultry farming?",
  "How do I start goat farming?",
  "What are the benefits of vermicomposting?",
  "How can I reduce post-harvest losses?",
  "What are the best crops during the rainy season?",
  "How do I protect crops from flooding?",
  "What are good cover crops for soil protection?",
  "How can technology help in farming?",
  "What are organic alternatives to chemical fertilizers?",
  "How do I improve seed germination rates?",
  "What are sustainable livestock practices?",
  "What are the signs of nutrient deficiency in plants?",
  "How do I maintain soil pH balance?",
  "What is aquaculture farming?",
  "How do I increase milk production in cows?",
  "What are effective ways to manage farm waste?",
];

// --- Keywords to check if user input is agriculture-related ---
const agricultureKeywords = [
  "farm",
  "farmer",
  "agriculture",
  "crop",
  "rice",
  "corn",
  "maize",
  "soil",
  "fertilizer",
  "plant",
  "plants",
  "vegetable",
  "fruit",
  "tree",
  "livestock",
  "poultry",
  "goat",
  "cow",
  "chicken",
  "irrigation",
  "harvest",
  "pest",
  "organic",
  "farming",
  "compost",
  "seed",
  "drought",
  "greenhouse",
  "vermicompost",
  "hydroponic",
  "aquaculture",
];

// --- General greetings / small talk ---
const greetingsKeywords = ["hello", "hi", "hey", "good morning", "good evening", "my name is", "who are you"];

const Chatbox: React.FC = () => {
  const [userInput, setUserInput] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [suggested, setSuggested] = useState<string[]>([]);

  // --- Helpers ---
  function generateChatTitle(text?: string): string {
    if (!text || !text.trim()) return "New Chat";
    const words = text.trim().split(/\s+/);
    return words.slice(0, 8).join(" ") + (words.length > 8 ? "..." : "");
  }

  const refreshSuggestions = () => {
    const shuffled = [...agricultureQuestions].sort(() => 0.5 - Math.random());
    setSuggested(shuffled.slice(0, 3));
  };

  // --- Load sessions ---
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: ChatSession[] = JSON.parse(stored);
        const normalized = parsed.map((s) => ({
          ...s,
          title: generateChatTitle(s.title),
        }));
        setSessions(normalized);
        setActiveSessionId(normalized[0]?.id ?? null);
      } catch (err) {
        const firstSession: ChatSession = { id: 1, title: "New Chat", messages: [] };
        setSessions([firstSession]);
        setActiveSessionId(1);
      }
    } else {
      const firstSession: ChatSession = { id: 1, title: "New Chat", messages: [] };
      setSessions([firstSession]);
      setActiveSessionId(1);
    }
    refreshSuggestions();
  }, []);

  // --- Persist sessions ---
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // --- Click outside menu closes it ---
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? null;

  // --- Update session helper ---
  const updateSession = (updated: ChatSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const newChat = () => {
    const newId = sessions.length > 0 ? Math.max(...sessions.map((s) => s.id)) + 1 : 1;
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setUserInput("");
    refreshSuggestions();
    setShowIntro(true);
  };

  const switchChat = (id: number) => {
    setActiveSessionId(id);
    setMenuOpenId(null);
  };

  const deleteChat = (id: number) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      if (id === activeSessionId) {
        if (updated.length > 0) {
          setActiveSessionId(updated[0].id);
        } else {
          const newSession: ChatSession = { id: 1, title: "New Chat", messages: [] };
          setActiveSessionId(1);
          refreshSuggestions();
          setShowIntro(true);
          return [newSession];
        }
      }
      return updated;
    });
    setMenuOpenId(null);
  };

  // --- Validation before sending message ---
  const isAgricultureRelated = (text: string) => {
    const lower = text.toLowerCase();
    return agricultureKeywords.some((kw) => lower.includes(kw));
  };

  const isGreeting = (text: string) => {
    const lower = text.toLowerCase();
    return greetingsKeywords.some((kw) => lower.includes(kw));
  };

  const sendMessage = async (text?: string) => {
    const messageText = text ?? userInput;
    if (!messageText.trim() || !activeSession) return;

    if (showIntro) setShowIntro(false);

    const newMessage: Message = { role: "user", content: messageText };

    const updatedSession: ChatSession = {
      ...activeSession,
      messages: [...activeSession.messages, newMessage],
    };

    updateSession(updatedSession);
    setLoading(true);
    setUserInput("");
    setSuggested([]);

    try {
      let assistantReply = "";

      if (isAgricultureRelated(messageText)) {
        // Normal API response
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
              Authorization: `Bearer ${process.env.REACT_APP_OPENROUTER_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-r1:free",
            messages: [
              {
                role: "system",
                content: "You are an AI assistant named Aniko specialized in agriculture.",
              },
              ...updatedSession.messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            ],
          }),
        });

        const data = await res.json();
        assistantReply = data.choices?.[0]?.message?.content ?? "No response from Aniko.";
      } else if (isGreeting(messageText)) {
        assistantReply = "Hello! I’m Aniko, your agriculture assistant. How can I help you with farming today?";
      } else {
        assistantReply = "I can only reply to agriculture-related questions.";
      }

      const assistantMessage: Message = { role: "assistant", content: assistantReply };

      updateSession({
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
      });
    } catch (err: any) {
      updateSession({
        ...updatedSession,
        messages: [
          ...updatedSession.messages,
          {
            role: "assistant",
            content: `⚠️ Error: ${err?.message ?? "Unknown error"}`,
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="modal-dialog modal-dialog-centered chatbot-modDialog"
        style={{ maxWidth: "900px", width: "900px" }}
      >
        <div className="modal-content chatbot-modContent" style={{ height: "600px" }}>
          <div className="modal-header chatbot-modHeader">
            <h5 className="modal-title chatbot-modTitle">Aniko Smart AI</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => window.location.reload()}
            />
          </div>

          <div className="modal-body chatbot-modBody p-0" style={{ height: "100%" }}>
            <div className="d-flex" style={{ height: "100%" }}>
              {/* Sidebar */}
              <div
                className="cb-sidebar-body"
                style={{
                  width: "260px",
                  flexShrink: 0,
                  padding: "10px",
                  overflowY: "auto",
                }}
              >
                <button
                  className="btn btn-outline-primary btn-sm w-100 mb-3 newChat-btn"
                  onClick={newChat}
                >
                  <i className="bi bi-pencil-square"></i>New Chat
                </button>

                <h6 className="text-muted historyHeader">Chats</h6>

                <ul className="list-unstyled m-0 p-0">
                  {sessions.map((session) => (
                    <li key={session.id} style={{ position: "relative" }}>
                      <div
                        onClick={() => switchChat(session.id)}
                        className={
                          session.id === activeSessionId
                            ? "active-chat"
                            : "inactive-chat"
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          height: "45px",
                          padding: "0 10px",
                          borderRadius: "6px",
                          border: "1px solid #ddd",
                          marginBottom: "8px",
                          cursor: "pointer",
                          background: session.id === activeSessionId ? "#0d6efd" : "#f8f9fa",
                          color: session.id === activeSessionId ? "#fff" : "#000",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            flexGrow: 1,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            paddingRight: "8px",
                          }}
                        >
                          {session.title}
                        </span>

                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === session.id ? null : session.id);
                          }}
                          style={{
                            flexShrink: 0,
                            marginLeft: "8px",
                            cursor: "pointer",
                            color:
                              session.id === activeSessionId ? "#fff" : "#6c757d",
                          }}
                        >
                          ⋮
                        </span>
                      </div>

                      {menuOpenId === session.id && (
                        <div
                          ref={menuRef}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "calc(45px + 8px)",
                            backgroundColor: "#fff",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            zIndex: 3000,
                            boxShadow: "0px 6px 18px rgba(0,0,0,0.12)",
                          }}
                        >
                          <div
                            style={{
                              cursor: "pointer",
                              color: "#d9534f",
                              fontWeight: 500,
                              fontSize: "14px",
                            }}
                            onClick={() => deleteChat(session.id)}
                          >
                            🗑 Delete
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chat Window */}
              <div className="flex-grow-1 d-flex flex-column chat-window">
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "15px",
                    position: "relative",
                  }}
                >
                  {/* Messages */}
                  {activeSession?.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`d-flex mb-3 ${
                        msg.role === "user"
                          ? "justify-content-end"
                          : "justify-content-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <img
                          src="/PICTURES/Logo-noText.png"
                          alt="Aniko"
                          style={{
                            width: "35px",
                            height: "35px",
                            borderRadius: "50%",
                            marginRight: "8px",
                            objectFit: "contain",
                            backgroundColor: "#fff",
                            padding: "2px",
                          }}
                        />
                      )}

                      <div
                        className={`p-2 rounded ${
                          msg.role === "user" ? "bg-primary text-white" : "bg-light border"
                        }`}
                        style={{ maxWidth: "75%" }}
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(msg.content) as string,
                        }}
                      />
                    </div>
                  ))}

                  {loading && (
                    <div className="d-flex mb-3 justify-content-start">
                      <img
                        src="/PICTURES/Logo-noText.png"
                        alt="Aniko"
                        style={{
                          width: "35px",
                          height: "35px",
                          borderRadius: "50%",
                          marginRight: "8px",
                          objectFit: "contain",
                          backgroundColor: "#fff",
                          padding: "2px",
                        }}
                      />
                      <div
                        className="p-2 rounded bg-light border text-muted small thinking-text"
                        style={{ maxWidth: "75%" }}
                      >
                        Aniko is thinking...
                      </div>
                    </div>
                  )}

                  {/* Suggested Questions */}
                  {suggested.length > 0 &&
                    (!activeSession?.messages.length ||
                      activeSession.messages.length === 0) && (
                      <div className="p-2 border-top mt-3 suggestQs-container">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold small">Suggested Questions</span>
                          <RotateCw
                            size={18}
                            style={{ cursor: "pointer" }}
                            onClick={refreshSuggestions}
                          />
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          {suggested.map((q, i) => (
                            <button
                              key={i}
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => sendMessage(q)}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Intro Message */}
              {showIntro && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="fw-bold fs-5 winIntro-mess"
                  >
                    Hello, I’m <span className="text-primary aniko-winHeader">Aniko</span>, here
                    to assist you today!
                  </motion.div>
                )}

                </div>

                {/* Input */}
                <div className="p-3 border-top">
                  <div
                    className="cb-inputArea"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "25px",
                      padding: "5px 10px",
                    }}
                  >
                    <input
                      type="text"
                      className="form-control border-0 shadow-none cb-inputForm"
                      placeholder="Ask a question..."
                      style={{ borderRadius: "25px", flex: 1 }}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button
                      className="btn btn-success rounded-circle ms-2 cb-sendBtn"
                      style={{
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => sendMessage()}
                      disabled={loading}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbox;
