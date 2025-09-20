import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HeaderProps {
  username: string;
  greeting: string;
  onLogout: () => void;
}

export default function Header({ username, greeting, onLogout }: HeaderProps) {
  return (
    <View style={styles.headerTop}>
      <View>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.greeting}>{username || "User"}</Text>
      </View>

      <View style={styles.headerIcons}>
        <Ionicons name="notifications-outline" size={22} color="white" />
        <TouchableOpacity onPress={onLogout} style={{ marginLeft: 12 }}>
          <Ionicons name="log-out-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 40,
  },

  
  greeting: { color: "white", fontSize: 18, fontWeight: "bold" },
  headerIcons: { flexDirection: "row", alignItems: "center" },
});
