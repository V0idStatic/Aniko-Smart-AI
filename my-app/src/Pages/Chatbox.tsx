"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { marked } from "marked"
import { RotateCw, Send } from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import "../CSS/chatbot.css"

type Message = { role: "user" | "assistant"; content: string }
type ChatSession = {
  id: number
  title: string
  messages: Message[]
  lastTitleGeneratedAt?: number
}

const STORAGE_KEY = "chatbox_sessions"
const GUEST_PROMPT_LIMIT = 5
const GUEST_USAGE_KEY = "guest_prompt_count"

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
]

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
  "banana",
  "mango",
  "papaya",
  "coconut",
  "pineapple",
  "tomato",
  "potato",
  "onion",
  "garlic",
  "cabbage",
  "lettuce",
  "carrot",
  "eggplant",
  "pepper",
  "chili",
  "squash",
  "pumpkin",
  "cucumber",
  "watermelon",
  "melon",
  "strawberry",
  "grapes",
  "orange",
  "lemon",
  "lime",
  "avocado",
  "guava",
  "dragon fruit",
  "durian",
  "rambutan",
  "lychee",
  "wheat",
  "barley",
  "oats",
  "soybean",
  "peanut",
  "cassava",
  "sweet potato",
  "yam",
  "taro",
  "ginger",
  "turmeric",
  "sugarcane",
  "coffee",
  "cacao",
  "tea",
  "rubber",
  "cotton",
  "tobacco",
  "hemp",
  "bamboo",
  "orchid",
  "rose",
  "sunflower",
  "planting",
  "growing",
  "cultivation",
  "yield",
  "season",
  "rainy",
  "dry",
  "climate",
  "weather",
  "temperature",
  "humidity",
  "water",
  "nutrient",
  "disease",
  "weed",
  "herbicide",
  "pesticide",
  "insecticide",
  "fungicide",
  "manure",
  "mulch",
  "pruning",
  "grafting",
  "transplanting",
  "seedling",
  "nursery",
  "field",
  "garden",
  "orchard",
  "plantation",
  "paddy",
  "terracing",
  "tilling",
  "plowing",
  "harrowing",
  "sowing",
  "reaping",
  "threshing",
  "drying",
  "storage",
  "market",
  "produce",
  "organic",
  "sustainable",
  "agroforestry",
  "permaculture",
  "companion planting",
  "intercropping",
  "monoculture",
  "polyculture",
]

const greetingsKeywords = ["hello", "hi", "hey", "good morning", "good evening", "my name is", "who are you"]

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_KEY = process.env.REACT_APP_OPENROUTER_KEY

const TITLE_GENERATION_MODEL = "gpt-3.5-turbo"
const RESPONSE_MODEL = "gpt-3.5-turbo"

const Chatbox: React.FC = () => {
  const navigate = useNavigate()
  const [userInput, setUserInput] = useState("")
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatingTitleForId, setGeneratingTitleForId] = useState<number | null>(null)
  const [showIntro, setShowIntro] = useState(true)
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [suggested, setSuggested] = useState<string[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [guestPromptCount, setGuestPromptCount] = useState(0)

  // Helpers
  function generateChatTitleFallback(text?: string): string {
    if (!text || !text.trim()) return "New Chat"
    const words = text.trim().split(/\s+/)
    return words.slice(0, 8).join(" ") + (words.length > 8 ? "..." : "")
  }

  const refreshSuggestions = () => {
    const shuffled = [...agricultureQuestions].sort(() => 0.5 - Math.random())
    setSuggested(shuffled.slice(0, 3))
  }

  const isGreeting = (text: string): boolean => {
    return greetingsKeywords.some((kw) => text.toLowerCase().includes(kw))
  }

  const getStorageKey = (userId: string | null): string => {
    if (!userId) return STORAGE_KEY
    return `${STORAGE_KEY}_${userId}`
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid)
      } else {
        setCurrentUserId(null)
        const storedCount = sessionStorage.getItem(GUEST_USAGE_KEY)
        setGuestPromptCount(storedCount ? Number.parseInt(storedCount, 10) : 0)
      }
      setIsAuthReady(true)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isAuthReady) return

    if (currentUserId) {
      const storageKey = getStorageKey(currentUserId)
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          const parsed: ChatSession[] = JSON.parse(stored)
          setSessions(parsed)
          setActiveSessionId(parsed[0]?.id ?? null)
        } catch {
          const first: ChatSession = { id: 1, title: "New Chat", messages: [] }
          setSessions([first])
          setActiveSessionId(1)
        }
      } else {
        const first: ChatSession = { id: 1, title: "New Chat", messages: [] }
        setSessions([first])
        setActiveSessionId(1)
      }
    } else {
      const first: ChatSession = { id: 1, title: "New Chat", messages: [] }
      setSessions([first])
      setActiveSessionId(1)
    }
    refreshSuggestions()
  }, [isAuthReady, currentUserId])

  useEffect(() => {
    if (sessions.length > 0 && isAuthReady && currentUserId) {
      const storageKey = getStorageKey(currentUserId)
      localStorage.setItem(storageKey, JSON.stringify(sessions))
    }
  }, [sessions, isAuthReady, currentUserId])

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? null

  const updateSession = (updated: ChatSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  const newChat = () => {
    const newId = sessions.length > 0 ? Math.max(...sessions.map((s) => s.id)) + 1 : 1
    const newSession: ChatSession = { id: newId, title: "New Chat", messages: [] }
    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newId)
    setUserInput("")
    refreshSuggestions()
    setShowIntro(true)
  }

  const switchChat = (id: number) => {
    setActiveSessionId(id)
    setMenuOpenId(null)
  }

  const deleteChat = (id: number) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      if (id === activeSessionId) {
        if (updated.length > 0) setActiveSessionId(updated[0].id)
        else {
          const newSession: ChatSession = { id: 1, title: "New Chat", messages: [] }
          setActiveSessionId(1)
          refreshSuggestions()
          setShowIntro(true)
          return [newSession]
        }
      }
      return updated
    })
    setMenuOpenId(null)
  }

  const isAgricultureRelated = (text: string, conversationHistory?: Message[]) => {
    const currentMessageIsAgri = agricultureKeywords.some((kw) => text.toLowerCase().includes(kw))

    if (currentMessageIsAgri) return true

    if (conversationHistory && conversationHistory.length > 0) {
      const hasAgriContext = conversationHistory
        .filter((m) => m.role === "user")
        .some((m) => agricultureKeywords.some((kw) => m.content.toLowerCase().includes(kw)))

      if (hasAgriContext) {
        const followUpPatterns = [
          "how about",
          "what about",
          "and",
          "also",
          "too",
          "as well",
          "similarly",
          "likewise",
          "in addition",
          "furthermore",
          "moreover",
        ]
        const isFollowUp = followUpPatterns.some((pattern) => text.toLowerCase().includes(pattern))
        if (isFollowUp) return true
      }
    }

    return false
  }

  const generateTitleWithAI = async (session: ChatSession): Promise<string> => {
    if (!OPENROUTER_KEY) {
      return generateChatTitleFallback(session.messages[0]?.content ?? undefined)
    }
    try {
      setGeneratingTitleForId(session.id)
      const firstUserMessage = session.messages.find((m) => m.role === "user")?.content ?? ""
      const lastMessages = session.messages
        .slice(-6)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n")

      const systemPrompt =
        "You are a helpful assistant that, given a brief conversation, returns a concise title (maximum 6 words) capturing the main topic. Return ONLY the title text, without punctuation or commentary."
      const payload = {
        model: TITLE_GENERATION_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `First user message: ${firstUserMessage}\n\nRecent conversation:\n${lastMessages}\n\nProvide a short chat title (max 6 words).`,
          },
        ],
        max_tokens: 32,
        temperature: 0.2,
        n: 1,
      }

      const res = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      const raw = data.choices?.[0]?.message?.content ?? ""
      const cleaned = (raw as string).trim().replace(/^["']+|["']+$/g, "")
      if (!cleaned) return generateChatTitleFallback(firstUserMessage || session.title)
      return cleaned.length > 60 ? cleaned.slice(0, 60) + "..." : cleaned
    } catch {
      return generateChatTitleFallback(session.messages[0]?.content ?? undefined)
    } finally {
      setGeneratingTitleForId(null)
    }
  }

  const refreshTitleForSession = async (s: ChatSession) => {
    const title = await generateTitleWithAI(s)
    updateSession({ ...s, title, lastTitleGeneratedAt: Date.now() })
  }

  const sendMessage = async (text?: string) => {
    const messageText = text ?? userInput
    if (!messageText.trim() || !activeSession) return

    if (!currentUserId) {
      if (guestPromptCount >= GUEST_PROMPT_LIMIT) {
        return // Don't send if limit reached
      }
    }

    const newMessage: Message = { role: "user", content: messageText }
    const updatedSession: ChatSession = {
      ...activeSession,
      messages: [...activeSession.messages, newMessage],
    }

    updateSession(updatedSession)
    setLoading(true)
    setUserInput("")
    setSuggested([])

    if (!currentUserId) {
      const newCount = guestPromptCount + 1
      setGuestPromptCount(newCount)
      sessionStorage.setItem(GUEST_USAGE_KEY, newCount.toString())
    }

    const needImmediateTitle = updatedSession.messages.filter((m) => m.role === "user").length === 1
    if (needImmediateTitle) {
      refreshTitleForSession(updatedSession).catch(() => {})
    }

    try {
      let assistantReply = ""
      if (isAgricultureRelated(messageText, activeSession.messages)) {
        const payload = {
          model: RESPONSE_MODEL,
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
          temperature: 0.2,
          max_tokens: 600,
          n: 1,
        }

        const res = await fetch(OPENROUTER_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        const data = await res.json()
        assistantReply = data.choices?.[0]?.message?.content ?? "No response."
      } else if (isGreeting(messageText)) {
        assistantReply = "Hello! I'm Aniko, your agriculture assistant. How can I help you with farming today?"
      } else {
        assistantReply = "I can only reply to agriculture-related questions."
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: assistantReply,
      }
      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
      }
      updateSession(finalSession)

      const userMessagesCount = finalSession.messages.filter((m) => m.role === "user").length
      if (userMessagesCount > 0 && userMessagesCount % 3 === 0) {
        refreshTitleForSession(finalSession).catch(() => {})
      }
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
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthReady) {
    return (
      <div
        className="modal show d-block"
        tabIndex={-1}
        role="dialog"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
      >
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "400px" }}>
          <div className="modal-content p-4 text-center">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
    >
      <div
        className="modal-dialog modal-dialog-centered chatbot-modDialog"
        style={{ maxWidth: "900px", width: "900px" }}
      >
        <div className="modal-content chatbot-modContent" style={{ height: "600px" }}>
          <div className="modal-header chatbot-modHeader">
            <h5 className="modal-title chatbot-modTitle">Aniko Smart AI</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={() => window.location.reload()} />
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
                <button className="btn btn-outline-primary btn-sm w-100 mb-3 newChat-btn" onClick={newChat}>
                  <i className="bi bi-pencil-square"></i> <strong>New Chat</strong>
                </button>

                <h6 className="text-muted historyHeader">Chats</h6>
                <ul className="list-unstyled m-0 p-0">
                  {sessions
                    .filter((s) => s.messages.length > 0)
                    .map((session) => (
                      <li key={session.id} style={{ position: "relative" }}>
                        <div
                          onClick={() => switchChat(session.id)}
                          className={session.id === activeSessionId ? "active-chat" : "inactive-chat"}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            height: "55px",
                            padding: "0 10px",
                            borderRadius: "6px",
                            border: "1px solid #ddd",
                            marginBottom: "8px",
                            cursor: "pointer",
                            background: session.id === activeSessionId ? "#0d6efd" : "#f8f9fa",
                            color: session.id === activeSessionId ? "#fff" : "#000",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flexGrow: 1,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                flexGrow: 1,
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                maxWidth: "170px",
                              }}
                            >
                              <strong style={{ fontSize: "0.95rem" }}>
                                {session.title !== "New Chat" ? session.title : ""}
                              </strong>
                              <div
                                style={{
                                  fontSize: "0.90rem",
                                  color:
                                    session.id === activeSessionId
                                      ? "rgba(255,255,255,0.85)"
                                      : "rgba(255,255,255,0.85)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {session.messages.length > 0
                                  ? session.messages[0].content.slice(0, 60) +
                                    (session.messages[0].content.length > 60 ? "..." : "")
                                  : "No messages yet"}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              onClick={(e) => {
                                e.stopPropagation()
                                setMenuOpenId(menuOpenId === session.id ? null : session.id)
                              }}
                              style={{
                                flexShrink: 0,
                                marginLeft: "4px",
                                cursor: "pointer",
                                color: session.id === activeSessionId ? "#fff" : "#6c757d",
                              }}
                            >
                              ⋮
                            </span>
                          </div>
                        </div>

                        {menuOpenId === session.id && (
                          <div
                            ref={menuRef}
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "calc(55px + 8px)",
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
                  {activeSession?.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`d-flex mb-3 ${msg.role === "user" ? "justify-content-end" : "justify-content-start"}`}
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
                        className={`p-2 rounded ${msg.role === "user" ? "bg-primary text-white" : "bg-light border"}`}
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
                  {suggested.length > 0 && (!activeSession?.messages.length || activeSession.messages.length === 0) && (
                    <div className="p-2 border-top mt-3 suggestQs-container">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold small">Suggested Questions</span>
                        <RotateCw size={18} style={{ cursor: "pointer" }} onClick={refreshSuggestions} />
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {suggested.map((q, i) => (
                          <button key={i} className="btn btn-sm btn-outline-secondary" onClick={() => sendMessage(q)}>
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Intro Message */}
                  {(!activeSession?.messages || activeSession.messages.length === 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="fw-bold fs-5 winIntro-mess"
                    >
                      Hello, I'm <span className="text-primary aniko-winHeader">Aniko</span>, here to assist you today!
                    </motion.div>
                  )}
                </div>

                {/* Input */}
                <div className="p-3 border-top">
                  {!currentUserId && guestPromptCount >= GUEST_PROMPT_LIMIT && (
                    <div className="alert alert-warning mb-2 p-2 text-center" style={{ fontSize: "0.9rem" }}>
                      <strong>0 credits remaining.</strong> Please{" "}
                      <button
                        onClick={() => navigate("/login", { state: { redirectTo: "/chatbot" } })}
                        className="alert-link btn btn-link p-0 m-0"
                        style={{
                          textDecoration: "underline",
                          fontSize: "inherit",
                          color: "inherit",
                          background: "none",
                          border: "none",
                        }}
                      >
                        login
                      </button>{" "}
                      to get unlimited access.
                    </div>
                  )}

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
                      disabled={!currentUserId && guestPromptCount >= GUEST_PROMPT_LIMIT}
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
                      disabled={loading || (!currentUserId && guestPromptCount >= GUEST_PROMPT_LIMIT)}
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
  )
}

export default Chatbox
