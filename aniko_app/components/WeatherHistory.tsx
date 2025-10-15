import { View, Text, StyleSheet, ScrollView, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

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
  secondaryBrown: "#ecc096ff",
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

interface DayWeatherData {
  day: string
  status: string
  temp: string
  humidity: string
  color: string
}

interface WeatherHistoryProps {
  weeklyWeather: DayWeatherData[]
}

export default function WeatherHistory({ weeklyWeather }: WeatherHistoryProps) {
  const getWeatherImage = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes("rain")) return require("../assets/rainy.png")
    if (statusLower.includes("hot") || statusLower.includes("sunny")) return require("../assets/sunny.png")
    if (statusLower.includes("cloud")) return require("../assets/cloudy.png")
    if (statusLower.includes("thunder") || statusLower.includes("storm")) return require("../assets/thunderstorm.png")
    return require("../assets/sunny.png")
  }

  return (
    <LinearGradient colors={[COLORS.pastelGreen, COLORS.lightGreen, COLORS.pastelGreen]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>7-Day Weather Forecast</Text>
        <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {weeklyWeather.map((day, index) => (
          <View key={index} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{day.day}</Text>
            </View>

            <View style={[styles.iconContainer, { backgroundColor: `${day.color}15` }]}>
              <Image source={getWeatherImage(day.status)} style={styles.weatherImage} resizeMode="contain" />
            </View>

            <View style={styles.dayInfo}>
              <Text style={styles.temperature}>{day.temp}</Text>
              <Text style={styles.status}>{day.status}</Text>

              <View style={styles.humidityRow}>
                <Ionicons name="water" size={14} color={COLORS.primaryBrown} />
                <Text style={styles.humidity}>{day.humidity}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.mutedGreen,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 8,
  },
  dayCard: {
    width: 120,
    backgroundColor: COLORS.lightGreen,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
    overflow: "hidden",
  },
  dayHeader: {
    marginBottom: 12,
  },
  dayName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primaryBrown,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  dayInfo: {
    alignItems: "center",
    gap: 6,
  },
  temperature: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.mutedGreen,
  },
  status: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.pastelGreen,
    textAlign: "center",
  },
  humidityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  humidity: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primaryBrown,
  },
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  weatherImage: {
    width: 40,
    height: 40,
  },
})
