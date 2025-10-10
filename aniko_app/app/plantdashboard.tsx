"use client"

import supabase from "./CONFIG/supaBase"
import { useState, useEffect } from "react"
import { useAppContext } from "./CONFIG/GlobalContext"
import type { CropData, SensorData } from "./CONFIG/GlobalContext"
import { Text, View, TouchableOpacity, ScrollView, Alert, Modal } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"

// Import styles from a separate file
import { styles } from "./styles/plantdashboard.style"
import FooterNavigation from "../components/FooterNavigation"

interface User {
  id: string
  username: string
  email?: string
  last_login?: string
  created_at?: string
}

interface AuthUser {
  id: string
  email?: string
  username?: string
}

// Interface for daily monitoring history
interface DailyMonitoringData {
  date: string
  day: string
  plantName: string
  monitoringDuration: number // in hours
  sessionsCount: number
  avgTemperature: number
  avgHumidity: number
  avgPh: number
  avgNitrogen: number
  avgPotassium: number
  avgPhosphorus: number
  overallStatus: "Good" | "Warning" | "Bad"
  statusColor: string
  hourlyReadings: Array<{
    timestamp: string
    temperature: number
    humidity: number
    ph: number
    nitrogen: number
    potassium: number
    phosphorus: number
  }>
}

export default function Dashboard() {
  const [user, setUser] = useState<User | AuthUser | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Use global context for shared state
  const {
    selectedLocation,
    selectedCrop,
    setSelectedCrop,
    cropParameters,
    setCropParameters,
    sensorData,
    setSensorData,
  } = useAppContext()

  const [cropsStatus] = useState("Good")
  const router = useRouter()

  // Local plant selection state
  const [crops, setCrops] = useState<CropData[]>([])
  const [showPlantModal, setShowPlantModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  // Plant history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedDayHistory, setSelectedDayHistory] = useState<DailyMonitoringData | null>(null)
  const [weeklyMonitoringData, setWeeklyMonitoringData] = useState<DailyMonitoringData[]>([])

  // Derive categories and plants from crops data
  const originalCategories = Array.from(new Set(crops.map((c) => c.crop_categories)))
  const categories = selectedLocation ? ["Recommended", ...originalCategories] : originalCategories

  const plantsInCategory =
    selectedCategory === "Recommended"
      ? crops.filter(
          (crop) =>
            selectedLocation &&
            (crop.crop_region === selectedLocation.region ||
              crop.crop_province === selectedLocation.province ||
              crop.crop_city === selectedLocation.city),
        )
      : crops.filter((c) => c.crop_categories === selectedCategory)

  // Get plants sorted by recommendation (location-based first)
  const getSortedPlants = () => {
    if (!selectedCategory) return []

    const plants = plantsInCategory.reduce(
      (acc, crop) => {
        if (!acc.find((p) => p.crop_name === crop.crop_name)) {
          const isRecommended = selectedLocation
            ? crop.crop_region === selectedLocation.region ||
              crop.crop_province === selectedLocation.province ||
              crop.crop_city === selectedLocation.city
            : false
          acc.push({ ...crop, isRecommended })
        }
        return acc
      },
      [] as (CropData & { isRecommended: boolean })[],
    )

    // Sort recommended plants first (except when "Recommended" category is selected)
    if (selectedCategory === "Recommended") {
      return plants.sort((a, b) => a.crop_name.localeCompare(b.crop_name))
    } else {
      return plants.sort((a, b) => {
        if (a.isRecommended && !b.isRecommended) return -1
        if (!a.isRecommended && b.isRecommended) return 1
        return a.crop_name.localeCompare(b.crop_name)
      })
    }
  }

  const sortedPlants = getSortedPlants()

  const handleDayClick = (dayData: DailyMonitoringData) => {
    setSelectedDayHistory(dayData)
    setShowHistoryModal(true)
  }

  // Load crop parameters for sensor monitoring
  const loadCropParameters = async (cropName: string) => {
    if (!cropName) return

    try {
      const { data, error } = await supabase
        .from("denormalized_crop_parameter")
        .select("*")
        .eq("crop_name", cropName)
        .single()

      if (error) {
        console.error("DB crop parameters error:", error)
        setCropParameters(null)
        return
      }

      if (data) {
        setCropParameters(data)
        console.log("Loaded crop parameters for:", cropName, data)
      }
    } catch (err) {
      console.error("Failed to load crop parameters:", err)
      setCropParameters(null)
    }
  }

  // Fetch ESP32 sensor data from database
  const fetchESP32SensorData = async (userId: string) => {
    try {
      console.log("🔍 Fetching ESP32 sensor data for user:", userId)

      const { data: latestReading, error } = await supabase
        .from("esp32_readings")
        .select("*")
        .eq("user_id", userId)
        .order("measured_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error("❌ Error fetching ESP32 data:", error)
        return null
      }

      if (latestReading) {
        console.log("✅ Successfully loaded REAL ESP32 sensor data:", latestReading)

        // Map database fields to sensor data interface
        const mappedSensorData: SensorData = {
          temperature: latestReading.temp_c || 0,
          moisture: latestReading.moisture_pct || 0,
          ph: latestReading.ph_level || 0,
          ec: latestReading.ec_us_cm || 0,
          nitrogen: latestReading.nitrogen_ppm || 0,
          potassium: latestReading.potassium_ppm || 0,
          phosphorus: latestReading.phosphorus_ppm || 0,
          timestamp: new Date(latestReading.measured_at).getTime(),
        }

        setSensorData(mappedSensorData)
        return mappedSensorData
      }

      console.log("📭 No ESP32 sensor records found for this user")
      return null
    } catch (err) {
      console.error("❌ Failed to fetch ESP32 sensor data:", err)
      return null
    }
  }

  // Function to check if sensor reading is within optimal range
  const getSensorStatus = (value: number, min: number, max: number) => {
    if (value >= min && value <= max) {
      return { status: "Good", color: "#4CAF50" }
    } else if (value < min * 0.8 || value > max * 1.2) {
      return { status: "Bad", color: "#F44336" }
    } else {
      return { status: "Warning", color: "#FFC107" }
    }
  }

  // Generate real sensor-based monitoring history for last 7 days
  const generateWeeklyMonitoringData = async (): Promise<DailyMonitoringData[]> => {
    if (!currentUser && !user) {
      console.log("📭 No user available for sensor history")
      return generateMockWeeklyData()
    }

    const userId = currentUser?.id || (user as User)?.id
    if (!userId) {
      console.log("📭 No user ID available for sensor history")
      return generateMockWeeklyData()
    }

    try {
      // Get the last 7 days of data
      const today = new Date()
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 6)

      console.log("📊 Fetching sensor history from:", sevenDaysAgo.toISOString(), "to:", today.toISOString())

      const { data: sensorHistory, error } = await supabase
        .from("esp32_readings")
        .select("*")
        .eq("user_id", userId)
        .gte("measured_at", sevenDaysAgo.toISOString())
        .lte("measured_at", today.toISOString())
        .order("measured_at", { ascending: true })

      if (error) {
        console.error("❌ Error fetching sensor history:", error)
        return generateMockWeeklyData() // Fallback to mock data
      }

      if (!sensorHistory || sensorHistory.length === 0) {
        console.log("📭 No sensor history found, using mock data for demo")
        return generateMockWeeklyData() // Fallback to mock data
      }

      console.log("✅ Found real sensor history:", sensorHistory.length, "readings")

      // Group readings by day
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const weekData: DailyMonitoringData[] = []

      // Create day buckets for last 7 days
      for (let i = 6; i >= 0; i--) {
        const currentDate = new Date(today)
        currentDate.setDate(today.getDate() - i)
        const dayName = dayNames[currentDate.getDay()]
        const dateString = currentDate.toISOString().split("T")[0]

        // Filter readings for this specific day
        const dayReadings = sensorHistory.filter((reading) => {
          const readingDate = new Date(reading.measured_at).toISOString().split("T")[0]
          return readingDate === dateString
        })

        if (dayReadings.length === 0) {
          // No data for this day - create placeholder
          weekData.push({
            date: dateString,
            day: dayName,
            plantName: selectedCrop?.crop_name || "No Plant Selected",
            monitoringDuration: 0,
            sessionsCount: 0,
            avgTemperature: 0,
            avgHumidity: 0,
            avgPh: 0,
            avgNitrogen: 0,
            avgPotassium: 0,
            avgPhosphorus: 0,
            overallStatus: "Bad" as const,
            statusColor: "#9E9E9E",
            hourlyReadings: [],
          })
          continue
        }

        // Calculate daily averages from real sensor data
        const avgTemp = dayReadings.reduce((sum, r) => sum + (r.temp_c || 0), 0) / dayReadings.length
        const avgHumidity = dayReadings.reduce((sum, r) => sum + (r.moisture_pct || 0), 0) / dayReadings.length
        const avgPh = dayReadings.reduce((sum, r) => sum + (r.ph_level || 0), 0) / dayReadings.length
        const avgNitrogen = dayReadings.reduce((sum, r) => sum + (r.nitrogen_ppm || 0), 0) / dayReadings.length
        const avgPotassium = dayReadings.reduce((sum, r) => sum + (r.potassium_ppm || 0), 0) / dayReadings.length
        const avgPhosphorus = dayReadings.reduce((sum, r) => sum + (r.phosphorus_ppm || 0), 0) / dayReadings.length

        // Convert readings to hourly format for timeline
        const hourlyReadings = dayReadings.map((reading) => ({
          timestamp: new Date(reading.measured_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          temperature: reading.temp_c || 0,
          humidity: reading.moisture_pct || 0,
          ph: reading.ph_level || 0,
          nitrogen: reading.nitrogen_ppm || 0,
          potassium: reading.potassium_ppm || 0,
          phosphorus: reading.phosphorus_ppm || 0,
        }))

        // Determine status based on crop parameters and real sensor readings
        let overallStatus: "Good" | "Warning" | "Bad" = "Good"
        let statusColor = "#4CAF50"

        if (cropParameters) {
          const tempStatus = getSensorStatus(avgTemp, cropParameters.temperature_min, cropParameters.temperature_max)
          const phStatus = getSensorStatus(avgPh, cropParameters.ph_level_min, cropParameters.ph_level_max)
          const moistureStatus = getSensorStatus(avgHumidity, cropParameters.moisture_min, cropParameters.moisture_max)

          const badCount = [tempStatus, phStatus, moistureStatus].filter((s) => s.status === "Bad").length
          const warningCount = [tempStatus, phStatus, moistureStatus].filter((s) => s.status === "Warning").length

          if (badCount > 0) {
            overallStatus = "Bad"
            statusColor = "#F44336"
          } else if (warningCount > 0) {
            overallStatus = "Warning"
            statusColor = "#FFC107"
          }
        }

        // Calculate monitoring duration and sessions
        const firstReading = dayReadings[0]
        const lastReading = dayReadings[dayReadings.length - 1]
        const durationHours =
          firstReading && lastReading
            ? (new Date(lastReading.measured_at).getTime() - new Date(firstReading.measured_at).getTime()) /
              (1000 * 60 * 60)
            : 0

        weekData.push({
          date: dateString,
          day: dayName,
          plantName: selectedCrop?.crop_name || "No Plant Selected",
          monitoringDuration: Math.max(0, durationHours),
          sessionsCount: dayReadings.length,
          avgTemperature: avgTemp,
          avgHumidity: avgHumidity,
          avgPh: avgPh,
          avgNitrogen: avgNitrogen,
          avgPotassium: avgPotassium,
          avgPhosphorus: avgPhosphorus,
          overallStatus,
          statusColor,
          hourlyReadings,
        })
      }

      return weekData
    } catch (err) {
      console.error("❌ Failed to fetch sensor history:", err)
      return generateMockWeeklyData() // Fallback to mock data
    }
  }

  // Fallback function for mock data when no real data exists
  const generateMockWeeklyData = (): DailyMonitoringData[] => {
    console.log("📝 Generating mock sensor data for development/demo")
    const today = new Date()
    const weekData: DailyMonitoringData[] = []
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    // Generate data for last 7 days (today + 6 days ago)
    for (let i = 6; i >= 0; i--) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() - i)

      const dayName = dayNames[currentDate.getDay()]
      const dateString = currentDate.toISOString().split("T")[0]

      // Use current sensor data as base for realistic values
      const baseSensorData = sensorData || {
        temperature: 26.0,
        moisture: 65.0,
        ph: 6.4,
        nitrogen: 45.0,
        potassium: 40.0,
        phosphorus: 23.0,
      }

      // Generate realistic hourly readings based on sensor patterns
      const hourlyReadings = []
      for (let hour = 6; hour <= 20; hour += 2) {
        // Add natural variation to sensor readings
        const tempVariation = (Math.random() - 0.5) * 4 // ±2°C variation
        const moistureVariation = (Math.random() - 0.5) * 10 // ±5% variation
        const phVariation = (Math.random() - 0.5) * 0.6 // ±0.3 pH variation
        const nutrientVariation = (Math.random() - 0.5) * 10 // ±5 nutrient variation

        hourlyReadings.push({
          timestamp: `${hour.toString().padStart(2, "0")}:00`,
          temperature: Math.max(20, Math.min(35, baseSensorData.temperature + tempVariation)),
          humidity: Math.max(40, Math.min(90, baseSensorData.moisture + moistureVariation)),
          ph: Math.max(5.5, Math.min(7.5, baseSensorData.ph + phVariation)),
          nitrogen: Math.max(30, Math.min(60, baseSensorData.nitrogen + nutrientVariation)),
          potassium: Math.max(25, Math.min(55, baseSensorData.potassium + nutrientVariation)),
          phosphorus: Math.max(15, Math.min(35, baseSensorData.phosphorus + nutrientVariation)),
        })
      }

      // Calculate averages from hourly readings
      const avgTemp = hourlyReadings.reduce((sum, r) => sum + r.temperature, 0) / hourlyReadings.length
      const avgHumidity = hourlyReadings.reduce((sum, r) => sum + r.humidity, 0) / hourlyReadings.length
      const avgPh = hourlyReadings.reduce((sum, r) => sum + r.ph, 0) / hourlyReadings.length
      const avgNitrogen = hourlyReadings.reduce((sum, r) => sum + r.nitrogen, 0) / hourlyReadings.length
      const avgPotassium = hourlyReadings.reduce((sum, r) => sum + r.potassium, 0) / hourlyReadings.length
      const avgPhosphorus = hourlyReadings.reduce((sum, r) => sum + r.phosphorus, 0) / hourlyReadings.length

      // Determine status based on crop parameters and sensor readings
      let overallStatus: "Good" | "Warning" | "Bad" = "Good"
      let statusColor = "#4CAF50"

      if (cropParameters) {
        const tempStatus = getSensorStatus(avgTemp, cropParameters.temperature_min, cropParameters.temperature_max)
        const phStatus = getSensorStatus(avgPh, cropParameters.ph_level_min, cropParameters.ph_level_max)
        const moistureStatus = getSensorStatus(avgHumidity, cropParameters.moisture_min, cropParameters.moisture_max)

        const badCount = [tempStatus, phStatus, moistureStatus].filter((s) => s.status === "Bad").length
        const warningCount = [tempStatus, phStatus, moistureStatus].filter((s) => s.status === "Warning").length

        if (badCount > 0) {
          overallStatus = "Bad"
          statusColor = "#F44336"
        } else if (warningCount > 0) {
          overallStatus = "Warning"
          statusColor = "#FFC107"
        }
      }

      weekData.push({
        date: dateString,
        day: dayName,
        plantName: selectedCrop?.crop_name || "No Plant Selected",
        monitoringDuration: Math.random() * 4 + 6, // 6-10 hours
        sessionsCount: Math.floor(Math.random() * 8) + 12, // 12-20 sessions
        avgTemperature: avgTemp,
        avgHumidity: avgHumidity,
        avgPh: avgPh,
        avgNitrogen: avgNitrogen,
        avgPotassium: avgPotassium,
        avgPhosphorus: avgPhosphorus,
        overallStatus,
        statusColor,
        hourlyReadings,
      })
    }

    return weekData
  }

  // Get overall plant health status based on sensor data vs parameters
  const getPlantHealthStatus = () => {
    if (!cropParameters || !sensorData) return { status: "Unknown", color: "#9E9E9E" }

    const statuses = [
      getSensorStatus(sensorData.temperature, cropParameters.temperature_min, cropParameters.temperature_max),
      getSensorStatus(sensorData.ph, cropParameters.ph_level_min, cropParameters.ph_level_max),
      getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max),
    ]

    const badCount = statuses.filter((s) => s.status === "Bad").length
    const warningCount = statuses.filter((s) => s.status === "Warning").length

    if (badCount > 0) return { status: "Bad", color: "#F44336" }
    if (warningCount > 0) return { status: "Warning", color: "#FFC107" }
    return { status: "Good", color: "#4CAF50" }
  }

  // Handle refresh ESP32 data manually
  const handleRefreshSensorData = async () => {
    const userId = currentUser?.id || (user as User)?.id
    if (userId) {
      console.log("🔄 Manual refresh of ESP32 sensor data...")
      await fetchESP32SensorData(userId)

      // Also refresh the weekly history
      const newWeeklyData = await generateWeeklyMonitoringData()
      setWeeklyMonitoringData(newWeeklyData)
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const authUserFound = await getCurrentUser()
        if (!authUserFound) await getLastLoggedInUser()
      } catch (error) {
        console.error("Error in fetchUserData:", error)
        await getLastLoggedInUser()
      }
    }

    const loadCropsFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from("denormalized_crop_details")
          .select("*")
          .order("crop_categories", { ascending: true })
          .order("crop_name", { ascending: true })
          .order("crop_region", { ascending: true })

        if (error) {
          console.error("DB crops error:", error)
          return
        }

        if (data && data.length > 0) {
          setCrops(data)
          console.log("Loaded crops:", data.length)
        }
      } catch (err) {
        console.error("Failed to load crops:", err)
      }
    }

    fetchUserData()
    loadCropsFromDb()
  }, [])

  // Load crop parameters when a crop is selected
  useEffect(() => {
    if (selectedCrop) {
      loadCropParameters(selectedCrop.crop_name)
    }
  }, [selectedCrop])

  // Fetch ESP32 sensor data when user is available
  useEffect(() => {
    const loadSensorAndHistory = async () => {
      const userId = currentUser?.id || (user as User)?.id
      if (userId) {
        console.log("🚀 Loading ESP32 sensor data and history for user:", userId)

        // Try to fetch real ESP32 sensor data first
        await fetchESP32SensorData(userId)

        // Load sensor history (real or mock)
        const historyData = await generateWeeklyMonitoringData()
        setWeeklyMonitoringData(historyData)
      }
    }

    if ((currentUser || user) && selectedCrop) {
      loadSensorAndHistory()
    }
  }, [currentUser, user, selectedCrop, cropParameters])

  const getLastLoggedInUser = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("last_login", { ascending: false })
        .limit(1)

      if (!error && data?.length > 0) {
        setCurrentUser(data[0])
      }
    } catch (error) {
      console.error("Error getting last logged user:", error)
    }
  }

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError) return false

      if (user) {
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (!error) setUser(data)
        else setUser(user)
        return true
      }
      return false
    } catch (error) {
      console.error("Error getting current user:", error)
      return false
    }
  }

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut()
            if (!error) router.replace("/")
          } catch (error) {
            console.error("Logout error:", error)
          }
        },
      },
    ])
  }

  const handlePlantSelect = async (crop: CropData) => {
    console.log("Plant selected:", crop)
    setSelectedCrop(crop) // Use global setter
    setShowPlantModal(false)

    // Load crop parameters for sensor monitoring
    await loadCropParameters(crop.crop_name)
  }

  return (
    <View style={styles.container}>
      {/* Header Background */}
      <LinearGradient colors={["#1c4722", "#4d7f39"]} style={styles.headerBackground}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.greeting}>
              {currentUser?.username ||
                (user && "username" in user ? user.username : user?.email?.split("@")[0]) ||
                "User"}
            </Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={handleRefreshSensorData} style={{ marginRight: 12 }}>
              <Ionicons name="refresh-outline" size={22} color="white" />
            </TouchableOpacity>
            <Ionicons name="notifications-outline" size={22} color="white" />
            <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 12 }}>
              <Ionicons name="log-out-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Plant Selection Modal */}
      <Modal visible={showPlantModal} transparent animationType="fade">
        <View style={styles.plantModalOverlay}>
          <View style={styles.plantModalContainer}>
            <Text style={styles.plantModalTitle}>Select Plant</Text>

            {/* Category Selection */}
            <Text style={styles.selectionLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[styles.selectionChip, selectedCategory === category && styles.selectionChipActive]}
                >
                  <View style={styles.categoryChipContent}>
                    {category === "Recommended" && (
                      <Ionicons
                        name="star"
                        size={12}
                        color={selectedCategory === category ? "#fff" : "#4d7f39"}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.selectionChipText,
                        selectedCategory === category && styles.selectionChipTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Plant Selection */}
            {selectedCategory && (
              <>
                <Text style={[styles.selectionLabel, { marginTop: 12 }]}>
                  {selectedCategory === "Recommended" ? "Plants Perfect for Your Area" : "Available Plants"}
                </Text>
                <ScrollView style={styles.plantList}>
                  {sortedPlants.length > 0 ? (
                    sortedPlants.map((crop) => (
                      <TouchableOpacity
                        key={`${crop.crop_details_id}`}
                        style={styles.plantItem}
                        onPress={() => handlePlantSelect(crop)}
                      >
                        <View style={styles.plantItemContent}>
                          <View style={styles.plantItemHeader}>
                            <Text style={styles.plantItemName}>{crop.crop_name}</Text>
                            {crop.isRecommended && selectedCategory !== "Recommended" && (
                              <View style={styles.recommendedBadge}>
                                <Text style={styles.recommendedText}>Recommended</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.plantItemLocation}>
                            Commonly grown in: {crop.crop_city}, {crop.crop_province}
                          </Text>
                        </View>
                        <Ionicons
                          name={
                            selectedCrop?.crop_details_id === crop.crop_details_id
                              ? "radio-button-on"
                              : "radio-button-off"
                          }
                          size={20}
                          color="#4d7f39"
                        />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noLocationsText}>
                      {selectedCategory === "Recommended"
                        ? "No recommended plants found for your location. Try other categories to see all available plants."
                        : "No plants available for this category."}
                    </Text>
                  )}
                </ScrollView>
              </>
            )}

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowPlantModal(false)}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Plant History Modal */}
      <Modal visible={showHistoryModal} transparent animationType="slide">
        <View style={styles.historyModalOverlay}>
          <View style={styles.historyModalContainer}>
            {selectedDayHistory && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.historyModalHeader}>
                  <View>
                    <Text style={styles.historyModalTitle}>Plant Monitoring Details</Text>
                    <Text style={styles.historyModalDate}>
                      {selectedDayHistory.day} - {selectedDayHistory.date}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.historyCloseBtn} onPress={() => setShowHistoryModal(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Plant & Status Summary */}
                <View style={styles.historySummaryCard}>
                  <View style={styles.historyPlantInfo}>
                    <Text style={styles.historyPlantName}>{selectedDayHistory.plantName}</Text>
                    <View style={[styles.historyStatusBadge, { backgroundColor: selectedDayHistory.statusColor }]}>
                      <Text style={styles.historyStatusText}>{selectedDayHistory.overallStatus}</Text>
                    </View>
                  </View>
                  <View style={styles.historyStatsRow}>
                    <View style={styles.historyStat}>
                      <Text style={styles.historyStatLabel}>Duration</Text>
                      <Text style={styles.historyStatValue}>{selectedDayHistory.monitoringDuration.toFixed(1)}h</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <Text style={styles.historyStatLabel}>Sessions</Text>
                      <Text style={styles.historyStatValue}>{selectedDayHistory.sessionsCount}</Text>
                    </View>
                  </View>
                </View>

                {/* Daily Averages */}
                <View style={styles.historyAveragesCard}>
                  <Text style={styles.historySectionTitle}>Daily Averages</Text>
                  <View style={styles.historyMetricsGrid}>
                    <View style={styles.historyMetricItem}>
                      <Text style={styles.historyMetricLabel}>Temperature</Text>
                      <Text style={styles.historyMetricValue}>{selectedDayHistory.avgTemperature.toFixed(1)}°C</Text>
                    </View>
                    <View style={styles.historyMetricItem}>
                      <Text style={styles.historyMetricLabel}>Humidity</Text>
                      <Text style={styles.historyMetricValue}>{selectedDayHistory.avgHumidity.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.historyMetricItem}>
                      <Text style={styles.historyMetricLabel}>pH Level</Text>
                      <Text style={styles.historyMetricValue}>{selectedDayHistory.avgPh.toFixed(1)}</Text>
                    </View>
                    <View style={styles.historyMetricItem}>
                      <Text style={styles.historyMetricLabel}>Nitrogen</Text>
                      <Text style={styles.historyMetricValue}>{selectedDayHistory.avgNitrogen.toFixed(1)}</Text>
                    </View>
                    <View style={styles.historyMetricItem}>
                      <Text style={styles.historyMetricLabel}>Potassium</Text>
                      <Text style={styles.historyMetricValue}>{selectedDayHistory.avgPotassium.toFixed(1)}</Text>
                    </View>
                    <View style={styles.historyMetricItem}>
                      <Text style={styles.historyMetricLabel}>Phosphorus</Text>
                      <Text style={styles.historyMetricValue}>{selectedDayHistory.avgPhosphorus.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>

                {/* Hourly Timeline */}
                <View style={styles.historyTimelineCard}>
                  <Text style={styles.historySectionTitle}>Hourly Readings Timeline</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelineScroll}>
                    {selectedDayHistory.hourlyReadings.map((reading, index) => (
                      <View key={index} style={styles.timelineItem}>
                        <Text style={styles.timelineTimestamp}>{reading.timestamp}</Text>
                        <View style={styles.timelineReadings}>
                          <View style={styles.timelineReadingRow}>
                            <Ionicons name="thermometer-outline" size={14} color="#666" />
                            <Text style={styles.timelineReading}>{reading.temperature.toFixed(1)}°C</Text>
                          </View>
                          <View style={styles.timelineReadingRow}>
                            <Ionicons name="water-outline" size={14} color="#666" />
                            <Text style={styles.timelineReading}>{reading.humidity.toFixed(0)}%</Text>
                          </View>
                          <View style={styles.timelineReadingRow}>
                            <Ionicons name="flask-outline" size={14} color="#666" />
                            <Text style={styles.timelineReading}>pH {reading.ph.toFixed(1)}</Text>
                          </View>
                          <View style={styles.timelineReadingRow}>
                            <Ionicons name="leaf-outline" size={14} color="#4CAF50" />
                            <Text style={styles.timelineReading}>N {reading.nitrogen.toFixed(0)}</Text>
                          </View>
                          <View style={styles.timelineReadingRow}>
                            <Ionicons name="leaf-outline" size={14} color="#2196F3" />
                            <Text style={styles.timelineReading}>K {reading.potassium.toFixed(0)}</Text>
                          </View>
                          <View style={styles.timelineReadingRow}>
                            <Ionicons name="leaf-outline" size={14} color="#FFC107" />
                            <Text style={styles.timelineReading}>P {reading.phosphorus.toFixed(0)}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* Simple Graph Representation */}
                <View style={styles.historyGraphCard}>
                  <Text style={styles.historySectionTitle}>Temperature Trend</Text>
                  <View style={styles.simpleGraph}>
                    {selectedDayHistory.hourlyReadings.map((reading, index) => {
                      const maxTemp = Math.max(...selectedDayHistory.hourlyReadings.map((r) => r.temperature))
                      const minTemp = Math.min(...selectedDayHistory.hourlyReadings.map((r) => r.temperature))
                      const normalizedHeight = ((reading.temperature - minTemp) / (maxTemp - minTemp)) * 100

                      return (
                        <View key={index} style={styles.graphColumn}>
                          <View
                            style={[
                              styles.graphBar,
                              {
                                height: `${Math.max(normalizedHeight, 10)}%`,
                                backgroundColor:
                                  reading.temperature > 28
                                    ? "#FF6B6B"
                                    : reading.temperature < 24
                                      ? "#4DABF7"
                                      : "#51CF66",
                              },
                            ]}
                          />
                          <Text style={styles.graphLabel}>{reading.timestamp.split(":")[0]}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.plantCard}>
          <View style={styles.plantCardContent}>
            <View style={styles.plantTextWrapper}>
              <Text style={styles.plantName}>{selectedCrop?.crop_name || "Select a Plant"}</Text>
              <Text style={styles.plantTitle}>Category</Text>
              <Text style={styles.plantDetails}>{selectedCrop?.crop_categories || "None Selected"}</Text>

              {selectedCrop && (
                <>
                  <Text style={styles.plantTitle}>Commonly Grown In</Text>
                  <Text style={styles.plantDetails}>
                    {selectedCrop.crop_city}, {selectedCrop.crop_province}
                  </Text>
                </>
              )}

              <TouchableOpacity style={styles.findPlantsButton} onPress={() => setShowPlantModal(true)}>
                <Text style={styles.findPlantsText}>Find Plants</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Plant Condition</Text>

        <View style={styles.conditionCard}>
          {/* Header with Status Badge */}
          <View style={styles.conditionHeader}>
            <View style={styles.conditionHeaderLeft}>
              <View style={[styles.conditionStatusBadge, { borderColor: getPlantHealthStatus().color }]}>
                <View
                  style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: getPlantHealthStatus().color }}
                />
                <Text style={[styles.conditionStatusText, { color: getPlantHealthStatus().color }]}>
                  {getPlantHealthStatus().status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.conditionSubtitle}>
                Soil:{" "}
                {sensorData && cropParameters
                  ? getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max)
                      .status
                  : "Unknown"}
              </Text>
            </View>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            {/* Temperature */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="thermometer-outline" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
                <Text style={styles.metricLabel}>Temperature</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color:
                      sensorData && cropParameters
                        ? getSensorStatus(
                            sensorData.temperature,
                            cropParameters.temperature_min,
                            cropParameters.temperature_max,
                          ).color
                        : "#666",
                  },
                ]}
              >
                {sensorData ? sensorData.temperature.toFixed(1) : "—"}°C
              </Text>
              {cropParameters && (
                <Text style={styles.metricRange}>
                  Range: {cropParameters.temperature_min}-{cropParameters.temperature_max}°C
                </Text>
              )}
              <Text
                style={[
                  styles.metricStatus,
                  {
                    color:
                      sensorData && cropParameters
                        ? getSensorStatus(
                            sensorData.temperature,
                            cropParameters.temperature_min,
                            cropParameters.temperature_max,
                          ).color
                        : "#666",
                  },
                ]}
              >
                {sensorData && cropParameters
                  ? getSensorStatus(
                      sensorData.temperature,
                      cropParameters.temperature_min,
                      cropParameters.temperature_max,
                    ).status
                  : "Unknown"}
              </Text>
            </View>

            {/* Humidity */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="water-outline" size={20} color="#4FC3F7" style={{ marginRight: 8 }} />
                <Text style={styles.metricLabel}>Humidity</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color:
                      sensorData && cropParameters
                        ? getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max)
                            .color
                        : "#666",
                  },
                ]}
              >
                {sensorData ? sensorData.moisture.toFixed(0) : "—"}%
              </Text>
              {cropParameters && (
                <Text style={styles.metricRange}>
                  Range: {cropParameters.moisture_min}-{cropParameters.moisture_max}%
                </Text>
              )}
              <Text
                style={[
                  styles.metricStatus,
                  {
                    color:
                      sensorData && cropParameters
                        ? getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max)
                            .color
                        : "#666",
                  },
                ]}
              >
                {sensorData && cropParameters
                  ? getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max)
                      .status
                  : "Unknown"}
              </Text>
            </View>

            {/* pH Level */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="flask-outline" size={20} color="#9C27B0" style={{ marginRight: 8 }} />
                <Text style={styles.metricLabel}>pH Level</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color:
                      sensorData && cropParameters
                        ? getSensorStatus(sensorData.ph, cropParameters.ph_level_min, cropParameters.ph_level_max).color
                        : "#666",
                  },
                ]}
              >
                {sensorData ? sensorData.ph.toFixed(1) : "—"}
              </Text>
              {cropParameters && (
                <Text style={styles.metricRange}>
                  Range: {cropParameters.ph_level_min}-{cropParameters.ph_level_max}
                </Text>
              )}
              <Text
                style={[
                  styles.metricStatus,
                  {
                    color:
                      sensorData && cropParameters
                        ? getSensorStatus(sensorData.ph, cropParameters.ph_level_min, cropParameters.ph_level_max).color
                        : "#666",
                  },
                ]}
              >
                {sensorData && cropParameters
                  ? getSensorStatus(sensorData.ph, cropParameters.ph_level_min, cropParameters.ph_level_max).status
                  : "Unknown"}
              </Text>
            </View>

            {/* Nitrogen */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="leaf-outline" size={20} color="#4CAF50" style={{ marginRight: 8 }} />
                <Text style={styles.metricLabel}>Nitrogen</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color:
                      sensorData && cropParameters
                        ? getSensorStatus(sensorData.nitrogen, cropParameters.nitrogen_min, cropParameters.nitrogen_max)
                            .color
                        : "#666",
                  },
                ]}
              >
                {sensorData ? sensorData.nitrogen.toFixed(0) : "—"}
              </Text>
              {cropParameters && (
                <Text style={styles.metricRange}>
                  Range: {cropParameters.nitrogen_min}-{cropParameters.nitrogen_max}
                </Text>
              )}
              <Text
                style={[
                  styles.metricStatus,
                  {
                    color:
                      sensorData && cropParameters
                        ? getSensorStatus(sensorData.nitrogen, cropParameters.nitrogen_min, cropParameters.nitrogen_max)
                            .color
                        : "#666",
                  },
                ]}
              >
                {sensorData && cropParameters
                  ? getSensorStatus(sensorData.nitrogen, cropParameters.nitrogen_min, cropParameters.nitrogen_max)
                      .status
                  : "Unknown"}
              </Text>
            </View>

            {/* Potassium */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="leaf-outline" size={20} color="#2196F3" style={{ marginRight: 8 }} />
                <Text style={styles.metricLabel}>Potassium</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color:
                      sensorData && cropParameters
                        ? getSensorStatus(
                            sensorData.potassium,
                            cropParameters.potassium_min,
                            cropParameters.potassium_max,
                          ).color
                        : "#666",
                  },
                ]}
              >
                {sensorData ? sensorData.potassium.toFixed(0) : "—"}
              </Text>
              {cropParameters && (
                <Text style={styles.metricRange}>
                  Range: {cropParameters.potassium_min}-{cropParameters.potassium_max}
                </Text>
              )}
              <Text
                style={[
                  styles.metricStatus,
                  {
                    color:
                      sensorData && cropParameters
                        ? getSensorStatus(
                            sensorData.potassium,
                            cropParameters.potassium_min,
                            cropParameters.potassium_max,
                          ).color
                        : "#666",
                  },
                ]}
              >
                {sensorData && cropParameters
                  ? getSensorStatus(sensorData.potassium, cropParameters.potassium_min, cropParameters.potassium_max)
                      .status
                  : "Unknown"}
              </Text>
            </View>

            {/* Phosphorus */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="leaf-outline" size={20} color="#FFC107" style={{ marginRight: 8 }} />
                <Text style={styles.metricLabel}>Phosphorus</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color:
                      sensorData && cropParameters
                        ? getSensorStatus(
                            sensorData.phosphorus,
                            cropParameters.phosphorus_min,
                            cropParameters.phosphorus_max,
                          ).color
                        : "#666",
                  },
                ]}
              >
                {sensorData ? sensorData.phosphorus.toFixed(0) : "—"}
              </Text>
              {cropParameters && (
                <Text style={styles.metricRange}>
                  Range: {cropParameters.phosphorus_min}-{cropParameters.phosphorus_max}
                </Text>
              )}
              <Text
                style={[
                  styles.metricStatus,
                  {
                    color:
                      sensorData && cropParameters
                        ? getSensorStatus(
                            sensorData.phosphorus,
                            cropParameters.phosphorus_min,
                            cropParameters.phosphorus_max,
                          ).color
                        : "#666",
                  },
                ]}
              >
                {sensorData && cropParameters
                  ? getSensorStatus(sensorData.phosphorus, cropParameters.phosphorus_min, cropParameters.phosphorus_max)
                      .status
                  : "Unknown"}
              </Text>
            </View>
          </View>
        </View>

        {/* Soil Moisture Tracking Section - Restructured */}
        <View style={styles.soilMoistureCard}>
          <View style={styles.soilMoistureHeader}>
            <Text style={styles.soilMoistureTitle}>Soil Moisture Monitoring</Text>
            <TouchableOpacity style={styles.soilViewButton} onPress={() => router.push("/waterdashboard")}>
              <Text style={styles.soilViewText}>View Details</Text>
            </TouchableOpacity>
          </View>

          {/* Main Moisture Display */}
          <View style={styles.moistureMainDisplay}>
            <View style={styles.moistureValueContainer}>
              <Text style={styles.moistureLargeValue}>{sensorData ? sensorData.moisture.toFixed(0) : "—"}</Text>
              <Text style={styles.moistureUnit}>%</Text>
            </View>
            <Text style={styles.moistureLabel}>Current Soil Moisture</Text>

            {cropParameters && (
              <View style={styles.moistureRangeContainer}>
                <Text style={styles.moistureRangeLabel}>Optimal Range</Text>
                <Text style={styles.moistureRangeValue}>
                  {cropParameters.moisture_min}% - {cropParameters.moisture_max}%
                </Text>
              </View>
            )}
          </View>

          {/* Status and Visual Indicator */}
          <View style={styles.moistureStatusRow}>
            <View style={styles.moistureStatusCard}>
              <View style={styles.moistureStatusHeader}>
                <Ionicons
                  name={
                    (sensorData?.moisture || 0) >= 60
                      ? "water"
                      : (sensorData?.moisture || 0) >= 30
                        ? "water-outline"
                        : "alert-circle-outline"
                  }
                  size={24}
                  color={
                    sensorData && cropParameters
                      ? getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max)
                          .color
                      : "#4FC3F7"
                  }
                />
                <Text
                  style={[
                    styles.moistureStatusText,
                    {
                      color:
                        sensorData && cropParameters
                          ? getSensorStatus(
                              sensorData.moisture,
                              cropParameters.moisture_min,
                              cropParameters.moisture_max,
                            ).color
                          : "#4FC3F7",
                    },
                  ]}
                >
                  {sensorData && cropParameters
                    ? getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max)
                        .status
                    : "Unknown"}
                </Text>
              </View>
              <Text style={styles.moistureMessage}>
                {(sensorData?.moisture || 0) >= 60
                  ? "Soil is well hydrated"
                  : (sensorData?.moisture || 0) >= 30
                    ? "Soil moisture is adequate"
                    : "Soil needs watering"}
              </Text>
            </View>

            {/* Visual Moisture Bar */}
            <View style={styles.moistureBarContainer}>
              <Text style={styles.moistureBarLabel}>Moisture Level</Text>
              <View style={styles.moistureBarTrack}>
                <View
                  style={[
                    styles.moistureBarFill,
                    {
                      width: `${Math.min(100, sensorData?.moisture || 0)}%`,
                      backgroundColor:
                        (sensorData?.moisture || 0) >= 60
                          ? "#4CAF50"
                          : (sensorData?.moisture || 0) >= 30
                            ? "#FFC107"
                            : "#F44336",
                    },
                  ]}
                />
              </View>
              <View style={styles.moistureBarMarkers}>
                <Text style={styles.moistureBarMarker}>0%</Text>
                <Text style={styles.moistureBarMarker}>50%</Text>
                <Text style={styles.moistureBarMarker}>100%</Text>
              </View>
            </View>
          </View>

          <View style={styles.plantHealthIndicator}>
            <View style={styles.plantHealthIcon}>
              <Ionicons
                name={
                  (sensorData?.moisture || 0) >= 60
                    ? "leaf"
                    : (sensorData?.moisture || 0) >= 30
                      ? "leaf-outline"
                      : "alert-circle"
                }
                size={32}
                color={
                  (sensorData?.moisture || 0) >= 60
                    ? "#4CAF50"
                    : (sensorData?.moisture || 0) >= 30
                      ? "#8BC34A"
                      : "#F44336"
                }
              />
            </View>
            <View style={styles.plantHealthText}>
              <Text style={styles.plantHealthTitle}>Plant Health</Text>
              <Text style={styles.plantHealthDescription}>
                {(sensorData?.moisture || 0) >= 60
                  ? "Your plant is thriving with optimal moisture levels"
                  : (sensorData?.moisture || 0) >= 30
                    ? "Your plant is doing okay but could use more water soon"
                    : "Your plant needs immediate watering attention"}
              </Text>
            </View>
          </View>
        </View>

        {/* Sensor Tracking History Section */}
        <View style={[styles.historyCard, { marginTop: 10 }]}>
          <View style={styles.historyHeader}>
            {/* Title and Legend in One Row */}
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyTitle}>Sensor Tracking History: Last 7 Days</Text>
              <View style={styles.legendRow}>
                {["Very Good", "Good", "Warning", "Bad"].map((label, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        {
                          backgroundColor: i === 0 ? "#4CAF50" : i === 1 ? "#8BC34A" : i === 2 ? "#FFC107" : "#F44336",
                        },
                      ]}
                    />
                    <Text style={styles.legendText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Days - Horizontally scrollable clean clickable cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyScrollContent}
            style={styles.historyScrollView}
          >
            {weeklyMonitoringData.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.scrollableHistoryDayWrapper}
                onPress={() => handleDayClick(item)}
                activeOpacity={0.7}
              >
                {/* Clean DAY BOX - Just day and status */}
                <View style={[styles.cleanDayBox, { backgroundColor: item.statusColor }]}>
                  <Text style={styles.cleanDayText}>{item.day}</Text>
                  <Text style={styles.cleanDateText}>{new Date(item.date).getDate()}</Text>
                  <Text style={styles.cleanStatusText}>{item.overallStatus}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

    <FooterNavigation />
    </View>
  )
}
