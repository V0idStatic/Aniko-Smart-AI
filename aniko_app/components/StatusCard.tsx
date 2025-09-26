import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatusCardProps {
  status: string;
  color: string;
  cropName?: string;
}

export default function StatusCard({ status, color, cropName }: StatusCardProps) {
  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status.toUpperCase()) {
      case "GOOD":
        return "checkmark-circle";
      case "WARNING":
      case "FAIR":
        return "warning";
      case "BAD":
        return "alert-circle";
      case "NO CROP":
        return "leaf-outline";
      default:
        return "help-circle";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status.toUpperCase()) {
      case "GOOD":
        return "Optimal conditions";
      case "WARNING":
        return "Needs attention";
      case "FAIR":
        return "Minor issues";
      case "BAD":
        return "Critical issues";
      case "NO CROP":
        return "Select a crop";
      default:
        return "Unknown status";
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={getStatusIcon(status)} size={24} color={color} />
        <Text style={[styles.status, { color }]}>{status}</Text>
      </View>

      <Text style={styles.cropName}>{cropName || "No Crop Selected"}</Text>

      <Text style={styles.message}>{getStatusMessage(status)}</Text>

      <View style={[styles.statusIndicator, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  cropName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    color: "#888",
  },
  statusIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 4,
    height: "100%",
  },
});
