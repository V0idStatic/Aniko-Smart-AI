"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { marked } from "marked"
import { RotateCw, Send, Menu, X } from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"

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
  const [sidebarVisible, setSidebarVisible] = useState(false)

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
      <>
        <style>{`
          .chatbot-loading-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
          .chatbot-loading-content {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
          }
        `}</style>
        <div className="chatbot-loading-modal">
          <div className="chatbot-loading-content">
            <p>Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        :root {
          --primary-green: #1d492c;
          --accent-green: #84cc16;
          --pastel-green: #bde08a;
          --light-green: #f0fdf4;
          --dark-green: #143820;
          --dark-gray: #374151;
          --light-gray: #f9fafb;
          --white: #ffffff;
          --bg-color: #cfc4b2ff;
          --primary-brown: #8a6440;
          --dark-brown: #4d2d18;
          --gradient-primary: linear-gradient(135deg, var(--primary-green), var(--accent-green));
          --gradient-secondary: linear-gradient(135deg, var(--primary-green), var(--pastel-green));
        }

        /* Base Modal Styles */
        .modal.show {
          z-index: 9999 !important;
        }

        .chatbot-modDialog {
          z-index: 10000 !important;
          max-width: 1100px;
          width: 90%;
          margin: auto;
        }

        .chatbot-modContent {
          display: flex;
          height: 90vh;
          width: 100%;
          background: linear-gradient(135deg, var(--light-green), var(--white));
          font-family: "Poppins", sans-serif;
          border: 2px solid var(--dark-green) !important;
          border-radius: 0;
          border-top-right-radius: 100px;
          border-bottom-left-radius: 80px;
          overflow: hidden;
          position: relative;
          box-shadow: 0px 0px 20px 5px var(--pastel-green) !important;
          z-index: 10001 !important;
        }

        .chatbot-modContent::before {
          content: "";
          position: absolute;
          top: 10%;
          left: 0;
          width: 100%;
          height: 80%;
          background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.25), transparent 70%);
          pointer-events: none;
        }

        /* Header */
        .chatbot-modHeader {
          padding: 18px 25px;
          background: var(--dark-green);
          color: var(--white);
          font-weight: 600;
          font-size: 1.2rem;
          border: none !important;
          border-radius: 0;
          border-top-right-radius: 50px;
          text-align: center;
          letter-spacing: 0.5px;
          box-shadow: inset 0 -2px 6px rgba(0, 0, 0, 0.15);
        }

        .chatbot-modHeader .btn-close {
          margin-right: 2.5rem;
          color: white !important;
        }

        /* Body */
        .chatbot-modBody {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--light-gray);
          position: relative;
          border-bottom-left-radius: 50px;
          overflow: hidden;
        }

        /* Chat Window */
        .chat-window {
          background-color: var(--bg-color) !important;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .chat-messages {
          flex: 1 !important;
          padding: 20px !important;
          overflow-y: auto !important;
          scroll-behavior: smooth !important;
          scrollbar-gutter: stable both-edges;
        }

        .suggestQs-container {
          background-color: rgba(77, 45, 24, 0.33);
          backdrop-filter: blur(4px);
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          animation: fadeIn 0.3s ease-in-out;
          border: none !important;
        }

        .suggestQs-container .small {
          color: var(--dark-brown);
        }

        .suggestQs-container .btn {
          border-radius: 20px;
          transition: all 0.2s ease-in-out;
          color: var(--light-green) !important;
          border-color: var(--light-green) !important;
        }

        .suggestQs-container .btn:hover {
          background-color: var(--primary-brown) !important;
          color: #fff;
          border-color: #4d2d18;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .winIntro-mess {
          color: var(--primary-brown) !important;
          text-align: center;
          margin-top: 2rem;
        }

        .aniko-winHeader {
          color: var(--primary-green) !important;
          font-weight: bolder !important;
        }

        .chat-messages::-webkit-scrollbar {
          width: 8px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: var(--primary-green);
          border-radius: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        /* User Bubbles */
        .chatbot-modBody .justify-content-end .rounded {
          background: var(--primary-green) !important;
          color: var(--white);
          border-radius: 20px !important;
          border-bottom-right-radius: 0 !important;
          font-size: 0.95rem;
          padding: 12px 16px !important;
          margin: 6px 0;
          max-width: 70%;
          box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.15);
        }

        /* Bot Bubbles */
        .chatbot-modBody .justify-content-start .rounded {
          background: var(--light-green) !important;
          color: var(--dark-green);
          border-radius: 20px !important;
          border-top-left-radius: 0 !important;
          font-size: 0.95rem;
          padding: 12px 16px !important;
          margin: 6px 0;
          max-width: 70%;
          box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.1);
        }

        .chatbot-modBody img {
          border: 2px solid var(--accent-green);
          border-radius: 50%;
        }

        .chatbot-modBody .btn-outline-secondary {
          border-radius: 20px;
          font-size: 0.85rem;
          border: 1px solid var(--primary-green);
          color: var(--primary-green);
          transition: all 0.3s ease;
          margin: 5px;
        }

        .chatbot-modBody .btn-outline-secondary:hover {
          background: var(--primary-green);
          color: var(--white);
        }

        .chatbot-modBody .fw-bold.fs-5.text-muted {
          text-align: center;
          padding: 40px 10px;
          color: var(--dark-gray) !important;
        }

        /* Sidebar */
        .cb-sidebar-body {
          width: 280px;
          background: var(--gradient-secondary);
          color: var(--dark-green);
          padding: 25px 20px;
          display: flex;
          flex-direction: column;
          border-bottom-left-radius: 50px;
          box-shadow: inset -4px 0 8px rgba(0, 0, 0, 0.05);
          overflow-y: auto;
          transition: transform 0.3s ease-in-out;
        }

        /* Added hamburger menu button styles */
        .hamburger-btn {
          display: none;
          position: absolute;
          top: 15px;
          left: 15px;
          z-index: 1000;
          background: var(--primary-green);
          color: var(--white);
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .hamburger-btn:hover {
          background: var(--dark-green);
        }

        /* Sidebar overlay for mobile/tablet */
        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
        }

        .sidebar-overlay.active {
          display: block;
        }

        .newChat-btn {
          color: var(--light-green) !important;
          border: 2px solid var(--light-green) !important;
          margin-top: 1rem;
          margin-bottom: 4rem !important;
          text-align: center !important;
          font-size: 17px !important;
          font-weight: 600 !important;
          box-shadow: 0px 0px 10px 2px var(--light-green) !important;
          border-radius: 15px;
          position: relative;
          overflow: hidden;
        }

        .newChat-btn:hover {
          background: var(--gradient-secondary) !important;
        }

        .newChat-btn::after {
          content: "";
          position: absolute;
          top: 0;
          left: -75%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0.7) 50%,
            rgba(255, 255, 255, 0.2) 100%
          );
          transform: skewX(-20deg);
          pointer-events: none;
          transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .newChat-btn:hover::after {
          left: 125%;
        }

        .cb-sidebar-body h6 {
          font-weight: 600;
          color: var(--light-green) !important;
          margin-bottom: 15px;
        }

        .active-chat {
          background: rgba(34, 56, 40, 0.375) !important;
          color: var(--white) !important;
          border-radius: 15px !important;
          backdrop-filter: blur(2px) !important;
          padding: 10px !important;
          transition: background 0.3s;
          border: none !important;
          font-weight: 500 !important;
        }

        .inactive-chat {
          background: none !important;
          color: var(--light-green) !important;
          border-radius: 15px !important;
          backdrop-filter: blur(2px) !important;
          padding: 10px !important;
          transition: background 0.3s;
          border: none !important;
          font-weight: 500 !important;
        }

        .inactive-chat:hover {
          background: rgba(34, 56, 40, 0.375) !important;
          color: var(--white) !important;
          border-radius: 15px !important;
          backdrop-filter: blur(2px) !important;
          padding: 10px !important;
          transition: background 0.3s;
          border: none !important;
        }

        /* Input Area */
        .cb-inputArea {
          background-color: var(--bg-color) !important;
          border-color: var(--primary-brown) !important;
        }

        .chatbot-input {
          flex-shrink: 0;
          position: relative;
          bottom: 0;
          left: 0;
          right: 0;
        }

        .cb-inputForm {
          font-size: 0.95rem;
          padding: 10px !important;
          border: 1px solid var(--pastel-green);
          border-radius: 25px;
          flex: 1;
          outline: none;
        }

        .chatbot-input .btn-success {
          background: var(--gradient-primary);
          border: none;
          border-radius: 50%;
          padding: 12px 14px;
          box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .chatbot-input .btn-success:hover {
          transform: scale(1.1);
          box-shadow: 0px 5px 12px rgba(0, 0, 0, 0.3);
        }

        .cb-sendBtn {
          background-color: var(--primary-green) !important;
          border: none !important;
        }

        .cb-sendBtn:hover {
          background-color: var(--dark-brown) !important;
        }

        /* Animation */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-messages .rounded {
          animation: fadeInUp 0.3s ease forwards;
        }

        /* ============================================
           RESPONSIVE MEDIA QUERIES
           ============================================ */

        /* Extra Small Mobile: 0px - 374px */
        @media (min-width: 0px) and (max-width: 374px) {
          .chatbot-modDialog {
            width: 100%;
            max-width: 100%;
            margin: 0;
          }

          .chatbot-modContent {
            height: 100vh;
            border-radius: 0 !important;
            border-top-right-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
            flex-direction: column;
          }

          .chatbot-modHeader {
            padding: 14px 18px;
            font-size: 1rem;
            border-top-right-radius: 0 !important;
          }

          .chatbot-modHeader .btn-close {
            margin-right: 0;
          }

          /* Hide sidebar by default, show hamburger menu */
          .hamburger-btn {
            display: block;
              top: 65px; /* ✅ moves button 30px down */
          }

          .cb-sidebar-body {
            position: fixed;
            top: 0;
            left: 0;
            width: 75%;
            max-width: 300px;
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            border-radius: 0;
            border-bottom-left-radius: 0;
          }

          .cb-sidebar-body.visible {
            transform: translateX(0);
          }

          .chat-window {
            width: 100% !important;
          }

          /* ✅ Full left side panel */
  .cb-sidebar-body {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;              /* Full width */
    height: 100vh;            /* Full height */
    z-index: 1000;
    background: #0d1b1e;      /* Add background so content isn’t visible underneath */
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    display: flex;
    flex-direction: column;
    padding: 16px;
    border-radius: 0 !important;
  }

          .newChat-btn {
            font-size: 15px !important;
            padding: 10px 14px;
            margin-bottom: 1.5rem !important;
          }

          .cb-sidebar-body h6 {
            font-size: 0.9rem;
            margin-bottom: 10px;
          }

          .active-chat,
          .inactive-chat {
            height: auto;
            min-height: 50px;
            font-size: 0.85rem;
            padding: 9px !important;
          }

          .chat-messages {
            padding: 12px !important;
          }

          .chatbot-modBody .justify-content-end .rounded,
          .chatbot-modBody .justify-content-start .rounded {
            font-size: 0.88rem;
            padding: 11px 14px !important;
            max-width: 80%;
          }

          .chatbot-modBody img {
            width: 30px;
            height: 30px;
          }

          .suggestQs-container {
            padding: 10px;
          }

          .suggestQs-container .btn {
            font-size: 0.8rem;
            padding: 7px 12px;
          }

          .winIntro-mess {
            font-size: 0.95rem;
            margin-top: 1.2rem;
          }

          .cb-inputForm {
            font-size: 0.88rem;
            padding: 9px !important;
          }

          .cb-sendBtn {
            width: 38px !important;
            height: 38px !important;
          }

          .chatbot-input {
            padding: 10px;
          }
        }

        /* Mobile: 375px - 639px */
        @media (min-width: 375px) and (max-width: 639px) {
          .chatbot-modDialog {
            width: 100%;
            max-width: 100%;
            margin: 0;
          }

          .chatbot-modContent {
            height: 100vh;
            border-radius: 0 !important;
            border-top-right-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
            flex-direction: column;
          }

          .chatbot-modHeader {
            padding: 14px 18px;
            font-size: 1rem;
            border-top-right-radius: 0 !important;
          }

          .chatbot-modHeader .btn-close {
            margin-right: 0;
          }

          /* Hide sidebar by default, show hamburger menu */
          .hamburger-btn {
            display: block;
              top: 65px; /* ✅ moves button 30px down */
          }

          .cb-sidebar-body {
            position: fixed;
            top: 0;
            left: 0;
            width: 75%;
            max-width: 300px;
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            border-radius: 0;
            border-bottom-left-radius: 0;
          }

          .cb-sidebar-body.visible {
            transform: translateX(0);
          }

          .chat-window {
            width: 100% !important;
          }

          /* ✅ Full left side panel */
  .cb-sidebar-body {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;              /* Full width */
    height: 100vh;            /* Full height */
    z-index: 1000;
    background: #0d1b1e;      /* Add background so content isn’t visible underneath */
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    display: flex;
    flex-direction: column;
    padding: 16px;
    border-radius: 0 !important;
  }

          .newChat-btn {
            font-size: 15px !important;
            padding: 10px 14px;
            margin-bottom: 1.5rem !important;
          }

          .cb-sidebar-body h6 {
            font-size: 0.9rem;
            margin-bottom: 10px;
          }

          .active-chat,
          .inactive-chat {
            height: auto;
            min-height: 50px;
            font-size: 0.85rem;
            padding: 9px !important;
          }

          .chat-messages {
            padding: 12px !important;
          }

          .chatbot-modBody .justify-content-end .rounded,
          .chatbot-modBody .justify-content-start .rounded {
            font-size: 0.88rem;
            padding: 11px 14px !important;
            max-width: 80%;
          }

          .chatbot-modBody img {
            width: 30px;
            height: 30px;
          }

          .suggestQs-container {
            padding: 10px;
          }

          .suggestQs-container .btn {
            font-size: 0.8rem;
            padding: 7px 12px;
          }

          .winIntro-mess {
            font-size: 0.95rem;
            margin-top: 1.2rem;
          }

          .cb-inputForm {
            font-size: 0.88rem;
            padding: 9px !important;
          }

          .cb-sendBtn {
            width: 38px !important;
            height: 38px !important;
          }

          .chatbot-input {
            padding: 10px;
          }
        }

            /* Tablet: 640px - 767px */
      @media (min-width: 640px) and (max-width: 767px) {
        .chatbot-modDialog {
          width: 95%;
          max-width: 95%;
        }

        .chatbot-modContent {
          height: 85vh;
          border-top-right-radius: 60px;
          border-bottom-left-radius: 50px;
          flex-direction: column;
        }

        .chatbot-modHeader {
          padding: 16px 20px;
          font-size: 1.05rem;
          border-top-right-radius: 30px;
        }

        .hamburger-btn {
          display: block;
          position: relative;
          top: 65px; /* ✅ moves button 30px down */
        }

        /* ✅ Full left-side sliding sidebar */
        .cb-sidebar-body {
          position: fixed;
          top: 0;
          left: 0;
          width: 320px;                /* Consistent width for tablets */
          height: 100vh;               /* Full height */
          background: #0d1b1e;         /* Dark solid background */
          z-index: 1000;
          transform: translateX(-100%); /* Hidden by default */
          transition: transform 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
          padding: 18px;
          border-radius: 0 !important;
        }

        /* Slide in smoothly */
        .cb-sidebar-body.visible {
          transform: translateX(0);
        }

        /* Optional: slightly dim background when sidebar is open */
        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 999;
          display: none;
        }

        .sidebar-overlay.visible {
          display: block;
        }

        .chat-window {
          width: 100% !important;
        }

        .newChat-btn {
          font-size: 15px !important;
          padding: 10px 16px;
          margin-bottom: 2rem !important;
          width: 100%;
        }

        .cb-sidebar-body h6 {
          font-size: 0.95rem;
          width: 100%;
        }

        .active-chat,
        .inactive-chat {
          height: auto;
          min-height: 52px;
          font-size: 0.9rem;
        }

        .chat-messages {
          padding: 15px !important;
        }

        .chatbot-modBody .justify-content-end .rounded,
        .chatbot-modBody .justify-content-start .rounded {
          font-size: 0.9rem;
          padding: 11px 15px !important;
          max-width: 75%;
        }

        .chatbot-modBody img {
          width: 32px;
          height: 32px;
        }

        .suggestQs-container {
          padding: 11px;
        }

        .suggestQs-container .btn {
          font-size: 0.82rem;
          padding: 8px 13px;
        }

        .winIntro-mess {
          font-size: 1rem;
          margin-top: 1.5rem;
        }

        .cb-inputForm {
          font-size: 0.9rem;
        }

        .cb-sendBtn {
          width: 40px !important;
          height: 40px !important;
        }
      }


  

        /* Desktop: 1024px - 1439px */
        @media (min-width: 768px) and (max-width: 1439px) {
          .chatbot-modDialog {
            width: 85%;
            max-width: 950px;
          }

          .chatbot-modContent {
            height: 88vh;
            border-top-right-radius: 85px;
            border-bottom-left-radius: 70px;
          }

          .chatbot-modHeader {
            padding: 18px 24px;
            font-size: 1.15rem;
            border-top-right-radius: 42px;
          }

          .cb-sidebar-body {
            width: 260px;
            padding: 22px 18px;
            border-bottom-left-radius: 40px;
          }

          .newChat-btn {
            font-size: 16px !important;
            padding: 12px 20px;
            margin-bottom: 3.5rem !important;
          }

          .cb-sidebar-body h6 {
            font-size: 1rem;
            margin-bottom: 14px;
          }

          .active-chat,
          .inactive-chat {
            height: 54px;
            font-size: 0.92rem;
          }

          .chat-messages {
            padding: 19px !important;
          }

          .chatbot-modBody .justify-content-end .rounded,
          .chatbot-modBody .justify-content-start .rounded {
            font-size: 0.94rem;
            padding: 12px 16px !important;
            max-width: 70%;
          }

          .chatbot-modBody img {
            width: 34px;
            height: 34px;
          }

          .suggestQs-container {
            padding: 12px;
          }

          .suggestQs-container .btn {
            font-size: 0.84rem;
            padding: 9px 15px;
          }

          .winIntro-mess {
            font-size: 1.1rem;
            margin-top: 1.9rem;
          }

          .cb-inputForm {
            font-size: 0.94rem;
          }

          .cb-sendBtn {
            width: 40px !important;
            height: 40px !important;
          }
        }

        /* Large Desktop: 1440px and above */
        @media (min-width: 1440px) {
          .chatbot-modDialog {
            width: 80%;
            max-width: 1200px;
          }

          .chatbot-modContent {
            height: 90vh;
            border-top-right-radius: 100px;
            border-bottom-left-radius: 80px;
          }

          .chatbot-modHeader {
            padding: 20px 28px;
            font-size: 1.25rem;
            border-top-right-radius: 50px;
          }

          .cb-sidebar-body {
            width: 300px;
            padding: 28px 22px;
            border-bottom-left-radius: 50px;
          }

          .newChat-btn {
            font-size: 18px !important;
            padding: 14px 24px;
            margin-bottom: 4rem !important;
          }

          .cb-sidebar-body h6 {
            font-size: 1.05rem;
            margin-bottom: 16px;
          }

          .active-chat,
          .inactive-chat {
            height: 58px;
            font-size: 0.98rem;
            padding: 12px !important;
          }

          .chat-messages {
            padding: 22px !important;
          }

          .chatbot-modBody .justify-content-end .rounded,
          .chatbot-modBody .justify-content-start .rounded {
            font-size: 1rem;
            padding: 13px 18px !important;
            max-width: 68%;
          }

          .chatbot-modBody img {
            width: 38px;
            height: 38px;
          }

          .suggestQs-container {
            padding: 14px;
          }

          .suggestQs-container .btn {
            font-size: 0.9rem;
            padding: 10px 18px;
          }

          .winIntro-mess {
            font-size: 1.2rem;
            margin-top: 2.2rem;
          }

          .cb-inputForm {
            font-size: 1rem;
            padding: 12px !important;
          }

          .cb-sendBtn {
            width: 44px !important;
            height: 44px !important;
          }

          .chatbot-input {
            padding: 14px;
          }
        }
      `}</style>

      <div
        className="modal show d-block"
        tabIndex={-1}
        role="dialog"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
      >
        <div className="modal-dialog modal-dialog-centered chatbot-modDialog">
          <div className="modal-content chatbot-modContent">
            <div className="modal-header chatbot-modHeader">
              <button
                className="hamburger-btn"
                onClick={() => setSidebarVisible(!sidebarVisible)}
                aria-label="Toggle sidebar"
              >
                {sidebarVisible ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h5 className="modal-title chatbot-modTitle">Aniko Smart AI</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => window.location.reload()} />
            </div>

            <div className="modal-body chatbot-modBody p-0" style={{ height: "100%" }}>
              <div
                className={`sidebar-overlay ${sidebarVisible ? "active" : ""}`}
                onClick={() => setSidebarVisible(false)}
              />

              <div className="d-flex" style={{ height: "100%" }}>
                {/* Sidebar */}
                <div className={`cb-sidebar-body ${sidebarVisible ? "visible" : ""}`}>
                  <button
                    className="btn btn-outline-primary btn-sm w-100 mb-3 newChat-btn"
                    onClick={() => {
                      newChat()
                      setSidebarVisible(false)
                    }}
                  >
                    <i className="bi bi-pencil-square"></i> <strong>New Chat</strong>
                  </button>

                  <h6 className="text-muted historyHeader">Chats</h6>
                  <ul className="list-unstyled m-0 p-0">
                    {sessions
                      .filter((s) => s.messages.length > 0)
                      .map((session) => (
                        <li key={session.id} style={{ position: "relative" }}>
                          <div
                            onClick={() => {
                              switchChat(session.id)
                              setSidebarVisible(false)
                            }}
                            className={session.id === activeSessionId ? "active-chat" : "inactive-chat"}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "100%",
                              padding: "0 10px",
                              borderRadius: "6px",
                              border: "1px solid #ddd",
                              marginBottom: "8px",
                              cursor: "pointer",
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
                    {suggested.length > 0 &&
                      (!activeSession?.messages.length || activeSession.messages.length === 0) && (
                        <div className="p-2 border-top mt-3 suggestQs-container">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold small">Suggested Questions</span>
                            <RotateCw size={18} style={{ cursor: "pointer" }} onClick={refreshSuggestions} />
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
                    {(!activeSession?.messages || activeSession.messages.length === 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="fw-bold fs-5 winIntro-mess"
                      >
                        Hello, I'm <span className="text-primary aniko-winHeader">Aniko</span>, here to assist you
                        today!
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
    </>
  )
}

export default Chatbox
