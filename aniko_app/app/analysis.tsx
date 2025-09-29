import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import supabase from './CONFIG/supaBase';
import { useAppContext } from './CONFIG/GlobalContext';
import FooterNavigation from '../components/FooterNavigation';

// For charts
import { LineChart, BarChart } from "react-native-chart-kit";

// Types
interface WeatherHistoryData {
  date: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  description: string;
}

interface PlantHistoryData {
  date: string;
  cropName: string;
  temperature: number;
  moisture: number;
  ph: number;
  nitrogen: number;
  potassium: number;
  phosphorus: number;
}

interface PlantRecommendation {
  cropName: string;
  bestMonths: number[];
  currentStatus: 'ideal' | 'good' | 'caution' | 'avoid';
  riskFactors: string[];
  recommendations: string[];
  predictedWeather: {
    nextMonth: {
      avgTemp: number;
      rainfall: number;
      humidity: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
  };
  alternativePlantingDates: string[];
  // Add database-specific fields
  optimalTemp?: { min: number; max: number };
  optimalHumidity?: { min: number; max: number };
  optimalPH?: { min: number | null; max: number | null };
  optimalNPK?: {
    nitrogen: { min: number | null; max: number | null };
    phosphorus: { min: number | null; max: number | null };
    potassium: { min: number | null; max: number | null };
  };
}

interface CropDatabase {
  [key: string]: {
    optimalTemp: { min: number; max: number };
    optimalHumidity: { min: number; max: number };
    rainfallTolerance: { min: number; max: number };
    plantingSeasons: number[];
    growthDuration: number; // days
    vulnerabilities: string[];
  };
}

// Example crop database (add more crops as needed)
const cropDatabase: CropDatabase = {
  Tomato: {
    optimalTemp: { min: 20, max: 30 },
    optimalHumidity: { min: 60, max: 80 },
    rainfallTolerance: { min: 50, max: 200 },
    plantingSeasons: [1, 2, 3, 10, 11, 12],
    growthDuration: 90,
    vulnerabilities: ['Fungal diseases', 'Heat stress'],
  },
  Lettuce: {
    optimalTemp: { min: 15, max: 25 },
    optimalHumidity: { min: 60, max: 80 },
    rainfallTolerance: { min: 30, max: 120 },
    plantingSeasons: [1, 2, 3, 4, 11, 12],
    growthDuration: 60,
    vulnerabilities: ['Bolting', 'Downy mildew'],
  },
  Cucumber: {
    optimalTemp: { min: 18, max: 32 },
    optimalHumidity: { min: 60, max: 85 },
    rainfallTolerance: { min: 40, max: 180 },
    plantingSeasons: [2, 3, 4, 5, 9, 10],
    growthDuration: 70,
    vulnerabilities: ['Powdery mildew', 'Root rot'],
  },
  Spinach: {
    optimalTemp: { min: 10, max: 22 },
    optimalHumidity: { min: 60, max: 80 },
    rainfallTolerance: { min: 30, max: 100 },
    plantingSeasons: [1, 2, 11, 12],
    growthDuration: 45,
    vulnerabilities: ['Leaf miners', 'Downy mildew'],
  },
};

export default function Analysis() {
  const router = useRouter();
  const { selectedCrop, selectedLocation } = useAppContext();
  const [user, setUser] = useState<any>(null);
  
  // Tab selection state
  const [activeTab, setActiveTab] = useState<'weather' | 'plants' | 'recommendations'>('weather');
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '1year' | '5years'>('7days');
  
  // Data states
  const [weatherData, setWeatherData] = useState<WeatherHistoryData[]>([]);
  const [plantData, setPlantData] = useState<PlantHistoryData[]>([]);
  const [plantHistory, setPlantHistory] = useState<{[key: string]: PlantHistoryData[]}>({});
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [plantRecommendations, setPlantRecommendations] = useState<PlantRecommendation[]>([]);
  
  // Loading states
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingPlant, setLoadingPlant] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // New state variables for chart expansion
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  // Add these state variables at the top with your other states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [plantCategories, setPlantCategories] = useState<{[key: string]: PlantRecommendation[]}>({});

  // Add this state for selected plant details
  const [selectedPlantDetail, setSelectedPlantDetail] = useState<PlantRecommendation | null>(null);

  // Initialize with selected plant if available
  useEffect(() => {
    if (selectedCrop?.crop_name) {
      setSelectedPlant(selectedCrop.crop_name);
    }
  }, [selectedCrop]);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          if (data) setUser(data);
        }
      } catch (error) {
        console.error("Error getting current user:", error);
      }
    };
    
    getCurrentUser();
  }, []);

  // Fetch weather data based on time range and location
  useEffect(() => {
    const fetchWeatherHistory = async () => {
      if (!selectedLocation) {
        console.log('⚠️ No location selected for weather analysis');
        return;
      }
      
      setLoadingWeather(true);
      
      try {
        // Get dates for the selected time range
        const endDate = new Date();
        const startDate = new Date();
        
        // Set start date based on time range
        switch(timeRange) {
          case '7days':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '1year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
          case '5years':
            startDate.setFullYear(endDate.getFullYear() - 5);
            break;
        }
        
        // Format dates for Open-Meteo API (YYYY-MM-DD)
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Get correct latitude and longitude from selectedLocation
        const latitude = selectedLocation.lat;
        const longitude = selectedLocation.lon;
        
        if (!latitude || !longitude) {
          throw new Error('Invalid location coordinates');
        }
        
        console.log(`🌤️ Fetching weather data for ${selectedLocation.city || 'Selected Location'}`);
        console.log(`📅 Date range: ${startDateStr} to ${endDateStr}`);
        console.log(`📍 Coordinates: ${latitude}, ${longitude}`);
        
        // Build Open-Meteo API URL - Use archive API for historical data
        const baseUrl = 'https://archive-api.open-meteo.com/v1/archive';
        const params = new URLSearchParams({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          start_date: startDateStr,
          end_date: endDateStr,
          daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum,weather_code',
          timezone: 'auto'
        });
        
        const apiUrl = `${baseUrl}?${params.toString()}`;
        console.log('🔗 Open-Meteo API URL:', apiUrl);
        
        // Fetch data from Open-Meteo API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AnikoSmartAI/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
        }
        
        const weatherApiData = await response.json();
        console.log('✅ Raw weather data received:', {
          daily: weatherApiData.daily ? 'Present' : 'Missing',
          dataPoints: weatherApiData.daily?.time?.length || 0
        });
        
        if (!weatherApiData.daily || !weatherApiData.daily.time) {
          throw new Error('No daily weather data available for this location and time range');
        }
        
        // Process the API response into our format
        const processedWeatherData: WeatherHistoryData[] = [];
        const dailyData = weatherApiData.daily;
        
        // Ensure we have data arrays
        if (!dailyData.time || dailyData.time.length === 0) {
          throw new Error('Empty weather data received from API');
        }
        
        for (let i = 0; i < dailyData.time.length; i++) {
          const date = dailyData.time[i];
          const tempMean = dailyData.temperature_2m_mean?.[i] || 
                          ((dailyData.temperature_2m_max?.[i] || 0) + (dailyData.temperature_2m_min?.[i] || 0)) / 2;
          const humidity = dailyData.relative_humidity_2m_mean?.[i] || 0;
          const rainfall = dailyData.precipitation_sum?.[i] || 0;
          const weatherCode = dailyData.weather_code?.[i] || 0;
          
          // Convert weather code to description
          const description = getWeatherDescription(weatherCode);
          
          processedWeatherData.push({
            date: date,
            temperature: Number(tempMean.toFixed(1)),
            humidity: Number(humidity.toFixed(1)),
            rainfall: Number(rainfall.toFixed(1)),
            description: description
          });
        }
        
        console.log(`✅ Successfully processed ${processedWeatherData.length} days of historical weather data`);
        console.log(`📊 Data range: ${processedWeatherData[0]?.date} to ${processedWeatherData[processedWeatherData.length - 1]?.date}`);
        
        // Sort data by date to ensure proper chronological order
        processedWeatherData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setWeatherData(processedWeatherData);
        
      } catch (error) {
        console.error('❌ Error fetching weather history:', error);
        
        // Show user-friendly error message
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.log('⏰ Weather API request timed out');
          } else if (error.message.includes('coordinates')) {
            console.log('📍 Invalid location coordinates');
          } else {
            console.log('🌐 Weather API temporarily unavailable');
          }
        } else {
          console.log('🌐 Weather API temporarily unavailable');
        }
        
        // Fallback to mock data with realistic patterns for the selected time range
        console.log('🔄 Generating fallback weather data for selected time range...');
        const mockWeatherData: WeatherHistoryData[] = [];
        
        const endDate = new Date();
        const startDate = new Date();
        
        switch(timeRange) {
          case '7days':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '1year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
          case '5years':
            startDate.setFullYear(endDate.getFullYear() - 5);
            break;
        }
        
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          // Generate more realistic seasonal weather patterns
          const dayOfYear = currentDate.getMonth() * 30 + currentDate.getDate();
          const seasonalTemp = 20 + Math.sin((dayOfYear - 80) * Math.PI / 180) * 10; // Seasonal variation
          const dailyVariation = Math.sin(currentDate.getDate() / 3) * 3;
          const randomVariation = (Math.random() - 0.5) * 6;
          
          const temp = seasonalTemp + dailyVariation + randomVariation;
          const humidity = Math.max(20, Math.min(95, 60 + Math.sin(dayOfYear / 20) * 20 + (Math.random() - 0.5) * 20));
          const rainfall = Math.max(0, Math.sin(dayOfYear / 15) * 5 + (Math.random() - 0.7) * 10);
          
          // More accurate weather descriptions
          let description = "Clear sky";
          if (rainfall > 5) description = "Rainy";
          else if (rainfall > 1) description = "Drizzle";
          else if (humidity > 85) description = "Cloudy";
          else if (humidity > 70) description = "Partly cloudy";
          else if (temp < 10) description = "Cold";
          
          mockWeatherData.push({
            date: currentDate.toISOString().split('T')[0],
            temperature: Number(temp.toFixed(1)),
            humidity: Number(humidity.toFixed(1)),
            rainfall: Number(rainfall.toFixed(1)),
            description
          });
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log(`🔄 Generated ${mockWeatherData.length} days of fallback weather data`);
        setWeatherData(mockWeatherData);
      } finally {
        setLoadingWeather(false);
      }
    };
    
    fetchWeatherHistory();
  }, [timeRange, selectedLocation]);

  // Helper function to convert weather codes to descriptions
  const getWeatherDescription = (weatherCode: number): string => {
    // WMO Weather interpretation codes (WW)
    // Reference: https://open-meteo.com/en/docs
    
    if (weatherCode === 0) return "Clear sky";
    if (weatherCode >= 1 && weatherCode <= 3) return "Partly cloudy";
    if (weatherCode >= 45 && weatherCode <= 48) return "Foggy";
    if (weatherCode >= 51 && weatherCode <= 57) return "Drizzle";
    if (weatherCode >= 61 && weatherCode <= 67) return "Rainy";
    if (weatherCode >= 71 && weatherCode <= 77) return "Snowy";
    if (weatherCode >= 80 && weatherCode <= 82) return "Rain showers";
    if (weatherCode >= 85 && weatherCode <= 86) return "Snow showers";
    if (weatherCode >= 95 && weatherCode <= 99) return "Thunderstorm";
    
    // Default fallback
    if (weatherCode >= 1 && weatherCode <= 50) return "Cloudy";
    if (weatherCode >= 50 && weatherCode <= 70) return "Rainy";
    if (weatherCode >= 70 && weatherCode <= 90) return "Snowy";
    
    return "Variable";
  };

  // Fetch plant history data
  useEffect(() => {
    const fetchPlantHistory = async () => {
      if (!user) return;
      
      setLoadingPlant(true);
      
      try {
        // Get all plant types the user has tracked
        const { data: plantTypes, error: plantError } = await supabase
          .from('esp32_readings')
          .select('crop_id, crops:lib_crop_param(crop_name)')
          .eq('user_id', user.id)
          .not('crop_id', 'is', null);
        
        if (plantError) throw plantError;
        
        // Create a list of unique plant types
        const uniquePlants: {[key: string]: number} = {};
        if (plantTypes) {
          plantTypes.forEach(item => {
            if (item.crops && Array.isArray(item.crops) && item.crops.length > 0 && item.crop_id) {
                
              uniquePlants[item.crops[0].crop_name] = item.crop_id;
            }
          });
        }
        
        // For each plant type, fetch its history
        const plantHistoryData: {[key: string]: PlantHistoryData[]} = {};
        
        for (const [plantName, cropId] of Object.entries(uniquePlants)) {
          // Fetch ESP32 readings for this crop
          const { data: readings, error: readingsError } = await supabase
            .from('esp32_readings')
            .select('*')
            .eq('user_id', user.id)
            .eq('crop_id', cropId)
            .order('measured_at', { ascending: false });
            
          if (readingsError) throw readingsError;
          
          if (readings && readings.length > 0) {
            // Map the readings to our interface
            const plantReadings = readings.map(reading => ({
              date: new Date(reading.measured_at).toISOString().split('T')[0],
              cropName: plantName,
              temperature: reading.temp_c || 0,
              moisture: reading.moisture_pct || 0,
              ph: reading.ph_level || 0,
              nitrogen: reading.nitrogen_ppm || 0,
              potassium: reading.potassium_ppm || 0,
              phosphorus: reading.phosphorus_ppm || 0
            }));
            
            plantHistoryData[plantName] = plantReadings;
          }
        }
        
        setPlantHistory(plantHistoryData);
        
        // If we have any plants, set the first one as selected
        const plantNames = Object.keys(plantHistoryData);
        if (plantNames.length > 0 && !selectedPlant) {
          setSelectedPlant(plantNames[0]);
        }
        
        // If we have a selected plant, set its data
        if (selectedPlant && plantHistoryData[selectedPlant]) {
          setPlantData(plantHistoryData[selectedPlant]);
        }
      } catch (error) {
        console.error("Error fetching plant history:", error);
        
        // Generate mock data for demonstration
        const mockPlants = ['Tomato', 'Lettuce', 'Cucumber', 'Spinach'];
        const mockHistory: {[key: string]: PlantHistoryData[]} = {};
        
        mockPlants.forEach(plant => {
          const plantReadings: PlantHistoryData[] = [];
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - 30);
          
          let currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            // Generate random-ish but somewhat realistic plant data
            const temp = 24 + Math.sin(currentDate.getDate() / 3) * 3 + (Math.random() * 2 - 1);
            const moisture = 65 + Math.sin(currentDate.getDate() / 2.5) * 15 + (Math.random() * 8 - 4);
            const ph = 6.5 + Math.sin(currentDate.getDate() / 5) * 0.5 + (Math.random() * 0.4 - 0.2);
            
            plantReadings.push({
              date: currentDate.toISOString().split('T')[0],
              cropName: plant,
              temperature: Number(temp.toFixed(1)),
              moisture: Number(moisture.toFixed(1)),
              ph: Number(ph.toFixed(1)),
              nitrogen: Math.floor(40 + Math.sin(currentDate.getDate() / 4) * 10 + (Math.random() * 5)),
              potassium: Math.floor(35 + Math.sin(currentDate.getDate() / 3.5) * 8 + (Math.random() * 4)),
              phosphorus: Math.floor(25 + Math.sin(currentDate.getDate() / 4.5) * 5 + (Math.random() * 3))
            });
            
            // Increment date by 1 day
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          mockHistory[plant] = plantReadings;
        });
        
        setPlantHistory(mockHistory);
        
        // Set default selected plant if none is selected
        if (!selectedPlant && mockPlants.length > 0) {
          setSelectedPlant(mockPlants[0]);
        }
        
        // Set plant data for selected plant
        if (selectedPlant && mockHistory[selectedPlant]) {
          setPlantData(mockHistory[selectedPlant]);
        } else if (mockPlants.length > 0) {
          setPlantData(mockHistory[mockPlants[0]]);
          setSelectedPlant(mockPlants[0]);
        }
      } finally {
        setLoadingPlant(false);
      }
    };
    
    fetchPlantHistory();
  }, [user, selectedPlant]);

  // Handle plant selection change
  const handlePlantSelect = (plantName: string) => {
    setSelectedPlant(plantName);
    if (plantHistory[plantName]) {
      setPlantData(plantHistory[plantName]);
    }
  };

  // Enhanced weather chart data preparation
  const getChartDataPoints = (data: any[], timeRange: string) => {
    switch(timeRange) {
      case '7days':
        return data.slice(-7);
      case '30days':
        return data.slice(-30).filter((_, index) => index % 2 === 0); // Show every 2nd day
      case '1year':
        return data.slice(-365).filter((_, index) => index % 15 === 0); // Show bi-weekly
      case '5years':
        return data.slice(-1825).filter((_, index) => index % 60 === 0); // Show every 2 months
      default:
        return data.slice(-7);
    }
  };

  // Calculate dynamic chart width based on data points
  const getChartWidth = (dataPoints: number, timeRange: string, isExpanded: boolean = false) => {
    const screenWidth = Dimensions.get("window").width;
    const minWidth = screenWidth - 40;
    const expandedMultiplier = isExpanded ? 2 : 1;
    
    switch(timeRange) {
      case '7days':
        return Math.max(minWidth, dataPoints * 50 * expandedMultiplier);
      case '30days':
        return Math.max(minWidth, dataPoints * 60 * expandedMultiplier);
      case '1year':
        return Math.max(minWidth, dataPoints * 80 * expandedMultiplier);
      case '5years':
        return Math.max(minWidth, dataPoints * 100 * expandedMultiplier);
      default:
        return minWidth;
    }
  };

  // Weather chart data preparation
  const weatherChartDataPoints = getChartDataPoints(weatherData, timeRange);
  const weatherChartWidth = getChartWidth(
    weatherChartDataPoints.length, 
    timeRange, 
    expandedChart === 'weather'
  );

  const weatherChartData = {
    labels: weatherChartDataPoints.length > 0 
      ? weatherChartDataPoints.map(d => {
          const date = new Date(d.date);
          if (timeRange === '7days') {
            return `${date.getMonth() + 1}/${date.getDate()}`;
          } else if (timeRange === '30days') {
            return `${date.getMonth() + 1}/${date.getDate()}`;
          } else if (timeRange === '1year') {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          } else if (timeRange === '5years') {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          }
          return `${date.getMonth() + 1}/${date.getDate()}`;
        })
      : ['No Data'],
    datasets: [
      {
        data: weatherChartDataPoints.length > 0 
          ? weatherChartDataPoints.map(d => d.temperature)
          : [0],
        color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Temperature (°C)"]
  };
  
  // Plant chart data preparation for temperature
  const plantTempDataPoints = plantData.length > 0 ? plantData.slice(-14) : [];
  const plantTempChartWidth = getChartWidth(
    plantTempDataPoints.length, 
    '30days', // Use 30days as default for plant charts
    expandedChart === 'plantTemp'
  );

  const plantTempChartData = {
    labels: plantTempDataPoints.length > 0 
      ? plantTempDataPoints.map(d => {
          const date = new Date(d.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        })
      : ['No Data'],
    datasets: [
      {
        data: plantTempDataPoints.length > 0 
          ? plantTempDataPoints.map(d => d.temperature)
          : [0],
        color: (opacity = 1) => `rgba(65, 105, 225, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Temperature (°C)"]
  };
  
  // Plant chart data for moisture
  const plantMoistureDataPoints = plantData.length > 0 ? plantData.slice(-14) : [];
  const plantMoistureChartWidth = getChartWidth(
    plantMoistureDataPoints.length, 
    '30days',
    expandedChart === 'plantMoisture'
  );

  const plantMoistureChartData = {
    labels: plantMoistureDataPoints.length > 0 
      ? plantMoistureDataPoints.map(d => {
          const date = new Date(d.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        })
      : ['No Data'],
    datasets: [
      {
        data: plantMoistureDataPoints.length > 0 
          ? plantMoistureDataPoints.map(d => d.moisture)
          : [0],
        color: (opacity = 1) => `rgba(46, 139, 87, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Moisture (%)"]
  };
  
  // Update the chart configuration for better readability
  const chartConfig = {
    backgroundColor: "#e26a00",
    backgroundGradientFrom: "#1c4722",
    backgroundGradientTo: "#4d7f39",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#ffa726"
    },
    // Improved label formatting
    formatXLabel: (value: string) => {
      return value.length > 8 ? value.substring(0, 8) + '...' : value;
    }
  };

  // Add this function before the return statement
  const handleRefreshWeatherData = async () => {
    if (!selectedLocation) {
      console.log('⚠️ No location selected for weather refresh');
      return;
    }
    
    console.log(`🔄 Manually refreshing weather data for ${timeRange} range`);
    setLoadingWeather(true);
    
    // Clear existing data first
    setWeatherData([]);
    
    // Force re-fetch by updating a state that triggers the useEffect
    const currentRange = timeRange;
    setTimeRange('7days');
    setTimeout(() => setTimeRange(currentRange), 100);
  };

  // Debug logging
  useEffect(() => {
    console.log('📊 Chart Data Debug:');
    console.log('Weather data points:', weatherData.length);
    console.log('Plant data points:', plantData.length);
    console.log('Selected plant:', selectedPlant);
    console.log('Active tab:', activeTab);
    console.log('Time range:', timeRange);
    
    if (weatherData.length > 0) {
      console.log('Weather sample:', weatherData.slice(0, 3));
    }
    
    if (plantData.length > 0) {
      console.log('Plant sample:', plantData.slice(0, 3));
    }
  }, [weatherData, plantData, selectedPlant, activeTab, timeRange]);

  // Toggle function for chart expansion
  const toggleChartExpansion = (chartType: string) => {
    setExpandedChart(expandedChart === chartType ? null : chartType);
  };

  // Replace the static cropDatabase and generatePlantRecommendations function
  const generatePlantRecommendations = async () => {
    if (!selectedLocation || weatherData.length === 0) return;
    
    setLoadingRecommendations(true);
    
    try {
      console.log('🔄 Fetching crop parameters from database...');
      
      // Fetch crop parameters from your denormalized_crop_parameter table
      const { data: cropParams, error: cropError } = await supabase
        .from('denormalized_crop_parameter')
        .select('*');

      if (cropError) {
        console.error('Error fetching crop parameters:', cropError);
        throw cropError;
      }

      if (!cropParams || cropParams.length === 0) {
        console.log('No crop parameters found in database');
        return;
      }

      console.log(`✅ Fetched ${cropParams.length} crops from database`);

      // Get next month info
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthNum = nextMonth.getMonth() + 1;
      
      // Analyze recent weather trends
      const recentWeather = weatherData.slice(-30); // Last 30 days
      const avgTemp = recentWeather.reduce((sum, d) => sum + d.temperature, 0) / recentWeather.length;
      const avgHumidity = recentWeather.reduce((sum, d) => sum + d.humidity, 0) / recentWeather.length;
      const totalRainfall = recentWeather.reduce((sum, d) => sum + d.rainfall, 0);
      
      console.log(`📊 Current weather analysis:`, {
        avgTemp: avgTemp.toFixed(1),
        avgHumidity: avgHumidity.toFixed(1),
        totalRainfall: totalRainfall.toFixed(1),
        location: selectedLocation.city
      });

      // Predict next month's weather
      const nextMonthWeather = {
        nextMonth: {
          avgTemp: avgTemp + (Math.random() * 4 - 2), // Slight variation from current
          rainfall: totalRainfall / recentWeather.length * 30, // Monthly estimate
          humidity: avgHumidity + (Math.random() * 10 - 5), // Slight variation
          riskLevel: totalRainfall > 200 ? 'high' : totalRainfall > 100 ? 'medium' : 'low' as 'low' | 'medium' | 'high'
        }
      };
      
      const recommendations: PlantRecommendation[] = [];
      
      // Process each crop from database
      for (const crop of cropParams) {
        console.log(`🌱 Processing crop: ${crop.crop_name}`);
        
        // Check temperature suitability
        const tempSuitability = avgTemp >= (crop.temperature_min || 0) && avgTemp <= (crop.temperature_max || 50);
        
        // Check humidity/moisture suitability
        const humiditySuitability = avgHumidity >= (crop.moisture_min || 0) && avgHumidity <= (crop.moisture_max || 100);
        
        // Determine planting seasons based on crop type and region
        const plantingSeasons = getPlantingSeasonsByCrop(crop.crop_name, selectedLocation.region);
        const isOptimalSeason = plantingSeasons.includes(nextMonthNum);
        
        let status: 'ideal' | 'good' | 'caution' | 'avoid' = 'good';
        const riskFactors: string[] = [];
        const recommendationsList: string[] = [];
        
        // Assess temperature conditions
        if (!tempSuitability) {
          if (avgTemp < (crop.temperature_min || 0)) {
            riskFactors.push(`Temperature too low (${avgTemp.toFixed(1)}°C < ${crop.temperature_min}°C)`);
            recommendationsList.push('Wait for warmer weather or use greenhouse protection');
          } else if (avgTemp > (crop.temperature_max || 50)) {
            riskFactors.push(`Temperature too high (${avgTemp.toFixed(1)}°C > ${crop.temperature_max}°C)`);
            recommendationsList.push('Provide shade nets or wait for cooler season');
          }
        }
        
        // Assess humidity/moisture conditions
        if (!humiditySuitability) {
          if (avgHumidity < (crop.moisture_min || 0)) {
            riskFactors.push(`Humidity too low (${avgHumidity.toFixed(1)}% < ${crop.moisture_min}%)`);
            recommendationsList.push('Increase irrigation frequency or use mulching');
          } else if (avgHumidity > (crop.moisture_max || 100)) {
            riskFactors.push(`Humidity too high (${avgHumidity.toFixed(1)}% > ${crop.moisture_max}%)`);
            recommendationsList.push('Ensure good ventilation and proper drainage');
          }
        }
        
        // Assess pH conditions if available
        if (crop.ph_level_min && crop.ph_level_max) {
          recommendationsList.push(`Maintain soil pH between ${crop.ph_level_min} - ${crop.ph_level_max}`);
        }
        
        // Assess NPK requirements
        const npkRecommendations = [];
        if (crop.nitrogen_min && crop.nitrogen_max) {
          npkRecommendations.push(`Nitrogen: ${crop.nitrogen_min}-${crop.nitrogen_max} ppm`);
        }
        if (crop.potassium_min && crop.potassium_max) {
          npkRecommendations.push(`Potassium: ${crop.potassium_min}-${crop.potassium_max} ppm`);
        }
        if (crop.phosphorus_min && crop.phosphorus_max) {
          npkRecommendations.push(`Phosphorus: ${crop.phosphorus_min}-${crop.phosphorus_max} ppm`);
        }
        
        if (npkRecommendations.length > 0) {
          recommendationsList.push(`Optimal nutrient levels: ${npkRecommendations.join(', ')}`);
        }
        
        // Weather-based rainfall assessment
        const estimatedRainfallTolerance = getRainfallToleranceByCrop(crop.crop_name);
        if (totalRainfall > estimatedRainfallTolerance.max) {
          riskFactors.push('Excessive rainfall detected');
          recommendationsList.push('Improve drainage and consider raised beds');
        } else if (totalRainfall < estimatedRainfallTolerance.min) {
          riskFactors.push('Insufficient rainfall');
          recommendationsList.push('Increase irrigation to supplement rainfall');
        }
        
        // Determine overall status
        if (isOptimalSeason && tempSuitability && humiditySuitability && riskFactors.length === 0) {
          status = 'ideal';
          recommendationsList.unshift('🌟 Perfect conditions for planting right now!');
        } else if (isOptimalSeason && riskFactors.length <= 1) {
          status = 'good';
          recommendationsList.unshift('✅ Good time to plant with minor adjustments');
        } else if (riskFactors.length <= 2) {
          status = 'caution';
          recommendationsList.unshift('⚠️ Proceed with caution and monitoring');
        } else {
          status = 'avoid';
          recommendationsList.unshift('❌ Consider waiting for better conditions');
        }
        
        // Generate location-specific alternative dates
        const alternativeDates = generateLocationAlternatives(crop, nextMonthWeather, selectedLocation);
        
        recommendations.push({
          cropName: crop.crop_name,
          bestMonths: plantingSeasons,
          currentStatus: status,
          riskFactors,
          recommendations: recommendationsList,
          predictedWeather: nextMonthWeather,
          alternativePlantingDates: alternativeDates,
          // Add database-specific info
          optimalTemp: { min: crop.temperature_min || 0, max: crop.temperature_max || 50 },
          optimalHumidity: { min: crop.moisture_min || 0, max: crop.moisture_max || 100 },
          optimalPH: { min: crop.ph_level_min, max: crop.ph_level_max },
          optimalNPK: {
            nitrogen: { min: crop.nitrogen_min, max: crop.nitrogen_max },
            phosphorus: { min: crop.phosphorus_min, max: crop.phosphorus_max },
            potassium: { min: crop.potassium_min, max: crop.potassium_max }
          }
        });
      }
      
      // Sort by recommendation priority and location suitability
      recommendations.sort((a, b) => {
        const statusPriority = { ideal: 4, good: 3, caution: 2, avoid: 1 };
        return statusPriority[b.currentStatus] - statusPriority[a.currentStatus];
      });
      
      // Categorize the recommendations
      const categorized = categorizePlants(recommendations);
      setPlantCategories(categorized);
      setPlantRecommendations(recommendations);
      
      console.log(`✅ Generated ${recommendations.length} recommendations in ${Object.keys(categorized).length} categories`);
      
    } catch (error) {
      console.error('Error generating database-based recommendations:', error);
      setPlantRecommendations([]);
      setPlantCategories({});
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Helper function to determine planting seasons by crop and region
  const getPlantingSeasonsByCrop = (cropName: string, region?: string): number[] => {
    // Philippines-specific planting seasons
    const cropSeasons: { [key: string]: number[] } = {
      // Rice varieties
      'Rice': [5, 6, 7, 11, 12, 1],
      
      // Vegetables
      'Tomato': [1, 2, 3, 10, 11, 12],
      'Lettuce': [11, 12, 1, 2, 3, 4],
      'Cucumber': [2, 3, 4, 5, 9, 10],
      'Spinach': [11, 12, 1, 2],
      'Cabbage': [11, 12, 1, 2, 3],
      'Carrot': [11, 12, 1, 2, 3],
      'Eggplant': [1, 2, 3, 10, 11, 12],
      'Bell Pepper': [1, 2, 3, 10, 11, 12],
      'Onion': [11, 12, 1, 2],
      'Garlic': [10, 11, 12],
      
      // Root crops
      'Sweet Potato': [3, 4, 5, 6],
      'Cassava': [4, 5, 6, 7],
      'Taro': [4, 5, 6, 7, 8],
      
      // Fruits
      'Banana': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Year-round
      'Papaya': [3, 4, 5, 6, 7, 8],
      'Mango': [12, 1, 2, 3],
      
      // Legumes
      'Mung Bean': [2, 3, 4, 8, 9, 10],
      'Peanut': [4, 5, 6, 7],
      'Soybean': [5, 6, 7, 8],
      
      // Corn
      'Corn': [1, 2, 3, 7, 8, 9],
      'Sweet Corn': [1, 2, 3, 7, 8, 9],
    };
    
    // Default to year-round if crop not found
    return cropSeasons[cropName] || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  };

  // Helper function to get rainfall tolerance by crop
  const getRainfallToleranceByCrop = (cropName: string): { min: number; max: number } => {
    const rainfallTolerance: { [key: string]: { min: number; max: number } } = {
      'Rice': { min: 100, max: 300 },
      'Tomato': { min: 50, max: 200 },
      'Lettuce': { min: 30, max: 120 },
      'Cucumber': { min: 40, max: 180 },
      'Spinach': { min: 30, max: 100 },
      'Corn': { min: 60, max: 250 },
      'Eggplant': { min: 50, max: 200 },
      'Sweet Potato': { min: 40, max: 150 },
      'Banana': { min: 80, max: 400 },
      'Mango': { min: 30, max: 150 },
    };
    
    return rainfallTolerance[cropName] || { min: 50, max: 200 };
  };

  // Enhanced alternative date generation with location data
  const generateLocationAlternatives = (crop: any, weather: any, location: any): string[] => {
    const alternatives: string[] = [];
    const currentMonth = new Date().getMonth() + 1;
    
    // Get optimal seasons for this crop
    const optimalSeasons = getPlantingSeasonsByCrop(crop.crop_name, location.region);
    
    // Find next optimal month
    const nextOptimalMonth = optimalSeasons.find((month: number) => month > currentMonth) ||
                            optimalSeasons[0] + 12;
    
    if (nextOptimalMonth !== currentMonth + 1) {
      const monthName = new Date(2024, (nextOptimalMonth - 1) % 12, 1)
        .toLocaleString('default', { month: 'long' });
      alternatives.push(`⏰ Wait until ${monthName} for optimal planting season`);
    }
    
    // Weather-based alternatives
    if (weather.nextMonth.riskLevel === 'high') {
      alternatives.push('🏠 Consider greenhouse or controlled environment');
      alternatives.push('📅 Plant 2-3 weeks earlier to avoid adverse weather');
    }
    
    // Region-specific advice
    if (location.region) {
      alternatives.push(`📍 Consult local farmers in ${location.region} for region-specific timing`);
    }
    
    // Temperature-based alternatives
    if (crop.temperature_min && crop.temperature_max) {
      alternatives.push(`🌡️ Monitor temperature: optimal range is ${crop.temperature_min}°C - ${crop.temperature_max}°C`);
    }
    
    return alternatives;
  };

  // Add useEffect to generate recommendations when data changes
  useEffect(() => {
    if (activeTab === 'recommendations' && weatherData.length > 0) {
      generatePlantRecommendations();
    }
  }, [activeTab, weatherData, selectedLocation]);

  // Debug logging for recommendations
  useEffect(() => {
    if (activeTab === 'recommendations') {
      console.log('📋 Recommendations Debug:');
      console.log('Plant recommendations:', plantRecommendations);
    }
  }, [plantRecommendations, activeTab]);

  // Helper for status color and icon
  const getStatusColor = (status: 'ideal' | 'good' | 'caution' | 'avoid') => {
    switch (status) {
      case 'ideal':
        return { background: '#e0f7fa', text: '#00796b' };
      case 'good':
        return { background: '#fffde7', text: '#fbc02d' };
      case 'caution':
        return { background: '#fff3e0', text: '#f57c00' };
      case 'avoid':
        return { background: '#ffebee', text: '#d32f2f' };
      default:
        return { background: '#e0e0e0', text: '#333' };
    }
  };

  // Helper for risk color
  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high' | undefined) => {
    switch (riskLevel) {
      case 'low':
        return { background: '#e0f7fa', text: '#00796b' };
      case 'medium':
        return { background: '#fffde7', text: '#fbc02d' };
      case 'high':
        return { background: '#ffebee', text: '#d32f2f' };
      default:
        return { background: '#e0e0e0', text: '#333' };
    }
  };

  // Function to categorize plants by type
  const categorizePlants = (recommendations: PlantRecommendation[]): {[key: string]: PlantRecommendation[]} => {
    const categories: {[key: string]: PlantRecommendation[]} = {
      all: recommendations,
      vegetables: [],
      fruits: [],
      grains: [],
      herbs: [],
      legumes: [],
      roots: []
    };

    recommendations.forEach(rec => {
      const cropName = rec.cropName.toLowerCase();
      
      // Categorize based on crop name
      if (cropName.includes('tomato') || cropName.includes('lettuce') || cropName.includes('cucumber') || 
          cropName.includes('spinach') || cropName.includes('cabbage') || cropName.includes('carrot') || 
          cropName.includes('eggplant') || cropName.includes('pepper') || cropName.includes('onion') || 
          cropName.includes('garlic')) {
        categories.vegetables.push(rec);
      } else if (cropName.includes('banana') || cropName.includes('papaya') || cropName.includes('mango')) {
        categories.fruits.push(rec);
      } else if (cropName.includes('rice') || cropName.includes('corn') || cropName.includes('wheat')) {
        categories.grains.push(rec);
      } else if (cropName.includes('basil') || cropName.includes('mint') || cropName.includes('oregano') || 
                 cropName.includes('parsley') || cropName.includes('cilantro')) {
        categories.herbs.push(rec);
      } else if (cropName.includes('bean') || cropName.includes('peanut') || cropName.includes('soybean') || 
                 cropName.includes('lentil') || cropName.includes('pea')) {
        categories.legumes.push(rec);
      } else if (cropName.includes('potato') || cropName.includes('cassava') || cropName.includes('taro') || 
                 cropName.includes('yam') || cropName.includes('radish')) {
        categories.roots.push(rec);
      } else {
        // Default to vegetables if not categorized
        categories.vegetables.push(rec);
      }
    });

    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (key !== 'all' && categories[key].length === 0) {
        delete categories[key];
      }
    });

    return categories;
  };

  // Helper function to get category information
  const getCategoryInfo = (category: string) => {
    const categoryMap: {[key: string]: {name: string, icon: string, count: number}} = {
      all: { name: 'All Plants', icon: 'apps-outline', count: plantRecommendations.length },
      vegetables: { name: 'Vegetables', icon: 'leaf-outline', count: plantCategories.vegetables?.length || 0 },
      fruits: { name: 'Fruits', icon: 'nutrition-outline', count: plantCategories.fruits?.length || 0 },
      grains: { name: 'Grains & Cereals', icon: 'grain-outline', count: plantCategories.grains?.length || 0 },
      herbs: { name: 'Herbs & Spices', icon: 'flower-outline', count: plantCategories.herbs?.length || 0 },
      legumes: { name: 'Legumes', icon: 'ellipse-outline', count: plantCategories.legumes?.length || 0 },
      roots: { name: 'Root Crops', icon: 'fitness-outline', count: plantCategories.roots?.length || 0 }
    };
    
    return categoryMap[category] || { name: 'Unknown', icon: 'help-outline', count: 0 };
  };

  // Helper function to get current category recommendations
  const getCurrentCategoryRecommendations = (): PlantRecommendation[] => {
    if (selectedCategory === 'all') {
      return plantRecommendations;
    }
    return plantCategories[selectedCategory] || [];
  };
  
  const getStatusIcon = (status: 'ideal' | 'good' | 'caution' | 'avoid') => {
    switch (status) {
      case 'ideal':
        return 'checkmark-circle-outline';
      case 'good':
        return 'happy-outline';
      case 'caution':
        return 'alert-circle-outline';
      case 'avoid':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };
  
    return (
      <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#1c4722", "#4d7f39"]} style={styles.headerBackground}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Analysis Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === 'weather' 
                ? `Weather Data for ${selectedLocation?.city || 'Your Location'}`
                : activeTab === 'plants'
                ? `Plant History & Trends`
                : `Smart Planting Recommendations`
              }
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
          style={[styles.tab, activeTab === 'weather' && styles.activeTab]}
          onPress={() => setActiveTab('weather')}
        >
          <Ionicons 
            name="cloud" 
            size={20} 
            color={activeTab === 'weather' ? "#1c4722" : "#666"} 
          />
          <Text style={[styles.tabText, activeTab === 'weather' && styles.activeTabText]}>
            Weather
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'plants' && styles.activeTab]}
          onPress={() => setActiveTab('plants')}
        >
          <Ionicons 
            name="leaf" 
            size={20} 
            color={activeTab === 'plants' ? "#1c4722" : "#666"} 
          />
          <Text style={[styles.tabText, activeTab === 'plants' && styles.activeTabText]}>
            Plants
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'recommendations' && styles.activeTab]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Ionicons 
            name="bulb" 
            size={20} 
            color={activeTab === 'recommendations' ? "#1c4722" : "#666"} 
          />
          <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>
            Recommendations
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Weather Analysis Tab */}
        {activeTab === 'weather' && (
          <>
            {/* Time Range Selection */}
            <View style={styles.timeRangeContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Weather for {selectedLocation?.city || 'Unknown Location'}
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={handleRefreshWeatherData}
                  disabled={loadingWeather}
                >
                  <Ionicons 
                    name="refresh-outline" 
                    size={20} 
                    color={loadingWeather ? "#ccc" : "#1c4722"} 
                  />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.timeRangeLabel}>Select Time Range:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity 
                  style={[styles.timeRangeBtn, timeRange === '7days' && styles.activeTimeRange]}
                  onPress={() => setTimeRange('7days')}
                >
                  <Text style={[styles.timeRangeText, timeRange === '7days' && styles.activeTimeRangeText]}>
                    7 Days
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.timeRangeBtn, timeRange === '30days' && styles.activeTimeRange]}
                  onPress={() => setTimeRange('30days')}
                >
                  <Text style={[styles.timeRangeText, timeRange === '30days' && styles.activeTimeRangeText]}>
                    30 Days
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.timeRangeBtn, timeRange === '1year' && styles.activeTimeRange]}
                  onPress={() => setTimeRange('1year')}
                >
                  <Text style={[styles.timeRangeText, timeRange === '1year' && styles.activeTimeRangeText]}>
                    1 Year
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.timeRangeBtn, timeRange === '5years' && styles.activeTimeRange]}
                  onPress={() => setTimeRange('5years')}
                >
                  <Text style={[styles.timeRangeText, timeRange === '5years' && styles.activeTimeRangeText]}>
                    5 Years
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Weather Charts */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Temperature Trends</Text>
                <TouchableOpacity 
                  style={styles.expandButton}
                  onPress={() => toggleChartExpansion('weather')}
                >
                  <Ionicons 
                    name={expandedChart === 'weather' ? "contract-outline" : "expand-outline"} 
                    size={20} 
                    color="#1c4722" 
                  />
                  <Text style={styles.expandButtonText}>
                    {expandedChart === 'weather' ? 'Shrink' : 'Expand'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {(timeRange === '1year' || timeRange === '5years') && (
                <Text style={styles.chartSubtitle}>
                  📊 Swipe horizontally to view all data points
                </Text>
              )}
              
              {loadingWeather ? (
                <ActivityIndicator size="large" color="#1c4722" />
              ) : weatherData.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={true}
                  style={[
                    styles.chartScrollView,
                    expandedChart === 'weather' && styles.expandedChartScrollView
                  ]}
                  contentContainerStyle={styles.chartScrollContent}
                >
                  <LineChart
                    data={weatherChartData}
                    width={weatherChartWidth}
                    height={expandedChart === 'weather' ? 300 : 220}
                    chartConfig={{
                      ...chartConfig,
                      propsForLabels: {
                        fontSize: expandedChart === 'weather' ? 12 : 10,
                      }
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
                  📈 Showing {weatherChartDataPoints.length} data points out of {weatherData.length} total
                  {expandedChart === 'weather' && ' • Expanded View'}
                </Text>
              )}
            </View>

            {/* Weather Statistics */}
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>
                Weather Statistics ({timeRange.replace('days', ' Days').replace('year', ' Year').replace('years', ' Years')})
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
                        {Math.max(...weatherData.map(d => d.temperature)).toFixed(1)}°C
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
                        {weatherData.filter(d => d.description.includes("Clear") || d.description.includes("Sunny")).length}
                      </Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Ionicons name="rainy" size={28} color="#2196f3" />
                      <Text style={styles.statTitle}>Rainy Days</Text>
                      <Text style={styles.statValue}>
                        {weatherData.filter(d => d.description.includes("Rain") || d.description.includes("Drizzle")).length}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
              
            {/* Daily Weather Table */}
            <View style={styles.tableContainer}>
              <Text style={styles.sectionTitle}>Daily Weather Record</Text>
              
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date</Text>
                <Text style={styles.tableHeaderCell}>Temp</Text>
                <Text style={styles.tableHeaderCell}>Humidity</Text>
                <Text style={styles.tableHeaderCell}>Rainfall</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Weather</Text>
              </View>
              
              {/* Table Body */}
              {weatherData.slice(-10).map((day, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.tableRow, 
                    index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{day.date}</Text>
                  <Text style={styles.tableCell}>{day.temperature}°C</Text>
                  <Text style={styles.tableCell}>{day.humidity}%</Text>
                  <Text style={styles.tableCell}>{day.rainfall} mm</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{day.description}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Plant Analysis Tab */}
        {activeTab === 'plants' && (
          <>
            {/* Plant Selection */}
            {Object.keys(plantHistory).length > 0 && (
              <View style={styles.plantSelectionContainer}>
                <Text style={styles.sectionTitle}>Select Plant:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {Object.keys(plantHistory).map((plantName, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.plantSelectBtn,
                        selectedPlant === plantName && styles.activePlantBtn
                      ]}
                      onPress={() => handlePlantSelect(plantName)}
                    >
                      <Text 
                        style={[
                          styles.plantSelectText,
                          selectedPlant === plantName && styles.activePlantText
                        ]}
                      >
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
                {selectedPlant ? `${selectedPlant} - Temperature Trends` : 'Temperature Trends'}
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
                      backgroundGradientTo: "#303f9f"
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
                  {selectedPlant ? `${selectedPlant} - Moisture Trends` : 'Moisture Trends'}
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
                      backgroundGradientTo: "#00796b"
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
                    <Text style={styles.statValue}>
                      {plantData.length}
                    </Text>
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
                          height: `${Math.min(100, (plantData.reduce((sum, d) => sum + d.nitrogen, 0) / plantData.length) / 1.5)}%`,
                          backgroundColor: '#4CAF50' 
                        }
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
                          height: `${Math.min(100, (plantData.reduce((sum, d) => sum + d.phosphorus, 0) / plantData.length) / 0.8)}%`,
                          backgroundColor: '#FF9800' 
                        }
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
                          height: `${Math.min(100, (plantData.reduce((sum, d) => sum + d.potassium, 0) / plantData.length) / 1.2)}%`,
                          backgroundColor: '#2196F3' 
                        }
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
                    style={[
                      styles.tableRow, 
                      index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                    ]}
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
        {activeTab === 'recommendations' && (
          <>
            {/* Header Section */}
            <View style={styles.recommendationHeader}>
              <Text style={styles.sectionTitle}>🌱 Smart Planting Recommendations</Text>
              <Text style={styles.subtitle}>
                Based on weather analysis for {selectedLocation?.city || 'your location'}
              </Text>
              
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={generatePlantRecommendations}
                disabled={loadingRecommendations}
              >
                <Ionicons 
                  name="refresh-outline" 
                  size={20} 
                  color={loadingRecommendations ? "#ccc" : "#1c4722"} 
                />
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
                    <Text style={styles.cardTitle}>📅 Next Month Weather Forecast</Text>
                    <View style={styles.predictionStats}>
                      <View style={styles.predictionStat}>
                        <Ionicons name="thermometer-outline" size={24} color="#e53935" />
                        <Text style={styles.predictionValue}>
                          {plantRecommendations[0]?.predictedWeather.nextMonth.avgTemp}°C
                        </Text>
                        <Text style={styles.predictionLabel}>Avg Temp</Text>
                      </View>
                      <View style={styles.predictionStat}>
                        <Ionicons name="rainy-outline" size={24} color="#2196f3" />
                        <Text style={styles.predictionValue}>
                          {plantRecommendations[0]?.predictedWeather.nextMonth.rainfall} mm
                        </Text>
                        <Text style={styles.predictionLabel}>Rainfall</Text>
                      </View>
                      <View style={styles.predictionStat}>
                        <Ionicons name="water-outline" size={24} color="#1976d2" />
                        <Text style={styles.predictionValue}>
                          {plantRecommendations[0]?.predictedWeather.nextMonth.humidity}%
                        </Text>
                        <Text style={styles.predictionLabel}>Humidity</Text>
                      </View>
                    </View>
                    
                    <View style={[
                      styles.riskIndicator,
                      { backgroundColor: getRiskColor(plantRecommendations[0]?.predictedWeather.nextMonth.riskLevel).background }
                    ]}>
                      <Text style={[
                        styles.riskText,
                        { color: getRiskColor(plantRecommendations[0]?.predictedWeather.nextMonth.riskLevel).text }
                      ]}>
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
                        const categoryInfo = getCategoryInfo(category);
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.categoryCard,
                              selectedCategory === category && styles.activeCategoryCard
                            ]}
                            onPress={() => setSelectedCategory(category)}
                          >
                            <View style={styles.categoryIconContainer}>
                              <Ionicons 
                                name={categoryInfo.icon as any} 
                                size={32} 
                                color={selectedCategory === category ? "#1c4722" : "#666"} 
                              />
                            </View>
                            <Text style={[
                              styles.categoryName,
                              selectedCategory === category && styles.activeCategoryName
                            ]}>
                              {categoryInfo.name}
                            </Text>
                            <Text style={styles.categoryCount}>
                              {categoryInfo.count} plants
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Selected Category Summary */}
                {selectedCategory && plantCategories[selectedCategory] && (
                  <View style={styles.categorySummary}>
                    <Text style={styles.categorySummaryTitle}>
                      {getCategoryInfo(selectedCategory).name} Recommendations
                    </Text>
                    <Text style={styles.categorySummarySubtitle}>
                      {getCurrentCategoryRecommendations().length} plants available for {selectedLocation?.city || 'your location'}
                    </Text>
                    
                    {/* Status Summary */}
                    <View style={styles.statusSummary}>
                      <View style={styles.statusSummaryItem}>
                        <View style={[styles.statusDot, { backgroundColor: '#00796b' }]} />
                        <Text style={styles.statusSummaryText}>
                          {getCurrentCategoryRecommendations().filter(r => r.currentStatus === 'ideal').length} Ideal
                        </Text>
                      </View>
                      <View style={styles.statusSummaryItem}>
                        <View style={[styles.statusDot, { backgroundColor: '#fbc02d' }]} />
                        <Text style={styles.statusSummaryText}>
                          {getCurrentCategoryRecommendations().filter(r => r.currentStatus === 'good').length} Good
                        </Text>
                      </View>
                      <View style={styles.statusSummaryItem}>
                        <View style={[styles.statusDot, { backgroundColor: '#f57c00' }]} />
                        <Text style={styles.statusSummaryText}>
                          {getCurrentCategoryRecommendations().filter(r => r.currentStatus === 'caution').length} Caution
                        </Text>
                      </View>
                      <View style={styles.statusSummaryItem}>
                        <View style={[styles.statusDot, { backgroundColor: '#d32f2f' }]} />
                        <Text style={styles.statusSummaryText}>
                          {getCurrentCategoryRecommendations().filter(r => r.currentStatus === 'avoid').length} Avoid
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Plant Recommendations List for Selected Category */}
                {getCurrentCategoryRecommendations().length > 0 ? (
                  selectedPlantDetail ? (
                    // Show detailed view for selected plant
                    <View style={styles.detailView}>
                      {/* Back button */}
                      <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => setSelectedPlantDetail(null)}
                      >
                        <Ionicons name="arrow-back-outline" size={20} color="#1c4722" />
                        <Text style={styles.backButtonText}>Back to {getCategoryInfo(selectedCategory).name}</Text>
                      </TouchableOpacity>

                      {/* Detailed Plant Card */}
                      <View style={styles.detailedRecommendationCard}>
                        <View style={styles.cardHeader}>
                          <View style={styles.plantInfo}>
                            <Text style={styles.plantName}>{selectedPlantDetail.cropName}</Text>
                            <View style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusColor(selectedPlantDetail.currentStatus).background }
                            ]}>
                              <Text style={[
                                styles.statusText,
                                { color: getStatusColor(selectedPlantDetail.currentStatus).text }
                              ]}>
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
                        <View style={styles.plantingMonths}>
                          <Text style={styles.subsectionTitle}>🗓️ Best Planting Months:</Text>
                          <View style={styles.monthsContainer}>
                            {selectedPlantDetail.bestMonths.map((month, idx) => (
                              <View key={idx} style={styles.monthChip}>
                                <Text style={styles.monthText}>
                                  {new Date(2024, month - 1, 1).toLocaleString('default', { month: 'short' })}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        {/* Risk Factors */}
                        {selectedPlantDetail.riskFactors.length > 0 && (
                          <View style={styles.riskSection}>
                            <Text style={styles.subsectionTitle}>⚠️ Current Risk Factors:</Text>
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
                          <Text style={styles.subsectionTitle}>💡 Recommendations:</Text>
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
                            <Text style={styles.subsectionTitle}>🔄 Alternative Options:</Text>
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
                            <Text style={styles.subsectionTitle}>🎯 Optimal Growing Conditions:</Text>
                            <Text style={styles.conditionText}>
                              🌡️ Temperature: {selectedPlantDetail.optimalTemp.min}°C - {selectedPlantDetail.optimalTemp.max}°C
                            </Text>
                            {selectedPlantDetail.optimalHumidity && (
                              <Text style={styles.conditionText}>
                                💧 Humidity: {selectedPlantDetail.optimalHumidity.min}% - {selectedPlantDetail.optimalHumidity.max}%
                              </Text>
                            )}
                            {selectedPlantDetail.optimalPH?.min && selectedPlantDetail.optimalPH?.max && (
                              <Text style={styles.conditionText}>
                                ⚗️ pH Level: {selectedPlantDetail.optimalPH.min} - {selectedPlantDetail.optimalPH.max}
                              </Text>
                            )}
                          </View>
                        )}

                        {/* NPK Requirements from database */}
                        {selectedPlantDetail.optimalNPK && (
                          <View style={styles.npkSection}>
                            <Text style={styles.subsectionTitle}>🧪 Nutrient Requirements:</Text>
                            {selectedPlantDetail.optimalNPK.nitrogen.min && selectedPlantDetail.optimalNPK.nitrogen.max && (
                              <Text style={styles.conditionText}>
                                🟢 Nitrogen: {selectedPlantDetail.optimalNPK.nitrogen.min} - {selectedPlantDetail.optimalNPK.nitrogen.max} ppm
                              </Text>
                            )}
                            {selectedPlantDetail.optimalNPK.phosphorus.min && selectedPlantDetail.optimalNPK.phosphorus.max && (
                              <Text style={styles.conditionText}>
                                🟠 Phosphorus: {selectedPlantDetail.optimalNPK.phosphorus.min} - {selectedPlantDetail.optimalNPK.phosphorus.max} ppm
                              </Text>
                            )}
                            {selectedPlantDetail.optimalNPK.potassium.min && selectedPlantDetail.optimalNPK.potassium.max && (
                              <Text style={styles.conditionText}>
                                🔵 Potassium: {selectedPlantDetail.optimalNPK.potassium.min} - {selectedPlantDetail.optimalNPK.potassium.max} ppm
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  ) : (
                    // Show compact plant list
                    <View style={styles.plantListContainer}>
                      <Text style={styles.listTitle}>
                        {getCategoryInfo(selectedCategory).name} Plants
                      </Text>
                      <Text style={styles.listSubtitle}>
                        Tap any plant to view detailed recommendations
                      </Text>
                      
                      {getCurrentCategoryRecommendations().map((recommendation, index) => (
                        <TouchableOpacity 
                          key={index} 
                          style={styles.plantListItem}
                          onPress={() => setSelectedPlantDetail(recommendation)}
                        >
                          <View style={styles.plantListInfo}>
                            <View style={styles.plantListHeader}>
                              <Text style={styles.plantListName}>{recommendation.cropName}</Text>
                              <View style={[
                                styles.compactStatusBadge,
                                { backgroundColor: getStatusColor(recommendation.currentStatus).background }
                              ]}>
                                <Text style={[
                                  styles.compactStatusText,
                                  { color: getStatusColor(recommendation.currentStatus).text }
                                ]}>
                                  {recommendation.currentStatus.toUpperCase()}
                                </Text>
                              </View>
                            </View>
                            
                            {/* Quick summary */}
                            <View style={styles.quickSummary}>
                              <Text style={styles.quickSummaryText}>
                                🗓️ Best months: {recommendation.bestMonths.slice(0, 3).map(month => 
                                  new Date(2024, month - 1, 1).toLocaleString('default', { month: 'short' })
                                ).join(', ')}{recommendation.bestMonths.length > 3 ? '...' : ''}
                              </Text>
                              
                              {recommendation.riskFactors.length > 0 && (
                                <Text style={styles.quickSummaryText}>
                                  ⚠️ {recommendation.riskFactors.length} risk factor{recommendation.riskFactors.length > 1 ? 's' : ''} detected
                                </Text>
                              )}
                              
                              {recommendation.optimalTemp && (
                                <Text style={styles.quickSummaryText}>
                                  🌡️ Optimal: {recommendation.optimalTemp.min}°C - {recommendation.optimalTemp.max}°C
                                </Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerBackground: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    marginTop: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: -20,
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1c4722',
    backgroundColor: '#f0f8f0',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#1c4722',
    fontWeight: 'bold',
  },
  timeRangeContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  timeRangeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 10,
  },
  activeTimeRange: {
    backgroundColor: '#1c4722',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#333',
  },
  activeTimeRangeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1c4722',
  },
  expandButtonText: {
    fontSize: 12,
    color: '#1c4722',
    fontWeight: '600',
    marginLeft: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 10,
    marginVertical: 10,
    elevation: 3,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c4722',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowEven: {
    backgroundColor: '#fff',
  },
  tableRowOdd: {
    backgroundColor: '#f9f9f9',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    color: '#555',
  },
  plantSelectionContainer: {
    marginBottom: 20,
  },
  plantSelectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 10,
  },
  activePlantBtn: {
    backgroundColor: '#1c4722',
  },
  plantSelectText: {
    fontSize: 14,
    color: '#333',
  },
  activePlantText: {
    color: 'white',
    fontWeight: 'bold',
  },
  npkContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  npkChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 200,
    marginTop: 20,
    paddingBottom: 30,
    alignItems: 'flex-end',
  },
  npkBar: {
    width: 60,
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  npkFill: {
    width: '100%',
    borderRadius: 5,
    position: 'absolute',
    bottom: 0,
  },
  npkValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    zIndex: 1,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  npkLabel: {
    position: 'absolute',
    bottom: -25,
    fontSize: 12,
    fontWeight: 'bold',
  },
  footerSpace: {
    height: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8f0',
  },
  timeRangeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 10,
  },
  chartScrollView: {
    marginVertical: 10,
  },
  expandedChartScrollView: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  chartScrollContent: {
    paddingRight: 20,
    paddingLeft: 5,
  },
  dataPointsIndicator: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  recommendationHeader: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#1c4722',
    marginLeft: 8,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
    loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
    fontStyle: 'italic',
  },
  weatherPredictionCard: {
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1c4722',
    marginBottom: 10,
  },
  predictionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  predictionStat: {
    alignItems: 'center',
    flex: 1,
  },
  predictionValue: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333',
    marginTop: 2,
  },
  predictionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
  riskIndicator: {
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  riskText: {
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1c4722',
    marginRight: 10,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  plantingMonths: {
    marginVertical: 8,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  monthsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  monthChip: {
    backgroundColor: '#e0f2f1',
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 8,
    marginBottom: 4,
  },
  monthText: {
    fontSize: 12,
    color: '#00796b',
  },
  riskSection: {
    marginTop: 5,
    marginBottom: 5,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  recommendationsSection: {
    marginTop: 5,
    marginBottom: 5,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  recommendationText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 5,
  },
  alternativesSection: {
    marginTop: 5,
    marginBottom: 5,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  alternativeText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 5,
  },
  tipsContainer: {
    marginTop: 15,
    marginBottom: 25,
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    padding: 15,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipContent: {
    marginLeft: 12,
    flex: 1,
  },
  tipTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
    color: '#333',
  },
  tipText: {
    fontSize: 13,
    color: '#555',
  },
  optimalConditions: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
    padding: 12,
  },
  npkSection: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 12,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryScrollView: {
    marginTop: 10,
  },
  categoryCard: {
    width: 120,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeCategoryCard: {
    borderColor: '#1c4722',
    backgroundColor: '#f0f8f0',
  },
  categoryIconContainer: {
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  activeCategoryName: {
    color: '#1c4722',
    fontWeight: 'bold',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categorySummary: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categorySummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c4722',
    marginBottom: 4,
  },
  categorySummarySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statusSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flex: 0.48,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusSummaryText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  conditionText: {
    fontSize: 13,
    color: '#555',
    marginVertical: 2,
    lineHeight: 18,
  },
  detailView: {
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    color: '#1c4722',
    fontWeight: '600',
    marginLeft: 6,
  },
  detailedRecommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  plantListContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c4722',
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  plantListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    marginBottom: 8,
  },
  plantListInfo: {
    flex: 1,
  },
  plantListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  plantListName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c4722',
    flex: 1,
  },
  compactStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  compactStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  quickSummary: {
    marginTop: 4,
  },
  quickSummaryText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});
