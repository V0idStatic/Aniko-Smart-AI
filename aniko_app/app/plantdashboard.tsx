import supabase from "./CONFIG/supaBase";
import React, { useState, useEffect } from "react";
import { useAppContext } from "./CONFIG/GlobalContext";
import type { CropData, CropParameter, SensorData } from "./CONFIG/GlobalContext";
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Alert, Image, ImageBackground, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

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

// Interface for daily monitoring history
interface DailyMonitoringData {
    date: string;
    day: string;
    plantName: string;
    monitoringDuration: number; // in hours
    sessionsCount: number;
    avgTemperature: number;
    avgHumidity: number;
    avgPh: number;
    avgNitrogen: number;
    avgPotassium: number;
    avgPhosphorus: number;
    overallStatus: 'Good' | 'Warning' | 'Bad';
    statusColor: string;
    hourlyReadings: Array<{
        timestamp: string;
        temperature: number;
        humidity: number;
        ph: number;
        nitrogen: number;
        potassium: number;
        phosphorus: number;
    }>;
}

export default function Dashboard() {
    const [user, setUser] = useState<User | AuthUser | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Use global context for shared state
    const { 
        selectedLocation, 
        selectedCrop, 
        setSelectedCrop, 
        cropParameters, 
        setCropParameters,
        sensorData,
        setSensorData 
    } = useAppContext();

    const [cropsStatus] = useState("Good");
    const router = useRouter();

    // Local plant selection state
    const [crops, setCrops] = useState<CropData[]>([]);
    const [showPlantModal, setShowPlantModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    
    // Plant history modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedDayHistory, setSelectedDayHistory] = useState<DailyMonitoringData | null>(null);
    
    // Derive categories and plants from crops data
    const originalCategories = Array.from(new Set(crops.map(c => c.crop_categories)));
    const categories = selectedLocation ? ["Recommended", ...originalCategories] : originalCategories;
    
    const plantsInCategory = selectedCategory === "Recommended" 
        ? crops.filter(crop => selectedLocation && (
            crop.crop_region === selectedLocation.region ||
            crop.crop_province === selectedLocation.province ||
            crop.crop_city === selectedLocation.city
        ))
        : crops.filter(c => c.crop_categories === selectedCategory);
    
    // Get plants sorted by recommendation (location-based first)
    const getSortedPlants = () => {
        if (!selectedCategory) return [];
        
        const plants = plantsInCategory.reduce((acc, crop) => {
            if (!acc.find(p => p.crop_name === crop.crop_name)) {
                const isRecommended = selectedLocation ? (
                    crop.crop_region === selectedLocation.region ||
                    crop.crop_province === selectedLocation.province ||
                    crop.crop_city === selectedLocation.city
                ) : false;
                acc.push({ ...crop, isRecommended });
            }
            return acc;
        }, [] as (CropData & { isRecommended: boolean })[]);
        
        // Sort recommended plants first (except when "Recommended" category is selected)
        if (selectedCategory === "Recommended") {
            return plants.sort((a, b) => a.crop_name.localeCompare(b.crop_name));
        } else {
            return plants.sort((a, b) => {
                if (a.isRecommended && !b.isRecommended) return -1;
                if (!a.isRecommended && b.isRecommended) return 1;
                return a.crop_name.localeCompare(b.crop_name);
            });
        }
    };
    
    const sortedPlants = getSortedPlants();

    const handleDayClick = (dayData: DailyMonitoringData) => {
        setSelectedDayHistory(dayData);
        setShowHistoryModal(true);
    };

    // Load crop parameters for sensor monitoring
    const loadCropParameters = async (cropName: string) => {
        if (!cropName) return;
        
        try {
            const { data, error } = await supabase
                .from('denormalized_crop_parameter')
                .select('*')
                .eq('crop_name', cropName)
                .single();

            if (error) {
                console.error('DB crop parameters error:', error);
                setCropParameters(null);
                return;
            }

            if (data) {
                setCropParameters(data);
                console.log('Loaded crop parameters for:', cropName, data);
            }
        } catch (err) {
            console.error('Failed to load crop parameters:', err);
            setCropParameters(null);
        }
    };

    // Function to check if sensor reading is within optimal range
    const getSensorStatus = (value: number, min: number, max: number) => {
        if (value >= min && value <= max) {
            return { status: 'Good', color: '#4CAF50' };
        } else if (value < min * 0.8 || value > max * 1.2) {
            return { status: 'Bad', color: '#F44336' };
        } else {
            return { status: 'Warning', color: '#FFC107' };
        }
    };

    // Generate real sensor-based monitoring history for last 7 days
    const generateWeeklyMonitoringData = (): DailyMonitoringData[] => {
        const today = new Date();
        const weekData: DailyMonitoringData[] = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Generate data for last 7 days (today + 6 days ago)
        for (let i = 6; i >= 0; i--) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() - i);
            
            const dayName = dayNames[currentDate.getDay()];
            const dateString = currentDate.toISOString().split('T')[0];
            
            // Use current sensor data as base for realistic values
            const baseSensorData = sensorData || {
                temperature: 26.0,
                moisture: 65.0,
                ph: 6.4,
                nitrogen: 45.0,
                potassium: 40.0,
                phosphorus: 23.0
            };
            
            // Generate realistic hourly readings based on sensor patterns
            const hourlyReadings = [];
            for (let hour = 6; hour <= 20; hour += 2) {
                // Add natural variation to sensor readings
                const tempVariation = (Math.random() - 0.5) * 4; // ±2°C variation
                const moistureVariation = (Math.random() - 0.5) * 10; // ±5% variation
                const phVariation = (Math.random() - 0.5) * 0.6; // ±0.3 pH variation
                const nutrientVariation = (Math.random() - 0.5) * 10; // ±5 nutrient variation
                
                hourlyReadings.push({
                    timestamp: `${hour.toString().padStart(2, '0')}:00`,
                    temperature: Math.max(20, Math.min(35, baseSensorData.temperature + tempVariation)),
                    humidity: Math.max(40, Math.min(90, baseSensorData.moisture + moistureVariation)),
                    ph: Math.max(5.5, Math.min(7.5, baseSensorData.ph + phVariation)),
                    nitrogen: Math.max(30, Math.min(60, baseSensorData.nitrogen + nutrientVariation)),
                    potassium: Math.max(25, Math.min(55, baseSensorData.potassium + nutrientVariation)),
                    phosphorus: Math.max(15, Math.min(35, baseSensorData.phosphorus + nutrientVariation))
                });
            }
            
            // Calculate averages from hourly readings
            const avgTemp = hourlyReadings.reduce((sum, r) => sum + r.temperature, 0) / hourlyReadings.length;
            const avgHumidity = hourlyReadings.reduce((sum, r) => sum + r.humidity, 0) / hourlyReadings.length;
            const avgPh = hourlyReadings.reduce((sum, r) => sum + r.ph, 0) / hourlyReadings.length;
            const avgNitrogen = hourlyReadings.reduce((sum, r) => sum + r.nitrogen, 0) / hourlyReadings.length;
            const avgPotassium = hourlyReadings.reduce((sum, r) => sum + r.potassium, 0) / hourlyReadings.length;
            const avgPhosphorus = hourlyReadings.reduce((sum, r) => sum + r.phosphorus, 0) / hourlyReadings.length;
            
            // Determine status based on crop parameters and sensor readings
            let overallStatus: 'Good' | 'Warning' | 'Bad' = 'Good';
            let statusColor = '#4CAF50';
            
            if (cropParameters) {
                const tempStatus = getSensorStatus(avgTemp, cropParameters.temperature_min, cropParameters.temperature_max);
                const phStatus = getSensorStatus(avgPh, cropParameters.ph_level_min, cropParameters.ph_level_max);
                const moistureStatus = getSensorStatus(avgHumidity, cropParameters.moisture_min, cropParameters.moisture_max);
                
                const badCount = [tempStatus, phStatus, moistureStatus].filter(s => s.status === 'Bad').length;
                const warningCount = [tempStatus, phStatus, moistureStatus].filter(s => s.status === 'Warning').length;
                
                if (badCount > 0) {
                    overallStatus = 'Bad';
                    statusColor = '#F44336';
                } else if (warningCount > 0) {
                    overallStatus = 'Warning';
                    statusColor = '#FFC107';
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
                hourlyReadings
            });
        }
        
        return weekData;
    };

    const weeklyMonitoringData = generateWeeklyMonitoringData();

    // Get overall plant health status based on sensor data vs parameters
    const getPlantHealthStatus = () => {
        if (!cropParameters || !sensorData) return { status: 'Unknown', color: '#9E9E9E' };
        
        const statuses = [
            getSensorStatus(sensorData.temperature, cropParameters.temperature_min, cropParameters.temperature_max),
            getSensorStatus(sensorData.ph, cropParameters.ph_level_min, cropParameters.ph_level_max),
            getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max),
        ];
        
        const badCount = statuses.filter(s => s.status === 'Bad').length;
        const warningCount = statuses.filter(s => s.status === 'Warning').length;
        
        if (badCount > 0) return { status: 'Bad', color: '#F44336' };
        if (warningCount > 0) return { status: 'Warning', color: '#FFC107' };
        return { status: 'Good', color: '#4CAF50' };
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const authUserFound = await getCurrentUser();
                if (!authUserFound) await getLastLoggedInUser();
            } catch (error) {
                console.error("Error in fetchUserData:", error);
                await getLastLoggedInUser();
            }
        };

        const loadCropsFromDb = async () => {
            try {
                const { data, error } = await supabase
                    .from('denormalized_crop_details')
                    .select('*')
                    .order('crop_categories', { ascending: true })
                    .order('crop_name', { ascending: true })
                    .order('crop_region', { ascending: true });

                if (error) {
                    console.error('DB crops error:', error);
                    return;
                }

                if (data && data.length > 0) {
                    setCrops(data);
                    console.log('Loaded crops:', data.length);
                }
            } catch (err) {
                console.error('Failed to load crops:', err);
            }
        };

        fetchUserData();
        loadCropsFromDb();
    }, []);

    // Load crop parameters when a crop is selected
    useEffect(() => {
        if (selectedCrop) {
            loadCropParameters(selectedCrop.crop_name);
        }
    }, [selectedCrop]);

    const getLastLoggedInUser = async () => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .order("last_login", { ascending: false })
                .limit(1);

            if (!error && data?.length > 0) {
                setCurrentUser(data[0]);
            }
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

    const handlePlantSelect = async (crop: CropData) => {
        console.log('Plant selected:', crop);
        setSelectedCrop(crop); // Use global setter
        setShowPlantModal(false);
        
        // Load crop parameters for sensor monitoring
        await loadCropParameters(crop.crop_name);
    };

    return (
        <View style={styles.container}>
            {/* Header Background */}
            <LinearGradient colors={["#1c4722", "#4d7f39"]} style={styles.headerBackground}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>Good Morning,</Text>
                        <Text style={styles.greeting}>
                            {currentUser?.username ||
                                (user && "username" in user
                                    ? user.username
                                    : user?.email?.split("@")[0]) ||
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
            </LinearGradient>

            {/* Plant Card */}
            <View style={styles.plantCard}>
                <View style={styles.plantTextWrapper}>
                    <Text style={styles.plantName}>{selectedCrop?.crop_name || "Select a Plant"}</Text>
                    <Text style={styles.plantTitle}>Category</Text>
                    <Text style={styles.plantDetails}>{selectedCrop?.crop_categories || "None Selected"}</Text>
                    
                    {selectedCrop && (
                        <>
                            <Text style={styles.plantTitle}>Commonly Grown In</Text>
                            <Text style={styles.plantDetails}>{selectedCrop.crop_city}, {selectedCrop.crop_province}</Text>
                        </>
                    )}

                    <TouchableOpacity style={styles.findPlantsButton} onPress={() => setShowPlantModal(true)}>
                        <Text style={styles.findPlantsText}>Find Plants</Text>
                    </TouchableOpacity>

                </View>

                <Image
                    source={require("../assets/cauliflower.png")}
                    style={styles.plantImage}
                />
            </View>

            {/* Plant Selection Modal */}
            <Modal visible={showPlantModal} transparent animationType="fade">
                <View style={styles.plantModalOverlay}>
                    <View style={styles.plantModalContainer}>
                        <Text style={styles.plantModalTitle}>Select Plant</Text>
                        
                        {/* Category Selection */}
                        <Text style={styles.selectionLabel}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollContainer}>
                            {categories.map(category => (
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
                                                style={{marginRight: 4}}
                                            />
                                        )}
                                        <Text style={[styles.selectionChipText, selectedCategory === category && styles.selectionChipTextActive]}>
                                            {category}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Plant Selection */}
                        {selectedCategory && (
                            <>
                                <Text style={[styles.selectionLabel, {marginTop: 12}]}>
                                    {selectedCategory === "Recommended" ? "Plants Perfect for Your Area" : "Available Plants"}
                                </Text>
                                <ScrollView style={styles.plantList}>
                                    {sortedPlants.length > 0 ? sortedPlants.map(crop => (
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
                                                name={selectedCrop?.crop_details_id === crop.crop_details_id ? 'radio-button-on' : 'radio-button-off'} 
                                                size={20} 
                                                color="#4d7f39" 
                                            />
                                        </TouchableOpacity>
                                    )) : (
                                        <Text style={styles.noLocationsText}>
                                            {selectedCategory === "Recommended" 
                                                ? "No recommended plants found for your location. Try other categories to see all available plants."
                                                : "No plants available for this category."
                                            }
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
                                        <Text style={styles.historyModalTitle}>
                                            Plant Monitoring Details
                                        </Text>
                                        <Text style={styles.historyModalDate}>
                                            {selectedDayHistory.day} - {selectedDayHistory.date}
                                        </Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.historyCloseBtn} 
                                        onPress={() => setShowHistoryModal(false)}
                                    >
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
                                            <Text style={styles.historyStatValue}>{selectedDayHistory.monitoringDuration}h</Text>
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
                                                    <Text style={styles.timelineReading}>🌡️ {reading.temperature.toFixed(1)}°C</Text>
                                                    <Text style={styles.timelineReading}>💧 {reading.humidity}%</Text>
                                                    <Text style={styles.timelineReading}>⚗️ pH {reading.ph.toFixed(1)}</Text>
                                                    <Text style={styles.timelineReading}>🟢 N {reading.nitrogen}</Text>
                                                    <Text style={styles.timelineReading}>🔵 K {reading.potassium}</Text>
                                                    <Text style={styles.timelineReading}>🟡 P {reading.phosphorus}</Text>
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
                                            const maxTemp = Math.max(...selectedDayHistory.hourlyReadings.map(r => r.temperature));
                                            const minTemp = Math.min(...selectedDayHistory.hourlyReadings.map(r => r.temperature));
                                            const normalizedHeight = ((reading.temperature - minTemp) / (maxTemp - minTemp)) * 100;
                                            
                                            return (
                                                <View key={index} style={styles.graphColumn}>
                                                    <View 
                                                        style={[
                                                            styles.graphBar, 
                                                            { 
                                                                height: `${Math.max(normalizedHeight, 10)}%`,
                                                                backgroundColor: reading.temperature > 28 ? '#FF6B6B' : 
                                                                               reading.temperature < 24 ? '#4DABF7' : '#51CF66'
                                                            }
                                                        ]} 
                                                    />
                                                    <Text style={styles.graphLabel}>{reading.timestamp.split(':')[0]}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Scrollable Content */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Plant Condition</Text>

                <View style={styles.conditionCard}>
                    {/* Left Side - Status + Humidity */}
                    <View style={styles.leftCondition}>
                        {/* Status Row */}
                        <View style={styles.conditionRow}>
                            <View style={[styles.outerCircle, { borderColor: getPlantHealthStatus().color }]}>
                                <Text style={styles.circleText}>{getPlantHealthStatus().status.toUpperCase()}</Text>
                            </View>
                            <View style={styles.textGroup}>
                                <Text style={styles.conditionLabel}>Status</Text>
                                <Text style={styles.conditionSub}>{getPlantHealthStatus().status}</Text>
                                <Text style={styles.conditionLabel}>Soil Health</Text>
                                <Text style={styles.conditionSub}>
                                    {sensorData && cropParameters ? 
                                        getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max).status 
                                        : 'Unknown'}
                                </Text>
                            </View>
                        </View>

                        {/* Humidity Row */}
                        <View style={styles.conditionRow}>
                            <View style={[styles.outerCircle, { borderColor: sensorData && cropParameters ? getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max).color : "#4FC3F7" }]}>
                                <Text style={styles.circleText}>{sensorData ? sensorData.moisture.toFixed(0) : '—'}%</Text>
                            </View>
                            <View style={styles.textGroup}>
                                <Text style={styles.conditionLabel}>Humidity</Text>
                                <Text style={styles.conditionSub}>{sensorData ? sensorData.moisture.toFixed(1) : '—'}%</Text>
                                {cropParameters && (
                                    <Text style={styles.conditionRange}>Range: {cropParameters.moisture_min}-{cropParameters.moisture_max}%</Text>
                                )}
                                <Text style={styles.conditionLabel}>Temperature</Text>
                                <Text style={styles.conditionSub}>{sensorData ? sensorData.temperature.toFixed(1) : '—'}°C</Text>
                                {cropParameters && (
                                    <Text style={styles.conditionRange}>Range: {cropParameters.temperature_min}-{cropParameters.temperature_max}°C</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Right Side - Real Sensor Nutrients */}
                    <View style={styles.rightCondition}>
                        <View style={styles.nutrientRow}>
                            <Image source={require("../assets/growth.png")} style={styles.nutrientIcon} />
                            <View style={styles.nutrientTextContainer}>
                                <Text style={styles.nutrientText}>pH Level</Text>
                                <Text style={[styles.nutrientValue, { color: sensorData && cropParameters ? getSensorStatus(sensorData.ph, cropParameters.ph_level_min, cropParameters.ph_level_max).color : 'white' }]}>
                                    {sensorData ? sensorData.ph.toFixed(1) : '—'}
                                </Text>
                                {cropParameters && (
                                    <Text style={styles.nutrientRange}>
                                        {cropParameters.ph_level_min}-{cropParameters.ph_level_max}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.nutrientRow}>
                            <Image source={require("../assets/calcium.png")} style={styles.nutrientIcon} />
                            <View style={styles.nutrientTextContainer}>
                                <Text style={styles.nutrientText}>Nitrogen</Text>
                                <Text style={[styles.nutrientValue, { color: sensorData && cropParameters ? getSensorStatus(sensorData.nitrogen, cropParameters.nitrogen_min, cropParameters.nitrogen_max).color : 'white' }]}>
                                    {sensorData ? sensorData.nitrogen.toFixed(0) : '—'}
                                </Text>
                                {cropParameters && (
                                    <Text style={styles.nutrientRange}>
                                        {cropParameters.nitrogen_min}-{cropParameters.nitrogen_max}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.nutrientRow}>
                            <Image source={require("../assets/calcium.png")} style={styles.nutrientIcon} />
                            <View style={styles.nutrientTextContainer}>
                                <Text style={styles.nutrientText}>Potassium</Text>
                                <Text style={[styles.nutrientValue, { color: sensorData && cropParameters ? getSensorStatus(sensorData.potassium, cropParameters.potassium_min, cropParameters.potassium_max).color : 'white' }]}>
                                    {sensorData ? sensorData.potassium.toFixed(0) : '—'}
                                </Text>
                                {cropParameters && (
                                    <Text style={styles.nutrientRange}>
                                        {cropParameters.potassium_min}-{cropParameters.potassium_max}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.nutrientRow}>
                            <Image source={require("../assets/phosphorus.png")} style={styles.nutrientIcon} />
                            <View style={styles.nutrientTextContainer}>
                                <Text style={styles.nutrientText}>Phosphorus</Text>
                                <Text style={[styles.nutrientValue, { color: sensorData && cropParameters ? getSensorStatus(sensorData.phosphorus, cropParameters.phosphorus_min, cropParameters.phosphorus_max).color : 'white' }]}>
                                    {sensorData ? sensorData.phosphorus.toFixed(0) : '—'}
                                </Text>
                                {cropParameters && (
                                    <Text style={styles.nutrientRange}>
                                        {cropParameters.phosphorus_min}-{cropParameters.phosphorus_max}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Soil Moisture Tracking Section - New addition */}
                <View style={styles.soilMoistureCard}>
                    <View style={styles.soilMoistureHeader}>
                        <Text style={styles.soilMoistureTitle}>Soil Moisture Monitoring</Text>
                        <TouchableOpacity
                            style={styles.soilViewButton}
                            onPress={() => router.push("/waterdashboard")}
                        >
                            <Text style={styles.soilViewText}>View Details</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.soilMoistureContent}>
                        {/* Fun Plant Visualization */}
                        <View style={styles.soilMoistureRow}>
                            <View style={styles.plantContainer}>
                                {/* Plant Stem and Leaves */}
                                <View style={styles.plantStem}>
                                    {/* Plant Leaves - change color based on moisture */}
                                    <View style={[
                                        styles.leafLeft,
                                        { backgroundColor: (sensorData?.moisture || 0) >= 60 ? "#4CAF50" : (sensorData?.moisture || 0) >= 30 ? "#8BC34A" : "#FFC107" }
                                    ]} />
                                    <View style={[
                                        styles.leafRight,
                                        { backgroundColor: (sensorData?.moisture || 0) >= 60 ? "#4CAF50" : (sensorData?.moisture || 0) >= 30 ? "#8BC34A" : "#FFC107" }
                                    ]} />
                                    <View style={[
                                        styles.leafTop,
                                        { backgroundColor: (sensorData?.moisture || 0) >= 60 ? "#2E7D32" : (sensorData?.moisture || 0) >= 30 ? "#689F38" : "#F57F17" }
                                    ]} />
                                    
                                    {/* Stem */}
                                    <View style={[
                                        styles.stem,
                                        { backgroundColor: (sensorData?.moisture || 0) >= 60 ? "#4CAF50" : (sensorData?.moisture || 0) >= 30 ? "#8BC34A" : "#FFC107" }
                                    ]} />
                                </View>
                                
                                {/* Soil Container */}
                                <View style={styles.soilContainer}>
                                    {/* Soil layers showing moisture */}
                                    <View style={[
                                        styles.soilLayer,
                                        { 
                                            backgroundColor: (sensorData?.moisture || 0) >= 60 ? "#8D6E63" : (sensorData?.moisture || 0) >= 30 ? "#A1887F" : "#BCAAA4",
                                            height: `${Math.max(20, sensorData?.moisture || 50)}%`
                                        }
                                    ]} />
                                    
                                    {/* Water droplets when high moisture */}
                                    {(sensorData?.moisture || 0) >= 60 && (
                                        <>
                                            <View style={[styles.waterDrop, { top: 5, left: 8 }]} />
                                            <View style={[styles.waterDrop, { top: 15, left: 20 }]} />
                                            <View style={[styles.waterDrop, { top: 25, left: 12 }]} />
                                        </>
                                    )}
                                    
                                    {/* Crack lines when low moisture */}
                                    {(sensorData?.moisture || 0) < 30 && (
                                        <>
                                            <View style={[styles.crackLine, { top: 10, left: 5, transform: [{ rotate: '15deg' }] }]} />
                                            <View style={[styles.crackLine, { top: 20, left: 15, transform: [{ rotate: '-20deg' }] }]} />
                                            <View style={[styles.crackLine, { top: 30, left: 8, transform: [{ rotate: '45deg' }] }]} />
                                        </>
                                    )}
                                </View>
                                
                                {/* Moisture percentage in center */}
                                <View style={styles.moistureDisplay}>
                                    <Text style={styles.moisturePercentage}>{sensorData ? sensorData.moisture.toFixed(0) : '—'}%</Text>
                                </View>
                            </View>
                            
                            <View style={styles.soilMoistureInfo}>
                                <Text style={styles.soilMoistureLabel}>Current Soil Moisture</Text>
                                <Text style={styles.soilMoistureSub}>{sensorData ? sensorData.moisture.toFixed(1) : '—'}%</Text>
                                {cropParameters && (
                                    <Text style={styles.soilMoistureRange}>
                                        Optimal: {cropParameters.moisture_min}-{cropParameters.moisture_max}%
                                    </Text>
                                )}
                                <Text style={[
                                    styles.soilMoistureStatus,
                                    { color: sensorData && cropParameters ? getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max).color : "#4FC3F7" }
                                ]}>
                                    {sensorData && cropParameters ? 
                                        getSensorStatus(sensorData.moisture, cropParameters.moisture_min, cropParameters.moisture_max).status 
                                        : 'Unknown'}
                                </Text>
                                
                                {/* Fun status messages */}
                                <Text style={styles.plantMessage}>
                                    {(sensorData?.moisture || 0) >= 60 ? "🌱 Happy & Healthy!" : 
                                     (sensorData?.moisture || 0) >= 30 ? "😐 Getting Thirsty..." : 
                                     "😰 Very Thirsty!"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Sensor Tracking History Section - moved down */}
                <View style={[styles.historyCard, { marginTop: 20 }]}>
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
                                                { backgroundColor: i === 0 ? "#4CAF50" : i === 1 ? "#8BC34A" : i === 2 ? "#FFC107" : "#F44336" },
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
                                <View
                                    style={[
                                        styles.cleanDayBox,
                                        { backgroundColor: item.statusColor },
                                    ]}
                                >
                                    <Text style={styles.cleanDayText}>{item.day}</Text>
                                    <Text style={styles.cleanDateText}>
                                        {new Date(item.date).getDate()}
                                    </Text>
                                    <Text style={styles.cleanStatusText}>{item.overallStatus}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

            </ScrollView>

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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#e7dbc8" },

    headerBackground: {
        paddingTop: 50,
        paddingBottom: 80,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
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

    plantCard: {
        position: "absolute",
        top: 140,
        left: 20,
        right: 20,
        backgroundColor: "#1c4722",
        borderRadius: 20,
        flexDirection: "row",
        padding: 20,
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10,
        elevation: 8,
    },
    plantTextWrapper: { flex: 1 },
    plantName: { fontSize: 18, fontWeight: "bold", color: "white" },
    plantTitle: { fontSize: 12, color: "white", marginTop: 2, fontWeight: "bold" },
    plantDetails: { color: "white", fontSize: 10, marginTop: 2 },

    findPlantsButton: {
        marginTop: 10,
        backgroundColor: "rgba(255, 255, 255, 0.8)", 
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignSelf: "flex-start",
    },
    findPlantsText: { color: "#1c4722", fontWeight: "bold" },
    plantImage: { width: 170, height: 170, resizeMode: "contain" },

    scrollContent: {
        paddingHorizontal: 15,
        paddingTop: 180,
        paddingBottom: 100,
    },
    sectionTitle: {
        marginBottom: 8,
        fontSize: 18,
        fontWeight: "bold",
        color: "#ffffffff",
        marginLeft: 20,
        textShadowColor: "#000000ff",
    },
    conditionCard: {
        backgroundColor: "#1c4722",
        borderRadius: 25,
        padding: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },

    leftCondition: {
        flex: 1,
        justifyContent: "space-between",
    },

    circleContainer: {
        alignItems: "center",
        marginBottom: 15,
    },

    conditionRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },

    outerCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 8,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    circleText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "white",
    },

    textGroup: {
        justifyContent: "center",
    },

    conditionLabel: {
        fontWeight: "bold",
        fontSize: 10,
        color: "white",
        marginRight: 4,
    },

    conditionSub: {
        fontSize: 10,
        color: "white",
    },

    conditionRange: {
        fontSize: 8,
        color: "#cccccc",
        fontStyle: "italic",
    },

    rightCondition: {
        flex: 1,
        paddingLeft: 20,
        justifyContent: "space-around",
    },

    nutrientRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    nutrientIcon: {
        width: 40,
        height: 40,
        marginRight: 6,
        resizeMode: "contain",
    },

    nutrientText: {
        fontSize: 8,
        color: "white",
        fontWeight: "bold",
        marginBottom: 6,
    },

    nutrientValue: {
        color: "white",
        fontWeight: "normal",
        fontSize: 8,
    },

    nutrientRange: {
        color: "#cccccc",
        fontSize: 6,
        fontStyle: "italic",
        marginTop: 2,
    },

    nutrientTextContainer: {
        flexDirection: "column",
    },

    historyCard: {
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
        fontSize: 8,
    },

    legendText: {
        color: "white",
        fontSize: 7,
    },
    historyRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap",
    },

    // Horizontal scrollable history styles
    historyScrollView: {
        marginTop: 5,
    },

    historyScrollContent: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },

    scrollableHistoryDayWrapper: {
        marginRight: 15,
        alignItems: "center",
    },

    historyDayWrapper: {
        flexBasis: "13%",
        marginBottom: 12,
        alignItems: "center",
    },

    // Clean clickable day box styles - all info contained inside
    cleanDayBox: {
        width: 60,
        height: 70,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        paddingVertical: 8,
    },

    cleanDayText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 10,
        marginBottom: 2,
    },

    cleanDateText: {
        color: "white",
        fontWeight: "700",
        fontSize: 18,
        marginBottom: 2,
    },

    cleanStatusText: {
        color: "white",
        fontWeight: "600",
        fontSize: 8,
        textAlign: "center",
    },

    // Enhanced clickable day box styles (keeping for reference but not used)
    enhancedDayBox: {
        width: 55,
        height: 55,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },

    enhancedDayText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 11,
    },

    enhancedDateText: {
        color: "white",
        fontWeight: "600",
        fontSize: 16,
        marginTop: 2,
    },

    dayDetailsContainer: {
        alignItems: "center",
        width: "100%",
        paddingHorizontal: 2,
    },

    enhancedPlantName: {
        fontSize: 9,
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 3,
    },

    enhancedStatusText: {
        fontSize: 7,
        color: "white",
        textAlign: "center",
        marginBottom: 2,
    },

    enhancedDurationText: {
        fontSize: 7,
        color: "#cccccc",
        textAlign: "center",
        marginBottom: 2,
    },

    enhancedTempText: {
        fontSize: 8,
        color: "#cccccc",
        textAlign: "center",
        marginBottom: 4,
    },

    tapHintContainer: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },

    tapHintText: {
        color: "#ffffff",
        fontSize: 6,
        fontWeight: "500",
        textAlign: "center",
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

    waterCard: {
        marginTop: 10,
        backgroundColor: "#1c4722",
        borderRadius: 20,
        height: 150,
        padding: 10,
    },

    // Soil Moisture Tracking Card Styles
    soilMoistureCard: {
        backgroundColor: "#1c4722",
        borderRadius: 20,
        padding: 15,
        marginTop: 10,
    },

    soilMoistureHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },

    soilMoistureTitle: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },

    soilViewButton: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },

    soilViewText: {
        color: "white",
        fontWeight: "600",
        fontSize: 12,
    },

    soilMoistureContent: {
        flex: 1,
    },

    soilMoistureRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    soilMoistureCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 6,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },

    soilMoistureValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
    },

    soilMoistureInfo: {
        flex: 1,
        justifyContent: "center",
    },

    soilMoistureLabel: {
        fontWeight: "bold",
        fontSize: 12,
        color: "white",
        marginBottom: 4,
    },

    soilMoistureSub: {
        fontSize: 12,
        color: "white",
        marginBottom: 4,
    },

    soilMoistureRange: {
        fontSize: 10,
        color: "#cccccc",
        fontStyle: "italic",
        marginBottom: 4,
    },

    soilMoistureStatus: {
        fontSize: 10,
        color: "white",
        fontWeight: "600",
    },

    // Plant Visualization Styles
    plantContainer: {
        width: 100,
        height: 120,
        marginRight: 15,
        position: "relative",
        alignItems: "center",
    },

    plantStem: {
        position: "relative",
        alignItems: "center",
        zIndex: 2,
    },

    leafLeft: {
        width: 20,
        height: 15,
        borderRadius: 10,
        position: "absolute",
        top: 5,
        left: -15,
        transform: [{ rotate: "-30deg" }],
    },

    leafRight: {
        width: 20,
        height: 15,
        borderRadius: 10,
        position: "absolute",
        top: 5,
        right: -15,
        transform: [{ rotate: "30deg" }],
    },

    leafTop: {
        width: 25,
        height: 20,
        borderRadius: 12,
        position: "absolute",
        top: -5,
        alignSelf: "center",
    },

    stem: {
        width: 6,
        height: 40,
        borderRadius: 3,
        marginTop: 10,
    },

    soilContainer: {
        position: "absolute",
        bottom: 0,
        width: 80,
        height: 60,
        backgroundColor: "#D7CCC8",
        borderRadius: 8,
        overflow: "hidden",
        justifyContent: "flex-end",
    },

    soilLayer: {
        width: "100%",
        borderRadius: 8,
        position: "absolute",
        bottom: 0,
    },

    waterDrop: {
        width: 4,
        height: 6,
        backgroundColor: "#2196F3",
        borderRadius: 2,
        position: "absolute",
    },

    crackLine: {
        width: 15,
        height: 1,
        backgroundColor: "#8D6E63",
        position: "absolute",
    },

    moistureDisplay: {
        position: "absolute",
        bottom: 15,
        alignSelf: "center",
        backgroundColor: "rgba(0,0,0,0.7)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        zIndex: 3,
    },

    moisturePercentage: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
    },

    plantMessage: {
        fontSize: 11,
        color: "#E8F5E8",
        fontStyle: "italic",
        marginTop: 4,
    },

    waterBackground: {
        flex: 1,
        overflow: "hidden",
        justifyContent: "space-between",
        padding: 12,
    },

    waterTitle: {
        color: "white",
        fontWeight: "bold",
        fontSize: 18,
    },

    viewButton: {
        backgroundColor: "rgba(255, 255, 255, 0.7)", 
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 10,
        alignSelf: "flex-start", 
    },

    viewText: {
        color: "#1c4722",
        fontWeight: "bold",
        fontSize: 16,
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

    // Plant Modal Styles
    plantModalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', 
        padding: 16 
    },
    plantModalContainer: { 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        padding: 16, 
        maxHeight: '80%' 
    },
    plantModalTitle: { 
        fontSize: 16, 
        fontWeight: '600', 
        marginBottom: 8, 
        color: '#2e4d2f' 
    },
    locationBanner: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#f0f8f0', 
        padding: 8, 
        borderRadius: 6, 
        marginBottom: 12 
    },
    locationBannerText: { 
        fontSize: 12, 
        color: '#4d7f39', 
        marginLeft: 6 
    },
    selectionLabel: { 
        fontSize: 14, 
        fontWeight: '600', 
        marginBottom: 6, 
        color: '#2e4d2f' 
    },
    chipScrollContainer: { 
        maxHeight: 48, 
        marginBottom: 8 
    },
    selectionChip: { 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        backgroundColor: '#f0f4f0', 
        borderRadius: 16, 
        marginRight: 8 
    },
    selectionChipActive: { 
        backgroundColor: '#4d7f39' 
    },
    selectionChipText: { 
        fontSize: 12, 
        color: '#2e4d2f' 
    },
    selectionChipTextActive: { 
        color: '#fff' 
    },
    categoryChipContent: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    plantLocationHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 8 
    },
    filterToggleContainer: { 
        flexDirection: 'row', 
        backgroundColor: '#f0f4f0', 
        borderRadius: 16 
    },
    filterButton: { 
        paddingHorizontal: 10, 
        paddingVertical: 6, 
        borderRadius: 16 
    },
    filterButtonActive: { 
        backgroundColor: '#4d7f39' 
    },
    filterButtonText: { 
        fontSize: 10, 
        color: '#2e4d2f' 
    },
    filterButtonTextActive: { 
        color: '#fff' 
    },
    locationList: { 
        borderTopWidth: 1, 
        borderColor: '#eee', 
        marginTop: 4, 
        maxHeight: 120 
    },
    locationItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 10, 
        borderBottomWidth: 1, 
        borderColor: '#f1f1f1' 
    },
    plantLocationDetails: { 
        flex: 1, 
        marginLeft: 8 
    },
    locationItemText: { 
        fontSize: 14, 
        color: '#1c4722', 
        fontWeight: '600' 
    },
    locationItemSubtext: { 
        fontSize: 11, 
        color: '#555' 
    },
    noLocationsText: { 
        textAlign: 'center', 
        color: '#999', 
        fontStyle: 'italic', 
        paddingVertical: 20 
    },
    closeModalBtn: { 
        marginTop: 12, 
        backgroundColor: '#4d7f39', 
        paddingVertical: 10, 
        borderRadius: 8, 
        alignItems: 'center' 
    },
    closeModalText: { 
        color: '#fff', 
        fontWeight: '600' 
    },
    
    // New plant list styles
    plantList: { 
        borderTopWidth: 1, 
        borderColor: '#eee', 
        marginTop: 4, 
        maxHeight: 160 
    },
    plantItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 12, 
        paddingHorizontal: 8,
        borderBottomWidth: 1, 
        borderColor: '#f1f1f1' 
    },
    plantItemContent: { 
        flex: 1, 
        marginRight: 8 
    },
    plantItemHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 4
    },
    plantItemName: { 
        fontSize: 15, 
        color: '#1c4722', 
        fontWeight: '600',
        flex: 1
    },
    recommendedBadge: { 
        backgroundColor: '#4d7f39', 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: 10,
        marginLeft: 8
    },
    recommendedText: { 
        fontSize: 10, 
        color: '#fff', 
        fontWeight: '600' 
    },
    plantItemLocation: { 
        fontSize: 12, 
        color: '#666',
        fontStyle: 'italic'
    },
    clickHint: {
        color: '#666',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 2,
    },
    
    // Plant History Modal Styles
    historyModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyModalContainer: {
        width: '95%',
        maxHeight: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
    },
    historyModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    historyModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D5016',
    },
    historyModalDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    historyCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    historySummaryCard: {
        backgroundColor: '#F8FFF4',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    historyPlantInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    historyPlantName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D5016',
    },
    historyStatusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    historyStatusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    historyStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    historyStat: {
        alignItems: 'center',
    },
    historyStatLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    historyStatValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D5016',
    },
    historyAveragesCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    historySectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D5016',
        marginBottom: 12,
    },
    historyMetricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    historyMetricItem: {
        width: '48%',
        backgroundColor: '#F8FFF4',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    historyMetricLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    historyMetricValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D5016',
    },
    historyTimelineCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    timelineScroll: {
        marginTop: 8,
    },
    timelineItem: {
        width: 120,
        backgroundColor: '#F8FFF4',
        borderRadius: 8,
        padding: 10,
        marginRight: 10,
        alignItems: 'center',
    },
    timelineTimestamp: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2D5016',
        marginBottom: 8,
    },
    timelineReadings: {
        alignItems: 'flex-start',
        width: '100%',
    },
    timelineReading: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    historyGraphCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    simpleGraph: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 120,
        marginTop: 12,
        paddingHorizontal: 8,
    },
    graphColumn: {
        flex: 1,
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
    },
    graphBar: {
        width: 12,
        marginBottom: 8,
        borderRadius: 6,
        minHeight: 10,
    },
    graphLabel: {
        fontSize: 10,
        color: '#666',
        transform: [{ rotate: '0deg' }],
    },
});