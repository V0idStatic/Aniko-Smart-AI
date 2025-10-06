import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { 
  fetchAllCropParameters, 
  formatCropDataForAI,
  CropParameter,
  formatSingleCropForAI
} from "../services/cropDataService";

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

  // Load crop data when component mounts
  useEffect(() => {
    loadCropData();
  }, []);

  const loadCropData = async () => {
    console.log("📦 Loading crop parameters from database...");
    const data = await fetchAllCropParameters();
    setCropData(data);
    setDataLoaded(true);
    console.log(`✅ Loaded ${data.length} crop parameters`);
  };

  // Check if user is asking about a specific crop
  const detectCropQuery = async (userMessage: string): Promise<string | null> => {
    const lowerMsg = userMessage.toLowerCase();
    
    // Keywords that indicate crop query
    const cropKeywords = [
      'what is', 'tell me about', 'information about', 'details of',
      'requirements for', 'how to grow', 'optimal conditions for',
      'temperature for', 'ph level for', 'npk for'
    ];
    
    const isCropQuery = cropKeywords.some(keyword => lowerMsg.includes(keyword));
    
    if (isCropQuery) {
      // Try to find crop name in the message
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

    try {
      // Check if user is asking about a specific crop
      const cropInfo = await detectCropQuery(userMessage.text);
      
      if (cropInfo) {
        // If we found specific crop info, return it directly
        setMessages((prev) => [...prev, { role: "assistant", text: cropInfo }]);
        setLoading(false);
        return;
      }

      // Build context with crop database
      const cropContext = formatCropDataForAI(cropData);
      
      const systemPrompt = `You are Aniko, an AI assistant specialized in agriculture and farming in the Philippines.

You have access to a comprehensive crop database with 60 different crops including:
- Rice varieties (Lowland, Upland, Glutinous, Red Rice, Hybrid)
- Vegetables (Tomato, Eggplant, Kangkong, Cabbage, Lettuce, Onion, Garlic, Bell Pepper, Chili, etc.)
- Root crops (Sweet Potato, Cassava, Taro, Yam, Potato, Carrots)
- Fruits (Mango, Banana, Coconut, Papaya, Pineapple, Guava, Rambutan, Lanzones, Durian, etc.)
- Legumes (Mongo, Peanut, Soybeans, Cowpea)
- Cash crops (Sugarcane, Tobacco, Coffee, Cacao, Abaca)
- Herbs & Spices (Basil, Lemongrass, Ginger, Turmeric, Cilantro)
- Ornamental plants (Roses, Bougainvillea, Orchids, Sampaguita, Sunflower)

For each crop, you know:
- Optimal temperature range (°C)
- pH level range
- Moisture requirements (%)
- Soil moisture requirements (%)
- NPK (Nitrogen, Phosphorus, Potassium) requirements in ppm

When users ask about a specific crop, provide:
1. The crop category
2. Optimal growing conditions (temperature, pH, moisture)
3. Nutrient requirements (NPK values)
4. Tips for successful cultivation

Always answer in a friendly, helpful manner. Use emojis to make responses engaging.

${cropContext}`;

      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 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",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            { role: "user", content: userMessage.text },
          ],
          max_tokens: 1000, // Increase token limit for detailed responses
        }),
      });

      const data = await resp.json();
      console.log("OpenRouter response:", data);

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

  // Add welcome message when data is loaded
  useEffect(() => {
    if (dataLoaded && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: `👋 Hello! I'm Aniko, your smart agriculture assistant!\n\n🌾 I have information about ${cropData.length} different crops including vegetables, fruits, rice varieties, and more.\n\n💬 Ask me anything like:\n• "What are the requirements for tomato?"\n• "Tell me about rice varieties"\n• "Best temperature for mango?"\n• "NPK levels for eggplant?"\n\nHow can I help you today? 🌱`,
        },
      ]);
    }
  }, [dataLoaded]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🌾 Aniko Smart AI</Text>
      
      {!dataLoaded && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4d7f39" />
          <Text style={styles.loadingText}>Loading crop database...</Text>
        </View>
      )}

      <ScrollView 
        style={styles.messages} 
        contentContainerStyle={{ paddingBottom: 20 }}
        ref={(ref) => ref?.scrollToEnd({ animated: true })}
      >
        {messages.map((m, i) => (
          <View key={i} style={[styles.msg, m.role === "user" ? styles.user : styles.bot]}>
            <Text
              style={[
                styles.msgText,
                m.role === "assistant" && { color: "#000" },
              ]}
            >
              {m.text}
            </Text>
          </View>
        ))}
        {loading && <Text style={styles.loading}>🤔 Aniko is thinking…</Text>}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask about crops, weather, farming tips..."
          placeholderTextColor="#888"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          multiline
        />
        <TouchableOpacity 
          onPress={sendMessage} 
          style={styles.sendBtn}
          disabled={loading || !dataLoaded}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e7dbc8", paddingTop: 50 },
  header: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#1c4722",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#1c4722",
    fontSize: 14,
  },
  messages: { flex: 1, paddingHorizontal: 15 },
  msg: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: "80%",
  },
  user: { alignSelf: "flex-end", backgroundColor: "#4d7f39" },
  bot: { alignSelf: "flex-start", backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd" },
  msgText: { color: "white", fontSize: 14, lineHeight: 20 },
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
    paddingHorizontal: 10, 
    color: "#000",
    maxHeight: 100,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#4d7f39",
    padding: 10,
    borderRadius: 20,
  },
  loading: { 
    alignSelf: "center", 
    marginTop: 5, 
    color: "#555",
    fontStyle: "italic",
  },
});