

import supabase from "./CONFIG/supaBase"
import { getCurrentUser } from "./CONFIG/currentUser"
import { useState, useEffect, useCallback, useRef } from "react"
import { useAppContext } from "./CONFIG/GlobalContext"
import type { CropData, SensorData } from "./CONFIG/GlobalContext"
import { Text, View, TouchableOpacity, ScrollView, Alert, Modal, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { useFocusEffect } from "@react-navigation/native"

// Import styles from a separate file
import { styles } from "./styles/plantdashboard.style"
import { COLORS } from "./styles/plantdashboard.style"

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
    isSensorConnected,
  } = useAppContext()

  const [cropsStatus] = useState("Good")
  const router = useRouter()

  // Local plant selection state
  const [crops, setCrops] = useState<CropData[]>([])
  const [showPlantModal, setShowPlantModal] = useState(false)
  const [selectionFeedback, setSelectionFeedback] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  // Plant history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedDayHistory, setSelectedDayHistory] = useState<DailyMonitoringData | null>(null)
  const [weeklyMonitoringData, setWeeklyMonitoringData] = useState<DailyMonitoringData[]>([])

  // Enhanced state variables for real-time data tracking
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [isLiveDataActive, setIsLiveDataActive] = useState(false)
  const [liveDataCounter, setLiveDataCounter] = useState(0) // Force re-renders on live updates
  const [lastSensorValues, setLastSensorValues] = useState<SensorData | null>(null) // Track previous values
  const [isScreenFocused, setIsScreenFocused] = useState(true) // Track screen focus for live updates
  const liveUpdateIntervalRef = useRef<any>(null) // Reference for live update interval

  // Arduino connection state for plant dashboard
  const [arduinoIP, setArduinoIP] = useState('192.168.18.56') // Same IP as sensor page
  const dashboardFetchIntervalRef = useRef<any>(null)

  // Live plant matching state - Updated to match analysis design
  const [liveMatchingPlants, setLiveMatchingPlants] = useState<{
    goodMatches: (CropData & { matchScore: number; matchReasons: string[] })[]
    badMatches: (CropData & { matchScore: number; matchReasons: string[] })[]
    warningMatches: (CropData & { matchScore: number; matchReasons: string[] })[]
  }>({ goodMatches: [], badMatches: [], warningMatches: [] })
  const [showLiveMatches, setShowLiveMatches] = useState(false)

  // Category and status filtering (same as analysis page)
  const [selectedLiveCategory, setSelectedLiveCategory] = useState<string>("all")
  const [selectedLiveStatus, setSelectedLiveStatus] = useState<"all" | "good" | "bad">("all")
  const [livePlantCategories, setLivePlantCategories] = useState<{ [key: string]: any[] }>({})
  const [expandedLivePlant, setExpandedLivePlant] = useState<string | null>(null)

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
    if (!cropName) {
      setCropParameters(null)
      return
    }

    console.log('📥 Loading crop parameters for:', cropName)

    try {
      const { data, error } = await supabase
        .from("denormalized_crop_parameter")
        .select("*")
        .eq("crop_name", cropName)
        .single()

      if (error) {
        console.error("❌ Error loading parameters:", error)
        setCropParameters(null)
        return
      }

      if (data) {
        console.log('✅ Parameters loaded successfully')
        console.log('🖼️ Image URL from database:', data.image_url)
        console.log('📋 Full crop parameter data:', data)
        setCropParameters(data)
      }
    } catch (err) {
      console.error("❌ Exception loading parameters:", err)
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

  // Enhanced plant health status with live data emphasis
  const getPlantHealthStatus = () => {
    if (!cropParameters || !sensorData) {
      return { 
        status: isLiveDataActive ? "Waiting for Live Data" : "Unknown", 
        color: "#9E9E9E" 
      }
    }

    const statuses = [
      getSensorStatus(sensorData.temperature, cropParameters.temperature_min, cropParameters.temperature_max),
      getSensorStatus(sensorData.ph, cropParameters.ph_level_min, cropParameters.ph_level_max),
      getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max),
    ]

    const badCount = statuses.filter((s) => s.status === "Bad").length
    const warningCount = statuses.filter((s) => s.status === "Warning").length

    // Enhanced status with live data context
    if (badCount > 0) return { 
      status: isLiveDataActive ? "Bad (Live)" : "Bad", 
      color: COLORS.error 
    }
    if (warningCount > 0) return { 
      status: isLiveDataActive ? "Warning (Live)" : "Warning", 
      color: "#FFC107" 
    }
    return { 
      status: isLiveDataActive ? "Good (Live)" : "Good", 
      color: "#4CAF50" 
    }
  }

  // NEW: Live comparison function to show value trends
  const getLiveComparison = (currentValue: number, previousValue: number | null) => {
    if (!previousValue || !isLiveDataActive) return ""
    
    const diff = currentValue - previousValue
    if (Math.abs(diff) < 0.1) return "➖" // No significant change
    if (diff > 0) return "📈" // Increasing
    return "📉" // Decreasing
  }

  // LIVE PLANT MATCHING SYSTEM - Analyzes current sensor data against all plants
  const analyzeLivePlantMatches = async () => {
    if (!sensorData || !isSensorConnected || crops.length === 0) {
      console.log('⚠️ Cannot analyze plant matches - missing sensor data or crops')
      setLiveMatchingPlants({ goodMatches: [], badMatches: [], warningMatches: [] })
      return
    }

    console.log('🔍 ANALYZING LIVE PLANT MATCHES with current sensor data:', {
      temperature: sensorData.temperature,
      moisture: sensorData.moisture,
      ph: sensorData.ph,
      nitrogen: sensorData.nitrogen,
      phosphorus: sensorData.phosphorus,
      potassium: sensorData.potassium
    })

    try {
      // Get all crop parameters from database
      const { data: allCropParameters, error } = await supabase
        .from("denormalized_crop_parameter")
        .select("*")

      if (error) {
        console.error('❌ Error fetching crop parameters:', error)
        return
      }

      if (!allCropParameters || allCropParameters.length === 0) {
        console.log('⚠️ No crop parameters found in database')
        return
      }

      const goodMatches: (CropData & { matchScore: number; matchReasons: string[] })[] = []
      const warningMatches: (CropData & { matchScore: number; matchReasons: string[] })[] = []
      const badMatches: (CropData & { matchScore: number; matchReasons: string[] })[] = []

      // Analyze each crop against current sensor readings
      for (const cropParam of allCropParameters) {
        // Find corresponding crop data
        const cropData = crops.find(c => c.crop_name === cropParam.crop_name)
        if (!cropData) continue

        const matchReasons: string[] = []
        let matchScore = 0
        let totalChecks = 0

        // Check temperature match
        if (cropParam.temperature_min !== null && cropParam.temperature_max !== null) {
          totalChecks++
          if (sensorData.temperature >= cropParam.temperature_min && sensorData.temperature <= cropParam.temperature_max) {
            matchScore++
            matchReasons.push(` Perfect temp (${sensorData.temperature}°C)`)
          } else if (sensorData.temperature >= cropParam.temperature_min * 0.9 && sensorData.temperature <= cropParam.temperature_max * 1.1) {
            matchScore += 0.5
            matchReasons.push(` Close temp (${sensorData.temperature}°C)`)
          } else {
            matchReasons.push(` Poor temp (${sensorData.temperature}°C vs ${cropParam.temperature_min}-${cropParam.temperature_max}°C)`)
          }
        }

        // Check moisture match
        if (cropParam.moisture_min !== null && cropParam.moisture_max !== null) {
          totalChecks++
          if (sensorData.moisture >= cropParam.moisture_min && sensorData.moisture <= cropParam.moisture_max) {
            matchScore++
            matchReasons.push(` Perfect moisture (${sensorData.moisture}%)`)
          } else if (sensorData.moisture >= cropParam.moisture_min * 0.9 && sensorData.moisture <= cropParam.moisture_max * 1.1) {
            matchScore += 0.5
            matchReasons.push(` Close moisture (${sensorData.moisture}%)`)
          } else {
            matchReasons.push(` Poor moisture (${sensorData.moisture}% vs ${cropParam.moisture_min}-${cropParam.moisture_max}%)`)
          }
        }

        // Check pH match
        if (cropParam.ph_level_min !== null && cropParam.ph_level_max !== null) {
          totalChecks++
          if (sensorData.ph >= cropParam.ph_level_min && sensorData.ph <= cropParam.ph_level_max) {
            matchScore++
            matchReasons.push(` Perfect pH (${sensorData.ph})`)
          } else if (sensorData.ph >= cropParam.ph_level_min * 0.95 && sensorData.ph <= cropParam.ph_level_max * 1.05) {
            matchScore += 0.5
            matchReasons.push(` Close pH (${sensorData.ph})`)
          } else {
            matchReasons.push(` Poor pH (${sensorData.ph} vs ${cropParam.ph_level_min}-${cropParam.ph_level_max})`)
          }
        }

        // Check nitrogen match
        if (cropParam.nitrogen_min !== null && cropParam.nitrogen_max !== null) {
          totalChecks++
          if (sensorData.nitrogen >= cropParam.nitrogen_min && sensorData.nitrogen <= cropParam.nitrogen_max) {
            matchScore++
            matchReasons.push(`🌿 Perfect N (${sensorData.nitrogen}ppm)`)
          } else if (sensorData.nitrogen >= cropParam.nitrogen_min * 0.8 && sensorData.nitrogen <= cropParam.nitrogen_max * 1.2) {
            matchScore += 0.5
            matchReasons.push(`🌿 Close N (${sensorData.nitrogen}ppm)`)
          } else {
            matchReasons.push(`🌿 Poor N (${sensorData.nitrogen}ppm vs ${cropParam.nitrogen_min}-${cropParam.nitrogen_max}ppm)`)
          }
        }

        // Calculate final match percentage
        const matchPercentage = totalChecks > 0 ? (matchScore / totalChecks) * 100 : 0
        
        const plantWithMatch = {
          ...cropData,
          matchScore: matchPercentage,
          matchReasons: matchReasons.slice(0, 3) // Limit to top 3 reasons
        }

        // Categorize based on match percentage
        if (matchPercentage >= 80) {
          goodMatches.push(plantWithMatch)
        } else if (matchPercentage >= 50) {
          warningMatches.push(plantWithMatch)
        } else {
          badMatches.push(plantWithMatch)
        }
      }

      // Sort by match score (highest first)
      goodMatches.sort((a, b) => b.matchScore - a.matchScore)
      warningMatches.sort((a, b) => b.matchScore - a.matchScore)
      badMatches.sort((a, b) => b.matchScore - a.matchScore)

      // Limit results to prevent UI overload
      const finalMatches = {
        goodMatches: goodMatches.slice(0, 10), // Top 10 good matches
        warningMatches: warningMatches.slice(0, 8), // Top 8 warning matches
        badMatches: badMatches.slice(0, 5) // Top 5 bad matches (for reference)
      }

      setLiveMatchingPlants(finalMatches)

      console.log('✅ LIVE PLANT ANALYSIS COMPLETE:', {
        totalCropsAnalyzed: allCropParameters.length,
        goodMatches: finalMatches.goodMatches.length,
        warningMatches: finalMatches.warningMatches.length,
        badMatches: finalMatches.badMatches.length,
        currentConditions: {
          temp: sensorData.temperature,
          moisture: sensorData.moisture,
          ph: sensorData.ph
        }
      })

      if (finalMatches.goodMatches.length > 0) {
        console.log('🌱 TOP EXCELLENT MATCHES:', finalMatches.goodMatches.slice(0, 3).map(p => `${p.crop_name} (${p.matchScore.toFixed(1)}%)`))
      }
      
      if (finalMatches.warningMatches.length > 0) {
        console.log('⚠️ TOP FAIR MATCHES:', finalMatches.warningMatches.slice(0, 2).map(p => `${p.crop_name} (${p.matchScore.toFixed(1)}%)`))
      }

      console.log('📊 LIVE PLANT MATCHING: Analysis completed and UI will update')

      // Categorize plants by type (same as analysis page)
      categorizeLivePlants([...finalMatches.goodMatches, ...finalMatches.badMatches])

    } catch (error) {
      console.error('❌ Error analyzing plant matches:', error)
      setLiveMatchingPlants({ goodMatches: [], badMatches: [], warningMatches: [] })
    }
  }

  // Function to categorize live plants by type (same logic as analysis page)
  const categorizeLivePlants = (recommendations: any[]) => {
    const categories: { [key: string]: any[] } = {
      all: recommendations,
      vegetables: [],
      fruits: [],
      grains: [],
      herbs: [],
      legumes: [],
      roots: [],
    }

    recommendations.forEach((rec) => {
      const cropName = rec.crop_name.toLowerCase()
      
      // Categorize based on crop name (same logic as analysis page)
      if (cropName.includes('tomato') || cropName.includes('lettuce') || cropName.includes('cucumber') || 
          cropName.includes('spinach') || cropName.includes('cabbage') || cropName.includes('broccoli') ||
          cropName.includes('pepper') || cropName.includes('onion') || cropName.includes('garlic')) {
        categories.vegetables.push(rec)
      } else if (cropName.includes('apple') || cropName.includes('banana') || cropName.includes('orange') || 
               cropName.includes('mango') || cropName.includes('grape') || cropName.includes('strawberry')) {
        categories.fruits.push(rec)
      } else if (cropName.includes('rice') || cropName.includes('wheat') || cropName.includes('corn') || 
               cropName.includes('oat') || cropName.includes('barley')) {
        categories.grains.push(rec)
      } else if (cropName.includes('basil') || cropName.includes('mint') || cropName.includes('oregano') || 
               cropName.includes('thyme') || cropName.includes('parsley')) {
        categories.herbs.push(rec)
      } else if (cropName.includes('bean') || cropName.includes('pea') || cropName.includes('lentil') || 
               cropName.includes('chickpea')) {
        categories.legumes.push(rec)
      } else if (cropName.includes('potato') || cropName.includes('carrot') || cropName.includes('radish') || 
               cropName.includes('turnip') || cropName.includes('sweet potato')) {
        categories.roots.push(rec)
      } else {
        // Default to vegetables if not categorized
        categories.vegetables.push(rec)
      }
    })

    // Remove empty categories
    Object.keys(categories).forEach((key) => {
      if (key !== 'all' && categories[key].length === 0) {
        delete categories[key]
      }
    })

    setLivePlantCategories(categories)
  }

  // Helper functions (same as analysis page)
  const getLiveCategoryIcon = (categoryKey: string): string => {
    const categoryIcons: { [key: string]: string } = {
      'all': 'apps-outline',
      'vegetables': 'leaf-outline', 
      'fruits': 'nutrition-outline',
      'grains': 'grain-outline',
      'herbs': 'flower-outline',
      'legumes': 'ellipse-outline',
      'roots': 'fitness-outline',
    }
    return categoryIcons[categoryKey] || 'leaf-outline'
  }

  const getLiveCategoryInfo = (category: string) => {
    const categoryMap: { [key: string]: { name: string; icon: string; count: number } } = {
      all: { name: "All Plants", icon: "apps-outline", count: (liveMatchingPlants.goodMatches.length + liveMatchingPlants.badMatches.length) },
      vegetables: { name: "Vegetables", icon: "leaf-outline", count: livePlantCategories.vegetables?.length || 0 },
      fruits: { name: "Fruits", icon: "nutrition-outline", count: livePlantCategories.fruits?.length || 0 },
      grains: { name: "Grains & Cereals", icon: "grain-outline", count: livePlantCategories.grains?.length || 0 },
      herbs: { name: "Herbs & Spices", icon: "flower-outline", count: livePlantCategories.herbs?.length || 0 },
      legumes: { name: "Legumes", icon: "ellipse-outline", count: livePlantCategories.legumes?.length || 0 },
      roots: { name: "Root Crops", icon: "fitness-outline", count: livePlantCategories.roots?.length || 0 },
    }
    return categoryMap[category] || { name: "Unknown", icon: "help-outline", count: 0 }
  }

  // Get filtered live recommendations based on category and status
  const getFilteredLiveRecommendations = () => {
    let categoryRecommendations: any[] = []

    if (selectedLiveCategory === "all") {
      categoryRecommendations = [...liveMatchingPlants.goodMatches, ...liveMatchingPlants.badMatches]
    } else {
      categoryRecommendations = livePlantCategories[selectedLiveCategory] || []
    }

    // Filter by status (good/bad only, no warning matches shown)
    if (selectedLiveStatus === "good") {
      return categoryRecommendations.filter(plant => plant.matchScore >= 80)
    } else if (selectedLiveStatus === "bad") {
      return categoryRecommendations.filter(plant => plant.matchScore < 50)
    } else {
      return categoryRecommendations
    }
  }

  const getLiveStatusColor = (matchScore: number) => {
    if (matchScore >= 80) return COLORS.success
    if (matchScore < 50) return COLORS.error
    return COLORS.warning
  }

  const getLiveStatusIcon = (matchScore: number) => {
    if (matchScore >= 80) return "checkmark-circle"
    if (matchScore < 50) return "close-circle"
    return "warning"
  }

  // DIRECT Arduino sensor data fetching for plant dashboard
  const fetchArduinoSensorData = async () => {
    try {
      console.log('🔥 PLANT DASHBOARD: Fetching LIVE data from Arduino:', `http://${arduinoIP}/api/sensor-data`)
      
      const response = await fetch(`http://${arduinoIP}/api/sensor-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ PLANT DASHBOARD: Received FRESH Arduino data:', data)
        
        const normalized: SensorData = {
          temperature: data.temperature || 0,
          moisture: data.moisture || 0,
          ph: data.ph || 0,
          ec: data.ec || 0,
          nitrogen: data.nitrogen || 0,
          potassium: data.potassium || 0,
          phosphorus: data.phosphorus || 0,
          timestamp: Date.now(), // Always use current timestamp to force updates
        }
        
        console.log('� PLANT DASHBOARD: Updating global sensor data with FRESH Arduino data')
        setSensorData(normalized)
        
        // Store in database if we have a user
        const userId = currentUser?.id || (user as User)?.id
        if (userId) {
          const insertPayload = {
            user_id: userId,
            measured_at: new Date().toISOString(),
            temp_c: normalized.temperature,
            moisture_pct: normalized.moisture,
            ec_us_cm: normalized.ec,
            ph_level: normalized.ph,
            nitrogen_ppm: normalized.nitrogen,
            phosphorus_ppm: normalized.phosphorus,
            potassium_ppm: normalized.potassium,
          }
          
          const { error } = await supabase.from('esp32_readings').insert(insertPayload)
          if (error) {
            console.log('⚠️ PLANT DASHBOARD: Database insert error:', error.message)
          } else {
            console.log('✅ PLANT DASHBOARD: Sensor data saved to database')
          }
        }
        
        // Update live status
        setIsLiveDataActive(true)
        setLastUpdateTime(new Date())
        setLiveDataCounter(prev => prev + 1)
        
        console.log('� PLANT DASHBOARD: Successfully updated with LIVE Arduino data!')
        return normalized
        
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error: any) {
      console.error('❌ PLANT DASHBOARD: Arduino fetch failed:', error.message)
      
      // If Arduino fails, try database as fallback
      const userId = currentUser?.id || (user as User)?.id
      if (userId) {
        console.log('🔄 PLANT DASHBOARD: Arduino failed, trying database fallback...')
        await fetchESP32SensorData(userId)
      }
      
      setIsLiveDataActive(false)
      return null
    }
  }

  // Handle refresh ESP32 data manually
  const handleRefreshSensorData = async () => {
    const userId = currentUser?.id || (user as User)?.id
    if (!userId) {
      console.log("❌ No user ID available for refresh")
      return
    }

    console.log("🔄 Manual refresh requested...")
    
    // Always try Arduino first for freshest data
    const freshData = await fetchArduinoSensorData()
    
    if (!freshData) {
      console.log("📂 Arduino unavailable - fetching latest from database")
      await fetchESP32SensorData(userId)
    }
    
    // Refresh the weekly history with latest data
    const newWeeklyData = await generateWeeklyMonitoringData()
    setWeeklyMonitoringData(newWeeklyData)
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
        // Get picture data from denormalized_crop_parameter
        const { data: pictureData, error: pictureError } = await supabase
          .from("denormalized_crop_parameter")
          .select("crop_id, crop_name, crop_category, picture")
          .order("crop_category", { ascending: true })
          .order("crop_name", { ascending: true })

        if (pictureError) {
          console.error("DB picture crops error:", pictureError)
          return
        }

        // Get location data from denormalized_crop_details  
        const { data: locationData, error: locationError } = await supabase
          .from("denormalized_crop_details")
          .select("crop_details_id, crop_city, crop_province, crop_region")

        if (locationError) {
          console.error("DB location crops error:", locationError)
        }

        if (pictureData && pictureData.length > 0) {
          // Create lookup map for location data
          const locationMap = new Map()
          if (locationData) {
            locationData.forEach(loc => {
              locationMap.set(loc.crop_details_id, {
                crop_city: loc.crop_city || '',
                crop_province: loc.crop_province || '', 
                crop_region: loc.crop_region || ''
              })
            })
          }

          // Combine picture and location data
          const mappedCrops = pictureData.map(item => {
            const location = locationMap.get(item.crop_id) || {
              crop_city: '',
              crop_province: '',
              crop_region: ''
            }

            return {
              crop_details_id: item.crop_id,
              crop_name: item.crop_name,
              crop_categories: item.crop_category,
              crop_region: location.crop_region,
              crop_province: location.crop_province,
              crop_city: location.crop_city,
              image_url: item.picture, // Map 'picture' to 'image_url' for consistency
              picture: item.picture    // Keep original for reference
            }
          })
          
          setCrops(mappedCrops)
          console.log("Loaded crops:", mappedCrops.length)
          console.log("🖼️ Sample crop with combined data:", mappedCrops[0])
          console.log("🔍 Crops with picture field:", mappedCrops.filter(crop => crop.picture).length)
          console.log("� Crops with location data:", mappedCrops.filter(crop => crop.crop_city).length)
        }
      } catch (err) {
        console.error("Failed to load crops:", err)
      }
    }

    fetchUserData()
    loadCropsFromDb()
  }, [])

  // Trigger live plant analysis when crops data loads
  useEffect(() => {
    if (crops.length > 0 && sensorData && isSensorConnected) {
      console.log('🌱 Crops data loaded - triggering initial plant analysis')
      setTimeout(() => {
        analyzeLivePlantMatches()
      }, 1000) // Allow time for crops to settle
    }
  }, [crops.length])

  // Reset status filter when category changes (same as analysis page)
  useEffect(() => {
    setSelectedLiveStatus("all")
  }, [selectedLiveCategory])

  // Initialize data only once on mount
  useEffect(() => {
    const initializeData = async () => {
      const userId = currentUser?.id || (user as User)?.id
      if (!userId) return

      console.log("🚀 Initializing plant dashboard (one-time setup)")

      // Load initial sensor data from database ONLY if no live data exists
      if (!sensorData || !isSensorConnected) {
        console.log("📂 Loading fallback sensor data from database")
        await fetchESP32SensorData(userId)
      } else {
        console.log("🔴 Using live sensor data - skipping database fetch")
      }

      // Load weekly history
      const historyData = await generateWeeklyMonitoringData()
      setWeeklyMonitoringData(historyData)
    }

    initializeData()
  }, [currentUser?.id, user]) // Re-run when user changes

  // SEPARATE useEffect for crop parameter loading (runs only when crop name changes)
  useEffect(() => {
    if (!selectedCrop?.crop_name) {
      console.log('⚠️ No crop selected')
      setCropParameters(null)
      return
    }

    console.log('🌱 Loading parameters for:', selectedCrop.crop_name)
    
    // Load crop parameters without blocking sensor updates
    const loadParams = async () => {
      try {
        const { data, error } = await supabase
          .from("denormalized_crop_parameter")
          .select("*")
          .eq("crop_name", selectedCrop.crop_name)
          .single()

        if (!error && data) {
          console.log('✅ Parameters loaded for:', selectedCrop.crop_name)
          setCropParameters(data)
        }
      } catch (err) {
        console.error("Failed to load parameters:", err)
      }
    }

    loadParams()
  }, [selectedCrop?.crop_name]) // Only re-run when crop NAME changes

  // AGGRESSIVE live sensor data monitoring - detects ANY sensor value change
  useEffect(() => {
    console.log('� LIVE SENSOR CHANGE DETECTED - Plant Dashboard')
    console.log('  🔗 Connection:', isSensorConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED')
    
    if (sensorData) {
      console.log('  � Current Live Sensor Values:')
      console.log('    🌡️ Temperature:', sensorData.temperature, '°C')
      console.log('    💧 Moisture:', sensorData.moisture, '%')
      console.log('    🧪 pH Level:', sensorData.ph)
      console.log('    � Nitrogen:', sensorData.nitrogen, 'ppm')
      console.log('    🌸 Phosphorus:', sensorData.phosphorus, 'ppm')
      console.log('    🥔 Potassium:', sensorData.potassium, 'ppm')
      console.log('    ⏰ Timestamp:', new Date(sensorData.timestamp).toLocaleTimeString())
    }
    
    // Always update live data status
    setIsLiveDataActive(isSensorConnected)
    
    if (isSensorConnected && sensorData) {
      // Check if sensor values actually changed
      const valuesChanged = !lastSensorValues || 
        lastSensorValues.temperature !== sensorData.temperature ||
        lastSensorValues.moisture !== sensorData.moisture ||
        lastSensorValues.ph !== sensorData.ph ||
        lastSensorValues.nitrogen !== sensorData.nitrogen ||
        lastSensorValues.phosphorus !== sensorData.phosphorus ||
        lastSensorValues.potassium !== sensorData.potassium

      if (valuesChanged) {
        console.log('🔥 SENSOR VALUES CHANGED - Forcing dashboard update!')
        if (lastSensorValues) {
          console.log('� Changes detected:')
          console.log('  Temperature:', lastSensorValues.temperature, '→', sensorData.temperature)
          console.log('  Moisture:', lastSensorValues.moisture, '→', sensorData.moisture)
          console.log('  pH:', lastSensorValues.ph, '→', sensorData.ph)
        }
        
        // Store current values as previous for next comparison
        setLastSensorValues({ ...sensorData })
        
        // Force UI counter increment to trigger re-renders
        setLiveDataCounter(prev => prev + 1)
        
        // Update timestamp for visual feedback
        setLastUpdateTime(new Date(sensorData.timestamp || Date.now()))
        
        console.log('✅ LIVE DATA UPDATE #' + (liveDataCounter + 1) + ' - Dashboard refreshing!')
      }
      
      // Always refresh monitoring history when live data is active
      if (selectedCrop?.crop_name) {
        console.log('🔄 Refreshing monitoring history with live sensor data...')
        setTimeout(async () => {
          try {
            const historyData = await generateWeeklyMonitoringData()
            setWeeklyMonitoringData(historyData)
            console.log('✅ Live monitoring history updated successfully')
          } catch (error) {
            console.error('❌ Error updating live monitoring history:', error)
          }
        }, 200) // Short delay for smooth updates
      }
    } else if (!isSensorConnected) {
      console.log('⚠️ Sensor DISCONNECTED - clearing live data state')
      setIsLiveDataActive(false)
      setLastSensorValues(null)
    }
  }, [
    isSensorConnected, 
    sensorData?.timestamp, 
    sensorData?.temperature,
    sensorData?.moisture, 
    sensorData?.ph,
    sensorData?.nitrogen,
    sensorData?.potassium,
    sensorData?.phosphorus,
    selectedCrop?.crop_name
  ]) // React to ALL sensor changes immediately

  // High-frequency live data refresh for immediate UI updates
  useEffect(() => {
    if (!isSensorConnected || !sensorData) {
      console.log('⚠️ No live sensor connection - stopping continuous refresh')
      return
    }

    console.log('� Starting HIGH-FREQUENCY live data monitoring')
    console.log('📡 Sensor updates every 3 seconds from Arduino')
    console.log('🔄 Dashboard will refresh every 5 seconds to show live changes')
    
    // More frequent refresh when live sensor is active for immediate response
    const monitoringRefreshInterval = setInterval(async () => {
      if (isSensorConnected && sensorData) {
        console.log('📊 LIVE REFRESH CYCLE - Current sensor values:', {
          temp: sensorData.temperature,
          moisture: sensorData.moisture,
          ph: sensorData.ph,
          timestamp: new Date(sensorData.timestamp).toLocaleTimeString()
        })
        
        if (selectedCrop?.crop_name) {
          try {
            const historyData = await generateWeeklyMonitoringData()
            setWeeklyMonitoringData(historyData)
            console.log('✅ Live monitoring data refreshed successfully')
          } catch (error) {
            console.error('❌ Error in live monitoring refresh:', error)
          }
        }
      }
    }, 5000) // Refresh every 5 seconds for responsive live updates

    console.log('📡 Live monitoring interval started, refreshing every 5 seconds')

    // Cleanup interval on disconnect or unmount
    return () => {
      console.log('🛑 Clearing high-frequency monitoring refresh interval')
      clearInterval(monitoringRefreshInterval)
    }
  }, [isSensorConnected, sensorData?.timestamp, selectedCrop?.crop_name]) // Re-setup when connection/data/crop changes

  // CRITICAL: INDEPENDENT Arduino fetching for plant dashboard
  useEffect(() => {
    console.log('🔥 STARTING INDEPENDENT ARDUINO FETCHING FOR PLANT DASHBOARD')
    
    if (dashboardFetchIntervalRef.current) {
      clearInterval(dashboardFetchIntervalRef.current)
      dashboardFetchIntervalRef.current = null
    }
    
    console.log('🚀 Plant dashboard will fetch DIRECTLY from Arduino every 3 seconds')
    console.log('📡 This is INDEPENDENT of sensor page - dashboard gets its OWN fresh data')
    
    // Start fetching immediately
    fetchArduinoSensorData()
    
    // Set up continuous Arduino fetching for plant dashboard
    const interval = setInterval(() => {
      console.log('🔄 PLANT DASHBOARD: Fetching fresh Arduino data (independent of sensor page)')
      fetchArduinoSensorData()
    }, 3000) // Fetch from Arduino every 3 seconds (same as sensor page)
    
    dashboardFetchIntervalRef.current = interval
    
    console.log('✅ PLANT DASHBOARD: Independent Arduino fetching started')
    console.log('🎯 Dashboard now gets FRESH data directly from Arduino every 3 seconds!')
    
    return () => {
      console.log('🛑 PLANT DASHBOARD: Stopping independent Arduino fetching')
      if (dashboardFetchIntervalRef.current) {
        clearInterval(dashboardFetchIntervalRef.current)
        dashboardFetchIntervalRef.current = null
      }
    }
  }, []) // Run once and keep running

  // CRITICAL: Continuous live monitoring - works on ANY screen
  useEffect(() => {
    console.log('🔥 STARTING CONTINUOUS PLANT DASHBOARD MONITORING')
    
    // Clear any existing interval
    if (liveUpdateIntervalRef.current) {
      clearInterval(liveUpdateIntervalRef.current)
      liveUpdateIntervalRef.current = null
    }
    
    // Always start monitoring - don't stop even if sensor disconnected
    // This ensures we catch sensor data as soon as it becomes available
    console.log('🚀 Monitoring will run continuously regardless of current sensor state')
    
    console.log('📡 Setting up PERSISTENT dashboard monitoring (works from any screen)')
    
    // Continuous monitoring that updates plant dashboard regardless of screen focus
    liveUpdateIntervalRef.current = setInterval(() => {
      if (isSensorConnected && sensorData) {
        console.log('� CONTINUOUS PLANT DASHBOARD UPDATE')
        console.log('  📊 Live sensor vs plant requirements comparison active')
        console.log('  🌡️ Temperature:', sensorData.temperature, '°C')
        console.log('  💧 Moisture:', sensorData.moisture, '%') 
        console.log('  🧪 pH:', sensorData.ph)
        console.log('  🌱 Selected plant:', selectedCrop?.crop_name || 'None')
        
        // Force dashboard UI update with latest sensor data
        setLiveDataCounter(prev => prev + 1)
        setLastUpdateTime(new Date(sensorData.timestamp))
        
        // Refresh plant monitoring history periodically
        if (selectedCrop?.crop_name && (Date.now() % 20000) < 2500) { // Every ~20 seconds
          console.log('🔄 Updating plant monitoring history with live sensor data')
          generateWeeklyMonitoringData().then(newData => {
            setWeeklyMonitoringData(newData)
          }).catch(err => {
            console.error('❌ Failed to refresh monitoring data:', err)
          })
        }
      }
    }, 1500) // Update every 1.5 seconds for MAXIMUM live responsiveness
    
    console.log('✅ Continuous plant dashboard monitoring started - ID:', liveUpdateIntervalRef.current)
    
    return () => {
      console.log('� Cleaning up continuous plant dashboard monitoring')
      if (liveUpdateIntervalRef.current) {
        clearInterval(liveUpdateIntervalRef.current)
        liveUpdateIntervalRef.current = null
      }
    }
  }, [isSensorConnected, sensorData?.timestamp, selectedCrop?.crop_name])

  // Screen focus effect for immediate visual feedback when user returns
  useFocusEffect(
    useCallback(() => {
      console.log('👁️ PLANT DASHBOARD FOCUSED - Immediate visual refresh')
      setIsScreenFocused(true)
      
      // Force immediate visual update when user returns to dashboard
      if (isSensorConnected && sensorData) {
        console.log('📱 User returned to dashboard - showing latest plant comparison')
        setLiveDataCounter(prev => prev + 1)
        setLastUpdateTime(new Date())
      }
      
      return () => {
        console.log('👁️ PLANT DASHBOARD UNFOCUSED - Continuous monitoring continues!')
        setIsScreenFocused(false)
        // Continuous monitoring keeps running in background
      }
    }, [isSensorConnected, sensorData])
  )

  // ULTRA-AGGRESSIVE SENSOR DATA RESPONSE - Triggers immediately when ANY sensor data changes
  useEffect(() => {
    console.log('⚡ ULTRA-FAST SENSOR DATA CHANGE DETECTED')
    console.log('📡 Global sensor data updated - IMMEDIATELY updating plant dashboard')
    
    // Always try to update dashboard when ANY sensor data changes
    if (sensorData) {
      console.log('✅ LIVE SENSOR DATA DETECTED - Forcing immediate plant comparison update')
      console.log('  🌡️ Live Temperature:', sensorData.temperature, '°C')
      console.log('  💧 Live Moisture:', sensorData.moisture, '%')
      console.log('  🧪 Live pH:', sensorData.ph)
      console.log('  🌿 Nitrogen:', sensorData.nitrogen, 'ppm')
      console.log('  🌸 Phosphorus:', sensorData.phosphorus, 'ppm')  
      console.log('  🥔 Potassium:', sensorData.potassium, 'ppm')
      console.log('  📅 Data timestamp:', new Date(sensorData.timestamp).toLocaleTimeString())
      console.log('  🔗 Sensor connected:', isSensorConnected ? 'YES' : 'NO')
      
      // IMMEDIATE and AGGRESSIVE UI update 
      setLiveDataCounter(prev => prev + 1)
      setLastUpdateTime(new Date(sensorData.timestamp || Date.now()))
      setIsLiveDataActive(isSensorConnected)
      
      // Update previous sensor values for live comparison
      setLastSensorValues(sensorData)
      
      // TRIGGER LIVE PLANT MATCHING ANALYSIS
      if (isSensorConnected && crops.length > 0) {
        console.log('🔍 TRIGGERING LIVE PLANT MATCHING ANALYSIS')
        setTimeout(() => {
          analyzeLivePlantMatches()
        }, 500) // Small delay to prevent overwhelming the system
      }
      
      // Force plant condition calculation update
      if (selectedCrop?.crop_name && cropParameters) {
        const tempStatus = getSensorStatus(sensorData.temperature, cropParameters.temperature_min, cropParameters.temperature_max)
        const moistureStatus = getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max)
        const phStatus = getSensorStatus(sensorData.ph, cropParameters.ph_level_min, cropParameters.ph_level_max)
        
        console.log('🌱 LIVE PLANT CONDITION COMPARISON:')
        console.log('  🌡️ Temperature Status:', tempStatus.status, `(${sensorData.temperature}°C vs optimal ${cropParameters.temperature_min}-${cropParameters.temperature_max}°C)`)
        console.log('  💧 Moisture Status:', moistureStatus.status, `(${sensorData.moisture}% vs optimal ${cropParameters.moisture_min}-${cropParameters.moisture_max}%)`)
        console.log('  🧪 pH Status:', phStatus.status, `(${sensorData.ph} vs optimal ${cropParameters.ph_level_min}-${cropParameters.ph_level_max})`)
      }
      
      console.log('🚀 Plant dashboard UI FORCE UPDATED with live sensor data')
    } else {
      console.log('⚠️ No sensor data available yet')
      setIsLiveDataActive(false)
    }
  }, [
    sensorData, // React to ANY sensor data changes
    isSensorConnected, // React to connection changes
    selectedCrop?.crop_name, // React to plant selection changes
    cropParameters, // React to parameter loading
    crops.length // React to crops loading
  ])

  // REAL-TIME PLANT CONDITION MONITORING - Updates plant condition comparison live
  useEffect(() => {
    if (!isSensorConnected || !sensorData || !selectedCrop || !cropParameters) return

    console.log('🌱 REAL-TIME PLANT CONDITION UPDATE')
    console.log('📊 Live Sensor vs', selectedCrop.crop_name, 'Requirements:')
    
    // Calculate live status for each parameter
    const tempStatus = getSensorStatus(sensorData.temperature, cropParameters.temperature_min, cropParameters.temperature_max)
    const moistureStatus = getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max)
    const phStatus = getSensorStatus(sensorData.ph, cropParameters.ph_level_min, cropParameters.ph_level_max)
    
    console.log('🌡️ Temperature:', sensorData.temperature, '°C -', tempStatus.status, `(optimal: ${cropParameters.temperature_min}-${cropParameters.temperature_max}°C)`)
    console.log('💧 Moisture:', sensorData.moisture, '% -', moistureStatus.status, `(optimal: ${cropParameters.moisture_min}-${cropParameters.moisture_max}%)`)
    console.log('🧪 pH Level:', sensorData.ph, '-', phStatus.status, `(optimal: ${cropParameters.ph_level_min}-${cropParameters.ph_level_max})`)
    
    // Force UI update to show live plant condition changes
    const currentTime = Date.now()
    if (!lastUpdateTime || (currentTime - lastUpdateTime.getTime()) > 500) { // Update max twice per second
      console.log('✅ Forcing plant condition UI update with live sensor data')
      setLastUpdateTime(new Date(currentTime))
      setLiveDataCounter(prev => prev + 1)
    }
    
  }, [
    isSensorConnected, 
    sensorData?.temperature,
    sensorData?.moisture,
    sensorData?.ph,
    sensorData?.nitrogen,
    sensorData?.potassium,
    sensorData?.phosphorus,
    selectedCrop?.crop_name,
    cropParameters
  ])

  // Log modal state changes (for debugging)
  useEffect(() => {
    console.log('📋 Plant modal state:', showPlantModal ? 'OPEN' : 'CLOSED')
  }, [showPlantModal])

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
    console.log('🌱 Plant selected:', crop.crop_name)
    
    // Update selected crop
    setSelectedCrop(crop)
    
    // Close live recommendations when plant is selected
    setShowLiveMatches(false)
    setExpandedLivePlant(null)
    
    // Close modal (THIS WAS THE BUG - was setShowIPInput instead!)
    setShowPlantModal(false)
    
    // Show feedback message
    setSelectionFeedback(`✅ ${crop.crop_name} selected!`)
    
    // Clear feedback after 3 seconds
    setTimeout(() => {
      setSelectionFeedback('')
    }, 3000)
    
    // Load parameters in background
    setTimeout(async () => {
      await loadCropParameters(crop.crop_name)
    }, 100) // Small delay to let modal close animation complete
    
    console.log('✅ Plant selected and recommendations closed - showing selected plant dashboard')
  }

  return (
    <View style={styles.container}>
      {/* Header Background */}
      <LinearGradient colors={[COLORS.primaryGreen, COLORS.darkGreen]} style={styles.headerBackground}>
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
    
            
            {/* Last Update Time */}
            {lastUpdateTime && (
              <View style={{ marginRight: 12 }}>
                <Text style={{ color: 'white', fontSize: 9, opacity: 0.8 }}>Updated</Text>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                  {lastUpdateTime.toLocaleTimeString()}
                </Text>
              </View>
            )}
            
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

      {/* Selection Feedback Message */}
      {selectionFeedback ? (
        <View style={{
          backgroundColor: 'rgba(76, 175, 80, 0.9)',
          paddingVertical: 8,
          paddingHorizontal: 16,
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(76, 175, 80, 0.3)'
        }}>
          <Text style={{
            color: 'white',
            fontSize: 14,
            fontWeight: '600'
          }}>
            {selectionFeedback}
          </Text>
        </View>
      ) : null}

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
                        {/* Plant Image */}
                        <View style={{ marginRight: 12 }}>
                          {crop.image_url ? (
                            <Image
                              source={{ uri: crop.image_url }}
                              style={{
                                width: 45,
                                height: 45,
                                borderRadius: 8,
                              }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={{
                              width: 45,
                              height: 45,
                              borderRadius: 8,
                              backgroundColor: '#f8f8f8',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: 1,
                              borderColor: '#e8e8e8',
                            }}>
                              <Ionicons name="leaf-outline" size={18} color="#ccc" />
                            </View>
                          )}
                        </View>

                        {/* Plant Content */}
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
        {/* LIVE PLANT RECOMMENDATIONS SECTION - ANALYSIS DESIGN */}
        {isLiveDataActive && (
          <View style={[styles.liveMatchesCard, { marginTop: 0, marginBottom: 20 }]}>
            {/* Header */}
            <View style={styles.liveMatchesHeader}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.liveMatchesTitle}> Live Plant Recommendations</Text>
                  
                </View>
                <TouchableOpacity 
                  onPress={() => analyzeLivePlantMatches()}
                  style={{ 
                    backgroundColor: COLORS.accentGreen, 
                    borderRadius: 8, 
                    padding: 8,
                    opacity: 0.9
                  }}
                >
                  <Ionicons name="refresh-outline" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Toggle Button */}
            <TouchableOpacity 
              style={styles.toggleMatchesButton}
              onPress={() => setShowLiveMatches(!showLiveMatches)}
            >
              <Text style={styles.toggleMatchesText}>
                {showLiveMatches ? '🔽 Collapse Recommendations' : ' View Plant Recommendations'}
              </Text>
              <Text style={styles.matchesCount}>
                {liveMatchingPlants.goodMatches.length + liveMatchingPlants.badMatches.length > 0 
                  ? `${liveMatchingPlants.goodMatches.length} Good • ${liveMatchingPlants.badMatches.length} Bad` 
                  : 'Analyzing your soil conditions...'}
              </Text>
            </TouchableOpacity>

            {/* Categories and Status Filter (Same as Analysis Page) */}
            {showLiveMatches && (
              <>
                {/* Categories Filter */}
                <Text style={[styles.sectionTitle, { fontSize: 14, marginTop: 0, marginBottom: 8 }]}>
                  Categories
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                  {Object.keys(livePlantCategories).map((category) => {
                    const categoryInfo = getLiveCategoryInfo(category)
                    const isSelected = selectedLiveCategory === category
                    return (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.liveCategoryChip,
                          {
                            backgroundColor: isSelected ? COLORS.accentGreen : 'rgba(132, 204, 22, 0.1)',
                            borderColor: isSelected ? COLORS.accentGreen : 'rgba(132, 204, 22, 0.3)',
                            marginRight: 8
                          }
                        ]}
                        onPress={() => setSelectedLiveCategory(category)}
                      >
                        <Ionicons
                          name={getLiveCategoryIcon(category) as any}
                          size={14}
                          color={isSelected ? 'white' : COLORS.accentGreen}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[
                          styles.liveCategoryChipText,
                          { color: isSelected ? 'white' : COLORS.accentGreen }
                        ]}>
                          {categoryInfo.name} ({categoryInfo.count})
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>

                {/* Status Filter (Good/Bad only) - SCROLLABLE */}
                <Text style={[styles.sectionTitle, { fontSize: 14, marginTop: 0, marginBottom: 8 }]}>
                  Filter by Match Quality
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                  <View style={{ flexDirection: 'row' }}>
                    {[
                      { key: 'all', label: 'All Matches', icon: 'apps-outline' },
                      { key: 'good', label: 'Good Match', icon: 'checkmark-circle' },
                      { key: 'bad', label: 'Poor Match', icon: 'close-circle' }
                    ].map((status) => {
                      const isSelected = selectedLiveStatus === status.key
                      return (
                        <TouchableOpacity
                          key={status.key}
                          style={[
                            styles.liveStatusFilter,
                            {
                              backgroundColor: isSelected ? COLORS.primaryGreen : 'rgba(29, 73, 44, 0.1)',
                              borderColor: isSelected ? COLORS.primaryGreen : 'rgba(29, 73, 44, 0.3)',
                              marginRight: 12,
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderRadius: 20,
                              borderWidth: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              minWidth: 120, // Ensure consistent button width
                            }
                          ]}
                          onPress={() => setSelectedLiveStatus(status.key as any)}
                        >
                          <Ionicons
                            name={status.icon as any}
                            size={14}
                            color={isSelected ? 'white' : COLORS.primaryGreen}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={[
                            styles.liveStatusFilterText,
                            { 
                              color: isSelected ? 'white' : COLORS.primaryGreen,
                              fontSize: 12,
                              fontWeight: '600'
                            }
                          ]}>
                            {status.label}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </ScrollView>

                {/* Plant Recommendations List */}
                {getFilteredLiveRecommendations().length > 0 ? (
                  <View>
                    {getFilteredLiveRecommendations().map((plant, index) => (
                      <TouchableOpacity
                        key={`${plant.crop_name}-${index}`}
                        style={[
                          styles.liveRecommendationCard,
                          {
                            backgroundColor: 'white',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 12,
                            borderLeftWidth: 4,
                            borderLeftColor: getLiveStatusColor(plant.matchScore),
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3
                          }
                        ]}
                        onPress={() => {
                          if (expandedLivePlant === plant.crop_name) {
                            setExpandedLivePlant(null)
                          } else {
                            setExpandedLivePlant(plant.crop_name)
                          }
                        }}
                      >
                        {/* Plant Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          {/* Plant Image */}
                          <View style={{ marginRight: 12 }}>
                            {plant.image_url ? (
                              <Image
                                source={{ uri: plant.image_url }}
                                style={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: 8,
                                }}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={{
                                width: 50,
                                height: 50,
                                borderRadius: 8,
                                backgroundColor: '#f5f5f5',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#e0e0e0',
                              }}>
                                <Ionicons name="leaf-outline" size={20} color="#999" />
                              </View>
                            )}
                          </View>

                          {/* Plant Info */}
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.livePlantName, { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary }]}>
                              {plant.crop_name}
                            </Text>
                            <Text style={[styles.livePlantCategory, { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }]}>
                              {plant.crop_categories} • Match: {plant.matchScore.toFixed(0)}%
                            </Text>
                          </View>
                          
                          {/* Status Icon */}
                          <View style={{ alignItems: 'center' }}>
                            <Ionicons
                              name={getLiveStatusIcon(plant.matchScore)}
                              size={24}
                              color={getLiveStatusColor(plant.matchScore)}
                            />
                            <Text style={{ fontSize: 10, color: getLiveStatusColor(plant.matchScore), fontWeight: '600', marginTop: 2 }}>
                              {plant.matchScore >= 80 ? 'GOOD' : 'POOR'}
                            </Text>
                          </View>
                        </View>

                        {/* Match Reasons */}
                        <View style={{ marginTop: 8 }}>
                          {plant.matchReasons.slice(0, 2).map((reason: string, i: number) => (
                            <Text key={i} style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 }}>
                              • {reason}
                            </Text>
                          ))}
                        </View>

                        {/* Expanded Details */}
                        {expandedLivePlant === plant.crop_name && (
                          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 }}>
                              Complete Analysis:
                            </Text>
                            {plant.matchReasons.map((reason: string, i: number) => (
                              <Text key={i} style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 3 }}>
                                • {reason}
                              </Text>
                            ))}
                            <TouchableOpacity
                              style={{
                                backgroundColor: COLORS.accentGreen,
                                borderRadius: 8,
                                padding: 8,
                                alignItems: 'center',
                                marginTop: 8
                              }}
                              onPress={() => handlePlantSelect(plant)}
                            >
                              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                                Select This Plant
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={{ 
                    padding: 20, 
                    alignItems: 'center', 
                    backgroundColor: 'rgba(158, 158, 158, 0.1)',
                    borderRadius: 12,
                    marginTop: 10
                  }}>
                    <Ionicons name="search-outline" size={32} color={COLORS.textSecondary} />
                    <Text style={{ 
                      fontSize: 14, 
                      color: COLORS.textSecondary, 
                      textAlign: 'center',
                      marginTop: 8,
                      lineHeight: 20
                    }}>
                      No plants match your current filter.{'\n'}
                      Try selecting a different category or status.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        <LinearGradient colors={[COLORS.mutedGreen, COLORS.pastelGreen, COLORS.mutedGreen]} style={styles.plantCard}>
          <View style={styles.plantCardContent}>
            {/* Plant Image Section */}
            <View style={styles.plantImageWrapper}>
              {selectedCrop?.image_url ? (
                <Image
                  source={{ uri: selectedCrop.image_url }}
                  style={styles.plantImage}
                  resizeMode="cover"
                  onError={(error) => console.log('❌ Image load error:', error.nativeEvent.error)}
                  onLoad={() => console.log('✅ Image loaded successfully:', selectedCrop.image_url)}
                />
              ) : (
                <View style={styles.plantImagePlaceholder}>
                  <Ionicons name="leaf-outline" size={40} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.plantImagePlaceholderText}>
                    {selectedCrop ? 'No Image URL' : 'No Plant Selected'}
                  </Text>
                </View>
              )}
            </View>

            {/* Plant Info Section */}
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
        </LinearGradient>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
          <Text style={styles.sectionTitle}>Plant Condition</Text>
          {isLiveDataActive && (
            <View style={{ 
              backgroundColor: 'rgba(76, 175, 80, 0.1)', 
              paddingHorizontal: 8, 
              paddingVertical: 4, 
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(76, 175, 80, 0.3)'
            }}>
        
            </View>
          )}
        </View>

        <View style={styles.conditionCard}>
          {/* Header with Status Badge */}
          <View style={styles.conditionHeader}>
            <View style={styles.conditionHeaderLeft}>
              <View style={[styles.conditionStatusBadge, { borderColor: getPlantHealthStatus().color }]}>
                <View
                  style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: getPlantHealthStatus().color }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.conditionStatusText, { color: getPlantHealthStatus().color }]}>
                    {getPlantHealthStatus().status.toUpperCase()}
                  </Text>
              
                </View>
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                {isLiveDataActive && sensorData && (
                  <View style={{ 
                    marginLeft: 8, 
                    backgroundColor: '#4CAF50', 
                    width: 8, 
                    height: 8, 
                    borderRadius: 4,
                    opacity: 0.8 
                  }} />
                )}
              </View>
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
                        : COLORS.primaryBrown,
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

