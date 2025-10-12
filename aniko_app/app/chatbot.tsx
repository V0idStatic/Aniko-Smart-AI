// chatbot.tsx - Enhanced Professional Version with Responsive Design

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
  Modal,
  FlatList,
  Alert,
  StyleSheet,
  Keyboard,
  Dimensions,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const scrollViewRef = useRef<ScrollView>(null);

  const STORAGE_KEY = `chatHistory_${userId}`;

  // Responsive breakpoints
  const { width: screenWidth, height: screenHeight } = screenData;
  const isSmallDevice = screenWidth < 375;
  const isMediumDevice = screenWidth >= 375 && screenWidth < 414;
  const isLargeDevice = screenWidth >= 414;
  const isTablet = screenWidth > 768;

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

  // Screen size listener
  useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  // Improved keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        // Auto scroll to bottom when keyboard opens
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        // Shorter delay to prevent space issues
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

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

  // Responsive styles
  const styles = StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: "#F8F9FA",
    },
    container: {
      flex: 1,
      backgroundColor: "#F8F9FA",
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: isTablet ? 24 : 16,
      paddingVertical: isTablet ? 20 : 16,
      backgroundColor: "#1c4722",
      borderBottomLeftRadius: isTablet ? 32 : 24,
      borderBottomRightRadius: isTablet ? 32 : 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1,
    },
    burgerBtn: {
      padding: isTablet ? 12 : 8,
      marginTop: 20, 
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 20, 
    },
    headerTitle: {
      fontSize: isTablet ? 28 : isSmallDevice ? 20 : 22,
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
      fontSize: isTablet ? 18 : 16,
      color: "#7F8C8D",
      fontWeight: "500",
    },
    messages: {
      flex: 1,
      backgroundColor: "#F8F9FA",
    },
    messageWrapper: {
      flexDirection: "row",
      marginBottom: isTablet ? 20 : 16,
      alignItems: "flex-end",
      paddingHorizontal: isTablet ? 8 : 0,
    },
    userMessageWrapper: {
      justifyContent: "flex-end",
    },
    botMessageWrapper: {
      justifyContent: "flex-start",
    },
    botAvatar: {
      width: isTablet ? 40 : 32,
      height: isTablet ? 40 : 32,
      borderRadius: isTablet ? 20 : 16,
      backgroundColor: "#1c4722",
      justifyContent: "center",
      alignItems: "center",
      marginRight: isTablet ? 12 : 8,
    },
    msg: {
      maxWidth: isTablet ? "60%" : "75%",
      paddingHorizontal: isTablet ? 20 : 16,
      paddingVertical: isTablet ? 16 : 12,
      borderRadius: isTablet ? 24 : 20,
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
      fontSize: isTablet ? 17 : isSmallDevice ? 14 : 15,
      lineHeight: isTablet ? 26 : isSmallDevice ? 20 : 22,
      color: "#2C3E50",
    },
    userMsgText: {
      color: "#FFFFFF",
    },
    typingContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: isTablet ? 20 : 16,
    },
    typingBubble: {
      backgroundColor: "#FFFFFF",
      paddingHorizontal: isTablet ? 20 : 16,
      paddingVertical: isTablet ? 16 : 12,
      borderRadius: isTablet ? 24 : 20,
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
      width: isTablet ? 10 : 8,
      height: isTablet ? 10 : 8,
      borderRadius: isTablet ? 5 : 4,
      backgroundColor: "#95A5A6",
    },
    dot1: {},
    dot2: {},
    dot3: {},
    inputWrapperContainer: {
      position: 'relative',
    },
    inputBackground: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: Platform.OS === 'android' ? 120 : 100,
      backgroundColor: "#FFFFFF",
      zIndex: 1,
    },
    inputWrapper: {
      backgroundColor: "#FFFFFF",
      paddingHorizontal: isTablet ? 24 : 16,
      paddingVertical: isTablet ? 16 : 12,
      paddingBottom: Platform.OS === 'android' ? (isTablet ? 40 : 30) : (isTablet ? 24 : 16),
      borderTopWidth: 1,
      borderTopColor: "#E8ECEF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 2,
      minHeight: isTablet ? 80 : isSmallDevice ? 60 : 68,
      position: 'relative',
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: isTablet ? 16 : 12,
    },
    input: {
      flex: 1,
      backgroundColor: "#F8F9FA",
      borderRadius: isTablet ? 28 : 24,
      paddingHorizontal: isTablet ? 24 : 18,
      paddingVertical: isTablet ? 14 : 10,
      fontSize: isTablet ? 17 : isSmallDevice ? 14 : 15,
      color: "#2C3E50",
      maxHeight: isTablet ? 120 : isSmallDevice ? 70 : 80,
      minHeight: isTablet ? 50 : isSmallDevice ? 36 : 40,
      borderWidth: 1,
      borderColor: "#E8ECEF",
      textAlignVertical: 'center',
    },
    sendBtn: {
      width: isTablet ? 56 : isSmallDevice ? 44 : 48,
      height: isTablet ? 56 : isSmallDevice ? 44 : 48,
      borderRadius: isTablet ? 28 : isSmallDevice ? 22 : 24,
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
      paddingHorizontal: isTablet ? 48 : 24,
      backgroundColor: "#F8F9FA",
    },
    iconContainer: {
      width: isTablet ? 140 : 120,
      height: isTablet ? 140 : 120,
      borderRadius: isTablet ? 70 : 60,
      backgroundColor: "#D8F3DC",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: isTablet ? 32 : 24,
      shadowColor: "#1c4722",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    title: {
      fontSize: isTablet ? 40 : isSmallDevice ? 28 : 32,
      fontWeight: "800",
      color: "#2D6A4F",
      marginBottom: isTablet ? 16 : 12,
      letterSpacing: 0.5,
      textAlign: "center",
    },
    subtitle: {
      textAlign: "center",
      color: "#7F8C8D",
      fontSize: isTablet ? 18 : isSmallDevice ? 14 : 16,
      lineHeight: isTablet ? 28 : isSmallDevice ? 20 : 24,
      marginBottom: isTablet ? 48 : 40,
      paddingHorizontal: isTablet ? 24 : 16,
    },
    suggestionContainer: {
      width: "100%",
    },
    suggestionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: isTablet ? 20 : 16,
      paddingHorizontal: 4,
    },
    suggestionTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: "700",
      color: "#2C3E50",
    },
    refreshBtn: {
      padding: isTablet ? 12 : 8,
      borderRadius: isTablet ? 24 : 20,
      backgroundColor: "#D8F3DC",
    },
    suggestionBtn: {
      width: "100%",
      backgroundColor: "#FFFFFF",
      padding: isTablet ? 20 : 16,
      borderRadius: isTablet ? 20 : 16,
      marginBottom: isTablet ? 16 : 12,
      flexDirection: "row",
      alignItems: "center",
      gap: isTablet ? 16 : 12,
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
      fontSize: isTablet ? 16 : isSmallDevice ? 13 : 14,
      lineHeight: isTablet ? 24 : 20,
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
      width: isTablet ? "60%" : "80%",
      backgroundColor: "#FFFFFF",
      paddingTop: isTablet ? 80 : 60,
      paddingHorizontal: isTablet ? 32 : 20,
      paddingBottom: isTablet ? 32 : 20,
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
      marginBottom: isTablet ? 32 : 24,
      paddingBottom: isTablet ? 20 : 16,
      borderBottomWidth: 1,
      borderBottomColor: "#E8ECEF",
    },
    historyTitle: {
      fontSize: isTablet ? 28 : 24,
      fontWeight: "800",
      color: "#2C3E50",
      marginBottom: 4,
    },
    historySubtitle: {
      fontSize: isTablet ? 16 : 14,
      color: "#7F8C8D",
      fontWeight: "500",
    },
    closeBtn: {
      padding: isTablet ? 8 : 4,
    },
    historyCard: {
      marginBottom: isTablet ? 16 : 12,
      padding: isTablet ? 20 : 16,
      borderRadius: isTablet ? 20 : 16,
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
      gap: isTablet ? 12 : 8,
      marginBottom: isTablet ? 12 : 8,
    },
    historyDate: {
      fontSize: isTablet ? 14 : 12,
      color: "#95A5A6",
      fontWeight: "500",
    },
    historyTitleText: {
      fontSize: isTablet ? 18 : 16,
      color: "#2C3E50",
      fontWeight: "600",
      marginBottom: isTablet ? 8 : 6,
      lineHeight: isTablet ? 26 : 22,
    },
    activeHistoryTitle: {
      color: "#1c4722",
    },
    messageCount: {
      fontSize: isTablet ? 14 : 12,
      color: "#7F8C8D",
      fontWeight: "500",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: isTablet ? 80 : 60,
    },
    noHistory: {
      textAlign: "center",
      color: "#7F8C8D",
      marginTop: isTablet ? 20 : 16,
      fontSize: isTablet ? 18 : 16,
      fontWeight: "600",
    },
    noHistorySubtext: {
      textAlign: "center",
      color: "#95A5A6",
      marginTop: isTablet ? 12 : 8,
      fontSize: isTablet ? 16 : 14,
    },
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSidePanelVisible(true)} style={styles.burgerBtn}>
              <Ionicons name="menu" size={isTablet ? 30 : 26} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>AniKo Chatbot</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* MAIN CONTENT AREA - Fixed keyboard behavior */}
          {Platform.OS === "ios" ? (
            <KeyboardAvoidingView
              behavior="padding"
              style={styles.keyboardAvoidingView}
              keyboardVerticalOffset={Platform.OS === 'ios' ? (isSmallDevice ? 5 : isTablet ? 20 : 10) : 0}
            >
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
                        <Ionicons name="refresh-outline" size={isTablet ? 24 : 20} color="#2D6A4F" />
                      </TouchableOpacity>
                    </View>

                    {suggestions.map((q, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setInput(q)}
                        style={introStyles.suggestionBtn}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="lightbulb-on-outline" size={isTablet ? 22 : 18} color="#40916C" />
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
                    contentContainerStyle={{ 
                      paddingVertical: isTablet ? 24 : 16, 
                      paddingHorizontal: isTablet ? 24 : 16,
                      paddingBottom: 16,
                      flexGrow: 1
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    maintainVisibleContentPosition={{
                      minIndexForVisible: 0,
                      autoscrollToTopThreshold: 10,
                    }}
                    onContentSizeChange={() => {
                      if (!isKeyboardVisible) {
                        scrollViewRef.current?.scrollToEnd({ animated: false });
                      }
                    }}
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
                            <MaterialCommunityIcons name="sprout" size={isTablet ? 20 : 16} color="#FFFFFF" />
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
                          <MaterialCommunityIcons name="sprout" size={isTablet ? 20 : 16} color="#FFFFFF" />
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

              {/* INPUT with background extension */}
              <View style={styles.inputWrapperContainer}>
                <View style={styles.inputBackground} />
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
                      onFocus={() => {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                      }}
                      blurOnSubmit={false}
                      returnKeyType="send"
                      enablesReturnKeyAutomatically={true}
                      textAlignVertical="center"
                    />
                    <TouchableOpacity
                      onPress={sendMessage}
                      style={[styles.sendBtn, (!dataLoaded || !input.trim()) && styles.sendBtnDisabled]}
                      disabled={loading || !dataLoaded || !input.trim()}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="send" size={isTablet ? 24 : 20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          ) : (
            /* ANDROID LAYOUT - Different approach to prevent space issues */
            <View style={styles.keyboardAvoidingView}>
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
                        <Ionicons name="refresh-outline" size={isTablet ? 24 : 20} color="#2D6A4F" />
                      </TouchableOpacity>
                    </View>

                    {suggestions.map((q, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setInput(q)}
                        style={introStyles.suggestionBtn}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="lightbulb-on-outline" size={isTablet ? 22 : 18} color="#40916C" />
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
                    style={[
                      styles.messages,
                      isKeyboardVisible && {
                        marginBottom: keyboardHeight - (isSmallDevice ? 30 : isTablet ? 60 : 40)
                      }
                    ]}
                    contentContainerStyle={{ 
                      paddingVertical: isTablet ? 24 : 16, 
                      paddingHorizontal: isTablet ? 24 : 16,
                      paddingBottom: 16,
                      flexGrow: 1
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    maintainVisibleContentPosition={{
                      minIndexForVisible: 0,
                      autoscrollToTopThreshold: 10,
                    }}
                    onContentSizeChange={() => {
                      if (!isKeyboardVisible) {
                        scrollViewRef.current?.scrollToEnd({ animated: false });
                      }
                    }}
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
                            <MaterialCommunityIcons name="sprout" size={isTablet ? 20 : 16} color="#FFFFFF" />
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
                          <MaterialCommunityIcons name="sprout" size={isTablet ? 20 : 16} color="#FFFFFF" />
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

              {/* INPUT with background extension for Android */}
              <View style={[
                styles.inputWrapperContainer,
                isKeyboardVisible && {
                  position: 'absolute',
                  bottom: keyboardHeight + (isSmallDevice ? 5 : isTablet ? 15 : 10),
                  left: 0,
                  right: 0,
                }
              ]}>
                <View style={[
                  styles.inputBackground,
                  isKeyboardVisible && {
                    height: Platform.OS === 'android' ? 150 : 100,
                  }
                ]} />
                <View style={[
                  styles.inputWrapper,
                  isKeyboardVisible && {
                    paddingBottom: Platform.OS === 'android' ? (isTablet ? 50 : 40) : (isTablet ? 24 : 16),
                  }
                ]}>
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
                      onFocus={() => {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                      }}
                      blurOnSubmit={false}
                      returnKeyType="send"
                      enablesReturnKeyAutomatically={true}
                      textAlignVertical="center"
                    />
                    <TouchableOpacity
                      onPress={sendMessage}
                      style={[styles.sendBtn, (!dataLoaded || !input.trim()) && styles.sendBtnDisabled]}
                      disabled={loading || !dataLoaded || !input.trim()}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="send" size={isTablet ? 24 : 20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

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
                    <Ionicons name="close" size={isTablet ? 28 : 24} color="#2C3E50" />
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
                            size={isTablet ? 22 : 18}
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
                      <MaterialCommunityIcons name="chat-outline" size={isTablet ? 60 : 48} color="#BDC3C7" />
                      <Text style={modalStyles.noHistory}>No conversations yet</Text>
                      <Text style={modalStyles.noHistorySubtext}>Start chatting to see your history here</Text>
                    </View>
                  }
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </>
  );
}