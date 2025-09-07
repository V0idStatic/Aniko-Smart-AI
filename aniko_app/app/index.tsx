import { useEffect, useState } from "react";
import supabase from "./CONFIG/supaBase"; // Import Supabase client
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Login() {
  const [username, setUsername] = useState(""); // Username state
  const [error, setError] = useState(""); // Error state for login failures
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false); // State to track DB connection
  const [debugInfo, setDebugInfo] = useState(""); // Debug information
  const router = useRouter();

  interface User {
  id: string;
  username: string;
  last_login: string | null;
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: User | null;
  old: User | null;
}

interface RealtimeUpdate {
  type: string;
  timestamp: string;
  data: User | null;
}

const [allUsers, setAllUsers] = useState<User[]>([]);
const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimeUpdate[]>([]);

  // Real-time listener for changes in the users table
// Real-time listener for changes in the users table
useEffect(() => {
  let subscription: ReturnType<typeof supabase.channel> | null = null;

  const setupRealtime = async () => {
    try {
      console.log('Setting up realtime connection...');
      
      // Test if realtime is available
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) {
        console.error('Database not accessible for realtime:', error);
        setDebugInfo(prev => prev + '\nDatabase not accessible: ' + error.message);
        return;
      }

      subscription = supabase
        .channel('users-channel') // Use a simpler channel name
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users'
          },
          (payload: any) => {
            console.log('Real-time change received!', payload);
            
            try {
              // Validate payload structure
              if (!payload || typeof payload.eventType !== 'string') {
                console.error('Invalid payload structure:', payload);
                return;
              }

              // Type-safe access to payload data
              const newUser = payload.new as User | null;
              const oldUser = payload.old as User | null;

              // Add to real-time updates log with proper error handling
              setRealtimeUpdates((prev) => {
                try {
                  const updates = [
                    ...prev,
                    {
                      type: payload.eventType,
                      timestamp: new Date().toLocaleTimeString(),
                      data: newUser || oldUser
                    }
                  ].slice(-5); // Keep only last 5 updates
                  return updates;
                } catch (err) {
                  console.error('Error updating realtime log:', err);
                  return prev;
                }
              });

              // Update the users list based on the event type with proper validation
              switch (payload.eventType) {
                case 'INSERT':
                  if (newUser && newUser.id && newUser.username) {
                    setAllUsers((prev) => {
                      // Check if user already exists to prevent duplicates
                      const exists = prev.some(user => user.id === newUser.id);
                      if (!exists) {
                        return [...prev, newUser];
                      }
                      return prev;
                    });
                  }
                  break;
                  
                case 'UPDATE':
                  if (newUser && newUser.id) {
                    setAllUsers((prev) =>
                      prev.map((user) =>
                        user.id === newUser.id ? { ...user, ...newUser } : user
                      )
                    );
                  }
                  break;
                  
                case 'DELETE':
                  if (oldUser && oldUser.id) {
                    setAllUsers((prev) =>
                      prev.filter((user) => user.id !== oldUser.id)
                    );
                  }
                  break;
                  
                default:
                  console.warn('Unknown event type:', payload.eventType);
              }
            } catch (err) {
              console.error('Error processing realtime payload:', err);
              setDebugInfo(prev => prev + '\nError processing update: ' + 
                (err instanceof Error ? err.message : 'Unknown error'));
            }
          }
        )
        .subscribe((status, err) => {
          console.log('Real-time subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            setDebugInfo(prevInfo => prevInfo + '\n✅ Realtime subscribed successfully');
            console.log('✅ Successfully subscribed to realtime updates');
          } else if (status === 'CLOSED') {
            setDebugInfo(prevInfo => prevInfo + '\n❌ Realtime connection closed');
            console.warn('❌ Realtime connection closed');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime channel error:', err);
            setDebugInfo(prevInfo => prevInfo + '\n❌ Realtime channel error: ' + 
              (err ? JSON.stringify(err) : 'Unknown error'));
          } else if (status === 'TIMED_OUT') {
            console.error('❌ Realtime connection timed out');
            setDebugInfo(prevInfo => prevInfo + '\n❌ Realtime connection timed out');
          }
        });

    } catch (err) {
      console.error('Error setting up realtime:', err);
      setDebugInfo(prevInfo => 
        prevInfo + '\n❌ Realtime setup failed: ' + 
        (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  };

  // Add a small delay to ensure component is fully mounted
  const timer = setTimeout(() => {
    setupRealtime();
  }, 100);

  return () => {
    // Clear the setup timer if component unmounts before setup
    clearTimeout(timer);
    
    // Clean up subscription
    if (subscription) {
      try {
        console.log('Cleaning up realtime subscription...');
        supabase.removeChannel(subscription); // Use removeChannel instead of unsubscribe
        console.log('✅ Realtime subscription cleaned up');
      } catch (err) {
        console.error('❌ Error cleaning up subscription:', err);
      }
    }
  };
}, []); // Empty dependency array to run only once


  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from("users").select("count").limit(1);
      if (error) {
        console.error("Database connection failed:", error);
        setIsDatabaseConnected(false);
        setDebugInfo("DB connection failed: " + error.message);
      } else {
        console.log("Database connected successfully");
        setIsDatabaseConnected(true);
        setDebugInfo("DB connected successfully");
      }
    } catch (err) {
      console.error("Error during database connection test:", err);
      setIsDatabaseConnected(false);
    }
  };

  // Function to show all users in database
  const debugAllUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order('last_login', { ascending: false });
      if (error) {
        console.error("Error fetching all users:", error);
        setDebugInfo(prev => prev + "\nError fetching users: " + error.message);
      } else {
        console.log("All users in database:", data);
        setAllUsers(data);
        setDebugInfo(prev => prev + `\nFound ${data.length} users in database`);
      }
    } catch (err) {
      console.error("Error in debugAllUsers:", err);
    }
  };

  // Handle login logic for username
  const handleLogin = async () => {
    try {
      const searchUsername = username.trim();
      setDebugInfo(`Searching for: ${searchUsername}`);
      console.log("Searching for username:", searchUsername);

      // Query the users table to find a matching username
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .ilike("username", `%${searchUsername}%`) // Use ilike with wildcards for better matching
        .limit(1);

      if (error) {
        setError("Database error: " + error.message);
        console.error("Login Error:", error);
        setDebugInfo(prev => prev + "\nQuery error: " + error.message);
        return;
      }

      if (!data || data.length === 0) {
        setError("Username not found. Please check your username or sign up.");
        setDebugInfo(prev => prev + "\nNo user found with that username");
        return;
      }

      const user = data[0]; // Get the first user

      console.log("User logged in:", user);
      setDebugInfo(prev => prev + "\nUser found: " + JSON.stringify(user));

      // Update last_login after successful login with proper ISO string
      const newLastLogin = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("users")
        .update({ last_login: newLastLogin })
        .eq("id", user.id); // Update the user's last login

      if (updateError) {
        console.error("Error updating last login:", updateError);
        setDebugInfo(prev => prev + "\nUpdate error: " + updateError.message);
      } else {
        console.log("Last login updated successfully to:", newLastLogin);
        setDebugInfo(prev => prev + "\nLast login updated successfully");
        
        // Update local state immediately
        setAllUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === user.id ? {...u, last_login: newLastLogin} : u
          )
        );
        
        // Redirect to the dashboard after login
        setTimeout(() => {
          router.push("/dashboard");
        }, 500); // Small delay to ensure update is processed
      }

    } catch (err) {
      console.error("Unexpected Error:", err);
      setError("An unexpected error occurred.");
    }
  };

  // Call the database connection test on component mount
  useEffect(() => {
    testDatabaseConnection();
    debugAllUsers();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.arc}>
        <Image source={require("../assets/image.png")} style={styles.logo} />
        <Text style={styles.title}>LOG-IN YOUR ACCOUNT</Text>

        {/* Username Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            placeholder="Enter your username (case insensitive)"
            style={styles.input}
            placeholderTextColor="#6b4226"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        {/* Error message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Database connection status */}
        {!isDatabaseConnected && <Text style={styles.errorText}>Failed to connect to the database</Text>}
        {isDatabaseConnected && <Text style={styles.successText}>Database connected successfully!</Text>}

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Log-in</Text>
        </TouchableOpacity>

        {/* Debug buttons */}
        <View style={styles.debugButtons}>
          <TouchableOpacity style={styles.debugButton} onPress={debugAllUsers}>
            <Text style={styles.debugText}>Show All Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.debugButton} onPress={testDatabaseConnection}>
            <Text style={styles.debugText}>Test Connection</Text>
          </TouchableOpacity>
        </View>

        {/* Users list for debugging */}
        <ScrollView style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Users in Database (sorted by last login):</Text>
          {allUsers.map(user => (
            <Text key={user.id} style={styles.userInfo}>
              {user.username} - Last login: {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
            </Text>
          ))}
        </ScrollView>

        {/* Real-time updates */}
        <ScrollView style={styles.realtimeContainer}>
          <Text style={styles.debugTitle}>Real-time Updates:</Text>
          {realtimeUpdates.slice(-5).map((update, index) => (
            <Text key={index} style={styles.realtimeInfo}>
              [{update.timestamp}] {update.type}: {update.data?.username} - {update.data?.last_login ? new Date(update.data.last_login).toLocaleTimeString() : 'No login'}
            </Text>
          ))}
        </ScrollView>

        {/* Sign-up link */}
        <TouchableOpacity onPress={() => router.push("/signup")}>
          <Text style={styles.signupText}>Don't have an account yet? Click here</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.divider} />
        </View>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9C6A5",
    alignItems: "center",
    justifyContent: "center",
  },
  arc: {
    marginTop: 50,
    width: "100%",
    height: "90%",
    backgroundColor: "#EDE1CF",
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    alignItems: "center",
    paddingTop: 40,
  },
  logo: {
    height: 120,
    width: 120,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    color: "brown",
    marginBottom: 20,
  },
  inputGroup: {
    width: "90%",
    marginBottom: 15,
  },
  label: {
    color: "black",
    fontWeight: "600",
    marginBottom: 5,
  },
  input: {
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "black",
    color: "black",
    backgroundColor: "white",
  },
  loginButton: {
    backgroundColor: "green",
    width: "90%",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  debugButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 10,
  },
  debugButton: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  debugText: {
    color: "#fff",
    fontSize: 12,
  },
  debugContainer: {
    width: "90%",
    maxHeight: 100,
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  realtimeContainer: {
    width: "90%",
    maxHeight: 100,
    backgroundColor: "#e6f7ff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  debugTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
    fontSize: 12,
  },
  userInfo: {
    fontSize: 10,
    color: "green",
    marginBottom: 2,
  },
  realtimeInfo: {
    fontSize: 10,
    color: "blue",
    marginBottom: 2,
    fontStyle: "italic",
  },
  signupText: {
    color: "brown",
    marginBottom: 20,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "85%",
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#000",
  },
  orText: {
    marginHorizontal: 10,
    color: "#000",
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  successText: {
    color: "green",
    marginBottom: 10,
    textAlign: "center",
  },
});