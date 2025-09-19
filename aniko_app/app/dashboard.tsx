import supabase from "./CONFIG/supaBase";
import React, { useState, useEffect } from "react";

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { fetchWeatherApi } from "openmeteo";

/* ===================== Types ===================== */
interface User {
  id: string;
  username: string;
  email?: string;
  last_login?: string;
  created_at?: string;
}
interface AuthUser {
  id: string;
  email?: string;
  username?: string;
}
interface WeatherData {
  city: string;
  temperature: string;
  condition: string;
  highLow: string;
  hourlyWeather: Array<{
    time: string;
    temp: string;
    icon: keyof typeof Ionicons.glyphMap;
    isNow?: boolean;
  }>;
  source?: "LIVE" | "FALLBACK";
  updatedAt?: string;
}
interface DayWeatherData {
  day: string;
  status: string;
  temp: string;
  humidity: string;
  color: string;
}

// NEW: DB location type
type DbLocation = {
  location_id: number;
  region_id: number;
  reg_desc: string;
  province_id: number;
  province_desc: string;
  city_id: number;
  city_desc: string;
  lat?: number;
  lon?: number;
};

/* ===================== Component ===================== */
export default function Dashboard() {
  const [user, setUser] = useState<User | AuthUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fix the initial weather state - don't hardcode the city
  const [weather, setWeather] = useState<WeatherData>({
    city: "Loading...", // Changed from "Olongapo"
    temperature: "—",
    condition: "Loading…",
    highLow: "—",
    hourlyWeather: [],
    source: "FALLBACK",
    updatedAt: "",
  });
  const [weeklyWeather, setWeeklyWeather] = useState<DayWeatherData[]>([]);

  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayWeatherData | null>(null);

  // Location selection state
  interface PhLocation { province: string; city: string; lat: number; lon: number; }
  
  // Replace static array with dynamic state
  const [locations, setLocations] = useState<PhLocation[]>([]);
  
  const [selectedLocation, setSelectedLocation] = useState<PhLocation | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showInlinePicker, setShowInlinePicker] = useState(false);
  
  // Derive provinces from dynamic locations
  const provinces = Array.from(new Set(locations.map(l => l.province)));
  const [activeProvince, setActiveProvince] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");

  const router = useRouter();
  const [nowClock, setNowClock] = useState<string>(new Date().toLocaleTimeString('en-PH',{ hour: '2-digit', minute: '2-digit', second:'2-digit'}));
  const [isFullFetching, setIsFullFetching] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => {
      setNowClock(new Date().toLocaleTimeString('en-PH',{ hour: '2-digit', minute:'2-digit', second:'2-digit'}));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  /* ===================== Supabase helpers ===================== */
  const getLastLoggedInUser = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("last_login", { ascending: false })
        .limit(1);

      if (!error && data?.length > 0) setCurrentUser(data[0]);
    } catch (error) {
      console.error("Error getting last logged user:", error);
    }
  };

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) return false;

      if (user) {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!error) setUser(data);
        else setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error getting current user:", error);
      return false;
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (!error) router.replace("/");
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  /* ===================== Location helpers ===================== */
  const handleLocationSelect = async (location: PhLocation) => {
    setSelectedLocation(location);
    setShowLocationModal(false);
    setShowInlinePicker(false);
    
    // Update weather data for the new location
    setIsFullFetching(true);
    await fetchWeatherData();
    setIsFullFetching(false);
  };

  /* ===================== Weather helpers ===================== */
  const TZ = "Asia/Manila";

  // Safe extractor for Open-Meteo variables (guards against missing variables)
  const vals = (group: any, idx: number): number[] => {
    try {
      const v = group?.variables?.(idx);
      const a = v?.valuesArray?.();
      return a ? Array.from(a) : [];
    } catch {
      return [];
    }
  };

  const getLocalParts = (d: Date) => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    });
    const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
    return {
      y: Number(parts.year),
      m: Number(parts.month),
      d: Number(parts.day),
      h: Number(parts.hour), // 0..23
    };
  };

  const labelHour = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hour12: true })
      .format(d)
      .toUpperCase();

  const VALID_ICON = (name: string): keyof typeof Ionicons.glyphMap => {
    const fallbackMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      thunderstorm: "rainy",
      snow: "cloudy",
      moon: "partly-sunny"
    };
    return (Ionicons.glyphMap as any)[name] ? (name as any) : (fallbackMap[name] ?? "cloudy");
  };

  const wmoToCondition = (code?: number, isDay: number = 1): string => {
    if (code == null) return "—";
    if (code === 0) return isDay ? "Sunny" : "Clear";
    if (code === 1) return "Mostly Sunny";
    if (code === 2) return "Partly Cloudy";
    if (code === 3) return "Cloudy";
    if (code === 45 || code === 48) return "Foggy";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65].includes(code)) return "Rain";
    if ([66, 67].includes(code)) return "Freezing Rain";
    if ([71, 73, 75, 77].includes(code)) return "Snow";
    if ([80, 81, 82].includes(code)) return "Showers";
    if ([85, 86].includes(code)) return "Snow Showers";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "—";
  };

  const iconFor = (
    pop?: number,
    prcp?: number,
    rh?: number,
    isDay?: number,
    weatherCode?: number,
    tempC?: number,
    apparentC?: number
  ): keyof typeof Ionicons.glyphMap => {
    // Prefer WMO code mapping for icons
    if (typeof weatherCode === "number") {
      if ([95, 96, 99].includes(weatherCode)) return VALID_ICON("thunderstorm");
      if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return VALID_ICON("snow");
      if ([80, 81, 82].includes(weatherCode)) return "rainy";
      if ([51, 53, 55, 56, 57].includes(weatherCode)) return "rainy";
      if ([61, 63, 65, 66, 67].includes(weatherCode)) return "rainy";
      if ([45, 48].includes(weatherCode)) return "cloudy";
      if ([3].includes(weatherCode)) return "cloudy";
      if ([1, 2].includes(weatherCode)) return isDay ? "partly-sunny" : "cloudy";
      if (weatherCode === 0) return isDay ? "sunny" : VALID_ICON("moon");
    }
    if ((prcp ?? 0) > 0 || (pop ?? 0) >= 60) return "rainy";
    if ((pop ?? 0) >= 40) return "cloudy";
    if ((rh ?? 0) >= 80) return "cloudy";
    return isDay ? "sunny" : "partly-sunny";
  };

  // ================== FEELS-LIKE HELPERS ==================
  const USE_API_APPARENT = true;

  // Heat Index approximation (Steadman / NOAA style) for T >= 27C and RH >= 40%
  const computeHeatIndex = (tC: number, rh: number): number => {
    const tF = tC * 9/5 + 32;
    const HI = -42.379 + 2.04901523*tF + 10.14333127*rh - 0.22475541*tF*rh - 0.00683783*tF*tF - 0.05481717*rh*rh + 0.00122874*tF*tF*rh + 0.00085282*tF*rh*rh - 0.00000199*tF*tF*rh*rh;
    const adj = (rh < 13 && tF >= 80 && tF <= 112) ? ((13 - rh)/4)*Math.sqrt((17 - Math.abs(tF-95))/17) : (rh > 85 && tF >= 80 && tF <= 87 ? ((rh-85)/10)*((87-tF)/5) : 0);
    const hiF = HI - adj;
    return (hiF - 32) * 5/9;
  };

  const computeFeelsLike = (tC: number, rh: number, wind?: number): number => {
    if (tC >= 27 && rh >= 40) return computeHeatIndex(tC, rh);
    return tC;
  };

  /* ===================== Weather Fetch (full) ===================== */
  const fetchWeatherData = async () => {
    if (!selectedLocation) {
      console.warn('No location selected for weather fetch');
      return;
    }

    try {
      const LAT = selectedLocation.lat;
      const LON = selectedLocation.lon;

      // Validate coordinates before API call
      if (!LAT || !LON || isNaN(LAT) || isNaN(LON)) {
        throw new Error(`Invalid coordinates: lat=${LAT}, lon=${LON}`);
      }

      const params = {
        latitude: LAT,
        longitude: LON,
        timezone: TZ,
        past_days: 1,
        forecast_days: 7,
        // Boost coastal accuracy and model blend for PH
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
          "wind_speed_10m"
        ],
        daily: [
          "temperature_2m_max",
          "temperature_2m_min",
          "precipitation_sum",
          "weather_code",
          "precipitation_probability_max"
        ],
      } as const;

      const url = "https://api.open-meteo.com/v1/forecast";
      const responses = await fetchWeatherApi(url, params);
      if (!responses?.length) throw new Error("No weather responses");
      const response = responses[0];

      // Prefer real-time current block
      let currentTemp: number | null = null;
      let currentFeels: number | null = null;
      let currentWeatherCode: number | null = null;
      let useRealTime = false;

      try {
        const current = response.current?.();
        if (current) {
          const tempVar = current.variables?.(0); // temperature_2m
          const weatherCodeVar = current.variables?.(2); // weather_code
          const apparentVar = current.variables?.(3); // apparent_temperature

          if (tempVar) {
            const temp = tempVar.value?.();
            if (typeof temp === "number" && !isNaN(temp)) {
              currentTemp = Math.round(temp);
              useRealTime = true;
            }
          }
          if (apparentVar) {
            const av = apparentVar.value?.();
            if (typeof av === "number" && !isNaN(av)) currentFeels = av;
          }
          if (weatherCodeVar) {
            const code = weatherCodeVar.value?.();
            if (typeof code === "number") currentWeatherCode = code;
          }
        }
      } catch {
        // fallback to hourly
      }

      const hourly = response.hourly?.();
      if (!hourly) throw new Error("Hourly block missing");

      const hStart = Number(hourly.time?.());
      const hEnd = Number(hourly.timeEnd?.());
      const hStep = Number(hourly.interval?.());
      const hLen = Math.max(0, Math.floor((hEnd - hStart) / hStep));

      const hours = Array.from({ length: hLen }, (_, i) => new Date((hStart + i * hStep) * 1000));
      const tempArr = vals(hourly, 0);
      const rhArr = vals(hourly, 1);
      const popArr = vals(hourly, 2);
      const prcpArr = vals(hourly, 3);
      const dayArr = vals(hourly, 4);
      const apparentArr = vals(hourly, 5);
      const weatherCodeArr = vals(hourly, 6);
      const cloudArr = vals(hourly, 7);
      const windArr = vals(hourly, 8);

      // Build indexes for "today" in local time
      const today = getLocalParts(new Date());
      const todayIdxs: number[] = [];
      for (let i = 0; i < hours.length; i++) {
        const { y, m, d, h } = getLocalParts(hours[i]);
        if (y === today.y && m === today.m && d === today.d && h >= 0 && h <= 23) todayIdxs.push(i);
      }
      // Removed filler that could include next-day hours

      // Determine the current hour index based on local time
      const nowParts = getLocalParts(new Date());
      const currentHourIdx =
        todayIdxs.find((i) => getLocalParts(hours[i]).h === nowParts.h) ??
        todayIdxs[0] ?? 0;

      // Only show remaining hours today (from NOW to end of day)
      const startPos = Math.max(0, todayIdxs.indexOf(currentHourIdx));
      const remainingIdxs = todayIdxs.slice(startPos);

      // Fall back for current temp if needed
      if (currentTemp === null) {
        currentTemp = Math.round(tempArr[currentHourIdx] ?? tempArr[0] ?? 30);
      }

      // Feels-like: prefer API apparent temp at current hour or current block
      if (currentFeels == null) {
        const rhNow = rhArr[currentHourIdx] ?? 60;
        const appNow = apparentArr[currentHourIdx];
        currentFeels = (USE_API_APPARENT && Number.isFinite(appNow))
          ? appNow
          : computeFeelsLike(currentTemp, rhNow);
      }

      // Condition text via WMO code
      const isDayNow = (dayArr[currentHourIdx] ?? 1);
      const codeNow = (currentWeatherCode ?? weatherCodeArr[currentHourIdx]);
      const conditionText = wmoToCondition(codeNow, isDayNow);

      // Hourly list (remaining hours only) + flag the current hour
      const hourlyWeather = remainingIdxs.map((i) => {
        const t = tempArr[i] ?? 30;
        const rh = rhArr[i] ?? 60;
        const pop = popArr[i];
        const prcp = prcpArr[i];
        const isDay = dayArr[i];
        const wCode = weatherCodeArr[i];
        const app = Number.isFinite(apparentArr[i]) ? apparentArr[i] : undefined;

        const icon = iconFor(pop, prcp, rh, isDay, wCode, t, app);
        return {
          time: labelHour(hours[i]),
          temp: String(Math.round(t)),
          icon,
          isNow: i === currentHourIdx,
        };
      });

      // Daily aggregates
      const daily = response.daily?.();
      if (!daily) throw new Error("Daily block missing");

      const dStart = Number(daily.time?.());
      const dEnd = Number(daily.timeEnd?.());
      const dStep = Number(daily.interval?.());
      const dLen = Math.max(0, Math.floor((dEnd - dStart) / dStep));
      const days = Array.from({ length: dLen }, (_, i) => new Date((dStart + i * dStep) * 1000));
      const tMaxArr = vals(daily, 0);
      const tMinArr = vals(daily, 1);
      const dPsum = vals(daily, 2);
      const dCodes = vals(daily, 3);
      const dPopMax = vals(daily, 4);

      const sameLocalDay = (a: Date, b: Date) => {
        const A = getLocalParts(a);
        const B = getLocalParts(b);
        return A.y === B.y && A.m === B.m && A.d === B.d;
      };
      const todayDailyIdx = Math.max(0, days.findIndex((d) => sameLocalDay(d, new Date())));
      const safeMax = Number.isFinite(tMaxArr[todayDailyIdx]) ? Math.round(tMaxArr[todayDailyIdx]) : Math.round(Math.max(...tempArr));
      const safeMin = Number.isFinite(tMinArr[todayDailyIdx]) ? Math.round(tMinArr[todayDailyIdx]) : Math.round(Math.min(...tempArr));

      setWeather({
        city: selectedLocation.city,
        temperature: `${Math.round(currentTemp)}°C`,
        condition: conditionText ?? "—",
        highLow: `H:${safeMax}° L:${safeMin}°`,
        hourlyWeather,
        source: useRealTime ? "LIVE" : "FALLBACK",
        updatedAt: new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date()),
      });

      // Weekly weather rating band
      const colorFor = (tMax: number, pSum: number, rhAvg: number, code?: number, pop?: number) => {
        if (pSum > 15 || (pop ?? 0) > 80 || (code && [80,81,82,95,96,99].includes(code))) return "#F44336"; // Bad
        if (pSum > 5 || tMax > 35 || rhAvg > 75 || (pop ?? 0) > 60) return "#FFC107"; // Warning
        if (tMax >= 27 && tMax <= 32 && rhAvg <= 65) return "#4CAF50"; // Very Good
        return "#8BC34A"; // Good
      };

      const avg = (a: number[]) => (a.length ? a.reduce((x: number, y: number) => x + y, 0) / a.length : 0);
      const week: DayWeatherData[] = [];
      for (let i = 0; i < Math.min(7, days.length); i++) {
        const date = days[i];
        const maxT = Math.round(tMaxArr[i] ?? 30);
        const pSum = dPsum[i] ?? 0;
        const code = dCodes[i];
        const popMax = dPopMax[i];
        const rhStart = i * 24;
        const rhSlice = rhArr.slice(rhStart, rhStart + 24);
        const rhAvg = rhSlice.length ? Math.round(avg(rhSlice)) : 60;

        let status: string;
        if (code && [80,81,82,95,96,99].includes(code)) status = "Heavy Rain";
        else if (pSum > 10 || (popMax ?? 0) > 70) status = "Rainy";
        else if (maxT > 33 && rhAvg < 60) status = "Hot";
        else if (maxT >= 27 && maxT <= 32 && rhAvg <= 65) status = "Fair";
        else status = "Cloudy";

        const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TZ }).format(date);
        week.push({
          day: dayLabel,
          status,
          temp: `${maxT}°C`,
          humidity: `${rhAvg}%`,
          color: colorFor(maxT, pSum, rhAvg, code, popMax),
        });
      }

      setWeeklyWeather(
        week.length
          ? week
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => ({
              day: d, status: "Sunny", temp: "30°C", humidity: "60%", color: "#8BC34A",
            }))
      );
    } catch (err) {
      console.error("Weather error:", err);
      
      // Fallback weather - still use selected location city name
      setWeather({
        city: selectedLocation?.city || "Unknown Location",
        temperature: "—°C",
        condition: "Unable to fetch",
        highLow: "—",
        hourlyWeather: [],
        source: "FALLBACK",
        updatedAt: new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date()),
      });
    }
  };

  // Fast current-only updater (2 minutes)
  const fetchCurrentOnly = async () => {
    if (!selectedLocation) return;
    try {
      const url = "https://api.open-meteo.com/v1/forecast";
      const params = {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lon,
        timezone: TZ,
        cell_selection: "nearest" as any,
        models: "icon_seamless,gfs_seamless" as any,
        current: ["temperature_2m", "precipitation", "weather_code", "apparent_temperature"],
      } as const;
      const responses = await fetchWeatherApi(url, params);
      if (!responses?.length) return;
      const response = responses[0];
      const current = response.current?.();
      if (!current) return;

      const tempVar = current.variables?.(0);
      const weatherCodeVar = current.variables?.(2);
      const apparentVar = current.variables?.(3);

      let temp: number | null = null;
      let wCode: number | null = null;
      let feels: number | null = null;

      const t = tempVar?.value?.();
      if (typeof t === "number" && !isNaN(t)) temp = Math.round(t);

      const c = weatherCodeVar?.value?.();
      if (typeof c === "number") wCode = c;

      const a = apparentVar?.value?.();
      if (typeof a === "number") feels = a;

      setWeather(prev => {
        const nowHour = new Date().getHours();
        const nowIsDay = nowHour >= 6 && nowHour < 18 ? 1 : 0;

        const condition = typeof wCode === "number" ? wmoToCondition(wCode, nowIsDay) : prev.condition;
        const temperature = temp != null ? `${temp}°C` : prev.temperature;

        return {
          ...prev,
          condition,
          temperature,
          updatedAt: new Intl.DateTimeFormat('en-PH',{ hour:'numeric', minute:'2-digit', second:'2-digit', timeZone: TZ}).format(new Date()),
          source: 'LIVE'
        };
      });
    } catch (e) {
      // silent fail for lightweight updates
    }
  };

  /* ===================== Effects ===================== */
  useEffect(() => {
    const loadLocationsFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from('denormalized_locations')
          .select('*')
          .order('province_desc', { ascending: true })
          .order('city_desc', { ascending: true });

        if (error) {
          console.error('DB location error:', error);
          return;
        }

        if (data && data.length > 0) {
          const dbLocations: PhLocation[] = data.map((row: any) => {
            const province = row.province_desc || 'Unknown';
            const city = row.city_desc || 'Unknown';
            const lat = Number(row.lat);
            const lon = Number(row.lon);

            // Validate coordinates - only use if they're valid numbers
            const validLat = !isNaN(lat) && lat >= -90 && lat <= 90 ? lat : null;
            const validLon = !isNaN(lon) && lon >= -180 && lon <= 180 ? lon : null;

            if (!validLat || !validLon) {
              console.warn(`Invalid coordinates for ${city}, ${province}: lat=${lat}, lon=${lon}`);
            }

            return { 
              province, 
              city, 
              lat: validLat || 0, // Will be filtered out below
              lon: validLon || 0  // Will be filtered out below
            };
          });

          // Filter out locations with invalid coordinates
          const validLocations = dbLocations.filter(loc => loc.lat !== 0 && loc.lon !== 0);

          if (validLocations.length === 0) {
            console.error('No valid locations found in database');
            return;
          }

          setLocations(validLocations);
          
          // Set initial location to first valid location from DB
          if (!selectedLocation && validLocations.length > 0) {
            const firstLocation = validLocations[0];
            setSelectedLocation(firstLocation);
            setActiveProvince(firstLocation.province);
            setSelectedProvince(firstLocation.province);
          }
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
      }
    };

    const init = async () => {
      await loadLocationsFromDb();
      
      try {
        const ok = await getCurrentUser();
        if (!ok) await getLastLoggedInUser();
      } catch {
        await getLastLoggedInUser();
      }
      
      // Only fetch weather after locations are loaded
      if (selectedLocation) {
        setIsFullFetching(true);
        await fetchWeatherData();
        setIsFullFetching(false);
      }
    };
    init();
  }, []);

  // Update the selectedLocation dependency
  useEffect(() => {
    if (!selectedLocation) return;
    
    const weatherInterval = setInterval(async () => {
      setIsFullFetching(true);
      await fetchWeatherData();
      setIsFullFetching(false);
    }, 10 * 60 * 1000);

    const now = new Date();
    const msToNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();
    const hourTimeout = setTimeout(async () => {
      setIsFullFetching(true);
      await fetchWeatherData();
      setIsFullFetching(false);
    }, msToNextHour);

    return () => {
      clearInterval(weatherInterval);
      clearTimeout(hourTimeout);
    };
  }, [selectedLocation]);

  // Fast current-only interval
  useEffect(() => {
    const fast = setInterval(() => {
      if (!isFullFetching) fetchCurrentOnly();
    }, 2 * 60 * 1000); // 2 minutes
    return () => clearInterval(fast);
  }, [selectedLocation, isFullFetching]);

  const timeGreetingPH = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Magandang Umaga";
    if (hour < 15) return "Magandang Tanghali";
    if (hour < 18) return "Magandang Hapon";
    return "Magandang Gabi";
  };

  /* ===================== Render ===================== */
  return (
    <View style={styles.container}>
      {/* Background gradient layer */}
      <LinearGradient colors={["#1c4722", "#4d7f39"]} style={styles.headerGradientLayer} />
      {/* Header content above gradient */}
      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{timeGreetingPH()},</Text>
            <Text style={styles.greeting}>
              {currentUser?.username ||
                (user && "username" in user ? user.username : user?.email?.split("@")[0]) ||
                "User"}
            </Text>
          </View>

          <View style={styles.headerIcons}>
            <Ionicons name="notifications-outline" size={22} color="white" />
            <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 12 }}>
              <Ionicons name="log-out-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="gray" />
          <TextInput placeholder="Search" style={styles.searchInput} placeholderTextColor="gray" />
        </View>
      </View>

      {/* Location Selection Modal */}
      <Modal visible={showLocationModal} transparent animationType="fade">
        <View style={styles.locationModalOverlay}>
          <View style={styles.locationModalContainer}>
            <Text style={styles.locationModalTitle}>Select Location (PH)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 48, marginBottom: 8 }}>
              {provinces.map(prov => (
                <TouchableOpacity key={prov} onPress={() => setActiveProvince(prov)} style={[styles.provinceChip, activeProvince === prov && styles.provinceChipActive]}>
                  <Text style={[styles.provinceChipText, activeProvince === prov && styles.provinceChipTextActive]}>{prov}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={styles.locationList}>
              {locations.filter(l => l.province === activeProvince).map(loc => (
                <TouchableOpacity 
                  key={loc.city} 
                  style={styles.locationItem} 
                  onPress={() => handleLocationSelect(loc)}
                >
                  <Ionicons name={selectedLocation?.city === loc.city ? 'radio-button-on' : 'radio-button-off'} size={18} color="#4d7f39" />
                  <Text style={styles.locationItemText}>{loc.city}</Text>
                  <Text style={styles.locationItemCoords}>{loc.lat.toFixed(3)}, {loc.lon.toFixed(3)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowLocationModal(false)}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.weatherCardInline}>
          <View style={styles.weatherHeaderRow}>
            <View>
              <Text style={styles.weatherCity}>{weather.city}</Text>
              <Text style={styles.weatherTemp}>{weather.temperature}</Text>
              <TouchableOpacity style={styles.changeLocationBtn} onPress={() => { setShowInlinePicker(s => !s); }}>
                <Ionicons name="location-outline" size={14} color="#fff" />
                <Text style={styles.changeLocationText}>{showInlinePicker ? 'Hide Location' : 'Change Location'}</Text>
              </TouchableOpacity>
              {showInlinePicker && (
                <View style={styles.inlinePickerBox}>
                  <Text style={styles.inlinePickerLabel}>Province</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inlineProvinceRow}>
                    {provinces.map(p => (
                      <TouchableOpacity 
                        key={p} 
                        onPress={() => { 
                          console.log('Province selected:', p);
                          setSelectedProvince(p); 
                        }} 
                        style={[styles.inlineProvinceChip, selectedProvince === p && styles.inlineProvinceChipActive]}
                      >
                        <Text style={[styles.inlineProvinceChipText, selectedProvince === p && styles.inlineProvinceChipTextActive]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={[styles.inlinePickerLabel,{marginTop:6}]}>City / Municipality</Text>
                  <View style={styles.inlineCityList}>
                    <ScrollView style={{maxHeight:140}}>
                      {locations.filter(l => l.province === selectedProvince).map(loc => (
                        <TouchableOpacity 
                          key={loc.city} 
                          style={styles.inlineCityItem} 
                          onPress={() => handleLocationSelect(loc)}
                        >
                          <Ionicons name={selectedLocation?.city === loc.city ? 'radio-button-on' : 'radio-button-off'} size={16} color="#4d7f39" />
                          <Text style={styles.inlineCityName}>{loc.city}</Text>
                          <Text style={styles.inlineCityCoords}>{loc.lat.toFixed(2)}, {loc.lon.toFixed(2)}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.weatherRightColumn}>
              <Ionicons name="partly-sunny" size={30} color="white" style={{ marginBottom: 4 }} />
              <Text style={styles.weatherCondition}>{weather.condition}</Text>
              <Text style={styles.weatherHighLow}>{weather.highLow}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Time: {nowClock}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
            {weather.hourlyWeather.map((item, index) => {
              const active = item.isNow || index === 0; // first item is current hour
              return (
                <View key={index} style={[styles.weatherHourCard, active && styles.weatherHourCardActive]}>
                  <Text style={[styles.weatherHour, active && styles.weatherHourActive]}>
                    {active ? "NOW" : item.time}
                  </Text>
                  <Ionicons name={item.icon} size={18} color={active ? "#1c4722" : "white"} />
                  <Text style={[styles.weatherHourTemp, active && styles.weatherHourTempActive]}>
                    {item.temp}°
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>My Crops</Text>

        <View style={styles.cropRow}>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={styles.statusCircleWrapper}>
              <View style={[styles.outerCircle, { borderColor: "#FFD700" }]}>
                <Text style={styles.circleText}>GOOD</Text>
              </View>
            </View>
          </View>

          {/* Plant Diagnosis Card */}
          <TouchableOpacity style={styles.diagnosisCard}>
            <Image source={require("../assets/plant-bg.png")} style={styles.diagnosisImage} />
            <View style={styles.diagnosisOverlay}>
              <Text style={styles.diagnosisTitle}>Plant Diagnosis</Text>
              <TouchableOpacity
                style={styles.tryNowButton}
                onPress={() => router.push("/plantdashboard")}
              >
                <Text style={styles.tryNowText}>Try Now</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Weather History Section */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyTitle}>Weather History: This Week</Text>
              <View style={styles.legendRow}>
                {["Very Good", "Good", "Warning", "Bad"].map((label, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: i === 0 ? "#4CAF50" : i === 1 ? "#8BC34A" : i === 2 ? "#FFC107" : "#F44336" },
                      ]}
                    />
                    <Text style={styles.legendText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Days */}
          <View style={styles.historyRow}>
            {weeklyWeather.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.historyDayWrapper}
                onPress={() => {
                  setSelectedDay(item);
                  setShowDayModal(true);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.dayBox, { backgroundColor: item.color }]}>
                  <Text style={styles.historyDayText}>{item.day}</Text>
                </View>
                {/* Removed detail texts below each day */}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Day Analysis Modal */}
      <Modal visible={showDayModal} transparent animationType="fade">
        <View style={styles.locationModalOverlay}>
          <View style={styles.locationModalContainer}>
            <Text style={styles.locationModalTitle}>
              {selectedDay ? `${selectedDay.day} — Analysis` : "Day Analysis"}
            </Text>

            {selectedDay && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={[styles.legendColor, { backgroundColor: selectedDay.color }]} />
                  <Text style={{ color: '#2e4d2f', fontWeight: '600' }}>{selectedDay.status}</Text>
                </View>

                <View style={{ paddingVertical: 6 }}>
                  <Text style={{ color: '#1c4722', marginBottom: 4 }}>Temperature (max): {selectedDay.temp}</Text>
                  <Text style={{ color: '#1c4722' }}>Humidity (avg): {selectedDay.humidity}</Text>
                </View>

                {/* Add more fields later if needed (rain chance, precipitation, min temp, etc.) */}
              </View>
            )}

            <TouchableOpacity
              style={[styles.closeModalBtn, { marginTop: 16 }]}
              onPress={() => setShowDayModal(false)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity>
          <Ionicons name="home" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/plantdashboard")}>
          <Ionicons name="leaf" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="camera" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/dashboard")}>
          <Ionicons name="cloud" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="menu" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/sensor")}>
          <Ionicons name="analytics-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ===================== Styles ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e7dbc8" },

  headerGradientLayer: { position:'absolute', left:0, right:0, top:0, height:220, zIndex:0, borderBottomLeftRadius:20, borderBottomRightRadius:20 },
  headerContent: { paddingTop:50, paddingBottom:60, paddingHorizontal:20, zIndex:1 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white"
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center"
  },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    height: 40,
  },
  searchInput: { marginLeft: 8, flex: 1, color: "black" },

  weatherCardInline: { backgroundColor: '#1c4722', borderRadius: 20, padding: 15, shadowColor:'#000', shadowOpacity:0.2, shadowRadius:8, elevation:5, marginTop:-20 },
  weatherHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  weatherCity: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  weatherTemp: { color: 'white', fontSize: 34, fontWeight: 'bold', marginTop: 2 },
  weatherRightColumn: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  weatherCondition: { color: 'white', fontSize: 14, fontWeight: '600' },
  weatherHighLow: { color: 'white', fontSize: 12, opacity: 0.85, marginTop: 2 },
  weatherHourCard: { width: 55, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', marginRight: 8 },
  weatherHour: { color: 'white', fontSize: 11, marginBottom: 4 },
  weatherHourTemp: { color: 'white', fontSize: 13, fontWeight: 'bold', marginTop: 2 },

  // Active/current hour emphasis (lighter card)
  weatherHourCardActive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#FFD54F',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  weatherHourActive: { color: '#1c4722', fontSize: 11, fontWeight: '700' },
  weatherHourTempActive: { color: '#1c4722' },
  changeLocationBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 14, marginTop: 6, alignSelf: 'flex-start' },
  changeLocationText: { color: '#fff', fontSize: 11, marginLeft: 4, fontWeight: '600' },
  locationModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  locationModalContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 16, maxHeight: '80%' },
  locationModalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#2e4d2f' },
  locationList: { borderTopWidth: 1, borderColor: '#eee', marginTop: 4 },
  locationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f1f1f1' },
  locationItemText: { flex: 1, fontSize: 14, color: '#1c4722', marginLeft: 8 },
  locationItemCoords: { fontSize: 11, color: '#555' },
  closeModalBtn: { marginTop: 12, backgroundColor: '#4d7f39', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  closeModalText: { color: '#fff', fontWeight: '600' },
  provinceChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f0f4f0', borderRadius: 16, marginRight: 8 },
  provinceChipActive: { backgroundColor: '#4d7f39' },
  provinceChipText: { fontSize: 12, color: '#2e4d2f' },
  provinceChipTextActive: { color: '#fff' },
  inlinePickerBox: { backgroundColor: 'rgba(255,255,255,0.12)', padding: 10, borderRadius: 12, marginTop: 10 },
  inlinePickerLabel: { color: 'white', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  inlineProvinceRow: { maxHeight: 40 },
  inlineProvinceChip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, marginRight: 8 },
  inlineProvinceChipActive: { backgroundColor: 'white' },
  inlineProvinceChipText: { color: 'white', fontSize: 12, fontWeight: '600' },
  inlineProvinceChipTextActive: { color: '#1c4722' },
  inlineCityList: { marginTop: 6 },
  inlineCityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  inlineCityName: { color: 'white', fontSize: 12, flex: 1, marginLeft: 6 },
  inlineCityCoords: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },

  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 110,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1c4722",
  },

  cropRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusCard: {
    flex: 1,
    backgroundColor: "#1c4722",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginRight: 10,
  },
  statusLabel: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 10,
  },
  statusCircleWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    width: 90,
    height: 90,
    borderRadius: 60,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  circleText: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#FFC107",
  },

  diagnosisCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    marginLeft: 10,
    height: 150,
    position: "relative",
  },
  diagnosisImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  diagnosisOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  diagnosisTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
  tryNowButton: {
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  tryNowText: {
    color: "#1c4722",
    fontWeight: "bold",
  },

  historyCard: {
    marginTop: 15,
    backgroundColor: "#1c4722",
    borderRadius: 20,
    padding: 15,
  },
  historyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  historyHeader: {
    marginBottom: 4,
  },

  legendRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,

  },

  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,

  },

  historyTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,

  },

  legendText: {
    color: "white",
    fontSize: 8,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: 10,
  },

  historyDayWrapper: {
    flexBasis: "13%",
    marginBottom: 8,
  },

  dayBox: {
    width: 45,
    height: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },

  historyDayText: {
    color: "white",
    fontWeight: "bold",
  },

  historyDetails: {
    fontSize: 5,
    color: "white",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1c4722",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});