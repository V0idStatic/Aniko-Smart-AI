"use client"

import supabase from "./CONFIG/supaBase"
import { useState, useEffect } from "react"
import { useAppContext } from "./CONFIG/GlobalContext"
import type { PhLocation } from "./CONFIG/GlobalContext"
import FooterNavigation from "../components/FooterNavigation"
import DraggableAIButton from "../components/DraggableAIButton"

import StatusCard from "../components/StatusCard"
import DiagnosisCard from "../components/DiagnosisCard"
import WeatherHistory from "../components/WeatherHistory"

import { styles, COLORS } from "./styles/dashboard.style"

import { Text, View, TouchableOpacity, ScrollView, Alert, Modal } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { fetchWeatherApi } from "openmeteo"

/* ===================== Types ===================== */

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
interface WeatherData {
  city: string
  temperature: string
  condition: string
  highLow: string
  hourlyWeather: Array<{
    time: string
    temp: string
    icon: keyof typeof Ionicons.glyphMap
    isNow?: boolean
  }>
  source?: "LIVE" | "FALLBACK"
  updatedAt?: string
}
interface DayWeatherData {
  day: string
  status: string
  temp: string
  humidity: string
  color: string
}

type DbLocation = {
  location_id: number
  region_id: number
  reg_desc: string
  province_id: number
  province_desc: string
  city_id: number
  city_desc: string
  lat?: number
  lon?: number
}

/* ===================== Component ===================== */
export default function Dashboard() {
  const [user, setUser] = useState<User | AuthUser | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const { selectedLocation, setSelectedLocation, selectedCrop, cropParameters, sensorData } = useAppContext()

  const [weather, setWeather] = useState<WeatherData>({
    city: selectedLocation?.city || "Loading...",
    temperature: "—",
    condition: "Loading…",
    highLow: "—",
    hourlyWeather: [],
    source: "FALLBACK",
    updatedAt: "",
  })
  const [weeklyWeather, setWeeklyWeather] = useState<DayWeatherData[]>([])

  const [showDayModal, setShowDayModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<DayWeatherData | null>(null)

  const [locations, setLocations] = useState<PhLocation[]>([])
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showInlinePicker, setShowInlinePicker] = useState(false)

  const regions = Array.from(new Set(locations.map((l) => l.region)))
  const provinces = Array.from(new Set(locations.filter((l) => l.region === selectedRegion).map((l) => l.province)))
  const cities = locations.filter((l) => l.region === selectedRegion && l.province === selectedProvince)

  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [selectedProvince, setSelectedProvince] = useState<string>("")
  const [activeRegion, setActiveRegion] = useState<string>("")
  const [activeProvince, setActiveProvince] = useState<string>("")

  const router = useRouter()
  const [nowClock, setNowClock] = useState<string>(
    new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  )
  const [isFullFetching, setIsFullFetching] = useState(false)

  useEffect(() => {
    const tick = setInterval(() => {
      setNowClock(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  /* ===================== Supabase helpers ===================== */

  const getLastLoggedInUser = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("last_login", { ascending: false })
        .limit(1)

      if (!error && data?.length > 0) setCurrentUser(data[0])
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
            if (!error) router.replace("/Login")
          } catch (error) {
            console.error("Logout error:", error)
          }
        },
      },
    ])
  }

  /* ===================== Location helpers ===================== */

  const handleLocationSelect = async (location: PhLocation) => {
    console.log("Location selected:", location)
    setSelectedLocation(location)
    setSelectedRegion(location.region)
    setSelectedProvince(location.province)
    setActiveRegion(location.region)
    setActiveProvince(location.province)
    setShowLocationModal(false)
    setShowInlinePicker(false)

    setWeather((prev) => ({
      ...prev,
      city: location.city,
    }))

    setIsFullFetching(true)
    await fetchWeatherData()
    setIsFullFetching(false)
  }

  /* ===================== Weather helpers ===================== */

  const TZ = "Asia/Manila"

  const vals = (group: any, idx: number): number[] => {
    try {
      const v = group?.variables?.(idx)
      const a = v?.valuesArray?.()
      return a ? Array.from(a) : []
    } catch {
      return []
    }
  }

  const getLocalParts = (d: Date) => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    })
    const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]))
    return {
      y: Number(parts.year),
      m: Number(parts.month),
      d: Number(parts.day),
      h: Number(parts.hour),
    }
  }

  const labelHour = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hour12: true }).format(d).toUpperCase()

  const VALID_ICON = (name: string): keyof typeof Ionicons.glyphMap => {
    const fallbackMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      thunderstorm: "rainy",
      snow: "cloudy",
      moon: "partly-sunny",
    }
    return (Ionicons.glyphMap as any)[name] ? (name as any) : (fallbackMap[name] ?? "cloudy")
  }

  const wmoToCondition = (code?: number, isDay = 1): string => {
    if (code == null) return "—"
    if (code === 0) return isDay ? "Sunny" : "Clear"
    if (code === 1) return "Mostly Sunny"
    if (code === 2) return "Partly Cloudy"
    if (code === 3) return "Cloudy"
    if (code === 45 || code === 48) return "Foggy"
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle"
    if ([61, 63, 65].includes(code)) return "Rain"
    if ([66, 67].includes(code)) return "Freezing Rain"
    if ([71, 73, 75, 77].includes(code)) return "Snow"
    if ([80, 81, 82].includes(code)) return "Showers"
    if ([85, 86].includes(code)) return "Snow Showers"
    if ([95, 96, 99].includes(code)) return "Thunderstorm"
    return "—"
  }

  const iconFor = (
    pop?: number,
    prcp?: number,
    rh?: number,
    isDay?: number,
    weatherCode?: number,
    tempC?: number,
    apparentC?: number,
  ): keyof typeof Ionicons.glyphMap => {
    if (typeof weatherCode === "number") {
      if ([95, 96, 99].includes(weatherCode)) return VALID_ICON("thunderstorm")
      if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return VALID_ICON("snow")
      if ([80, 81, 82].includes(weatherCode)) return "rainy"
      if ([51, 53, 55, 56, 57].includes(weatherCode)) return "rainy"
      if ([61, 63, 65, 66, 67].includes(weatherCode)) return "rainy"
      if ([45, 48].includes(weatherCode)) return "cloudy"
      if ([3].includes(weatherCode)) return "cloudy"
      if ([1, 2].includes(weatherCode)) return isDay ? "partly-sunny" : "cloudy"
      if (weatherCode === 0) return isDay ? "sunny" : VALID_ICON("moon")
    }
    if ((prcp ?? 0) > 0 || (pop ?? 0) >= 60) return "rainy"
    if ((pop ?? 0) >= 40) return "cloudy"
    if ((rh ?? 0) >= 80) return "cloudy"
    return isDay ? "sunny" : "partly-sunny"
  }

  const USE_API_APPARENT = true

  const computeHeatIndex = (tC: number, rh: number): number => {
    const tF = (tC * 9) / 5 + 32
    const HI =
      -42.379 +
      2.04901523 * tF +
      10.14333127 * rh -
      0.22475541 * tF * rh -
      0.00683783 * tF * tF -
      0.05481717 * rh * rh +
      0.00122874 * tF * tF * rh +
      0.00085282 * tF * rh * rh -
      0.00000199 * tF * tF * rh * rh
    const adj =
      rh < 13 && tF >= 80 && tF <= 112
        ? ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tF - 95)) / 17)
        : rh > 85 && tF >= 80 && tF <= 87
          ? ((rh - 85) / 10) * ((87 - tF) / 5)
          : 0
    const hiF = HI - adj
    return ((hiF - 32) * 5) / 9
  }

  const computeFeelsLike = (tC: number, rh: number, wind?: number): number => {
    if (tC >= 27 && rh >= 40) return computeHeatIndex(tC, rh)
    return tC
  }

  /* ===================== Weather Fetch (FIXED) ===================== */

  const fetchWeatherData = async () => {
    if (!selectedLocation) {
      console.warn("No location selected for weather fetch")
      return
    }

    try {
      const LAT = selectedLocation.lat
      const LON = selectedLocation.lon

      if (!LAT || !LON || isNaN(LAT) || isNaN(LON)) {
        throw new Error(`Invalid coordinates: lat=${LAT}, lon=${LON}`)
      }

      const forecastUrl = "https://api.open-meteo.com/v1/forecast"
      const forecastParams = {
        latitude: LAT,
        longitude: LON,
        timezone: TZ,
        past_days: 1,
        forecast_days: 7,
        cell_selection: "nearest" as any,
        models: "icon_seamless,gfs_seamless" as any,
        current: ["temperature_2m", "precipitation", "weather_code", "apparent_temperature"],
        hourly: [
          "temperature_2m",
          "relative_humidity_2m",
          "precipitation_probability",
          "precipitation",
          "is_day",
          "apparent_temperature",
          "weather_code",
          "cloud_cover",
          "wind_speed_10m",
        ],
        daily: [
          "temperature_2m_max",
          "temperature_2m_min",
          "precipitation_sum",
          "weather_code",
          "precipitation_probability_max",
        ],
      } as const

      const todayDate = new Date()
      const sevenDaysAgo = new Date(todayDate)
      sevenDaysAgo.setDate(todayDate.getDate() - 7)

      const startDateStr = sevenDaysAgo.toISOString().split("T")[0]
      const endDateStr = todayDate.toISOString().split("T")[0]

      const archiveUrl = "https://archive-api.open-meteo.com/v1/archive"
      const archiveParams = new URLSearchParams({
        latitude: LAT.toString(),
        longitude: LON.toString(),
        start_date: startDateStr,
        end_date: endDateStr,
        daily: "temperature_2m_max,temperature_2m_min,temperature_2m_mean",
        timezone: TZ,
      })

      const [forecastResponse, archiveResponse] = await Promise.all([
        fetchWeatherApi(forecastUrl, forecastParams),
        fetch(`${archiveUrl}?${archiveParams.toString()}`),
      ])

      if (!forecastResponse?.length) throw new Error("No forecast responses")
      const response = forecastResponse[0]

      let currentTemp: number | null = null
      let currentFeels: number | null = null
      let currentWeatherCode: number | null = null

      const current = response.current?.()
      if (current) {
        const tempVar = current.variables?.(0)
        const weatherCodeVar = current.variables?.(2)
        const apparentVar = current.variables?.(3)

        if (tempVar) {
          const temp = tempVar.value?.()
          if (typeof temp === "number" && !isNaN(temp)) {
            currentTemp = Math.round(temp)
          }
        }
        if (apparentVar) {
          const av = apparentVar.value?.()
          if (typeof av === "number" && !isNaN(av)) currentFeels = av
        }
        if (weatherCodeVar) {
          const code = weatherCodeVar.value?.()
          if (typeof code === "number") currentWeatherCode = code
        }
      }

      const archiveData = await archiveResponse.json()
      let todayMax = 30
      let todayMin = 20

      if (archiveData.daily && archiveData.daily.time) {
        const todayStr = todayDate.toISOString().split("T")[0]
        const todayIndex = archiveData.daily.time.findIndex((d: string) => d === todayStr)

        if (todayIndex >= 0) {
          todayMax = Math.round(archiveData.daily.temperature_2m_max[todayIndex] || 30)
          todayMin = Math.round(archiveData.daily.temperature_2m_min[todayIndex] || 20)
        } else {
          const yesterdayIndex = archiveData.daily.time.length - 1
          todayMax = Math.round(archiveData.daily.temperature_2m_max[yesterdayIndex] || 30)
          todayMin = Math.round(archiveData.daily.temperature_2m_min[yesterdayIndex] || 20)
        }
      }

      console.log(`🌡️ Dashboard Weather (Accurate):`, {
        current: currentTemp,
        high: todayMax,
        low: todayMin,
        source: "Archive API (Historical)",
      })

      const hourly = response.hourly?.()
      if (!hourly) throw new Error("Hourly block missing")

      const hStart = Number(hourly.time?.())
      const hEnd = Number(hourly.timeEnd?.())
      const hStep = Number(hourly.interval?.())
      const hLen = Math.max(0, Math.floor((hEnd - hStart) / hStep))

      const hours = Array.from({ length: hLen }, (_, i) => new Date((hStart + i * hStep) * 1000))
      const tempArr = vals(hourly, 0)
      const rhArr = vals(hourly, 1)
      const popArr = vals(hourly, 2)
      const precipitationArr = vals(hourly, 3)
      const dayArr = vals(hourly, 4)
      const apparentArr = vals(hourly, 5)
      const weatherCodeArr = vals(hourly, 6)

      const todayParts = getLocalParts(new Date())
      const todayIndexes: number[] = []
      for (let i = 0; i < hours.length; i++) {
        const { y, m, d, h } = getLocalParts(hours[i])
        if (y === todayParts.y && m === todayParts.m && d === todayParts.d && h >= 0 && h <= 23) {
          todayIndexes.push(i)
        }
      }

      const nowParts = getLocalParts(new Date())
      const currentHourIdx = todayIndexes.find((i) => getLocalParts(hours[i]).h === nowParts.h) ?? todayIndexes[0] ?? 0

      const startPos = Math.max(0, todayIndexes.indexOf(currentHourIdx))
      const remainingIndexes = todayIndexes.slice(startPos)

      if (currentTemp === null) {
        currentTemp = Math.round(tempArr[currentHourIdx] ?? tempArr[0] ?? 30)
      }

      if (currentFeels == null) {
        const rhNow = rhArr[currentHourIdx] ?? 60
        const appNow = apparentArr[currentHourIdx]
        currentFeels = USE_API_APPARENT && Number.isFinite(appNow) ? appNow : computeFeelsLike(currentTemp, rhNow)
      }

      const isDayNow = dayArr[currentHourIdx] ?? 1
      const codeNow = currentWeatherCode ?? weatherCodeArr[currentHourIdx]
      const conditionText = wmoToCondition(codeNow, isDayNow)

      const hourlyWeather = remainingIndexes.map((i) => {
        const t = tempArr[i] ?? 30
        const rh = rhArr[i] ?? 60
        const pop = popArr[i]
        const precipitation = precipitationArr[i]
        const isDay = dayArr[i]
        const wCode = weatherCodeArr[i]
        const app = Number.isFinite(apparentArr[i]) ? apparentArr[i] : undefined

        const icon = iconFor(pop, precipitation, rh, isDay, wCode, t, app)
        return {
          time: labelHour(hours[i]),
          temp: String(Math.round(t)),
          icon,
          isNow: i === currentHourIdx,
        }
      })

      const daily = response.daily?.()
      if (!daily) {
        console.warn("Daily block missing - using fallback weekly weather")
        setWeather({
          city: selectedLocation.city,
          temperature: `${Math.round(currentTemp)}°C`,
          condition: conditionText ?? "—",
          highLow: `H:${todayMax}° L:${todayMin}°`,
          hourlyWeather,
          source: "LIVE",
          updatedAt: new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(
            new Date(),
          ),
        })

        setWeeklyWeather(
          ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => ({
            day: d,
            status: "Sunny",
            temp: "30°C",
            humidity: "60%",
            color: "#8BC34A",
          })),
        )
        return
      }

      const dStart = Number(daily.time?.())
      const dEnd = Number(daily.timeEnd?.())
      const dStep = Number(daily.interval?.())
      const dLen = Math.max(0, Math.floor((dEnd - dStart) / dStep))
      const days = Array.from({ length: dLen }, (_, i) => new Date((dStart + i * dStep) * 1000))
      const tMaxArr = vals(daily, 0)
      const tMinArr = vals(daily, 1)
      const dPsum = vals(daily, 2)
      const dCodes = vals(daily, 3)
      const dPopMax = vals(daily, 4)

      const colorFor = (tMax: number, pSum: number, rhAvg: number, code?: number, pop?: number) => {
        if (pSum > 15 || (pop ?? 0) > 80 || (code && [80, 81, 82, 95, 96, 99].includes(code))) return "#F44336"
        if (pSum > 5 || tMax > 35 || rhAvg > 75 || (pop ?? 0) > 60) return "#FFC107"
        if (tMax >= 27 && tMax <= 32 && rhAvg <= 65) return "#4CAF50"
        return "#8BC34A"
      }

      const avg = (a: number[]) => (a.length ? a.reduce((x: number, y: number) => x + y, 0) / a.length : 0)
      const week: DayWeatherData[] = []

      for (let i = 0; i < Math.min(7, days.length); i++) {
        const date = days[i]
        const maxT = Math.round(tMaxArr[i] ?? 30)
        const pSum = dPsum[i] ?? 0
        const code = dCodes[i]
        const popMax = dPopMax[i]
        const rhStart = i * 24
        const rhSlice = rhArr.slice(rhStart, rhStart + 24)
        const rhAvg = rhSlice.length ? Math.round(avg(rhSlice)) : 60

        let status: string
        if (code && [80, 81, 82, 95, 96, 99].includes(code)) status = "Heavy Rain"
        else if (pSum > 10 || (popMax ?? 0) > 70) status = "Rainy"
        else if (maxT > 33 && rhAvg < 60) status = "Hot"
        else if (maxT >= 27 && maxT <= 32 && rhAvg <= 65) status = "Fair"
        else status = "Cloudy"

        const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TZ }).format(date)
        week.push({
          day: dayLabel,
          status,
          temp: `${maxT}°C`,
          humidity: `${rhAvg}%`,
          color: colorFor(maxT, pSum, rhAvg, code, popMax),
        })
      }

      setWeather({
        city: selectedLocation.city,
        temperature: `${Math.round(currentTemp)}°C`,
        condition: conditionText ?? "—",
        highLow: `H:${todayMax}° L:${todayMin}°`,
        hourlyWeather,
        source: "LIVE",
        updatedAt: new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(
          new Date(),
        ),
      })

      setWeeklyWeather(
        week.length > 0
          ? week
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => ({
              day: d,
              status: "Sunny",
              temp: "30°C",
              humidity: "60%",
              color: "#8BC34A",
            })),
      )
    } catch (err) {
      console.error("Weather error:", err)

      setWeather({
        city: selectedLocation?.city || "Unknown Location",
        temperature: "—°C",
        condition: "Unable to fetch",
        highLow: "—",
        hourlyWeather: [],
        source: "FALLBACK",
        updatedAt: new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(
          new Date(),
        ),
      })

      setWeeklyWeather(
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => ({
          day: d,
          status: "—",
          temp: "—",
          humidity: "—",
          color: "#9E9E9E",
        })),
      )
    }
  }

  const fetchCurrentOnly = async () => {
    if (!selectedLocation) return
    try {
      const url = "https://api.open-meteo.com/v1/forecast"
      const params = {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lon,
        timezone: TZ,
        cell_selection: "nearest" as any,
        models: "icon_seamless,gfs_seamless" as any,
        current: ["temperature_2m", "precipitation", "weather_code", "apparent_temperature"],
      } as const
      const responses = await fetchWeatherApi(url, params)
      if (!responses?.length) return
      const response = responses[0]
      const current = response.current?.()
      if (!current) return

      const tempVar = current.variables?.(0)
      const weatherCodeVar = current.variables?.(2)
      const apparentVar = current.variables?.(3)

      let temp: number | null = null
      let wCode: number | null = null
      let feels: number | null = null

      const t = tempVar?.value?.()
      if (typeof t === "number" && !isNaN(t)) temp = Math.round(t)

      const c = weatherCodeVar?.value?.()
      if (typeof c === "number") wCode = c

      const a = apparentVar?.value?.()
      if (typeof a === "number") feels = a

      setWeather((prev) => {
        const nowHour = new Date().getHours()
        const nowIsDay = nowHour >= 6 && nowHour < 18 ? 1 : 0

        const condition = typeof wCode === "number" ? wmoToCondition(wCode, nowIsDay) : prev.condition
        const temperature = temp != null ? `${temp}°C` : prev.temperature

        return {
          ...prev,
          condition,
          temperature,
          updatedAt: new Intl.DateTimeFormat("en-PH", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            timeZone: TZ,
          }).format(new Date()),
          source: "LIVE",
        }
      })
    } catch (e) {
      // silent fail for lightweight updates
    }
  }

  /* ===================== Effects ===================== */

  useEffect(() => {
    const loadLocationsFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from("denormalized_locations")
          .select("*")
          .order("reg_desc", { ascending: true })
          .order("province_desc", { ascending: true })
          .order("city_desc", { ascending: true })

        if (error) {
          console.error("DB location error:", error)
          return
        }

        if (data && data.length > 0) {
          const dbLocations: PhLocation[] = data.map((row: any) => {
            const region = row.reg_desc || "Unknown"
            const province = row.province_desc || "Unknown"
            const city = row.city_desc || "Unknown"
            const lat = Number(row.lat)
            const lon = Number(row.lon)

            const validLat = !isNaN(lat) && lat >= -90 && lat <= 90 ? lat : null
            const validLon = !isNaN(lon) && lon >= -180 && lon <= 180 ? lon : null

            if (!validLat || !validLon) {
              console.warn(`Invalid coordinates for ${city}, ${province}, ${region}: lat=${lat}, lon=${lon}`)
            }

            return {
              region,
              province,
              city,
              lat: validLat || 0,
              lon: validLon || 0,
            }
          })

          const validLocations = dbLocations.filter((loc) => loc.lat !== 0 && loc.lon !== 0)

          if (validLocations.length === 0) {
            console.error("No valid locations found in database")
            return
          }

          setLocations(validLocations)

          if (!selectedLocation && validLocations.length > 0) {
            const olongapoLocation = validLocations.find(
              (loc) => loc.city.toLowerCase().includes("olongapo") && loc.province.toLowerCase().includes("zambales"),
            )

            const defaultLocation = olongapoLocation || validLocations[0]
            console.log("Setting default location to:", defaultLocation)
            setSelectedLocation(defaultLocation)
            setSelectedRegion(defaultLocation.region)
            setSelectedProvince(defaultLocation.province)
            setActiveRegion(defaultLocation.region)
            setActiveProvince(defaultLocation.province)

            setWeather((prev) => ({
              ...prev,
              city: defaultLocation.city,
            }))
          }
        }
      } catch (err) {
        console.error("Failed to load locations:", err)
      }
    }

    const init = async () => {
      await loadLocationsFromDb()

      try {
        const ok = await getCurrentUser()
        if (!ok) await getLastLoggedInUser()
      } catch {
        await getLastLoggedInUser()
      }

      if (selectedLocation) {
        setIsFullFetching(true)
        await fetchWeatherData()
        setIsFullFetching(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      console.log("Selected location changed to:", selectedLocation)
      setWeather((prev) => ({
        ...prev,
        city: selectedLocation.city,
      }))

      const fetchNewWeather = async () => {
        setIsFullFetching(true)
        await fetchWeatherData()
        setIsFullFetching(false)
      }

      fetchNewWeather()
    }
  }, [selectedLocation])

  useEffect(() => {
    if (!selectedLocation) return

    const weatherInterval = setInterval(
      async () => {
        setIsFullFetching(true)
        await fetchWeatherData()
        setIsFullFetching(false)
      },
      10 * 60 * 1000,
    )

    const now = new Date()
    const msToNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds()
    const hourTimeout = setTimeout(async () => {
      setIsFullFetching(true)
      await fetchWeatherData()
      setIsFullFetching(false)
    }, msToNextHour)

    return () => {
      clearInterval(weatherInterval)
      clearTimeout(hourTimeout)
    }
  }, [selectedLocation])

  useEffect(() => {
    const fast = setInterval(
      () => {
        if (!isFullFetching) fetchCurrentOnly()
      },
      2 * 60 * 1000,
    )
    return () => clearInterval(fast)
  }, [selectedLocation, isFullFetching])

  const timeGreetingPH = () => {
    const hour = new Date().getHours()
    if (hour < 11) return "Magandang Umaga"
    if (hour < 15) return "Magandang Tanghali"
    if (hour < 18) return "Magandang Hapon"
    return "Magandang Gabi"
  }

  const getCropStatus = () => {
    if (!cropParameters || !sensorData || !selectedCrop) {
      return { status: "NO CROP", color: "#9E9E9E" }
    }

    const getSensorStatus = (value: number, min: number, max: number) => {
      if (value >= min && value <= max) {
        return { status: "Good", color: "#4CAF50" }
      } else if (value < min * 0.8 || value > max * 1.2) {
        return { status: "Bad", color: "#F44336" }
      } else {
        return { status: "Warning", color: "#FFC107" }
      }
    }

    const statuses = [
      getSensorStatus(sensorData.temperature, cropParameters.temperature_min, cropParameters.temperature_max),
      getSensorStatus(sensorData.ph, cropParameters.ph_level_min, cropParameters.ph_level_max),
      getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max),
      getSensorStatus(sensorData.nitrogen, cropParameters.nitrogen_min, cropParameters.nitrogen_max),
      getSensorStatus(sensorData.potassium, cropParameters.potassium_min, cropParameters.potassium_max),
      getSensorStatus(sensorData.phosphorus, cropParameters.phosphorus_min, cropParameters.phosphorus_max),
    ]

    const badCount = statuses.filter((s) => s.status === "Bad").length
    const warningCount = statuses.filter((s) => s.status === "Warning").length

    if (badCount > 0) {
      return { status: "BAD", color: "#F44336" }
    } else if (warningCount > 1) {
      return { status: "WARNING", color: "#FFC107" }
    } else if (warningCount === 1) {
      return { status: "FAIR", color: "#FF9800" }
    } else {
      return { status: "GOOD", color: "#4CAF50" }
    }
  }

  /* ===================== Render ===================== */
  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primaryGreen, COLORS.darkGreen]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{timeGreetingPH()}</Text>
              <Text style={styles.username}>
                {currentUser?.username ||
                  (user && "username" in user ? user.username : user?.email?.split("@")[0]) ||
                  "User"}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
                <Ionicons name="log-out-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      <Modal visible={showLocationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={COLORS.primaryGreen} />
              </TouchableOpacity>
            </View>

            <Text style={styles.selectorLabel}>Region</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
              {regions.map((region) => (
                <TouchableOpacity
                  key={region}
                  onPress={() => {
                    setActiveRegion(region)
                    setActiveProvince("")
                  }}
                  style={[styles.chip, activeRegion === region && styles.chipActive]}
                >
                  <Text style={[styles.chipText, activeRegion === region && styles.chipTextActive]}>{region}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {activeRegion && (
              <>
                <Text style={[styles.selectorLabel, { marginTop: 16 }]}>Province</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                  {locations
                    .filter((l) => l.region === activeRegion)
                    .map((l) => l.province)
                    .filter((province, index, arr) => arr.indexOf(province) === index)
                    .map((province) => (
                      <TouchableOpacity
                        key={province}
                        onPress={() => setActiveProvince(province)}
                        style={[styles.chip, activeProvince === province && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, activeProvince === province && styles.chipTextActive]}>
                          {province}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </>
            )}

            {activeRegion && activeProvince && (
              <>
                <Text style={[styles.selectorLabel, { marginTop: 16 }]}>City / Municipality</Text>
                <ScrollView style={styles.locationList}>
                  {locations
                    .filter((l) => l.region === activeRegion && l.province === activeProvince)
                    .map((loc) => (
                      <TouchableOpacity
                        key={loc.city}
                        style={styles.locationItem}
                        onPress={() => handleLocationSelect(loc)}
                      >
                        <Ionicons
                          name={selectedLocation?.city === loc.city ? "radio-button-on" : "radio-button-off"}
                          size={20}
                          color={COLORS.primaryGreen}
                        />
                        <View style={styles.locationItemContent}>
                          <Text style={styles.locationItemText}>{loc.city}</Text>
                          <Text style={styles.locationItemCoords}>
                            {loc.lat.toFixed(3)}, {loc.lon.toFixed(3)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[COLORS.mutedGreen, COLORS.pastelGreen, COLORS.mutedGreen]} style={styles.weatherCard}>
            <View style={styles.weatherHeader}>
              <View style={styles.weatherLocation}>
                <Ionicons name="location" size={20} color={COLORS.lightGreen} />
                <Text style={styles.weatherCity}>{weather.city}</Text>
              </View>
              <TouchableOpacity style={styles.changeLocationButton} onPress={() => setShowInlinePicker((s) => !s)}>
                <Text style={styles.changeLocationText}>Change</Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.primaryGreen} />
              </TouchableOpacity>
            </View>

            {showInlinePicker && (
              <View style={styles.inlinePicker}>
                <Text style={styles.inlinePickerLabel}>Region</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inlineChipContainer}>
                  {regions.map((region) => (
                    <TouchableOpacity
                      key={region}
                      onPress={() => {
                        setSelectedRegion(region)
                        setSelectedProvince("")
                      }}
                      style={[styles.inlineChip, selectedRegion === region && styles.inlineChipActive]}
                    >
                      <Text style={[styles.inlineChipText, selectedRegion === region && styles.inlineChipTextActive]}>
                        {region}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {selectedRegion && (
                  <>
                    <Text style={[styles.inlinePickerLabel, { marginTop: 12 }]}>Province</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inlineChipContainer}>
                      {locations
                        .filter((l) => l.region === selectedRegion)
                        .map((l) => l.province)
                        .filter((province, index, arr) => arr.indexOf(province) === index)
                        .map((province) => (
                          <TouchableOpacity
                            key={province}
                            onPress={() => setSelectedProvince(province)}
                            style={[styles.inlineChip, selectedProvince === province && styles.inlineChipActive]}
                          >
                            <Text
                              style={[
                                styles.inlineChipText,
                                selectedProvince === province && styles.inlineChipTextActive,
                              ]}
                            >
                              {province}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </>
                )}

                {selectedRegion && selectedProvince && (
                  <>
                    <Text style={[styles.inlinePickerLabel, { marginTop: 12 }]}>City / Municipality</Text>
                    <View style={styles.inlineCityList}>
                      <ScrollView style={{ maxHeight: 150 }}>
                        {locations
                          .filter((l) => l.region === selectedRegion && l.province === selectedProvince)
                          .map((loc) => (
                            <TouchableOpacity
                              key={loc.city}
                              style={styles.inlineCityItem}
                              onPress={() => handleLocationSelect(loc)}
                            >
                              <Ionicons
                                name={selectedLocation?.city === loc.city ? "radio-button-on" : "radio-button-off"}
                                size={18}
                                color={COLORS.primaryGreen}
                              />
                              <Text style={styles.inlineCityText}>{loc.city}</Text>
                            </TouchableOpacity>
                          ))}
                      </ScrollView>
                    </View>
                  </>
                )}
              </View>
            )}

            <View style={styles.weatherMain}>
              <View style={styles.weatherLeft}>
                <Text style={styles.temperature}>{weather.temperature}</Text>
                <Text style={styles.condition}>{weather.condition}</Text>
                <Text style={styles.highLow}>{weather.highLow}</Text>
              </View>
              <View style={styles.weatherRight}>
                <Ionicons name="partly-sunny" size={80} color={COLORS.primaryGreen} />
              </View>
            </View>

            <View style={styles.weatherMeta}>
              <View style={styles.weatherMetaItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.primaryBrown} />
                <Text style={styles.weatherMetaText}>{nowClock}</Text>
              </View>
              <View style={styles.weatherMetaItem}>
                <Ionicons name="refresh-outline" size={16} color={COLORS.primaryBrown} />
                <Text style={styles.weatherMetaText}>Updated: {weather.updatedAt}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyForecast}>
              {weather.hourlyWeather.map((item, index) => {
                const isActive = item.isNow || index === 0
                return (
                  <View key={index} style={[styles.hourlyItem, isActive && styles.hourlyItemActive]}>
                    <Text style={[styles.hourlyTime, isActive && styles.hourlyTimeActive]}>
                      {isActive ? "NOW" : item.time}
                    </Text>
                    <Ionicons name={item.icon} size={24} color={isActive ? COLORS.primaryGreen : COLORS.primaryBrown} />
                    <Text style={[styles.hourlyTemp, isActive && styles.hourlyTempActive]}>{item.temp}°</Text>
                  </View>
                )
              })}
            </ScrollView>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Crops</Text>
        </View>

        <View style={styles.cropRow}>
          <StatusCard
            status={getCropStatus().status}
            color={getCropStatus().color}
            cropName={selectedCrop?.crop_name}
          />
          <DiagnosisCard />
        </View>

        <TouchableOpacity style={styles.chatbotCard} onPress={() => router.push("/analysis")}>
          <View style={styles.chatbotIconWrapper}>
            <LinearGradient colors={[COLORS.primaryGreen, COLORS.darkGreen]} style={styles.chatbotIconGradient}>
              <Ionicons name="stats-chart" size={28} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.chatbotContent}>
            <Text style={styles.chatbotTitle}>Analysis</Text>
            <Text style={styles.chatbotSubtitle}>View detailed crop and weather analytics</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.primaryBrown} />
        </TouchableOpacity>

        <WeatherHistory weeklyWeather={weeklyWeather} />

        <View style={{ height: 100 }} />
      </ScrollView>

      <DraggableAIButton onPress={() => router.push("/chatbot")} />

      <FooterNavigation />
    </View>
  )
}
