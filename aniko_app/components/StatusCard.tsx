import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface StatusCardProps {
  status: string
  color: string
  cropName?: string
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

  const displayColor = status === "NO CROP" ? "#6B7280" : color

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={[styles.statusBar, { backgroundColor: displayColor }]} />

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: `${displayColor}20` }]}>
            <Ionicons name={getStatusIcon()} size={32} color={displayColor} />
          </View>

          <View style={styles.textContent}>
            <Text style={styles.label}>CROP STATUS</Text>
            <Text style={[styles.status, { color: displayColor }]}>{status}</Text>
            {cropName && <Text style={styles.cropName}>{cropName}</Text>}
            {!cropName && status === "NO CROP" && <Text style={styles.noCropHint}>Add a crop to monitor</Text>}
          </View>
        </View>
      </View>
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
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  textContent: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  status: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  cropName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginTop: 2,
  },
  noCropHint: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: 2,
  },
})
