import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"



interface StatusCardProps {
  status: string
  color: string
  cropName?: string
}

export const COLORS = {
  // Primary colors
  primaryGreen: "#1D492C",
  accentGreen: "#84cc16",
  pastelGreen: "#BDE08A",
  lightGreen: "#f0fdf4",
  darkGreen: "#143820",
  mutedGreen: "#4C6444",
  grayText: "#666",
  border: "#e0e0e0",
  white: "#ffffff",
  bgCOlor: "#cfc4b2ff",
  primaryBrown: "#8A6440",
  darkBrown: "#4D2D18",
  accent: "#FF6F00",
  accentLight: "#FFA726",
  background: "#CBBA9E",
  cardBackground: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",

  // Status colors
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#8a1c14ff",
  info: "#2196F3",
}

export default function StatusCard({ status, color, cropName }: StatusCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "GOOD":
        return "checkmark-circle"
      case "BAD":
        return "alert-circle"
      case "WARNING":
        return "warning"
      case "FAIR":
        return "information-circle"
      default:
        return "leaf-outline"
    }
  }

  const displayColor = status === "NO CROP" ? COLORS.lightGreen : color

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.pastelGreen, COLORS.mutedGreen]} style={styles.card}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: `${displayColor}30` }]}>
            <Ionicons name={getStatusIcon()} size={32} color={COLORS.darkGreen} />
          </View>

          <View style={styles.textContent}>
            <Text style={styles.label}>CROP STATUS</Text>
            <Text style={[styles.status, { color: displayColor }]}>{status}</Text>
            {cropName && <Text style={styles.cropName}>{cropName}</Text>}
            {!cropName && status === "NO CROP" && <Text style={styles.noCropHint}>Add a crop to monitor</Text>}
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 160,
  },
  card: {
    flex: 1,
    borderRadius: 10,
    borderTopRightRadius: 55,
    borderBottomLeftRadius: 55,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0
  },
  statusBar: {
    height: 6,
    width: "100%",
  },
  content: {
    padding: 20,
    flex: 1,
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  textContent: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.pastelGreen,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  status: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: COLORS.lightGreen
  },
  cropName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primaryGreen,
    marginTop: 1,
  },
  noCropHint: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.pastelGreen,
    marginTop: 2,
  },
})
