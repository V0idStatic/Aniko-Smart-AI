"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, Stack } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import supabase from "./CONFIG/supaBase"
import { useAppContext } from "./CONFIG/GlobalContext"
import FooterNavigation from "../components/FooterNavigation"

// For charts
import { LineChart } from "react-native-chart-kit"

// Import shared styles
import SharedStyles from "./styles/analysis.style"

// Import Lucide icons
import { AlertTriangle, Calendar, Lightbulb, Thermometer } from "lucide-react-native"

// Types
interface WeatherHistoryData {
  date: string
  temperature: number
  humidity: number
  rainfall: number
  description: string
}

interface PlantHistoryData {
  date: string
  cropName: string
  temperature: number
  moisture: number
  ph: number
  nitrogen: number
  potassium: number
  phosphorus: number
}

interface PlantRecommendation {
  cropName: string
  bestMonths: number[]
  currentStatus: "ideal" | "good" | "caution" | "avoid"
  riskFactors: string[]
  recommendations: string[]
  predictedWeather: {
    nextMonth: {
      avgTemp: number
      rainfall: number
      humidity: number
      riskLevel: "low" | "medium" | "high"
    }
  }
  alternativePlantingDates: string[]
  // Add database-specific fields
  optimalTemp?: { min: number; max: number }
  optimalHumidity?: { min: number; max: number }
  optimalPH?: { min: number | null; max: number | null }
  optimalNPK?: {
    nitrogen: { min: number | null; max: number | null }
    phosphorus: { min: number | null; max: number | null }
    potassium: { min: number | null; max: number | null }
  }
}

interface CropDatabase {
  [key: string]: {
    optimalTemp: { min: number; max: number }
    optimalHumidity: { min: number; max: number }
    rainfallTolerance: { min: number; max: number }
    plantingSeasons: number[]
    growthDuration: number // days
    vulnerabilities: string[]
  }
}

export default function Analysis() {
  const router = useRouter()
  const { selectedLocation } = useAppContext()
  const [user, setUser] = useState<any>(null)

  // Tab selection state
  const [activeTab, setActiveTab] = useState<"weather" | "plants" | "recommendations">("weather")
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "1year" | "5years">("7days")

  // Data states
  const [weatherData, setWeatherData] = useState<WeatherHistoryData[]>([])
  const [plantData, setPlantData] = useState<PlantHistoryData[]>([])
  const [plantHistory, setPlantHistory] = useState<{ [key: string]: PlantHistoryData[] }>({})
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null)
  const [plantRecommendations, setPlantRecommendations] = useState<PlantRecommendation[]>([])

  // Loading states
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [loadingPlant, setLoadingPlant] = useState(false)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  // New state variables for chart expansion
  const [expandedChart, setExpandedChart] = useState<string | null>(null)

  // Add these state variables at the top with your other states
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [plantCategories, setPlantCategories] = useState<{ [key: string]: PlantRecommendation[] }>({})

  // Add this state for selected plant details
  const [selectedPlantDetail, setSelectedPlantDetail] = useState<PlantRecommendation | null>(null)

  // Add this state after your existing states (around line 70)
  const [selectedStatus, setSelectedStatus] = useState<"all" | "ideal" | "good" | "caution" | "avoid">("all")

  const [showAllRecords, setShowAllRecords] = useState(false)
  const [expandedRecordIndex, setExpandedRecordIndex] = useState<number | null>(null)

  // Initialize with selected plant if available
  useEffect(() => {
    // Note: `selectedCrop` was removed from useAppContext, so this needs adjustment if `selectedCrop` is intended to be used.
    // For now, assuming it's no longer relevant or needs to be passed differently.
    // if (selectedCrop?.crop_name) {
    //   setSelectedPlant(selectedCrop.crop_name)
    // }
  }, []) // Removed `selectedCrop` dependency

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        if (currentUser) {
          const { data } = await supabase.from("users").select("*").eq("id", currentUser.id).single()

          if (data) setUser(data)
        }
      } catch (error) {
        console.error("Error getting current user:", error)
      }
    }

    getCurrentUser()
  }, [])

  // Helper function to convert weather codes to descriptions
  const getWeatherDescription = (weatherCode: number): string => {
    // WMO Weather interpretation codes (WW)
    // Reference: https://open-meteo.com/en/docs

    if (weatherCode === 0) return "Clear sky"
    if (weatherCode >= 1 && weatherCode <= 3) return "Partly cloudy"
    if (weatherCode >= 45 && weatherCode <= 48) return "Foggy"
    if (weatherCode >= 51 && weatherCode <= 57) return "Drizzle"
    if (weatherCode >= 61 && weatherCode <= 67) return "Rainy"
    if (weatherCode >= 71 && weatherCode <= 77) return "Snowy"
    if (weatherCode >= 80 && weatherCode <= 82) return "Rain showers"
    if (weatherCode >= 85 && weatherCode <= 86) return "Snow showers"
    if (weatherCode >= 95 && weatherCode <= 99) return "Thunderstorm"

    // Default fallback
    if (weatherCode >= 1 && weatherCode <= 50) return "Cloudy"
    if (weatherCode >= 50 && weatherCode <= 70) return "Rainy"
    if (weatherCode >= 70 && weatherCode <= 90) return "Snowy"

    return "Variable"
  }

  const getTempColor = (temp: number) => {
    if (temp < 15) return styles.tempCold
    if (temp < 25) return styles.tempMild
    if (temp < 30) return styles.tempWarm
    return styles.tempHot
  }

  const getRainfallColor = (rainfall: number) => {
    if (rainfall > 50) return styles.rainfallHigh
    if (rainfall > 10) return styles.rainfallMedium
    return styles.rainfallLow
  }

  // Fetch plant history data
  useEffect(() => {
    const fetchPlantHistory = async () => {
      if (!user) return

      setLoadingPlant(true)

      try {
        // Get all plant types the user has tracked
        const { data: plantTypes, error: plantError } = await supabase
          .from("esp32_readings")
          .select("crop_id, crops:lib_crop_param(crop_name)")
          .eq("user_id", user.id)
          .not("crop_id", "is", null)

        if (plantError) throw plantError

        // Create a list of unique plant types
        const uniquePlants: { [key: string]: number } = {}
        if (plantTypes) {
          plantTypes.forEach((item) => {
            if (item.crops && Array.isArray(item.crops) && item.crops.length > 0 && item.crop_id) {
              uniquePlants[item.crops[0].crop_name] = item.crop_id
            }
          })
        }

        // For each plant type, fetch its history
        const plantHistoryData: { [key: string]: PlantHistoryData[] } = {}

        for (const [plantName, cropId] of Object.entries(uniquePlants)) {
          // Fetch ESP32 readings for this crop
          const { data: readings, error: readingsError } = await supabase
            .from("esp32_readings")
            .select("*")
            .eq("user_id", user.id)
            .eq("crop_id", cropId)
            .order("measured_at", { ascending: false })

          if (readingsError) throw readingsError

          if (readings && readings.length > 0) {
            // Map the readings to our interface
            const plantReadings = readings.map((reading) => ({
              date: new Date(reading.measured_at).toISOString().split("T")[0],
              cropName: plantName,
              temperature: reading.temp_c || 0,
              moisture: reading.moisture_pct || 0,
              ph: reading.ph_level || 0,
              nitrogen: reading.nitrogen_ppm || 0,
              potassium: reading.potassium_ppm || 0,
              phosphorus: reading.phosphorus_ppm || 0,
            }))

            plantHistoryData[plantName] = plantReadings
          }
        }

        setPlantHistory(plantHistoryData)

        // If we have any plants, set the first one as selected
        const plantNames = Object.keys(plantHistoryData)
        if (plantNames.length > 0 && !selectedPlant) {
          setSelectedPlant(plantNames[0])
        }

        // If we have a selected plant, set its data
        if (selectedPlant && plantHistoryData[selectedPlant]) {
          setPlantData(plantHistoryData[selectedPlant])
        }
      } catch (error) {
        console.error("Error fetching plant history:", error)

        // Generate mock data for demonstration
        const mockPlants = ["Tomato", "Lettuce", "Cucumber", "Spinach"]
        const mockHistory: { [key: string]: PlantHistoryData[] } = {}

        mockPlants.forEach((plant) => {
          const plantReadings: PlantHistoryData[] = []
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(endDate.getDate() - 30)

          const currentDate = new Date(startDate)
          while (currentDate <= endDate) {
            // Generate random-ish but somewhat realistic plant data
            const temp = 24 + Math.sin(currentDate.getDate() / 3) * 3 + (Math.random() * 2 - 1)
            const moisture = 65 + Math.sin(currentDate.getDate() / 2.5) * 15 + (Math.random() * 8 - 4)
            const ph = 6.5 + Math.sin(currentDate.getDate() / 5) * 0.5 + (Math.random() * 0.4 - 0.2)

            plantReadings.push({
              date: currentDate.toISOString().split("T")[0],
              cropName: plant,
              temperature: Number(temp.toFixed(1)),
              moisture: Number(moisture.toFixed(1)),
              ph: Number(ph.toFixed(1)),
              nitrogen: Math.floor(40 + Math.sin(currentDate.getDate() / 4) * 10 + Math.random() * 5),
              potassium: Math.floor(35 + Math.sin(currentDate.getDate() / 3.5) * 8 + Math.random() * 4),
              phosphorus: Math.floor(25 + Math.sin(currentDate.getDate() / 4.5) * 5 + Math.random() * 3),
            })

            // Increment date by 1 day
            currentDate.setDate(currentDate.getDate() + 1)
          }

          mockHistory[plant] = plantReadings
        })

        setPlantHistory(mockHistory)

        // Set default selected plant if none is selected
        if (!selectedPlant && mockPlants.length > 0) {
          setSelectedPlant(mockPlants[0])
        }

        // Set plant data for selected plant
        if (selectedPlant && mockHistory[selectedPlant]) {
          setPlantData(mockHistory[selectedPlant])
        } else if (mockPlants.length > 0) {
          setPlantData(mockHistory[mockPlants[0]])
          setSelectedPlant(mockPlants[0])
        }
      } finally {
        setLoadingPlant(false)
      }
    }

    fetchPlantHistory()
  }, [user, selectedPlant])

  // Handle plant selection change
  const handlePlantSelect = (plantName: string) => {
    setSelectedPlant(plantName)
    if (plantHistory[plantName]) {
      setPlantData(plantHistory[plantName])
    }
  }

  // Enhanced weather chart data preparation
  const getChartDataPoints = (data: any[], timeRange: string) => {
    switch (timeRange) {
      case "7days":
        return data.slice(-7)
      case "30days":
        return data.slice(-30).filter((_, index) => index % 2 === 0) // Show every 2nd day
      case "1year":
        return data.slice(-365).filter((_, index) => index % 15 === 0) // Show bi-weekly
      case "5years":
        return data.slice(-1825).filter((_, index) => index % 60 === 0) // Show every 2 months
      default:
        return data.slice(-7)
    }
  }

  // Calculate dynamic chart width based on data points
  const getChartWidth = (dataPoints: number, timeRange: string, isExpanded = false) => {
    const screenWidth = Dimensions.get("window").width
    const minWidth = screenWidth - 40
    const expandedMultiplier = isExpanded ? 2 : 1

    switch (timeRange) {
      case "7days":
        return Math.max(minWidth, dataPoints * 50 * expandedMultiplier)
      case "30days":
        return Math.max(minWidth, dataPoints * 60 * expandedMultiplier)
      case "1year":
        return Math.max(minWidth, dataPoints * 80 * expandedMultiplier)
      case "5years":
        return Math.max(minWidth, dataPoints * 100 * expandedMultiplier)
      default:
        return minWidth
    }
  }

  // Weather chart data preparation
  const weatherChartDataPoints = getChartDataPoints(weatherData, timeRange)
  const weatherChartWidth = getChartWidth(weatherChartDataPoints.length, timeRange, expandedChart === "weather")

  const weatherChartData = {
    labels:
      weatherChartDataPoints.length > 0
        ? weatherChartDataPoints.map((d) => {
            const date = new Date(d.date)
            if (timeRange === "7days") {
              return `${date.getMonth() + 1}/${date.getDate()}`
            } else if (timeRange === "30days") {
              return `${date.getMonth() + 1}/${date.getDate()}`
            } else if (timeRange === "1year") {
              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
            } else if (timeRange === "5years") {
              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
            }
            return `${date.getMonth() + 1}/${date.getDate()}`
          })
        : ["No Data"],
    datasets: [
      {
        data: weatherChartDataPoints.length > 0 ? weatherChartDataPoints.map((d) => d.temperature) : [0],
        color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Temperature (°C)"],
  }

  // Plant chart data preparation for temperature
  const plantTempDataPoints = plantData.length > 0 ? plantData.slice(-14) : []
  const plantTempChartWidth = getChartWidth(
    plantTempDataPoints.length,
    "30days", // Use 30days as default for plant charts
    expandedChart === "plantTemp",
  )

  const plantTempChartData = {
    labels:
      plantTempDataPoints.length > 0
        ? plantTempDataPoints.map((d) => {
            const date = new Date(d.date)
            return `${date.getMonth() + 1}/${date.getDate()}`
          })
        : ["No Data"],
    datasets: [
      {
        data: plantTempDataPoints.length > 0 ? plantTempDataPoints.map((d) => d.temperature) : [0],
        color: (opacity = 1) => `rgba(65, 105, 225, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Temperature (°C)"],
  }

  // Plant chart data for moisture
  const plantMoistureDataPoints = plantData.length > 0 ? plantData.slice(-14) : []
  const plantMoistureChartWidth = getChartWidth(
    plantMoistureDataPoints.length,
    "30days",
    expandedChart === "plantMoisture",
  )

  const plantMoistureChartData = {
    labels:
      plantMoistureDataPoints.length > 0
        ? plantMoistureDataPoints.map((d) => {
            const date = new Date(d.date)
            return `${date.getMonth() + 1}/${date.getDate()}`
          })
        : ["No Data"],
    datasets: [
      {
        data: plantMoistureDataPoints.length > 0 ? plantMoistureDataPoints.map((d) => d.moisture) : [0],
        color: (opacity = 1) => `rgba(46, 139, 87, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Moisture (%)"],
  }

  // Update the chart configuration for better readability
  const chartConfig = {
    backgroundColor: "#e26a00",
    backgroundGradientFrom: "#1c4722",
    backgroundGradientTo: "#4d7f39",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#ffa726",
    },
    // Improved label formatting
    formatXLabel: (value: string) => {
      return value.length > 8 ? value.substring(0, 8) + "..." : value
    },
  }

  // Add this function before the return statement
  const handleRefreshWeatherData = async () => {
    if (!selectedLocation) {
      console.log("[WARNING] No location selected for weather refresh")
      return
    }

    console.log(`🔄 Manually refreshing weather data for ${timeRange} range`)
    setLoadingWeather(true)

    // Clear existing data first
    setWeatherData([])

    // Force re-fetch by updating a state that triggers the useEffect
    const currentRange = timeRange
    setTimeRange("7days")
    setTimeout(() => setTimeRange(currentRange), 100)
  }

  // Debug logging
  useEffect(() => {
    console.log("[DEBUG] Chart Data Debug:")
    console.log("Weather data points:", weatherData.length)
    console.log("Plant data points:", plantData.length)
    console.log("Selected plant:", selectedPlant)
    console.log("Active tab:", activeTab)
    console.log("Time range:", timeRange)

    if (weatherData.length > 0) {
      console.log("Weather sample:", weatherData.slice(0, 3))
    }

    if (plantData.length > 0) {
      console.log("Plant sample:", plantData.slice(0, 3))
    }
  }, [weatherData, plantData, selectedPlant, activeTab, timeRange])

  // Toggle function for chart expansion
  const toggleChartExpansion = (chartType: string) => {
    setExpandedChart(expandedChart === chartType ? null : chartType)
  }
  // Add these functions after your helper functions (around line 700)

  // ==========================================
  // 1. SAVE WEATHER DATA TO DATABASE
  // ==========================================
  const saveWeatherDataToDatabase = async (
    locationId: string,
    weatherData: WeatherHistoryData[],
    isHistorical = false,
  ) => {
    try {
      const tableName = isHistorical ? "weather_historical" : "weather_current"

      console.log(`[SAVE] Saving ${weatherData.length} records to ${tableName}...`)
      console.log(`[LOCATION] Location ID: ${locationId}`)
      console.log(`[DATE] Date range: ${weatherData[0]?.date} to ${weatherData[weatherData.length - 1]?.date}`)

      const dataToInsert = weatherData.map((data) => ({
        location_id: locationId,
        date: data.date,
        temperature_avg: data.temperature,
        humidity_avg: data.humidity,
        rainfall_mm: data.rainfall,
        weather_description: data.description,
        year: new Date(data.date).getFullYear(),
        month: new Date(data.date).getMonth() + 1,
        data_source: "open-meteo-api",
        created_at: new Date().toISOString(),
      }))

      console.log(`[SAMPLE] Sample record to insert:`, JSON.stringify(dataToInsert[0], null, 2))

      // Use upsert to avoid duplicates
      const { data: insertedData, error } = await supabase.from(tableName).upsert(dataToInsert, {
        onConflict: "location_id,date",
        ignoreDuplicates: false,
      })

      if (error) {
        console.error(`[ERROR] Database error saving to ${tableName}:`, error)
        throw error
      }

      console.log(`[SUCCESS] Successfully saved ${dataToInsert.length} records to ${tableName}`)

      // Verify the save by reading back
      const { data: verifyData, error: verifyError } = await supabase
        .from(tableName)
        .select("*")
        .eq("location_id", locationId)
        .order("date", { ascending: false })
        .limit(5)

      if (!verifyError && verifyData) {
        console.log(
          `[VERIFY] Verification: Found ${verifyData.length} records in ${tableName} for location ${locationId}`,
        )
        console.log(`[DATA] Latest record:`, verifyData[0])
      }

      // Log the API call
      await logWeatherAPICall(
        locationId,
        isHistorical ? "archive" : "forecast",
        weatherData[0].date,
        weatherData[weatherData.length - 1].date,
        weatherData.length,
        200,
      )

      return true
    } catch (error) {
      console.error("[ERROR] Error saving weather data to database:", error)
      return false
    }
  }

  // ==========================================
  // 2. LOG API USAGE
  // ==========================================
  const logWeatherAPICall = async (
    locationId: string,
    endpoint: string,
    startDate: string,
    endDate: string,
    dataPointsFetched: number,
    responseStatus: number,
  ) => {
    try {
      const { error } = await supabase.from("weather_api_logs").insert({
        location_id: locationId,
        api_endpoint: endpoint,
        date_range_start: startDate,
        date_range_end: endDate,
        data_points_fetched: dataPointsFetched,
        response_status: responseStatus,
        fetched_at: new Date().toISOString(),
      })

      if (error) throw error
      console.log("[LOG] API call logged successfully")
    } catch (error) {
      console.error("Error logging API call:", error)
    }
  }

  // ==========================================
  // 3. FETCH WEATHER FROM DATABASE FIRST
  // ==========================================
  const fetchWeatherFromDatabase = async (
    locationId: string,
    startDate: string,
    endDate: string,
    isHistorical = false,
  ): Promise<WeatherHistoryData[] | null> => {
    try {
      const tableName = isHistorical ? "weather_historical" : "weather_current"

      console.log(`[DB] Checking ${tableName} for cached weather data...`)
      console.log(`[LOCATION] Location ID: ${locationId}`)
      console.log(`[DATE] Date range: ${startDate} to ${endDate}`)

      const { data: cachedData, error: dbError } = await supabase
        .from(tableName)
        .select("*")
        .eq("location_id", locationId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true })

      if (dbError) {
        console.error(`[ERROR] Database error fetching from ${tableName}:`, dbError)
        throw dbError
      }

      if (!cachedData || cachedData.length === 0) {
        console.log(`[DB] No cached data found in ${tableName} for location ${locationId}`)

        // Check if there's ANY data for this location
        const { data: anyData, error: anyError } = await supabase
          .from(tableName)
          .select("*")
          .eq("location_id", locationId)
          .limit(5)

        if (!anyError && anyData && anyData.length > 0) {
          console.log(`[INFO] Found ${anyData.length} records for this location, but not in the requested date range`)
          console.log(`[DATA] Sample dates available:`, anyData.map((d) => d.date).join(", "))
        } else {
          console.log(`[INFO] No data exists at all for location ${locationId} in ${tableName}`)
        }

        return null
      }

      // Calculate cache completeness
      const expectedDataPoints = Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
      )
      const cacheCompleteness = (cachedData.length / expectedDataPoints) * 100

      console.log(
        `[DATA] Cache completeness: ${cacheCompleteness.toFixed(1)}% (${cachedData.length}/${expectedDataPoints} days)`,
      )

      // Check if we have today's data
      const latestCachedDate = cachedData.length > 0 ? cachedData[cachedData.length - 1].date : null
      const todayStr = new Date().toISOString().split("T")[0]
      const hasTodayData = latestCachedDate === todayStr || latestCachedDate === endDate

      console.log(`[DATE] Latest cached date: ${latestCachedDate}, Today: ${todayStr}, Has today: ${hasTodayData}`)

      // Only use cache if it's at least 80% complete AND has today's data
      if (cacheCompleteness < 80) {
        console.log(`[WARNING] Cache incomplete (${cacheCompleteness.toFixed(1)}%), will fetch from API`)
        return null
      }

      // For short time ranges (7days, 30days), refetch if missing today's data
      if (!isHistorical && !hasTodayData) {
        console.log(`[WARNING] Cache missing latest data (latest: ${latestCachedDate}), will fetch from API`)
        return null
      }

      // Convert database format to app format
      const processedData: WeatherHistoryData[] = cachedData.map((d) => ({
        date: d.date,
        temperature: d.temperature_avg,
        humidity: d.humidity_avg,
        rainfall: d.rainfall_mm,
        description: d.weather_description,
      }))

      console.log(`[SUCCESS] Using ${processedData.length} cached weather records from ${tableName}`)
      return processedData
    } catch (error) {
      console.error("Error fetching from database:", error)
      return null
    }
  }

  // ==========================================
  // 4. UPDATE YOUR fetchWeatherHistory TO USE DATABASE
  // ==========================================
  // Replace your existing useEffect for weather fetching with this:

  useEffect(() => {
    const fetchWeatherHistory = async () => {
      if (!selectedLocation) {
        console.log("[WARNING] No location selected for weather analysis")
        return
      }

      setLoadingWeather(true)

      try {
        const endDate = new Date()
        const startDate = new Date()

        // Set start date based on time range
        switch (timeRange) {
          case "7days":
            startDate.setDate(endDate.getDate() - 7)
            break
          case "30days":
            startDate.setDate(endDate.getDate() - 30)
            break
          case "1year":
            startDate.setFullYear(endDate.getFullYear() - 1)
            break
          case "5years":
            startDate.setFullYear(endDate.getFullYear() - 5)
            break
        }

        const startDateStr = startDate.toISOString().split("T")[0]
        const endDateStr = endDate.toISOString().split("T")[0]

        const latitude = selectedLocation.lat
        const longitude = selectedLocation.lon

        if (!latitude || !longitude) {
          throw new Error("Invalid location coordinates")
        }

        console.log(`[WEATHER] Fetching weather data for ${selectedLocation.city || "Selected Location"}`)
        console.log(`[DATE] Date range: ${startDateStr} to ${endDateStr}`)

        // ✅ STEP 1: Try to get data from database first
        const isHistoricalRange = timeRange === "1year" || timeRange === "5years"

        // Create a unique location identifier from coordinates
        const locationId = `${latitude.toFixed(0)}_${(latitude % 1).toFixed(6).substring(2)}_${longitude.toFixed(0)}_${(longitude % 1).toFixed(6).substring(2)}`

        const cachedWeatherData = await fetchWeatherFromDatabase(
          locationId,
          startDateStr,
          endDateStr,
          isHistoricalRange,
        )

        // If we have good cached data, use it and skip API call
        if (cachedWeatherData && cachedWeatherData.length > 0) {
          console.log(`[SUCCESS] Using ${cachedWeatherData.length} cached records from database`)
          setWeatherData(cachedWeatherData)
          setLoadingWeather(false)
          return // ✅ CRITICAL: Stop here, don't fetch from API
        }

        // ✅ STEP 2: If no cached data, fetch from API
        console.log(`[WEATHER] Fetching fresh data from Open-Meteo API...`)

        const baseUrl = isHistoricalRange
          ? "https://archive-api.open-meteo.com/v1/archive"
          : "https://api.open-meteo.com/v1/forecast"

        const params = new URLSearchParams({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          start_date: startDateStr,
          end_date: endDateStr,
          daily:
            "temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum,weather_code",
          timezone: "auto",
        })

        const apiUrl = `${baseUrl}?${params.toString()}`
        console.log("🔗 API URL:", apiUrl)

        const controller = new AbortController()
        // Increase timeout based on range: 1min for 7days, 2min for 1year, 3min for 5years
        const timeoutDuration = timeRange === "5years" ? 180000 : timeRange === "1year" ? 120000 : 60000
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration)

        console.log(`[TIMEOUT] API timeout set to ${timeoutDuration / 1000} seconds for ${timeRange}`)

        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "AnikoSmartAI/1.0",
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status} ${response.statusText}`)
        }

        const weatherApiData = await response.json()

        if (!weatherApiData.daily || !weatherApiData.daily.time) {
          throw new Error("No daily weather data available")
        }

        // Process the API response
        const processedWeatherData: WeatherHistoryData[] = []
        const dailyData = weatherApiData.daily

        for (let i = 0; i < dailyData.time.length; i++) {
          const date = dailyData.time[i]
          const tempMean =
            dailyData.temperature_2m_mean?.[i] ||
            ((dailyData.temperature_2m_max?.[i] || 0) + (dailyData.temperature_2m_min?.[i] || 0)) / 2
          const humidity = dailyData.relative_humidity_2m_mean?.[i] || 0
          const rainfall = dailyData.precipitation_sum?.[i] || 0
          const weatherCode = dailyData.weather_code?.[i] || 0

          const description = getWeatherDescription(weatherCode)

          processedWeatherData.push({
            date: date,
            temperature: Number(tempMean.toFixed(1)),
            humidity: Number(humidity.toFixed(1)),
            rainfall: Number(rainfall.toFixed(1)),
            description: description,
          })
        }

        console.log(`[SUCCESS] Successfully fetched ${processedWeatherData.length} days from API`)

        // Save to database for future use
        await saveWeatherDataToDatabase(locationId, processedWeatherData, isHistoricalRange)

        processedWeatherData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setWeatherData(processedWeatherData)
      } catch (error) {
        console.error("[ERROR] Error fetching weather history:", error)

        // Check if it's a timeout error
        if (error instanceof Error && error.name === "AbortError") {
          console.error("[TIMEOUT] Weather API request timed out")
          console.log("[TIP] Tip: Try a shorter time range (7 days) or check your internet connection")
        }

        // Fallback to mock data
        console.log("🔄 Generating fallback weather data for selected time range...")
        const mockWeatherData: WeatherHistoryData[] = []

        const endDate = new Date()
        const startDate = new Date()

        switch (timeRange) {
          case "7days":
            startDate.setDate(endDate.getDate() - 7)
            break
          case "30days":
            startDate.setDate(endDate.getDate() - 30)
            break
          case "1year":
            startDate.setFullYear(endDate.getFullYear() - 1)
            break
          case "5years":
            startDate.setFullYear(endDate.getFullYear() - 5)
            break
        }

        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          const dayOfYear = currentDate.getMonth() * 30 + currentDate.getDate()
          const seasonalTemp = 20 + Math.sin(((dayOfYear - 80) * Math.PI) / 180) * 10
          const dailyVariation = Math.sin(currentDate.getDate() / 3) * 3
          const randomVariation = (Math.random() - 0.5) * 6

          const temp = seasonalTemp + dailyVariation + randomVariation
          const humidity = Math.max(20, Math.min(95, 60 + Math.sin(dayOfYear / 20) * 20 + (Math.random() - 0.5) * 20))
          const rainfall = Math.max(0, Math.sin(dayOfYear / 15) * 5 + (Math.random() - 0.7) * 10)

          let description = "Clear sky"
          if (rainfall > 5) description = "Rainy"
          else if (rainfall > 1) description = "Drizzle"
          else if (humidity > 85) description = "Cloudy"
          else if (humidity > 70) description = "Partly cloudy"
          else if (temp < 10) description = "Cold"

          mockWeatherData.push({
            date: currentDate.toISOString().split("T")[0],
            temperature: Number(temp.toFixed(1)),
            humidity: Number(humidity.toFixed(1)),
            rainfall: Number(rainfall.toFixed(1)),
            description,
          })

          currentDate.setDate(currentDate.getDate() + 1)
        }

        console.log(`🔄 Generated ${mockWeatherData.length} days of fallback weather data`)
        setWeatherData(mockWeatherData)
      } finally {
        setLoadingWeather(false)
      }
    }

    fetchWeatherHistory()
  }, [timeRange, selectedLocation])

  // Replace the static cropDatabase and generatePlantRecommendations function
  const generatePlantRecommendations = async () => {
    if (!selectedLocation || weatherData.length === 0) return

    setLoadingRecommendations(true)

    try {
      console.log("[INFO] Fetching crop parameters from database...")

      // Fetch crop parameters from your denormalized_crop_parameter table
      const { data: cropParams, error: cropError } = await supabase.from("denormalized_crop_parameter").select("*")

      if (cropError) throw cropError
      if (!cropParams || cropParams.length === 0) return

      // ✅ FETCH HISTORICAL DATA (5 years) FROM DATABASE
      const locationId = `${selectedLocation.lat.toFixed(0)}_${(selectedLocation.lat % 1).toFixed(6).substring(2)}_${selectedLocation.lon.toFixed(0)}_${(selectedLocation.lon % 1).toFixed(6).substring(2)}`

      console.log("[DATA] Fetching 5-year historical weather data from database...")
      const { data: historicalData, error: histError } = await supabase
        .from("weather_historical")
        .select("*")
        .eq("location_id", locationId)
        .order("date", { ascending: true })

      if (histError) {
        console.error("[ERROR] Error fetching historical data:", histError)
      }

      console.log(`[DATA] Loaded ${historicalData?.length || 0} historical records`)

      // ✅ CURRENT WEATHER ANALYSIS (last 30 days from weather_current)
      const recentWeather = weatherData.slice(-30)
      const avgTemp = recentWeather.reduce((sum, d) => sum + d.temperature, 0) / recentWeather.length
      const avgHumidity = recentWeather.reduce((sum, d) => sum + d.humidity, 0) / recentWeather.length
      const totalRainfall = recentWeather.reduce((sum, d) => sum + d.rainfall, 0)
      const avgDailyRainfall = totalRainfall / recentWeather.length

      // ✅ GET CURRENT MONTH
      const currentMonth = new Date().getMonth() + 1 // 1-12
      const currentYear = new Date().getFullYear()

      console.log(`[DATE] Current month: ${currentMonth}, Analyzing ${currentYear} vs 5-year average`)

      // ✅ CALCULATE 5-YEAR AVERAGE FOR CURRENT MONTH
      let historicalMonthAvg: { temp: number; humidity: number; rainfall: number } | null = null

      if (historicalData && historicalData.length > 0) {
        const currentMonthHistorical = historicalData.filter((d) => {
          const date = new Date(d.date)
          return date.getMonth() + 1 === currentMonth // Same month across all years
        })

        if (currentMonthHistorical.length > 0) {
          const avgHistTemp =
            currentMonthHistorical.reduce((sum, d) => sum + (d.temperature_avg || 0), 0) / currentMonthHistorical.length
          const avgHistHumidity =
            currentMonthHistorical.reduce((sum, d) => sum + (d.humidity_avg || 0), 0) / currentMonthHistorical.length
          const avgHistRainfall =
            currentMonthHistorical.reduce((sum, d) => sum + (d.rainfall_mm || 0), 0) / currentMonthHistorical.length

          historicalMonthAvg = {
            temp: avgHistTemp,
            humidity: avgHistHumidity,
            rainfall: avgHistRainfall,
          }

          console.log(`[DATA] 5-year average for month ${currentMonth}:`, {
            temp: avgHistTemp.toFixed(1),
            humidity: avgHistHumidity.toFixed(1),
            rainfall: avgHistRainfall.toFixed(1),
          })

          console.log(`[DATA] Current year ${currentYear} for month ${currentMonth}:`, {
            temp: avgTemp.toFixed(1),
            humidity: avgHumidity.toFixed(1),
            rainfall: avgDailyRainfall.toFixed(1),
          })
        }
      }

      // Predict next month's weather based on recent trends
      const nextMonthWeather = {
        nextMonth: {
          avgTemp: avgTemp + (Math.random() * 2 - 1), // Slight variation
          rainfall: avgDailyRainfall * 30, // Monthly estimate
          humidity: avgHumidity + (Math.random() * 5 - 2.5),
          riskLevel: determineWeatherRisk(avgTemp, avgHumidity, totalRainfall),
        },
      }

      console.log(`[DATA] Current weather analysis:`, {
        avgTemp: avgTemp.toFixed(1),
        avgHumidity: avgHumidity.toFixed(1),
        totalRainfall: totalRainfall.toFixed(1),
        avgDailyRainfall: avgDailyRainfall.toFixed(1),
      })

      const recommendations: PlantRecommendation[] = []

      // ✅ PROCESS EACH CROP DYNAMICALLY
      for (const crop of cropParams) {
        console.log(`[CROP] Processing crop: ${crop.crop_name}`)

        // ✅ Check if CURRENT weather conditions are suitable
        const tempSuitability = isTemperatureSuitable(avgTemp, crop)
        const humiditySuitability = isHumiditySuitable(avgHumidity, crop)
        const rainfallSuitability = isRainfallSuitable(avgDailyRainfall, crop)

        // ✅ Calculate overall suitability score
        let suitabilityScore = calculateSuitabilityScore(tempSuitability, humiditySuitability, rainfallSuitability)

        let status: "ideal" | "good" | "caution" | "avoid" = "avoid"
        const riskFactors: string[] = []
        const recommendationsList: string[] = []

        // 🆕 COMPARE WITH 5-YEAR HISTORICAL AVERAGE
        if (historicalMonthAvg) {
          const tempDiff = avgTemp - historicalMonthAvg.temp
          const humidityDiff = avgHumidity - historicalMonthAvg.humidity
          const rainfallDiff = avgDailyRainfall - historicalMonthAvg.rainfall

          console.log(`[DATA] ${crop.crop_name} - Historical comparison:`, {
            tempDiff: tempDiff.toFixed(1),
            humidityDiff: humidityDiff.toFixed(1),
            rainfallDiff: rainfallDiff.toFixed(1),
          })

          // 🚨 DOWNGRADE if current year deviates significantly from 5-year average
          let historicalDeviationPenalty = 0

          // Temperature deviation (>3°C difference is significant)
          if (Math.abs(tempDiff) > 3) {
            historicalDeviationPenalty += 0.15
            if (tempDiff > 3) {
              riskFactors.push(
                `Temperature: ${Math.abs(tempDiff).toFixed(1)}°C hotter than usual for ${getMonthName(currentMonth)}`,
              )
              recommendationsList.push(
                `Historical data: ${getMonthName(currentMonth)} averages ${historicalMonthAvg.temp.toFixed(1)}°C (currently ${avgTemp.toFixed(1)}°C)`,
              )
            } else {
              riskFactors.push(
                `Temperature: ${Math.abs(tempDiff).toFixed(1)}°C colder than usual for ${getMonthName(currentMonth)}`,
              )
              recommendationsList.push(
                `Historical data: ${getMonthName(currentMonth)} averages ${historicalMonthAvg.temp.toFixed(1)}°C (currently ${avgTemp.toFixed(1)}°C)`,
              )
            }
          }

          // Rainfall deviation (>5mm/day difference is significant)
          if (Math.abs(rainfallDiff) > 5) {
            historicalDeviationPenalty += 0.2
            if (rainfallDiff > 5) {
              riskFactors.push(`Rainfall: Much rainier than usual: +${rainfallDiff.toFixed(1)}mm/day vs 5-year avg`)
              recommendationsList.push(
                `Warning: ${currentYear} is experiencing unusual rainfall for ${getMonthName(currentMonth)}`,
              )
            } else {
              riskFactors.push(
                `Rainfall: Much drier than usual: ${Math.abs(rainfallDiff).toFixed(1)}mm/day below 5-year avg`,
              )
              recommendationsList.push(
                `Warning: ${currentYear} is experiencing drought conditions for ${getMonthName(currentMonth)}`,
              )
            }
          }

          // Humidity deviation (>15% difference is significant)
          if (Math.abs(humidityDiff) > 15) {
            historicalDeviationPenalty += 0.1
            riskFactors.push(
              `Humidity: ${humidityDiff > 0 ? "higher" : "lower"} than 5-year average by ${Math.abs(humidityDiff).toFixed(1)}%`,
            )
          }

          // Apply historical deviation penalty
          suitabilityScore = Math.max(0, suitabilityScore - historicalDeviationPenalty)

          console.log(
            `[DATA] ${crop.crop_name} - Adjusted suitability: ${suitabilityScore.toFixed(2)} (penalty: ${historicalDeviationPenalty.toFixed(2)})`,
          )
        }

        // ✅ TEMPERATURE ANALYSIS
        if (!tempSuitability.suitable) {
          if (avgTemp < (crop.temperature_min || 0)) {
            riskFactors.push(`Temperature: Too cold: ${avgTemp.toFixed(1)}°C (needs ${crop.temperature_min}°C+)`)
            recommendationsList.push("Use greenhouse or wait for warmer weather")
          } else {
            riskFactors.push(`Temperature: Too hot: ${avgTemp.toFixed(1)}°C (max ${crop.temperature_max}°C)`)
            recommendationsList.push("Provide shade or wait for cooler weather")
          }
        }

        // ✅ HUMIDITY ANALYSIS
        if (!humiditySuitability.suitable) {
          if (avgHumidity < (crop.moisture_min || 0)) {
            riskFactors.push(`Humidity: Low humidity: ${avgHumidity.toFixed(1)}% (needs ${crop.moisture_min}%+)`)
            recommendationsList.push("Increase irrigation or use mulching")
          } else {
            riskFactors.push(`Humidity: High humidity: ${avgHumidity.toFixed(1)}% (max ${crop.moisture_max}%)`)
            recommendationsList.push("Improve ventilation and drainage")
          }
        }

        // ✅ RAINFALL ANALYSIS
        if (!rainfallSuitability.suitable) {
          if (avgDailyRainfall > getRainfallTolerance(crop.crop_name).max) {
            riskFactors.push(`Rainfall: Excessive rain: ${avgDailyRainfall.toFixed(1)}mm/day`)
            recommendationsList.push("Improve drainage, use raised beds")
          } else {
            riskFactors.push(`Rainfall: Insufficient rain: ${avgDailyRainfall.toFixed(1)}mm/day`)
            recommendationsList.push("Increase irrigation frequency")
          }
        }

        // ✅ DETERMINE STATUS BASED ON WEATHER CONDITIONS ONLY
        if (suitabilityScore >= 0.9) {
          status = "ideal"
          recommendationsList.unshift("Perfect weather conditions for planting!")
        } else if (suitabilityScore >= 0.7) {
          status = "good"
          recommendationsList.unshift("Good weather conditions with minor adjustments")
        } else if (suitabilityScore >= 0.5) {
          status = "caution"
          recommendationsList.unshift("Warning: Challenging conditions, monitor closely")
        } else {
          status = "avoid"
          recommendationsList.unshift("Warning: Poor weather conditions, wait for improvement")
        }

        // ✅ GENERATE WEATHER-BASED ALTERNATIVES
        const alternativeDates = generateWeatherBasedAlternatives(crop, nextMonthWeather, weatherData)

        // ✅ Calculate best months dynamically based on weather history
        const bestMonths = calculateBestPlantingMonths(crop, weatherData)

        recommendations.push({
          cropName: crop.crop_name,
          bestMonths: bestMonths, // ✅ Now populated with dynamic data
          currentStatus: status,
          riskFactors,
          recommendations: recommendationsList,
          predictedWeather: nextMonthWeather,
          alternativePlantingDates: alternativeDates,
          optimalTemp: { min: crop.temperature_min || 0, max: crop.temperature_max || 50 },
          optimalHumidity: { min: crop.moisture_min || 0, max: crop.moisture_max || 100 },
          optimalPH: { min: crop.ph_level_min, max: crop.ph_level_max },
          optimalNPK: {
            nitrogen: { min: crop.nitrogen_min, max: crop.nitrogen_max },
            phosphorus: { min: crop.phosphorus_min, max: crop.phosphorus_max },
            potassium: { min: crop.potassium_min, max: crop.potassium_max },
          },
        })
      }

      // Sort by weather suitability instead of static seasons
      recommendations.sort((a, b) => {
        const statusPriority = { ideal: 4, good: 3, caution: 2, avoid: 1 }
        return statusPriority[b.currentStatus] - statusPriority[a.currentStatus]
      })

      const categorized = categorizePlants(recommendations)
      setPlantCategories(categorized)
      setPlantRecommendations(recommendations)

      console.log(`✅ Generated ${recommendations.length} weather-based recommendations`)
    } catch (error) {
      console.error("Error generating weather-based recommendations:", error)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  // Add this function to calculate best months dynamically
  const calculateBestPlantingMonths = (crop: any, weatherHistory: WeatherHistoryData[]): number[] => {
    const bestMonths: number[] = []

    // Analyze each month (1-12) against crop requirements
    for (let month = 1; month <= 12; month++) {
      // Get historical weather data for this month across multiple years
      const monthData = weatherHistory.filter((d) => {
        const date = new Date(d.date)
        return date.getMonth() + 1 === month // getMonth() returns 0-11
      })

      if (monthData.length === 0) continue

      // Calculate average conditions for this month
      const avgTemp = monthData.reduce((sum, d) => sum + d.temperature, 0) / monthData.length
      const avgHumidity = monthData.reduce((sum, d) => sum + d.humidity, 0) / monthData.length
      const avgRainfall = monthData.reduce((sum, d) => sum + d.rainfall, 0) / monthData.length

      // Check if month conditions match crop requirements
      const tempSuitable = avgTemp >= (crop.temperature_min || 0) && avgTemp <= (crop.temperature_max || 50)
      const humiditySuitable = avgHumidity >= (crop.moisture_min || 0) && avgHumidity <= (crop.moisture_max || 100)
      const rainfallTolerance = getRainfallTolerance(crop.crop_name)
      const rainfallSuitable = avgRainfall >= rainfallTolerance.min && avgRainfall <= rainfallTolerance.max

      // Calculate suitability score for this month
      const suitabilityScore =
        (tempSuitable ? 1 : 0) * 0.4 + (humiditySuitable ? 1 : 0) * 0.3 + (rainfallSuitable ? 1 : 0) * 0.3

      // If month scores above 70%, consider it good for planting
      if (suitabilityScore >= 0.7) {
        bestMonths.push(month)
      }
    }

    return bestMonths
  }

  // ✅ HELPER FUNCTIONS FOR WEATHER-BASED ANALYSIS

  const getMonthName = (month: number): string => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return months[month - 1] || "Unknown"
  }

  const isTemperatureSuitable = (currentTemp: number, crop: any) => {
    const min = crop.temperature_min || 0
    const max = crop.temperature_max || 50
    const suitable = currentTemp >= min && currentTemp <= max
    const score = suitable ? 1 : Math.max(0, 1 - Math.abs(currentTemp - (min + max) / 2) / 10)
    return { suitable, score }
  }

  const isHumiditySuitable = (currentHumidity: number, crop: any) => {
    const min = crop.moisture_min || 0
    const max = crop.moisture_max || 100
    const suitable = currentHumidity >= min && currentHumidity <= max
    const score = suitable ? 1 : Math.max(0, 1 - Math.abs(currentHumidity - (min + max) / 2) / 20)
    return { suitable, score }
  }

  const isRainfallSuitable = (dailyRainfall: number, crop: any) => {
    const tolerance = getRainfallTolerance(crop.crop_name)
    const suitable = dailyRainfall >= tolerance.min && dailyRainfall <= tolerance.max
    const score = suitable
      ? 1
      : Math.max(0, 1 - Math.abs(dailyRainfall - (tolerance.min + tolerance.max) / 2) / tolerance.max)
    return { suitable, score }
  }

  const calculateSuitabilityScore = (tempSuit: any, humidSuit: any, rainSuit: any) => {
    return tempSuit.score * 0.4 + humidSuit.score * 0.3 + rainSuit.score * 0.3
  }

  const determineWeatherRisk = (temp: number, humidity: number, rainfall: number): "low" | "medium" | "high" => {
    let riskScore = 0

    // Temperature extremes
    if (temp < 10 || temp > 40) riskScore += 3
    else if (temp < 15 || temp > 35) riskScore += 2
    else if (temp < 18 || temp > 32) riskScore += 1

    // Humidity extremes
    if (humidity < 30 || humidity > 90) riskScore += 2
    else if (humidity < 40 || humidity > 80) riskScore += 1

    // Rainfall extremes
    if (rainfall > 150)
      riskScore += 3 // Very wet month
    else if (rainfall > 100) riskScore += 2
    else if (rainfall < 10) riskScore += 2 // Very dry month

    if (riskScore >= 5) return "high"
    if (riskScore >= 3) return "medium"
    return "low"
  }

  const getRainfallTolerance = (cropName: string): { min: number; max: number } => {
    // Daily rainfall tolerance in mm/day
    const rainfallMap: { [key: string]: { min: number; max: number } } = {
      Rice: { min: 3, max: 10 },
      Tomato: { min: 1, max: 6 },
      Lettuce: { min: 1, max: 4 },
      Cucumber: { min: 1.5, max: 6 },
      Corn: { min: 2, max: 8 },
      Spinach: { min: 1, max: 3 },
    }

    return rainfallMap[cropName] || { min: 1, max: 5 } // Default
  }

  const generateWeatherBasedAlternatives = (crop: any, weather: any, weatherHistory: any[]): string[] => {
    const alternatives: string[] = []

    // Analyze weather trends to suggest better timing
    if (weather.nextMonth.riskLevel === "high") {
      alternatives.push("Wait 2-3 weeks for weather conditions to improve")
      alternatives.push("Consider controlled environment (greenhouse)")
    }

    // Suggest based on historical weather patterns
    const recentTrend = weatherHistory.slice(-7)
    const tempTrend = recentTrend[recentTrend.length - 1].temperature - recentTrend[0].temperature

    if (tempTrend > 2) {
      alternatives.push("Temperature rising - plant heat-tolerant varieties")
    } else if (tempTrend < -2) {
      alternatives.push("Temperature dropping - plant cold-tolerant varieties")
    }

    return alternatives
  }

  // Add useEffect to generate recommendations when data changes
  useEffect(() => {
    if (activeTab === "recommendations" && weatherData.length > 0) {
      generatePlantRecommendations()
    }
  }, [activeTab, weatherData, selectedLocation])

  // Debug logging for recommendations
  useEffect(() => {
    if (activeTab === "recommendations") {
      console.log("📋 Recommendations Debug:")
      console.log("Plant recommendations:", plantRecommendations)
    }
  }, [plantRecommendations, activeTab])

  // Helper for status color and icon
  const getStatusColor = (status: "ideal" | "good" | "caution" | "avoid") => {
    switch (status) {
      case "ideal":
        return { background: "#e0f7fa", text: "#00796b" }
      case "good":
        return { background: "#fffde7", text: "#fbc02d" }
      case "caution":
        return { background: "#fff3e0", text: "#f57c00" }
      case "avoid":
        return { background: "#ffebee", text: "#d32f2f" }
      default:
        return { background: "#e0e0e0", text: "#333" }
    }
  }

  // Helper for risk color
  const getRiskColor = (riskLevel: "low" | "medium" | "high" | undefined) => {
    switch (riskLevel) {
      case "low":
        return { background: "#e0f7fa", text: "#00796b" }
      case "medium":
        return { background: "#fffde7", text: "#fbc02d" }
      case "high":
        return { background: "#ffebee", text: "#d32f2f" }
      default:
        return { background: "#e0e0e0", text: "#333" }
    }
  }

  // Function to categorize plants by type
  const categorizePlants = (recommendations: PlantRecommendation[]): { [key: string]: PlantRecommendation[] } => {
    const categories: { [key: string]: PlantRecommendation[] } = {
      all: recommendations,
      vegetables: [],
      fruits: [],
      grains: [],
      herbs: [],
      legumes: [],
      roots: [],
    }

    recommendations.forEach((rec) => {
      const cropName = rec.cropName.toLowerCase()

      // Categorize based on crop name
      if (
        cropName.includes("tomato") ||
        cropName.includes("lettuce") ||
        cropName.includes("cucumber") ||
        cropName.includes("spinach") ||
        cropName.includes("cabbage") ||
        cropName.includes("carrot") ||
        cropName.includes("eggplant") ||
        cropName.includes("pepper") ||
        cropName.includes("onion") ||
        cropName.includes("garlic")
      ) {
        categories.vegetables.push(rec)
      } else if (cropName.includes("banana") || cropName.includes("papaya") || cropName.includes("mango")) {
        categories.fruits.push(rec)
      } else if (cropName.includes("rice") || cropName.includes("corn") || cropName.includes("wheat")) {
        categories.grains.push(rec)
      } else if (
        cropName.includes("basil") ||
        cropName.includes("mint") ||
        cropName.includes("oregano") ||
        cropName.includes("parsley") ||
        cropName.includes("cilantro")
      ) {
        categories.herbs.push(rec)
      } else if (
        cropName.includes("bean") ||
        cropName.includes("peanut") ||
        cropName.includes("soybean") ||
        cropName.includes("lentil") ||
        cropName.includes("pea")
      ) {
        categories.legumes.push(rec)
      } else if (
        cropName.includes("potato") ||
        cropName.includes("cassava") ||
        cropName.includes("taro") ||
        cropName.includes("yam") ||
        cropName.includes("radish")
      ) {
        categories.roots.push(rec)
      } else {
        // Default to vegetables if not categorized
        categories.vegetables.push(rec)
      }
    })

    // Remove empty categories
    Object.keys(categories).forEach((key) => {
      if (key !== "all" && categories[key].length === 0) {
        delete categories[key]
      }
    })

    return categories
  }

  // Helper function to get category information
  const getCategoryInfo = (category: string) => {
    const categoryMap: { [key: string]: { name: string; icon: string; count: number } } = {
      all: { name: "All Plants", icon: "apps-outline", count: plantRecommendations.length },
      vegetables: { name: "Vegetables", icon: "leaf-outline", count: plantCategories.vegetables?.length || 0 },
      fruits: { name: "Fruits", icon: "nutrition-outline", count: plantCategories.fruits?.length || 0 },
      grains: { name: "Grains & Cereals", icon: "grain-outline", count: plantCategories.grains?.length || 0 },
      herbs: { name: "Herbs & Spices", icon: "flower-outline", count: plantCategories.herbs?.length || 0 },
      legumes: { name: "Legumes", icon: "ellipse-outline", count: plantCategories.legumes?.length || 0 },
      roots: { name: "Root Crops", icon: "fitness-outline", count: plantCategories.roots?.length || 0 },
    }

    return categoryMap[category] || { name: "Unknown", icon: "help-outline", count: 0 }
  }

  // Helper function to get current category recommendations
  const getCurrentCategoryRecommendations = (): PlantRecommendation[] => {
    let categoryRecommendations: PlantRecommendation[] = []

    if (selectedCategory === "all") {
      categoryRecommendations = plantRecommendations
    } else {
      categoryRecommendations = plantCategories[selectedCategory] || []
    }

    // ✅ Filter by selected status
    if (selectedStatus === "all") {
      return categoryRecommendations
    } else {
      return categoryRecommendations.filter((rec) => rec.currentStatus === selectedStatus)
    }
  }

  const getStatusIcon = (status: "ideal" | "good" | "caution" | "avoid") => {
    switch (status) {
      case "ideal":
        return "checkmark-circle-outline"
      case "good":
        return "happy-outline"
      case "caution":
        return "alert-circle-outline"
      case "avoid":
        return "close-circle-outline"
      default:
        return "help-circle-outline"
    }
  }

  // Add this useEffect after your other useEffect hooks (around line 120)
  // Reset status filter when category changes
  useEffect(() => {
    setSelectedStatus("all")
  }, [selectedCategory])

  // This ensures the list refreshes when clicking status filters
  useEffect(() => {
    if (selectedPlantDetail) {
      setSelectedPlantDetail(null)
    }
  }, [selectedStatus])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#1c4722", "#4d7f39"]} style={styles.headerBackground}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Analysis Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === "weather"
                ? `Weather Data for ${selectedLocation?.city || "Your Location"}`
                : activeTab === "plants"
                  ? `Plant History & Trends`
                  : `Smart Planting Recommendations`}
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-circle-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "weather" && styles.activeTab]}
          onPress={() => setActiveTab("weather")}
        >
          <Ionicons name="cloud" size={18} color={activeTab === "weather" ? "#1c4722" : "#666"} />
          <Text style={[styles.tabText, activeTab === "weather" && styles.activeTabText]}>Weather</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "plants" && styles.activeTab]}
          onPress={() => setActiveTab("plants")}
        >
          <Ionicons name="leaf" size={18} color={activeTab === "plants" ? "#1c4722" : "#666"} />
          <Text style={[styles.tabText, activeTab === "plants" && styles.activeTabText]}>Plants</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "recommendations" && styles.activeTab]}
          onPress={() => setActiveTab("recommendations")}
        >
          <Ionicons name="bulb" size={18} color={activeTab === "recommendations" ? "#1c4722" : "#666"} />
          <Text style={[styles.tabText, activeTab === "recommendations" && styles.activeTabText]}>Suggestion</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Weather Analysis Tab */}
        {activeTab === "weather" && (
          <>
            {/* Time Range Selection */}
            <View style={styles.timeRangeContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Weather for {selectedLocation?.city || "Unknown Location"}</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={handleRefreshWeatherData}
                  disabled={loadingWeather}
                >
                  <Ionicons name="refresh-outline" size={20} color={loadingWeather ? "#ccc" : "#1c4722"} />
                </TouchableOpacity>
              </View>

              <Text style={styles.timeRangeLabel}>Select Time Range:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.timeRangeBtn, timeRange === "7days" && styles.activeTimeRange]}
                  onPress={() => setTimeRange("7days")}
                >
                  <Text style={[styles.timeRangeText, timeRange === "7days" && styles.activeTimeRangeText]}>
                    7 Days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.timeRangeBtn, timeRange === "30days" && styles.activeTimeRange]}
                  onPress={() => setTimeRange("30days")}
                >
                  <Text style={[styles.timeRangeText, timeRange === "30days" && styles.activeTimeRangeText]}>
                    30 Days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.timeRangeBtn, timeRange === "1year" && styles.activeTimeRange]}
                  onPress={() => setTimeRange("1year")}
                >
                  <Text style={[styles.timeRangeText, timeRange === "1year" && styles.activeTimeRangeText]}>
                    1 Year
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.timeRangeBtn, timeRange === "5years" && styles.activeTimeRange]}
                  onPress={() => setTimeRange("5years")}
                >
                  <Text style={[styles.timeRangeText, timeRange === "5years" && styles.activeTimeRangeText]}>
                    5 Years
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Weather Charts */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Temperature Trends</Text>
                <TouchableOpacity style={styles.expandButton} onPress={() => toggleChartExpansion("weather")}>
                  <Ionicons
                    name={expandedChart === "weather" ? "contract-outline" : "expand-outline"}
                    size={20}
                    color="#1c4722"
                  />
                  <Text style={styles.expandButtonText}>{expandedChart === "weather" ? "Shrink" : "Expand"}</Text>
                </TouchableOpacity>
              </View>

              {(timeRange === "1year" || timeRange === "5years") && (
                <Text style={styles.chartSubtitle}> Swipe horizontally to view all data points</Text>
              )}

              {loadingWeather ? (
                <ActivityIndicator size="large" color="#1c4722" />
              ) : weatherData.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  style={[styles.chartScrollView, expandedChart === "weather" && styles.expandedChartScrollView]}
                  contentContainerStyle={styles.chartScrollContent}
                >
                  <LineChart
                    data={weatherChartData}
                    width={weatherChartWidth}
                    height={expandedChart === "weather" ? 300 : 220}
                    chartConfig={{
                      ...chartConfig,
                      propsForLabels: {
                        fontSize: expandedChart === "weather" ? 12 : 10,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </ScrollView>
              ) : (
                <View style={styles.noDataContainer}>
                  <Ionicons name="cloud-offline-outline" size={60} color="#ccc" />
                  <Text style={styles.noDataText}>No weather data available</Text>
                </View>
              )}

              {/* Data points indicator */}
              {weatherData.length > 0 && (
                <Text style={styles.dataPointsIndicator}>
                  Showing {weatherChartDataPoints.length} data points out of {weatherData.length} total
                  {expandedChart === "weather" && " • Expanded View"}
                </Text>
              )}
            </View>

            {/* Weather Statistics */}
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>
                Weather Statistics (
                {timeRange.replace("days", " Days").replace("year", " Year").replace("years", " Years")})
              </Text>

              {weatherData.length > 0 && (
                <>
                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <Ionicons name="thermometer-outline" size={28} color="#e53935" />
                      <Text style={styles.statTitle}>Avg. Temperature</Text>
                      <Text style={styles.statValue}>
                        {(weatherData.reduce((sum, d) => sum + d.temperature, 0) / weatherData.length).toFixed(1)}°C
                      </Text>
                    </View>

                    <View style={styles.statCard}>
                      <Ionicons name="thermometer" size={28} color="#ff5722" />
                      <Text style={styles.statTitle}>Max Temperature</Text>
                      <Text style={styles.statValue}>
                        {Math.max(...weatherData.map((d) => d.temperature)).toFixed(1)}°C
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <Ionicons name="water-outline" size={28} color="#1976d2" />
                      <Text style={styles.statTitle}>Avg. Humidity</Text>
                      <Text style={styles.statValue}>
                        {(weatherData.reduce((sum, d) => sum + d.humidity, 0) / weatherData.length).toFixed(1)}%
                      </Text>
                    </View>

                    <View style={styles.statCard}>
                      <Ionicons name="rainy-outline" size={28} color="#29b6f6" />
                      <Text style={styles.statTitle}>Total Rainfall</Text>
                      <Text style={styles.statValue}>
                        {weatherData.reduce((sum, d) => sum + d.rainfall, 0).toFixed(1)} mm
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <Ionicons name="sunny-outline" size={28} color="#ffa000" />
                      <Text style={styles.statTitle}>Clear Days</Text>
                      <Text style={styles.statValue}>
                        {
                          weatherData.filter((d) => d.description.includes("Clear") || d.description.includes("Sunny"))
                            .length
                        }
                      </Text>
                    </View>

                    <View style={styles.statCard}>
                      <Ionicons name="rainy" size={28} color="#2196f3" />
                      <Text style={styles.statTitle}>Rainy Days</Text>
                      <Text style={styles.statValue}>
                        {
                          weatherData.filter((d) => d.description.includes("Rain") || d.description.includes("Drizzle"))
                            .length
                        }
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            <View style={styles.tableContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Weather Record</Text>
                <TouchableOpacity style={styles.expandButton} onPress={() => setShowAllRecords(!showAllRecords)}>
                  <Ionicons name={showAllRecords ? "chevron-up" : "chevron-down"} size={16} color="#1c4722" />
                  <Text style={styles.expandButtonText}>{showAllRecords ? "Show Less" : "Show All"}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                {showAllRecords ? `Showing all ${weatherData.length} records` : "Showing last 5 records"}
              </Text>

              {/* Weather Record Cards */}
              {(showAllRecords ? weatherData : weatherData.slice(-5)).reverse().map((day, index) => {
                const isExpanded = expandedRecordIndex === index
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.weatherRecordCard}
                    onPress={() => setExpandedRecordIndex(isExpanded ? null : index)}
                    activeOpacity={0.7}
                  >
                    {/* Card Header */}
                    <View style={styles.weatherRecordHeader}>
                      <View>
                        <Text style={styles.weatherRecordDate}>{day.date}</Text>
                        <Text style={styles.weatherRecordDay}>
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "long",
                          })}
                        </Text>
                      </View>
                      <View style={styles.weatherDescriptionBadge}>
                        <Ionicons
                          name={
                            day.description.toLowerCase().includes("rain")
                              ? "rainy"
                              : day.description.toLowerCase().includes("cloud")
                                ? "cloudy"
                                : day.description.toLowerCase().includes("sun")
                                  ? "sunny"
                                  : "partly-sunny"
                          }
                          size={14}
                          color="#1c4722"
                        />
                        <Text style={styles.weatherDescriptionText}>{day.description}</Text>
                      </View>
                    </View>

                    {/* Weather Metrics */}
                    <View style={styles.weatherMetricsRow}>
                      {/* Temperature */}
                      <View style={styles.weatherMetricItem}>
                        <Ionicons
                          name="thermometer"
                          size={20}
                          color={
                            day.temperature < 15
                              ? "#3B82F6"
                              : day.temperature < 25
                                ? "#10B981"
                                : day.temperature < 30
                                  ? "#F59E0B"
                                  : "#EF4444"
                          }
                        />
                        <View style={styles.weatherMetricContent}>
                          <Text style={styles.weatherMetricLabel}>TEMP</Text>
                          <Text style={[styles.weatherMetricValue, getTempColor(day.temperature)]}>
                            {day.temperature}°C
                          </Text>
                        </View>
                      </View>

                      {/* Humidity */}
                      <View style={styles.weatherMetricItem}>
                        <Ionicons name="water" size={20} color="#3B82F6" />
                        <View style={styles.weatherMetricContent}>
                          <Text style={styles.weatherMetricLabel}>WIND</Text>
                          <Text style={styles.weatherMetricValue}>{day.humidity}%</Text>
                        </View>
                      </View>

                      {/* Rainfall */}
                      <View style={styles.weatherMetricItem}>
                        <Ionicons
                          name="rainy"
                          size={20}
                          color={day.rainfall > 50 ? "#2563EB" : day.rainfall > 10 ? "#3B82F6" : "#60A5FA"}
                        />
                        <View style={styles.weatherMetricContent}>
                          <Text style={styles.weatherMetricLabel}>RAIN</Text>
                          <Text style={[styles.weatherMetricValue, getRainfallColor(day.rainfall)]}>
                            {day.rainfall} mm
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E2E8F0" }}>
                        <Text style={styles.subsectionTitle}>Additional Details</Text>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                          <View>
                            <Text style={styles.weatherMetricLabel}>FEELS LIKE</Text>
                            <Text style={styles.weatherMetricValue}>
                              {(day.temperature + (day.humidity > 70 ? 2 : -1)).toFixed(1)}°C
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.weatherMetricLabel}>CONDITION</Text>
                            <Text style={styles.weatherMetricValue}>{day.rainfall > 10 ? "Wet" : "Dry"}</Text>
                          </View>
                          <View>
                            <Text style={styles.weatherMetricLabel}>COMFORT</Text>
                            <Text style={styles.weatherMetricValue}>
                              {day.temperature >= 20 && day.temperature <= 28 && day.humidity < 70 ? "Good" : "Fair"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Tap to expand indicator */}
                    <View style={{ alignItems: "center", marginTop: 8 }}>
                      <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                )
              })}

              {/* Show More Button */}
              {!showAllRecords && weatherData.length > 5 && (
                <TouchableOpacity style={styles.showMoreButton} onPress={() => setShowAllRecords(true)}>
                  <Ionicons name="chevron-down-circle" size={18} color="#1c4722" />
                  <Text style={styles.showMoreText}>Show {weatherData.length - 5} More Records</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Plant Analysis Tab */}
        {activeTab === "plants" && (
          <>
            {/* Plant Selection */}
            {Object.keys(plantHistory).length > 0 && (
              <View style={styles.plantSelectionContainer}>
                <Text style={styles.sectionTitle}>Select Plant:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {Object.keys(plantHistory).map((plantName, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.plantSelectBtn, selectedPlant === plantName && styles.activePlantBtn]}
                      onPress={() => handlePlantSelect(plantName)}
                    >
                      <Text style={[styles.plantSelectText, selectedPlant === plantName && styles.activePlantText]}>
                        {plantName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Plant Temperature Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>
                {selectedPlant ? `${selectedPlant} - Temperature Trends` : "Temperature Trends"}
              </Text>

              {loadingPlant ? (
                <ActivityIndicator size="large" color="#1c4722" />
              ) : plantData.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  style={styles.chartScrollView}
                  contentContainerStyle={styles.chartScrollContent}
                >
                  <LineChart
                    data={plantTempChartData}
                    width={plantTempChartWidth}
                    height={220}
                    chartConfig={{
                      ...chartConfig,
                      backgroundGradientFrom: "#1a237e",
                      backgroundGradientTo: "#303f9f",
                    }}
                    bezier
                    style={styles.chart}
                  />
                </ScrollView>
              ) : (
                <View style={styles.noDataContainer}>
                  <Ionicons name="leaf-outline" size={60} color="#ccc" />
                  <Text style={styles.noDataText}>No plant data available</Text>
                </View>
              )}
            </View>

            {/* Plant Moisture Chart */}
            {plantData.length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>
                  {selectedPlant ? `${selectedPlant} - Moisture Trends` : "Moisture Trends"}
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  style={styles.chartScrollView}
                  contentContainerStyle={styles.chartScrollContent}
                >
                  <LineChart
                    data={plantMoistureChartData}
                    width={plantMoistureChartWidth}
                    height={220}
                    chartConfig={{
                      ...chartConfig,
                      backgroundGradientFrom: "#004d40",
                      backgroundGradientTo: "#00796b",
                    }}
                    bezier
                    style={styles.chart}
                  />
                </ScrollView>
              </View>
            )}

            {/* Plant Statistics */}
            {plantData.length > 0 && (
              <View style={styles.statsContainer}>
                <Text style={styles.sectionTitle}>Plant Growth Statistics</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Ionicons name="thermometer-outline" size={28} color="#e53935" />
                    <Text style={styles.statTitle}>Avg. Temperature</Text>
                    <Text style={styles.statValue}>
                      {(plantData.reduce((sum, d) => sum + d.temperature, 0) / plantData.length).toFixed(1)}°C
                    </Text>
                  </View>

                  <View style={styles.statCard}>
                    <Ionicons name="water-outline" size={28} color="#1976d2" />
                    <Text style={styles.statTitle}>Avg. Moisture</Text>
                    <Text style={styles.statValue}>
                      {(plantData.reduce((sum, d) => sum + d.moisture, 0) / plantData.length).toFixed(1)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Ionicons name="flask-outline" size={28} color="#9c27b0" />
                    <Text style={styles.statTitle}>Avg. pH Level</Text>
                    <Text style={styles.statValue}>
                      {(plantData.reduce((sum, d) => sum + d.ph, 0) / plantData.length).toFixed(1)}
                    </Text>
                  </View>

                  <View style={styles.statCard}>
                    <Ionicons name="leaf-outline" size={28} color="#4caf50" />
                    <Text style={styles.statTitle}>Days Tracked</Text>
                    <Text style={styles.statValue}>{plantData.length}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* NPK Levels */}
            {plantData.length > 0 && (
              <View style={styles.npkContainer}>
                <Text style={styles.sectionTitle}>Average NPK Levels</Text>

                <View style={styles.npkChart}>
                  <View style={styles.npkBar}>
                    <View
                      style={[
                        styles.npkFill,
                        {
                          height: `${Math.min(100, plantData.reduce((sum, d) => sum + d.nitrogen, 0) / plantData.length / 1.5)}%`,
                          backgroundColor: "#4CAF50",
                        },
                      ]}
                    />
                    <Text style={styles.npkValue}>
                      {(plantData.reduce((sum, d) => sum + d.nitrogen, 0) / plantData.length).toFixed(0)}
                    </Text>
                    <Text style={styles.npkLabel}>Nitrogen</Text>
                  </View>

                  <View style={styles.npkBar}>
                    <View
                      style={[
                        styles.npkFill,
                        {
                          height: `${Math.min(100, plantData.reduce((sum, d) => sum + d.phosphorus, 0) / plantData.length / 0.8)}%`,
                          backgroundColor: "#FF9800",
                        },
                      ]}
                    />
                    <Text style={styles.npkValue}>
                      {(plantData.reduce((sum, d) => sum + d.phosphorus, 0) / plantData.length).toFixed(0)}
                    </Text>
                    <Text style={styles.npkLabel}>Phosphorus</Text>
                  </View>

                  <View style={styles.npkBar}>
                    <View
                      style={[
                        styles.npkFill,
                        {
                          height: `${Math.min(100, plantData.reduce((sum, d) => sum + d.potassium, 0) / plantData.length / 1.2)}%`,
                          backgroundColor: "#2196F3",
                        },
                      ]}
                    />
                    <Text style={styles.npkValue}>
                      {(plantData.reduce((sum, d) => sum + d.potassium, 0) / plantData.length).toFixed(0)}
                    </Text>
                    <Text style={styles.npkLabel}>Potassium</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Daily Plant Data Table */}
            {plantData.length > 0 && (
              <View style={styles.tableContainer}>
                <Text style={styles.sectionTitle}>Daily Plant Readings</Text>

                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date</Text>
                  <Text style={styles.tableHeaderCell}>Temp</Text>
                  <Text style={styles.tableHeaderCell}>Moisture</Text>
                  <Text style={styles.tableHeaderCell}>pH</Text>
                </View>

                {/* Table Body */}
                {plantData.slice(-10).map((day, index) => (
                  <View
                    key={index}
                    style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                  >
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{day.date}</Text>
                    <Text style={styles.tableCell}>{day.temperature}°C</Text>
                    <Text style={styles.tableCell}>{day.moisture}%</Text>
                    <Text style={styles.tableCell}>{day.ph}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Plant Recommendations Tab */}
        {activeTab === "recommendations" && (
          <>
            {/* Header Section */}
            <View style={styles.recommendationHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.sectionTitle}>Smart Planting Recommendations</Text>
              </View>

              <Text style={styles.subtitle}>
                Based on weather analysis for {selectedLocation?.city || "your location"}
              </Text>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={generatePlantRecommendations}
                disabled={loadingRecommendations}
              >
                <Ionicons name="refresh-outline" size={20} color={loadingRecommendations ? "#ccc" : "#1c4722"} />
                <Text style={styles.refreshButtonText}>Refresh Recommendations</Text>
              </TouchableOpacity>
            </View>

            {loadingRecommendations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1c4722" />
                <Text style={styles.loadingText}>Analyzing weather patterns...</Text>
              </View>
            ) : (
              <>
                {/* Next Month Weather Prediction */}
                {plantRecommendations.length > 0 && (
                  <View style={styles.weatherPredictionCard}>
                    <Text style={[styles.cardTitle, { textAlign: "center" }]}>Next Month Weather Forecast</Text>
                    <View style={styles.predictionStats}>
                      <View style={styles.predictionStat}>
                        <Ionicons name="thermometer-outline" size={24} color="#e53935" />
                        <Text style={styles.predictionValue}>
                          {plantRecommendations[0]?.predictedWeather.nextMonth.avgTemp.toFixed(1)}°C
                        </Text>
                        <Text style={styles.predictionLabel}>Avg Temp</Text>
                      </View>
                      <View style={styles.predictionStat}>
                        <Ionicons name="rainy-outline" size={24} color="#2196f3" />
                        <Text style={styles.predictionValue}>
                          {plantRecommendations[0]?.predictedWeather.nextMonth.rainfall.toFixed(1)} mm
                        </Text>
                        <Text style={styles.predictionLabel}>Rainfall</Text>
                      </View>
                      <View style={styles.predictionStat}>
                        <Ionicons name="water-outline" size={24} color="#1976d2" />
                        <Text style={styles.predictionValue}>
                          {plantRecommendations[0]?.predictedWeather.nextMonth.humidity.toFixed(1)}%
                        </Text>
                        <Text style={styles.predictionLabel}>Humidity</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.riskIndicator,
                        {
                          backgroundColor: getRiskColor(plantRecommendations[0]?.predictedWeather.nextMonth.riskLevel)
                            .background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.riskText,
                          { color: getRiskColor(plantRecommendations[0]?.predictedWeather.nextMonth.riskLevel).text },
                        ]}
                      >
                        Risk Level: {plantRecommendations[0]?.predictedWeather.nextMonth.riskLevel.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Category Selection */}
                {Object.keys(plantCategories).length > 0 && (
                  <View style={styles.categoryContainer}>
                    <Text style={styles.sectionTitle}>Plant Categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollView}>
                      {Object.keys(plantCategories).map((category, index) => {
                        const categoryInfo = getCategoryInfo(category)
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[styles.categoryCard, selectedCategory === category && styles.activeCategoryCard]}
                            onPress={() => setSelectedCategory(category)}
                          >
                            <View style={styles.categoryIconContainer}>
                              <Ionicons
                                name={categoryInfo.icon as any}
                                size={32}
                                color={selectedCategory === category ? "#1c4722" : "#666"}
                              />
                            </View>
                            <Text
                              style={[styles.categoryName, selectedCategory === category && styles.activeCategoryName]}
                            >
                              {categoryInfo.name}
                            </Text>
                            <Text style={styles.categoryCount}>{categoryInfo.count} plants</Text>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Enhanced Clickable Status Summary - HORIZONTAL SCROLL VERSION */}
                {selectedCategory && plantCategories[selectedCategory] && (
                  <View style={styles.categorySummary}>
                    <Text style={styles.categorySummaryTitle}>
                      {getCategoryInfo(selectedCategory).name} Recommendations
                    </Text>
                    <Text style={styles.categorySummarySubtitle}>
                      {plantCategories[selectedCategory].length} plants available for{" "}
                      {selectedLocation?.city || "your location"}
                    </Text>

                    {/* ✅ HORIZONTAL SCROLLABLE Status Summary */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.statusSummaryScrollContent}
                      style={styles.statusSummaryScroll}
                    >
                      {/* All Status */}
                      <TouchableOpacity
                        style={[styles.statusSummaryItemCard, selectedStatus === "all" && styles.activeStatusItemCard]}
                        onPress={() => setSelectedStatus("all")}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.statusDot, { backgroundColor: "#666" }]} />
                        <View style={styles.statusTextContainer}>
                          <Text style={[styles.statusSummaryText, selectedStatus === "all" && styles.activeStatusText]}>
                            All Plants
                          </Text>
                          <Text style={styles.statusCount}>{plantCategories[selectedCategory].length}</Text>
                        </View>
                        {selectedStatus === "all" && (
                          <Ionicons name="checkmark-circle" size={18} color="#1c4722" style={styles.checkmark} />
                        )}
                      </TouchableOpacity>

                      {/* Ideal Status */}
                      {plantCategories[selectedCategory].filter((r) => r.currentStatus === "ideal").length > 0 && (
                        <TouchableOpacity
                          style={[
                            styles.statusSummaryItemCard,
                            selectedStatus === "ideal" && styles.activeStatusItemCard,
                          ]}
                          onPress={() => setSelectedStatus("ideal")}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.statusDot, { backgroundColor: "#00796b" }]} />
                          <View style={styles.statusTextContainer}>
                            <Text
                              style={[styles.statusSummaryText, selectedStatus === "ideal" && styles.activeStatusText]}
                            >
                              Ideal
                            </Text>
                            <Text style={styles.statusCount}>
                              {plantCategories[selectedCategory].filter((r) => r.currentStatus === "ideal").length}
                            </Text>
                          </View>
                          {selectedStatus === "ideal" && (
                            <Ionicons name="checkmark-circle" size={18} color="#00796b" style={styles.checkmark} />
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Good Status */}
                      {plantCategories[selectedCategory].filter((r) => r.currentStatus === "good").length > 0 && (
                        <TouchableOpacity
                          style={[
                            styles.statusSummaryItemCard,
                            selectedStatus === "good" && styles.activeStatusItemCard,
                          ]}
                          onPress={() => setSelectedStatus("good")}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.statusDot, { backgroundColor: "#fbc02d" }]} />
                          <View style={styles.statusTextContainer}>
                            <Text
                              style={[styles.statusSummaryText, selectedStatus === "good" && styles.activeStatusText]}
                            >
                              Good
                            </Text>
                            <Text style={styles.statusCount}>
                              {plantCategories[selectedCategory].filter((r) => r.currentStatus === "good").length}
                            </Text>
                          </View>
                          {selectedStatus === "good" && (
                            <Ionicons name="checkmark-circle" size={18} color="#fbc02d" style={styles.checkmark} />
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Caution Status */}
                      {plantCategories[selectedCategory].filter((r) => r.currentStatus === "caution").length > 0 && (
                        <TouchableOpacity
                          style={[
                            styles.statusSummaryItemCard,
                            selectedStatus === "caution" && styles.activeStatusItemCard,
                          ]}
                          onPress={() => setSelectedStatus("caution")}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.statusDot, { backgroundColor: "#f57c00" }]} />
                          <View style={styles.statusTextContainer}>
                            <Text
                              style={[
                                styles.statusSummaryText,
                                selectedStatus === "caution" && styles.activeStatusText,
                              ]}
                            >
                              Caution
                            </Text>
                            <Text style={styles.statusCount}>
                              {plantCategories[selectedCategory].filter((r) => r.currentStatus === "caution").length}
                            </Text>
                          </View>
                          {selectedStatus === "caution" && (
                            <Ionicons name="checkmark-circle" size={18} color="#f57c00" style={styles.checkmark} />
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Avoid Status */}
                      {plantCategories[selectedCategory].filter((r) => r.currentStatus === "avoid").length > 0 && (
                        <TouchableOpacity
                          style={[
                            styles.statusSummaryItemCard,
                            selectedStatus === "avoid" && styles.activeStatusItemCard,
                          ]}
                          onPress={() => setSelectedStatus("avoid")}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.statusDot, { backgroundColor: "#d32f2f" }]} />
                          <View style={styles.statusTextContainer}>
                            <Text
                              style={[styles.statusSummaryText, selectedStatus === "avoid" && styles.activeStatusText]}
                            >
                              Avoid
                            </Text>
                            <Text style={styles.statusCount}>
                              {plantCategories[selectedCategory].filter((r) => r.currentStatus === "avoid").length}
                            </Text>
                          </View>
                          {selectedStatus === "avoid" && (
                            <Ionicons name="checkmark-circle" size={18} color="#d32f2f" style={styles.checkmark} />
                          )}
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>
                )}

                {/* Plant Recommendations List for Selected Category */}
                {getCurrentCategoryRecommendations().length > 0 ? (
                  selectedPlantDetail ? (
                    // Show detailed view for selected plant
                    <View style={styles.detailView}>
                      {/* Back button */}
                      <TouchableOpacity style={styles.backButton} onPress={() => setSelectedPlantDetail(null)}>
                        <Ionicons name="arrow-back-outline" size={20} color="#1c4722" />
                        <Text style={styles.backButtonText}>Back to {getCategoryInfo(selectedCategory).name}</Text>
                      </TouchableOpacity>

                      {/* Detailed Plant Card */}
                      <View style={styles.detailedRecommendationCard}>
                        <View style={styles.cardHeader}>
                          <View style={styles.plantInfo}>
                            <Text style={styles.plantName}>{selectedPlantDetail.cropName}</Text>
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(selectedPlantDetail.currentStatus).background },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  { color: getStatusColor(selectedPlantDetail.currentStatus).text },
                                ]}
                              >
                                {selectedPlantDetail.currentStatus.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <Ionicons
                            name={getStatusIcon(selectedPlantDetail.currentStatus)}
                            size={28}
                            color={getStatusColor(selectedPlantDetail.currentStatus).text}
                          />
                        </View>

                        {/* Best Planting Months */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <Calendar size={16} color="#6b7280" />
                          <Text style={styles.subsectionTitle}>Best Planting Months:</Text>
                        </View>
                        <View style={styles.monthsContainer}>
                          {selectedPlantDetail.bestMonths.map((month, idx) => (
                            <View key={idx} style={styles.monthChip}>
                              <Text style={styles.monthText}>
                                {new Date(2024, month - 1, 1).toLocaleString("default", { month: "short" })}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* Risk Factors */}
                        {selectedPlantDetail.riskFactors.length > 0 && (
                          <View style={styles.riskSection}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                              <AlertTriangle size={16} color="#ef4444" />
                              <Text style={styles.subsectionTitle}>Current Risk Factors:</Text>
                            </View>
                            {selectedPlantDetail.riskFactors.map((risk, idx) => (
                              <View key={idx} style={styles.riskItem}>
                                <Ionicons name="warning-outline" size={16} color="#ff5722" />
                                <Text style={styles.riskText}>{risk}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Recommendations */}
                        <View style={styles.recommendationsSection}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <Lightbulb size={16} color="#f59e0b" />
                            <Text style={styles.subsectionTitle}>Recommendations:</Text>
                          </View>
                          {selectedPlantDetail.recommendations.map((rec, idx) => (
                            <View key={idx} style={styles.recommendationItem}>
                              <Ionicons name="checkmark-circle-outline" size={16} color="#4caf50" />
                              <Text style={styles.recommendationText}>{rec}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Alternative Dates */}
                        {selectedPlantDetail.alternativePlantingDates.length > 0 && (
                          <View style={styles.alternativesSection}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Calendar size={16} color="#2196f3" />
                              <Text style={styles.subsectionTitle}>Alternative Options:</Text>
                            </View>
                            {selectedPlantDetail.alternativePlantingDates.map((alt, idx) => (
                              <View key={idx} style={styles.alternativeItem}>
                                <Ionicons name="calendar-outline" size={16} color="#2196f3" />
                                <Text style={styles.alternativeText}>{alt}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Database-specific optimal conditions */}
                        {selectedPlantDetail.optimalTemp && (
                          <View style={styles.optimalConditions}>
                            <Text style={styles.subsectionTitle}> Optimal Growing Conditions:</Text>
                            <Text style={styles.conditionText}>
                              Temperature: {selectedPlantDetail.optimalTemp.min}°C -{" "}
                              {selectedPlantDetail.optimalTemp.max}°C
                            </Text>
                            {selectedPlantDetail.optimalHumidity && (
                              <Text style={styles.conditionText}>
                                Humidity: {selectedPlantDetail.optimalHumidity.min}% -{" "}
                                {selectedPlantDetail.optimalHumidity.max}%
                              </Text>
                            )}
                            {selectedPlantDetail.optimalPH?.min && selectedPlantDetail.optimalPH?.max && (
                              <Text style={styles.conditionText}>
                                pH Level: {selectedPlantDetail.optimalPH.min} - {selectedPlantDetail.optimalPH.max}
                              </Text>
                            )}
                          </View>
                        )}

                        {/* NPK Requirements from database */}
                        {selectedPlantDetail.optimalNPK && (
                          <View style={styles.npkSection}>
                            <Text style={styles.subsectionTitle}> Nutrient Requirements:</Text>
                            {selectedPlantDetail.optimalNPK.nitrogen.min &&
                              selectedPlantDetail.optimalNPK.nitrogen.max && (
                                <Text style={styles.conditionText}>
                                  Nitrogen: {selectedPlantDetail.optimalNPK.nitrogen.min} -{" "}
                                  {selectedPlantDetail.optimalNPK.nitrogen.max} ppm
                                </Text>
                              )}
                            {selectedPlantDetail.optimalNPK.phosphorus.min &&
                              selectedPlantDetail.optimalNPK.phosphorus.max && (
                                <Text style={styles.conditionText}>
                                  Phosphorus: {selectedPlantDetail.optimalNPK.phosphorus.min} -{" "}
                                  {selectedPlantDetail.optimalNPK.phosphorus.max} ppm
                                </Text>
                              )}
                            {selectedPlantDetail.optimalNPK.potassium.min &&
                              selectedPlantDetail.optimalNPK.potassium.max && (
                                <Text style={styles.conditionText}>
                                  Potassium: {selectedPlantDetail.optimalNPK.potassium.min} -{" "}
                                  {selectedPlantDetail.optimalNPK.potassium.max} ppm
                                </Text>
                              )}
                          </View>
                        )}
                      </View>
                    </View>
                  ) : (
                    // Show compact plant list
                    <View style={styles.plantListContainer}>
                      <Text style={styles.listTitle}>{getCategoryInfo(selectedCategory).name} Plants</Text>
                      <Text style={styles.listSubtitle}>Tap any plant to view detailed recommendations</Text>

                      {getCurrentCategoryRecommendations().map((recommendation, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.plantListItem}
                          onPress={() => setSelectedPlantDetail(recommendation)}
                        >
                          <View style={styles.plantListInfo}>
                            <View style={styles.plantListHeader}>
                              <Text style={styles.plantListName}>{recommendation.cropName}</Text>
                              <View
                                style={[
                                  styles.compactStatusBadge,
                                  { backgroundColor: getStatusColor(recommendation.currentStatus).background },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.compactStatusText,
                                    { color: getStatusColor(recommendation.currentStatus).text },
                                  ]}
                                >
                                  {recommendation.currentStatus.toUpperCase()}
                                </Text>
                              </View>
                            </View>
                            {/* Quick summary */}
                            <View style={{ marginTop: 8 }}>
                              {/* Best months */}
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  marginBottom: 4,
                                }}
                              >
                                <Ionicons
                                  name="calendar-outline"
                                  size={18}
                                  color="#333"
                                  style={{ marginRight: 6, marginTop: 2 }}
                                />
                                <Text style={{ fontSize: 14, color: "#333" }}>
                                  Best months:{" "}
                                  {recommendation.bestMonths
                                    .slice(0, 3)
                                    .map((month) =>
                                      new Date(2024, month - 1, 1).toLocaleString("default", { month: "short" }),
                                    )
                                    .join(", ")}
                                  {recommendation.bestMonths.length > 3 ? "..." : ""}
                                </Text>
                              </View>

                              {/* Risk factors */}
                              {recommendation.riskFactors.length > 0 && (
                                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                                  <AlertTriangle size={14} color="#e53935" style={{ marginRight: 6, marginTop: 2 }} />
                                  <Text style={{ fontSize: 13, color: "#e53935", fontWeight: "500" }}>
                                    {recommendation.riskFactors.length} risk factor
                                    {recommendation.riskFactors.length > 1 ? "s" : ""} detected
                                  </Text>
                                </View>
                              )}

                              {/* Optimal temperature */}
                              {recommendation.optimalTemp && (
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                  <Thermometer size={14} color="#1c4722" style={{ marginRight: 6, marginTop: 2 }} />
                                  <Text style={{ fontSize: 13, color: "#1c4722" }}>
                                    Optimal: {recommendation.optimalTemp.min}°C - {recommendation.optimalTemp.max}°C
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <Ionicons name="chevron-forward-outline" size={20} color="#666" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )
                ) : (
                  // No plants message
                  <View style={styles.noDataContainer}>
                    <Ionicons name="leaf-outline" size={60} color="#ccc" />
                    <Text style={styles.noDataText}>
                      No {getCategoryInfo(selectedCategory).name.toLowerCase()} available for current conditions
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* Blank space at bottom to prevent footer overlap */}
        <View style={styles.footerSpace} />
      </ScrollView>

      <FooterNavigation />
      </View>
    </>
  )
}

// Using SharedStyles from components folder
const styles = SharedStyles
