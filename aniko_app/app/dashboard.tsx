import supabase from "./CONFIG/supaBase";  // Import Supabase client from CONFIG folder
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// TypeScript interfaces
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
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Add separate state for current user
  const [weather, setWeather] = useState({
    city: "Olongapo",
    temperature: "31°C",
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

  const [cropsStatus, setCropsStatus] = useState("Good");
  const router = useRouter();

  // Get current user on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First try to get authenticated user
        const authUserFound = await getCurrentUser();
        
        // If no authenticated user found, fallback to last logged in user
        if (!authUserFound) {
          console.log('No authenticated user found, getting last logged in user');
          const lastUserFound = await getLastLoggedInUser();
          if (!lastUserFound) {
            console.log('No users found at all');
          }
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        // Fallback to last logged in user
        await getLastLoggedInUser();
      }
    };

    fetchUserData();
  }, []);

  // Function to get the most recently logged in user
  const getLastLoggedInUser = async () => {
    try {
      console.log('Fetching last logged in user from database...');
      // Get the most recently logged in user from the database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('last_login', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching last logged user:', error);
        return false;
      }
      
      if (data && data.length > 0) {
        setCurrentUser(data[0]);
        console.log('Current user set to:', data[0].username);
        return true;
      } else {
        console.log('No users found in database');
        return false;
      }
    } catch (error) {
      console.error('Error getting last logged user:', error);
      return false;
    }
  };

  // Function to get current user from Supabase
  const getCurrentUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth user:', user);
      
      if (authError) {
        console.error('Auth error:', authError);
        return false;
      }
      
      if (user) {
        // Get additional user info from the users table
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user data from users table:', error);
          // Use auth user data as fallback
          setUser(user);
          return true;
        } else {
          setUser(data);
          console.log('User set from users table:', data);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error getting current user:', error);
      return false;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                console.error('Error signing out:', error);
                Alert.alert("Error", "Failed to logout. Please try again.");
              } else {
                // Successfully logged out, navigate to index
                router.replace("/");
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert("Error", "An unexpected error occurred during logout.");
            }
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>
              Good Morning, {currentUser?.username || (user && 'username' in user ? user.username : user?.email?.split('@')[0]) || "User"}
            </Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="gray" />
            <TextInput style={styles.searchInput} placeholder="Search" />
          </View>
          <Ionicons name="notifications" size={24} color="white" />
        </View>

        {/* Weather Section */}
        <View style={styles.weatherContainer}>
          <Text style={styles.city}>{weather.city}</Text>
          <Text style={styles.temperature}>{weather.temperature}</Text>
          <Text style={styles.weatherCondition}>{weather.condition}</Text>
          <Text style={styles.highLow}>{weather.highLow}</Text>

          <ScrollView horizontal style={styles.weatherForecast} showsHorizontalScrollIndicator={false}>
            {weather.hourlyWeather.map((item, index) => (
              <View key={index} style={styles.weatherHour}>
                <Text style={styles.weatherHourText}>{item.time}</Text>
                <Ionicons name={item.icon} size={20} color="#76c7c0" />
                <Text style={styles.weatherHourTemp}>{item.temp}°</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.viewWeatherButton}>
            <Text style={styles.viewWeatherButtonText}>View Today's Weather</Text>
          </TouchableOpacity>
        </View>

        {/* My Crops Section */}
        <View style={styles.cropsContainer}>
          <Text style={styles.sectionTitle}>My Crops</Text>
          <View style={styles.cropsStatus}>
            <Text style={styles.statusLabel}>Status: </Text>
            <Text style={styles.status}>{cropsStatus}</Text>
          </View>
          <TouchableOpacity style={styles.diagnosisButton}>
            <Text style={styles.buttonText}>Plant Diagnosis</Text>
          </TouchableOpacity>
        </View>

        {/* Weather History Section */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Weather History: Last week</Text>
          <View style={styles.weatherHistory}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <View key={index} style={styles.weatherDay}>
                <Text style={styles.dayText}>{day}</Text>
                <Text style={styles.dayStatus}>Good</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Add bottom padding to prevent content from being hidden behind footer */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="leaf" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="camera" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="home" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollContainer: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: "#3b7e2a",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    marginLeft: 5,
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 8,
    borderRadius: 15,
    width: 150,
    marginHorizontal: 10,
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    color: "gray",
  },
  weatherContainer: {
    backgroundColor: "#76c7c0",
    padding: 20,
    margin: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  city: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  temperature: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
    marginVertical: 5,
  },
  weatherCondition: {
    fontSize: 18,
    color: "white",
    marginBottom: 5,
  },
  highLow: {
    fontSize: 16,
    color: "white",
    marginBottom: 15,
  },
  weatherForecast: {
    flexDirection: "row",
    marginVertical: 15,
  },
  weatherHour: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
    minWidth: 60,
  },
  weatherHourText: {
    color: "#3b7e2a",
    fontSize: 12,
    fontWeight: "bold",
  },
  weatherHourTemp: {
    color: "#3b7e2a",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
  viewWeatherButton: {
    marginTop: 15,
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  viewWeatherButtonText: {
    color: "#3b7e2a",
    fontWeight: "bold",
    fontSize: 16,
  },
  cropsContainer: {
    padding: 20,
    marginHorizontal: 15,
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3b7e2a",
    marginBottom: 10,
  },
  cropsStatus: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 16,
    color: "#666",
  },
  status: {
    fontWeight: "bold",
    color: "#4CAF50",
    fontSize: 16,
  },
  diagnosisButton: {
    marginTop: 15,
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  historyContainer: {
    padding: 20,
    marginHorizontal: 15,
    backgroundColor: "#e8f5e8",
    borderRadius: 15,
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3b7e2a",
    marginBottom: 15,
  },
  weatherHistory: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weatherDay: {
    alignItems: "center",
    flex: 1,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3b7e2a",
    marginBottom: 5,
  },
  dayStatus: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#3b7e2a",
    paddingVertical: 15,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    padding: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  bottomPadding: {
    height: 80, // Height of footer + some extra space
  },
});