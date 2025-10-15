import { View, Text, StyleSheet, ScrollView, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"

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
    <View style={styles.container}>
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
                <Ionicons name="water" size={14} color="#6B7280" />
                <Text style={styles.humidity}>{day.humidity}</Text>
              </View>
            </View>

            <View style={[styles.statusIndicator, { backgroundColor: day.color }]} />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
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
    color: "#1A1A1A",
  },
  scrollContent: {
    gap: 12,
    paddingRight: 8,
  },
  dayCard: {
    width: 120,
    backgroundColor: "#F9FAFB",
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
    color: "#1A1A1A",
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
    fontWeight: "800",
    color: "#1A1A1A",
  },
  status: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
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
    color: "#6B7280",
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
