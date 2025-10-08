import { useEffect, useState } from "react";
import supabase from "./CONFIG/supaBase";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import styles from "./styles/Login.style";
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const { setCurrentUser } = require('./CONFIG/currentUser');

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      const { error } = await supabase.from("users").select("count").limit(1);
      if (error) {
        console.error("Database connection failed:", error);
        setIsDatabaseConnected(false);
      } else {
        console.log("Database connected successfully");
        setIsDatabaseConnected(true);
      }
    } catch (err) {
      console.error("Error during database connection test:", err);
      setIsDatabaseConnected(false);
    }
  };

  // Handle login logic
  const handleLogin = async () => {
    try {
      const searchUsername = username.trim();

      if (!searchUsername) {
        setError("Please enter your username.");
        return;
      }

      if (!password) {
        setError("Please enter your password.");
        return;
      }

      setError("");
      console.log("Searching for username:", searchUsername);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .ilike("username", searchUsername)
        .eq("password_hash", password) // Use hashed password comparison
        .limit(1);

      if (error) {
        setError("Database error: " + error.message);
        console.error("Login Error:", error);
        return;
      }

      if (!data || data.length === 0) {
        setError("Username or password incorrect. Please try again.");
        return;
      }

      const user = data[0];
      console.log("User logged in:", user);

      const newLastLogin = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("users")
        .update({ last_login: newLastLogin })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating last login:", updateError);
      } else {
        console.log("Last login updated successfully");
        
        try {
          const numericId = parseInt(user.id, 10);
          if (!Number.isNaN(numericId)) {
            setCurrentUser({ 
              id: numericId, 
              username: user.username, 
              last_login: newLastLogin 
            });
          }
        } catch {}
        
        router.push("/OnBoardingScreen");
      }
    } catch (err) {
      console.error("Unexpected Error:", err);
      setError("An unexpected error occurred.");
    }
  };

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  return (
    <View style={styles.container}>
      {/* Database Status Indicator (like messenger) */}
       <View
          style={[
            styles.statusBar,
            isDatabaseConnected === null
              ? styles.statusConnecting
              : isDatabaseConnected
              ? styles.statusConnected
              : styles.statusOffline,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isDatabaseConnected === null
                ? styles.dotConnecting
                : isDatabaseConnected
                ? styles.dotConnected
                : styles.dotOffline,
            ]}
          />
          <Text style={styles.statusText}>
            {isDatabaseConnected === null
              ? "Connecting..."
              : isDatabaseConnected
              ? "Database Connected"
              : "Database Offline"}
          </Text>
        </View>
      <View style={styles.arc}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <Text style={styles.title}>LOG-IN YOUR ACCOUNT</Text>

        {/* Username Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            placeholder="Enter your username"
            style={styles.input}
            placeholderTextColor="#6b4226"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Enter your password"
              style={styles.passwordInput}
              placeholderTextColor="#6b4226"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#6b4226" 
                opacity={0.6}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Login Button */}
        <TouchableOpacity 
          style={[
            styles.loginButton,
            !isDatabaseConnected && styles.disabledButton
          ]} 
          onPress={handleLogin}
          disabled={!isDatabaseConnected}
        >
          <Text style={styles.loginText}>Log-in</Text>
        </TouchableOpacity>

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

