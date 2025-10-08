import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  fetchAllCropParameters,
  formatCropDataForAI,
  CropParameter,
  formatSingleCropForAI,
} from "../services/cropDataService";

const { width } = Dimensions.get("window");

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cropData, setCropData] = useState<CropParameter[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isPanelVisible, setPanelVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;

  // Load crop data
  useEffect(() => {
    loadCropData();
  }, []);

  const loadCropData = async () => {
    try {
      console.log("📦 Loading crop parameters...");
      const data = await fetchAllCropParameters();
      setCropData(data);
      setDataLoaded(true);
      console.log(`✅ Loaded ${data.length} crop parameters`);
    } catch (err) {
      console.error("Failed to load crop data:", err);
    }
  };

  // Detect specific crop
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

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Save to history preview
    setChatHistory((prev) => [
      ...prev,
      userMessage.text.length > 30
        ? userMessage.text.slice(0, 30) + "..."
        : userMessage.text,
    ]);

    try {
      const cropInfo = await detectCropQuery(userMessage.text);
      if (cropInfo) {
        setMessages((prev) => [...prev, { role: "assistant", text: cropInfo }]);
        setLoading(false);
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
          Authorization: "Bearer ", // Add your API key
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
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
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `⚠️ Error: ${err.message || err}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Welcome message
  useEffect(() => {
    if (dataLoaded && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: `Hello! I'm Aniko 🌱 your Smart Agriculture Assistant.

I have information on ${cropData.length} different crops including vegetables, fruits, and rice varieties.

Ask me things like:
• What are the requirements for tomato?
• NPK levels for eggplant?
• Best temperature for mango?

How can I help you today?`,
        },
      ]);
    }
  }, [dataLoaded]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Toggle panel animation
  const togglePanel = () => {
    Animated.timing(slideAnim, {
      toValue: isPanelVisible ? -width * 0.7 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setPanelVisible(!isPanelVisible));
  };

  const clearHistory = () => setChatHistory([]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      {/* Overlay when panel is open */}
      {isPanelVisible && (
        <TouchableWithoutFeedback onPress={togglePanel}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Side Panel */}
      <Animated.View
        style={[
          styles.sidePanel,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <Text style={styles.panelTitle}>Chat History</Text>
        <ScrollView style={{ marginTop: 10 }}>
          {chatHistory.length > 0 ? (
            chatHistory.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <Ionicons name="chatbox-ellipses-outline" size={20} color="#2E7D32" />
                <Text style={styles.historyText}>{item}</Text>
                
              </View>
            ))
          ) : (
            <Text style={styles.noHistory}>No chats yet</Text>
          )}
        </ScrollView>

        {chatHistory.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
            <MaterialCommunityIcons name="delete-outline" size={18} color="#fff" />
            <Text style={styles.clearBtnText}>Clear History</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={togglePanel} style={styles.burgerBtn}>
          <Ionicons name="menu" size={26} color="#f5f5f0" />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
       
          <Text style={styles.headerTitle}>Aniko Smart AI</Text>
        
        </View>
      </View>

      {!dataLoaded ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c9332ff" />
          <Text style={styles.loadingText}>Loading crop database...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messages}
          contentContainerStyle={{ paddingVertical: 10 }}
        >
          {messages.map((m, i) => (
            <View
              key={i}
              style={[
                styles.msg,
                m.role === "user" ? styles.userMsg : styles.botMsg,
              ]}
            >
              {m.role === "assistant" && (
                <MaterialCommunityIcons
                  name="robot-outline"
                  size={18}
                  color="#2E7D32"
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                style={[
                  styles.msgText,
                  m.role === "assistant" && { color: "#1b1b1b" },
                ]}
              >
                {m.text}
              </Text>
            </View>
          ))}
          {loading && (
            <View style={styles.typingContainer}>
              <MaterialCommunityIcons
                name="dots-horizontal"
                size={24}
                color="#4d7f39"
              />
              <Text style={styles.typingText}>Aniko is thinking...</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Input Section */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask about crops, soil, or farming tips..."
          placeholderTextColor="#888"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          multiline
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={[styles.sendBtn, !dataLoaded && { opacity: 0.5 }]}
          disabled={loading || !dataLoaded}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f0",
  },
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 10,
  },
  sidePanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: "#fff",
    padding: 16,
    zIndex: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E7D32",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  historyText: {
    marginLeft: 10,
    color: "#333",
  },
  noHistory: {
    marginTop: 20,
    textAlign: "center",
    color: "#777",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    padding: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  clearBtnText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
  burgerBtn: {
    marginRight: 10,
  },
header: {
  flexDirection: "row",
  alignItems: "center",
  paddingTop: 20,
  paddingHorizontal: 16,
  paddingBottom: 12,
  backgroundColor: "#1b5e20",
  borderBottomWidth: 1,
  borderColor: "#C8E6C9",
  elevation: 3,
},
headerLeft: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  flex: 1,
},

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f5f5f0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#1c4722",
  },
  messages: {
    flex: 1,
    paddingHorizontal: 15,
  },
  msg: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 14,
    marginVertical: 6,
    maxWidth: "85%",
    alignItems: "center",
  },
  userMsg: {
    alignSelf: "flex-end",
    backgroundColor: "#4d7f39",
    borderBottomRightRadius: 2,
  },
  botMsg: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe6e0",
    borderBottomLeftRadius: 2,
  },
  msgText: {
    color: "white",
    fontSize: 15,
    lineHeight: 20,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 15,
    marginVertical: 6,
  },
  typingText: {
    color: "#4d7f39",
    fontStyle: "italic",
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    color: "#000",
    maxHeight: 100,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#2E7D32",
    padding: 10,
    borderRadius: 25,
  },
});
