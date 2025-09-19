import { useEffect, useState, useRef } from "react";
import supabase from "./CONFIG/supaBase"; // Import Supabase client
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Login() {
  const [username, setUsername] = useState(""); // Username state
  const [error, setError] = useState(""); // Error state for login failures
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false); // State to track DB connection
  const [debugInfo, setDebugInfo] = useState(""); // Debug information
  const [realtimeStatus, setRealtimeStatus] = useState<string>('');
  const lastRealtimeTs = useRef<number>(Date.now());
  const router = useRouter();

  interface User {
    id: string; // stored as string from supabase, but is integer in DB
    username: string;
    last_login: string | null;
  }

  // Lazy import (avoid circular) for setting session
  const { setCurrentUser } = require('./CONFIG/currentUser');

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

  // Helper to parse ISO or null safely
  const parseDate = (d: string | null) => d ? new Date(d).getTime() : 0;

  // Merge or insert user, then resort descending by last_login
  const upsertAndSortUsers = (incoming: User, mode: 'insert' | 'update') => {
    setAllUsers(prev => {
      let next: User[];
      const idx = prev.findIndex(u => u.id === incoming.id);
      if (idx === -1) {
        next = [...prev, incoming];
      } else {
        next = prev.map(u => u.id === incoming.id ? { ...u, ...incoming } : u);
      }
      next.sort((a,b) => parseDate(b.last_login) - parseDate(a.last_login));
      return next;
    });
  };

  // Remove user helper
  const removeUserAndSort = (id: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== id));
  };

  // Real-time listener for changes in the users table
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const setupRealtime = async () => {
      try {
        // Test if realtime is available
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) {
         setRealtimeStatus('Realtime unavailable');
         setDebugInfo(prev => prev + '\nRealtime unavailable: ' + error.message);
         return; 
        }
        channel = supabase
          .channel('public:users')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload: any) => {
            const newUser = payload.new as User | null;
            if (newUser?.id) upsertAndSortUsers(newUser,'insert');
            lastRealtimeTs.current = Date.now();
            setRealtimeStatus('Last event: INSERT ' + new Date().toLocaleTimeString());
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload: any) => {
            const newUser = payload.new as User | null;
            if (newUser?.id) upsertAndSortUsers(newUser,'update');
            lastRealtimeTs.current = Date.now();
            setRealtimeStatus('Last event: UPDATE ' + new Date().toLocaleTimeString());
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'users' }, (payload: any) => {
            const oldUser = payload.old as User | null;
            if (oldUser?.id) removeUserAndSort(oldUser.id);
            lastRealtimeTs.current = Date.now();
            setRealtimeStatus('Last event: DELETE ' + new Date().toLocaleTimeString());
          })
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') setRealtimeStatus('Realtime connected');
            if (status === 'CHANNEL_ERROR') setRealtimeStatus('Realtime error');
            if (status === 'CLOSED') setRealtimeStatus('Realtime closed');
          });
      } catch (e) {
        setRealtimeStatus('Realtime setup failed');
      }
    };
    const timer = setTimeout(setupRealtime, 120);
    return () => { clearTimeout(timer); if (channel) supabase.removeChannel(channel); };
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

      // NEW: Guard against empty input so it doesn't match everyone with '%%'
      if (!searchUsername) {
        setError("Please enter your username.");
        return;
      }

      setError(""); // clear previous error
      setDebugInfo(`Searching for: ${searchUsername}`);
      console.log("Searching for username:", searchUsername);

      // Query users table – keep ilike but WITHOUT wildcards for exact (case-insensitive) match
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .ilike("username", searchUsername) // exact case-insensitive (no % to avoid broad match)
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

  const user = data[0];
      console.log("User logged in:", user);
      setDebugInfo(prev => prev + "\nUser found: " + JSON.stringify(user));

  const newLastLogin = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("users")
        .update({ last_login: newLastLogin })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating last login:", updateError);
        setDebugInfo(prev => prev + "\nUpdate error: " + updateError.message);
      } else {
        console.log("Last login updated successfully to:", newLastLogin);
        setDebugInfo(prev => prev + "\nLast login updated successfully");
        setAllUsers(prevUsers => prevUsers.map(u => u.id === user.id ? { ...u, last_login: newLastLogin } : u));
        // Store current user session (convert id to number for consistency)
        try {
          const numericId = parseInt(user.id, 10);
          if (!Number.isNaN(numericId)) {
            setCurrentUser({ id: numericId, username: user.username, last_login: newLastLogin });
          }
        } catch {}
        // Immediate refresh to reflect any order change if realtime lags
        debugAllUsers();
        setTimeout(() => { router.push("/getstarted"); }, 500);
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

  // Fallback polling: if no realtime event in last 45s, fetch again
  useEffect(() => {
    const interval = setInterval(async () => {
      const age = Date.now() - lastRealtimeTs.current;
      if (age > 45000) { // stale
        try {
          const { data, error } = await supabase.from('users').select('*').order('last_login', { ascending: false });
          if (!error && data) {
            setAllUsers(data);
            setRealtimeStatus(prev => prev.includes('Realtime') ? prev + ' • polled' : 'Polled (no realtime)');
            lastRealtimeTs.current = Date.now();
          }
        } catch {}
      }
    }, 15000); // check every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.arc}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
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
          {!!realtimeStatus && <Text style={{fontSize:10,color:'#555',marginTop:6}}>Status: {realtimeStatus}</Text>}
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

         {/* Google Login Button */}
        <TouchableOpacity style={styles.googleButton}>
          <Image
            source={{ uri: "https://img.icons8.com/color/48/000000/google-logo.png" }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleText}>Log-in with Google</Text>
        </TouchableOpacity>
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
    marginTop: 100,
    width: "100%",
    height: 850,
    backgroundColor: "#EDE1CF",
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    alignItems: "center",
    paddingTop: 30,
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

    googleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "brown",
    borderWidth: 1,
    borderRadius: 25,
    padding: 15,
    width: "90%",
    justifyContent: "center",
  },

  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },

  googleText: {
    color: "brown",
    fontWeight: "500",
  },
});