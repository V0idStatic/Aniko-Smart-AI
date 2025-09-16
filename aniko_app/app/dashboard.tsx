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
} from "react-native";
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

export default function Dashboard() {
  const [user, setUser] = useState<User | AuthUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [weather] = useState({
    city: "Olongapo",
    temperature: "31°",
    condition: "Partly Cloudy",
    highLow: "H:32° L:23°",
    hourlyWeather: [
      { time: "12PM", temp: "32", icon: "cloud" as keyof typeof Ionicons.glyphMap },
      { time: "1PM", temp: "32", icon: "cloud" as keyof typeof Ionicons.glyphMap },
      { time: "2PM", temp: "32", icon: "cloud" as keyof typeof Ionicons.glyphMap },
      { time: "3PM", temp: "31", icon: "cloud" as keyof typeof Ionicons.glyphMap },
      { time: "4PM", temp: "31", icon: "sunny" as keyof typeof Ionicons.glyphMap },
      { time: "5PM", temp: "30", icon: "sunny" as keyof typeof Ionicons.glyphMap },
    ],
  });

  const [cropsStatus] = useState("Good");
  const router = useRouter();

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

    fetchUserData();
  }, []);

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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="gray" />
          <TextInput placeholder="Search" style={styles.searchInput} placeholderTextColor="gray" />
        </View>
      </LinearGradient>

      {/* Floating Weather Card */}
      <View style={styles.weatherCard}>
        {/* Weather Header Row */}
        <View style={styles.weatherHeaderRow}>
          {/* Left Column: City + Temp */}
          <View>
            <Text style={styles.weatherCity}>{weather.city}</Text>
            <Text style={styles.weatherTemp}>{weather.temperature}</Text>
          </View>

          {/* Right Column: Condition + High/Low + Icon */}
          <View style={styles.weatherRightColumn}>
            <Ionicons name="partly-sunny" size={30} color="white" style={{ marginBottom: 4 }} />
            <Text style={styles.weatherCondition}>{weather.condition}</Text>
            <Text style={styles.weatherHighLow}>{weather.highLow}</Text>
          </View>
        </View>


        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
          {weather.hourlyWeather.map((item, index) => (
            <View key={index} style={styles.weatherHourCard}>
              <Text style={styles.weatherHour}>{item.time}</Text>
              <Ionicons name={item.icon} size={18} color="white" />
              <Text style={styles.weatherHourTemp}>{item.temp}°</Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.weatherButton}>
          <Text style={styles.weatherButtonText}>View Today's Weather</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>My Crops</Text>

        {/* Row with Status + Plant Diagnosis */}
        <View style={styles.cropRow}>
          {/* Status Card */}
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
            <Image
              source={require("../assets/plant-bg.png")}
              style={styles.diagnosisImage}
            />
            <View style={styles.diagnosisOverlay}>
              <Text style={styles.diagnosisTitle}>Plant Diagnosis</Text>
              <TouchableOpacity
                style={styles.tryNowButton}
                onPress={() => router.push("/plantdashboard")}>
                <Text style={styles.tryNowText}>Try Now</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Weather History Section */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            {/* Title and Legend in One Row */}
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyTitle}>Weather History: Last Week</Text>
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
            {[
              { day: "Mon", status: "Sunny", temp: "32°C", humidity: "60%" },
              { day: "Tue", status: "Cloudy", temp: "31°C", humidity: "64%" },
              { day: "Wed", status: "Sunny", temp: "32°C", humidity: "55%" },
              { day: "Thu", status: "Rainy", temp: "29°C", humidity: "75%" },
              { day: "Fri", status: "Sunny", temp: "33°C", humidity: "62%" },
              { day: "Sat", status: "Cloudy", temp: "31°C", humidity: "58%" },
              { day: "Sun", status: "Sunny", temp: "32°C", humidity: "60%" },
            ].map((item, i) => (
              <View key={i} style={styles.historyDayWrapper}>

                {/* DAY BOX */}
                <View
                  style={[
                    styles.dayBox,
                    i === 3 ? { backgroundColor: "#FFC107" } : { backgroundColor: "#4CAF50" },
                  ]}
                >
                  <Text style={styles.historyDayText}>{item.day}</Text>
                </View>

                {/* DETAILS BELOW */}
                <Text style={styles.historyDetails}>Weather: {item.status}</Text>
                <Text style={styles.historyDetails}>Temp: {item.temp}</Text>
                <Text style={styles.historyDetails}>Humidity: {item.humidity}</Text>
              </View>
            ))}
          </View>
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

  weatherCard: {
    position: "absolute",
    top: 140,
    left: 18,
    right: 18,
    backgroundColor: "#1c4722",
    borderRadius: 20,
    padding: 15,
    zIndex: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginTop: 20,
  },
  weatherHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  weatherRightColumn: {
    alignItems: "flex-end",
  },

  weatherCity: {
    fontSize: 17,
    color: "white",
    fontWeight: "600",
  },

  weatherTemp: {
    fontSize: 47,
    fontWeight: "bold",
    color: "white",
  },

  weatherCondition: {
    fontSize: 15,
    color: "white",
    fontWeight: "500",
  },

  weatherHighLow: {
    fontSize: 13,
    color: "white",
  },
  weatherHourCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 7,
    alignItems: "center",
    marginRight: 3,
    width: 50,
  },
  weatherHour: {
    fontSize: 10,
    color: "white",
    marginBottom: 3
  },
  weatherHourTemp: {
    fontSize: 11,
    fontWeight: "bold",
    color: "white",
  },
  weatherButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    paddingVertical: 8,
    marginTop: 7,
    alignItems: "center",
    borderColor: "#ffffffff",
    borderWidth: 1,
  },
  weatherButtonText: {
    color: "#ffffffff",
    fontWeight: "bold",
  },

  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 190,
    paddingBottom: 100,
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
