import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Direct access to environment variable
      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      
      console.log("API Key found:", apiKey ? "Yes" : "No");
      
      if (!apiKey) {
        throw new Error("API key not found. Please check your .env file is in the correct location.");
      }

      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an AI assistant named Aniko specialized in agriculture.",
            },
            { role: "user", content: userMessage.text },
          ],
        }),
      });

      const data = await resp.json();
      console.log("OpenRouter raw response:", data);

      if (!resp.ok) {
        throw new Error(data.error?.message || `HTTP ${resp.status}`);
      }

      const reply =
        data?.choices?.[0]?.message?.content ||
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Aniko Smart AI</Text>

      <ScrollView style={styles.messages} contentContainerStyle={{ paddingBottom: 20 }}>
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
        {loading && <Text style={styles.loading}>Aniko is thinking…</Text>}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type your message"
          placeholderTextColor="#888"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
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
  messages: { flex: 1, paddingHorizontal: 15 },
  msg: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: "80%",
  },
  user: { alignSelf: "flex-end", backgroundColor: "#4d7f39" },
  bot: { alignSelf: "flex-start", backgroundColor: "#ccc" },
  msgText: { color: "white" },
  inputRow: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  input: { flex: 1, paddingHorizontal: 10, color: "#000" },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#4d7f39",
    padding: 10,
    borderRadius: 20,
  },
  loading: { alignSelf: "center", marginTop: 5, color: "#555" },
});