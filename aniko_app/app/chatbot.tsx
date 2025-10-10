// chatbot.tsx - Enhanced Professional Version

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  FlatList,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  fetchAllCropParameters,
  formatCropDataForAI,
  CropParameter,
  formatSingleCropForAI,
} from "../services/cropDataService";
import { Stack } from "expo-router";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: string;
};

interface ChatbotProps {
  userId: string;
}

export default function Chatbot({ userId }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cropData, setCropData] = useState<CropParameter[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const STORAGE_KEY = `chatHistory_${userId}`;

  const agricultureQuestions = [
    "What are the ideal conditions for growing tomatoes?",
    "How often should I water my rice crops?",
    "What is the best soil pH for corn?",
    "What fertilizer should I use for eggplant?",
    "How can I prevent pests on my lettuce farm?",
    "When is the best season to plant sugarcane?",
    "What is the NPK requirement for cabbage?",
    "How can I improve soil fertility naturally?",
    "What crops grow best in dry climate areas?",
    "How do I manage irrigation for peanut farming?",
  ];

  useEffect(() => {
    loadCropData();
    loadChatHistory();
    refreshSuggestions();
  }, [userId]);

  const refreshSuggestions = () => {
    const shuffled = [...agricultureQuestions].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 4));
  };

  const loadCropData = async () => {
    try {
      const data = await fetchAllCropParameters();
      setCropData(data);
      setDataLoaded(true);
    } catch (err) {
      setDataLoaded(false);
      console.error("Failed to load crop data:", err);
    }
  };

  const loadChatHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setChatHistory(JSON.parse(stored));
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const saveChatHistory = async (updatedHistory: ChatSession[]) => {
    try {
      setChatHistory(updatedHistory);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (err) {
      console.error("Failed to save chat history:", err);
    }
  };

  const detectCropQuery = async (userMessage: string): Promise<string | null> => {
    const lowerMsg = userMessage.toLowerCase();
    const cropKeywords = [
      "what is",
      "tell me about",
      "information about",
      "details of",
      "requirements for",
      "how to grow",
      "optimal conditions for",
      "temperature for",
      "ph level for",
      "npk for",
    ];
    const isCropQuery = cropKeywords.some((keyword) => lowerMsg.includes(keyword));

    if (isCropQuery) {
      for (const crop of cropData) {
        const cropNameLower = crop.crop_name.toLowerCase();
        if (lowerMsg.includes(cropNameLower)) {
          return formatSingleCropForAI(crop);
        }
      }
    }
    return null;
  };

  const detectSmallTalk = (userMessage: string): string | null => {
    const msg = userMessage.toLowerCase();
    if (/^(hi|hello|hey)\b/.test(msg))
      return "Hello there! I'm Aniko, your friendly Smart Agriculture Assistant. How can I help you with crops or farming today?";
    if (msg.includes("my name is")) {
      const name = msg.split("my name is")[1]?.trim().split(" ")[0];
      if (name)
        return `Nice to meet you, ${name.charAt(0).toUpperCase() + name.slice(1)}! What crop would you like to know about?`;
      return "Nice to meet you! What crop would you like to learn about?";
    }
    if (msg.includes("thank") || msg.includes("thanks"))
      return "You're welcome! Always happy to help!";
    if (msg.includes("how are you"))
      return "I'm just a bot, but I'm feeling productive today!";
    if (msg.includes("who are you"))
      return "I'm Aniko, an AI agriculture assistant for Filipino farmers.";
    return null;
  };

  const isAgricultureRelated = (userMessage: string): boolean => {
    const msg = userMessage.toLowerCase();
    const agriWords = [
      "crop",
      "soil",
      "fertilizer",
      "farming",
      "plant",
      "seed",
      "harvest",
      "climate",
      "weather",
      "irrigation",
      "ph",
      "temperature",
      "fruit",
      "vegetable",
      "field",
      "water",
      "grow",
      "agriculture",
      "farm",
      "compost",
      "organic",
      "npk",
      "pesticide",
      "disease",
    ];
    return agriWords.some((word) => msg.includes(word));
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const smallTalk = detectSmallTalk(userMessage.text);
      if (smallTalk) {
        addBotReply(smallTalk);
        return;
      }

      if (!isAgricultureRelated(userMessage.text)) {
        addBotReply(
          "Hmm... That doesn't sound related to agriculture. I can help you with crop requirements, soil nutrients, or farming tips! 🌾"
        );
        return;
      }

      const cropInfo = await detectCropQuery(userMessage.text);
      if (cropInfo) {
        addBotReply(cropInfo);
        return;
      }

      const cropContext = formatCropDataForAI(cropData);
      const systemPrompt = `
        You are Aniko, an AI assistant specialized in agriculture in the Philippines.
        Use this data to answer accurately about crops, climate, and soil conditions.
        ${cropContext}
      `;

      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage.text },
          ],
          max_tokens: 1000,
        }),
      });

      const data = await resp.json();
      const reply =
        data?.choices?.[0]?.message?.content ||
        data?.error?.message ||
        "No response from Aniko.";
      addBotReply(reply);
    } catch (err: any) {
      addBotReply(`Error: ${err.message || err}`);
    }
  };

  const addBotReply = async (reply: string) => {
    setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    setLoading(false);
    await saveSessionMessages([...messages, { role: "assistant", text: reply }]);
  };

  const saveSessionMessages = async (newMessages: ChatMessage[]) => {
    let updatedHistory = [...chatHistory];
    if (activeChatId) {
      updatedHistory = updatedHistory.map((s) =>
        s.id === activeChatId ? { ...s, messages: newMessages } : s
      );
    } else {
      const newId = Date.now().toString();
      const newSession: ChatSession = {
        id: newId,
        title: await generateChatTitle(newMessages[0].text),
        messages: newMessages,
        timestamp: new Date().toLocaleString(),
      };
      updatedHistory.unshift(newSession);
      setActiveChatId(newId);
    }
    await saveChatHistory(updatedHistory);
  };

  const generateChatTitle = async (prompt: string): Promise<string> => {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "Generate a short, descriptive title (max 5 words) summarizing this user's message about agriculture.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 20,
        }),
      });
      const data = await resp.json();
      return data?.choices?.[0]?.message?.content?.trim() || "New Chat";
    } catch {
      return "New Chat";
    }
  };

  const reopenChat = (session: ChatSession) => {
    setActiveChatId(session.id);
    setMessages(session.messages);
    setSidePanelVisible(false);
  };

  const deleteChat = async (index: number) => {
    Alert.alert("Delete Chat", "Are you sure you want to delete this chat?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = chatHistory.filter((_, i) => i !== index);
          await saveChatHistory(updated);
          if (chatHistory[index].id === activeChatId) {
            setMessages([]);
            setActiveChatId(null);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSidePanelVisible(true)} style={styles.burgerBtn}>
              <Ionicons name="menu" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
           
              <Text style={styles.headerTitle}>AniKo Chatbot</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* INTRODUCTORY VIEW */}
          {messages.length === 0 && (
            <View style={introStyles.container}>
              <Text style={introStyles.title}>Welcome to Aniko</Text>
              <Text style={introStyles.subtitle}>
                Your intelligent agriculture companion. Get expert advice on crops, soil health, and sustainable farming practices.
              </Text>

              {/* Recommended Questions */}
              <View style={introStyles.suggestionContainer}>
                <View style={introStyles.suggestionHeader}>
                  <Text style={introStyles.suggestionTitle}>Suggested Questions</Text>
                  <TouchableOpacity onPress={refreshSuggestions} style={introStyles.refreshBtn}>
                    <Ionicons name="refresh-outline" size={20} color="#2D6A4F" />
                  </TouchableOpacity>
                </View>

                {suggestions.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setInput(q)}
                    style={introStyles.suggestionBtn}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#40916C" />
                    <Text style={introStyles.suggestionText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* MESSAGES */}
          {messages.length > 0 && (
            !dataLoaded ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2D6A4F" />
                <Text style={styles.loadingText}>Loading crop database...</Text>
              </View>
            ) : (
              <ScrollView
                ref={scrollViewRef}
                style={styles.messages}
                contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {messages.map((m, i) => (
                  <View
                    key={i}
                    style={[
                      styles.messageWrapper,
                      m.role === "user" ? styles.userMessageWrapper : styles.botMessageWrapper,
                    ]}
                  >
                    {m.role === "assistant" && (
                      <View style={styles.botAvatar}>
                        <MaterialCommunityIcons name="sprout" size={16} color="#FFFFFF" />
                      </View>
                    )}
                    <View
                      style={[
                        styles.msg,
                        m.role === "user" ? styles.userMsg : styles.botMsg,
                      ]}
                    >
                      <Text style={[styles.msgText, m.role === "user" && styles.userMsgText]}>
                        {m.text}
                      </Text>
                    </View>
                    {m.role === "user" && <View style={{ width: 8 }} />}
                  </View>
                ))}
                {loading && (
                  <View style={styles.typingContainer}>
                    <View style={styles.botAvatar}>
                      <MaterialCommunityIcons name="sprout" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.typingBubble}>
                      <View style={styles.typingDots}>
                        <View style={[styles.dot, styles.dot1]} />
                        <View style={[styles.dot, styles.dot2]} />
                        <View style={[styles.dot, styles.dot3]} />
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            )
          )}

          {/* INPUT */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Ask about crops, soil, or farming..."
                placeholderTextColor="#95A5A6"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={sendMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={sendMessage}
                style={[styles.sendBtn, (!dataLoaded || !input.trim()) && styles.sendBtnDisabled]}
                disabled={loading || !dataLoaded || !input.trim()}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* SIDE PANEL */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={sidePanelVisible}
            onRequestClose={() => setSidePanelVisible(false)}
          >
            <View style={modalStyles.overlay}>
              <TouchableOpacity
                style={modalStyles.overlayTouchable}
                activeOpacity={1}
                onPress={() => setSidePanelVisible(false)}
              />
              <View style={modalStyles.sidePanel}>
                <View style={modalStyles.panelHeader}>
                  <View>
                    <Text style={modalStyles.historyTitle}>Chat History</Text>
                    <Text style={modalStyles.historySubtitle}>{chatHistory.length} conversations</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSidePanelVisible(false)}
                    style={modalStyles.closeBtn}
                  >
                    <Ionicons name="close" size={24} color="#2C3E50" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={chatHistory}
                  keyExtractor={(_, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      onLongPress={() => deleteChat(index)}
                      onPress={() => reopenChat(item)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        modalStyles.historyCard,
                        item.id === activeChatId && modalStyles.activeHistoryCard
                      ]}>
                        <View style={modalStyles.historyCardHeader}>
                          <MaterialCommunityIcons
                            name="message-text-outline"
                            size={18}
                            color={item.id === activeChatId ? "#2D6A4F" : "#7F8C8D"}
                          />
                          <Text style={modalStyles.historyDate}>{item.timestamp}</Text>
                        </View>
                        <Text style={[
                          modalStyles.historyTitleText,
                          item.id === activeChatId && modalStyles.activeHistoryTitle
                        ]} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={modalStyles.messageCount}>
                          {item.messages.length} messages
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={modalStyles.emptyState}>
                      <MaterialCommunityIcons name="chat-outline" size={48} color="#BDC3C7" />
                      <Text style={modalStyles.noHistory}>No conversations yet</Text>
                      <Text style={modalStyles.noHistorySubtext}>Start chatting to see your history here</Text>
                    </View>
                  }
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#1c4722",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  burgerBtn: {
    padding: 8,
     marginTop: 20, 
  },
headerContent: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  marginTop: 20, 
},

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  messages: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessageWrapper: {
    justifyContent: "flex-end",
  },
  botMessageWrapper: {
    justifyContent: "flex-start",
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1c4722",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  msg: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMsg: {
    backgroundColor: "#1c4722",
    borderBottomRightRadius: 4,
    shadowColor: "#1c4722",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  botMsg: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#2C3E50",
  },
  userMsgText: {
    color: "#FFFFFF",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  typingDots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#95A5A6",
  },
  dot1: {},
  dot2: {},
  dot3: {},
  inputWrapper: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E8ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2C3E50",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#E8ECEF",
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1c4722",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1c4722",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: "#BDC3C7",
    shadowOpacity: 0,
    elevation: 0,
  },
});

const introStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F8F9FA",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#D8F3DC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#1c4722",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2D6A4F",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    textAlign: "center",
    color: "#7F8C8D",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  suggestionContainer: {
    width: "100%",
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#D8F3DC",
  },
  suggestionBtn: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E8ECEF",
  },
  suggestionText: {
    color: "#2C3E50",
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    fontWeight: "500",
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  overlayTouchable: {
    flex: 1,
  },
  sidePanel: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECEF",
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2C3E50",
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 14,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  closeBtn: {
    padding: 4,
  },
  historyCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeHistoryCard: {
    backgroundColor: "#D8F3DC",
    borderColor: "#2D6A4F",
  },
  historyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    color: "#95A5A6",
    fontWeight: "500",
  },
  historyTitleText: {
    fontSize: 16,
    color: "#2C3E50",
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 22,
  },
  activeHistoryTitle: {
    color: "#1c4722",
  },
  messageCount: {
    fontSize: 12,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noHistory: {
    textAlign: "center",
    color: "#7F8C8D",
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  noHistorySubtext: {
    textAlign: "center",
    color: "#95A5A6",
    marginTop: 8,
    fontSize: 14,
  },
});