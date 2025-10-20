"use client"

import { useEffect, useState } from "react"
import supabase from "./CONFIG/supaBase"
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { Stack } from "expo-router"
import styles from "./styles/Login.style"
import { Ionicons } from "@expo/vector-icons"
import * as Crypto from 'expo-crypto'

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUsernameFocused, setIsUsernameFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)

  const router = useRouter()
  const { setCurrentUser } = require("./CONFIG/currentUser")

  // ==========================================
  // PASSWORD HASHING FUNCTION (UNCHANGED)
  // ==========================================
  const hashPassword = async (password: string): Promise<string> => {
    const salt = 'ANIKO_SALT_2024'
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + salt
    )
    return digest
  }

  // ==========================================
  // DATABASE CONNECTION CHECK (UNCHANGED)
  // ==========================================
  const testDatabaseConnection = async () => {
    try {
      const { error } = await supabase.from("users").select("count").limit(1)
      if (error) {
        console.error("Database connection failed:", error)
        setIsDatabaseConnected(false)
      } else {
        console.log("Database connected successfully")
        setIsDatabaseConnected(true)
      }
    } catch (err) {
      console.error("Error during database connection test:", err)
      setIsDatabaseConnected(false)
    }
  }

  // ==========================================
  // LOGIN HANDLER (UNCHANGED)
  // ==========================================
  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setError("")

      if (!username || !password) {
        setError("Please enter both username and password")
        setIsLoading(false)
        return
      }

      console.log("🔍 Looking up username in public.users...")

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, auth_id, username')
        .ilike('username', username.trim())
        .single()

      if (userError || !userData) {
        setError("Invalid username or password")
        setIsLoading(false)
        return
      }

      console.log("✅ User found:", userData.username)

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: password,
      })

      if (authError) {
        console.error("❌ Login error:", authError)
        
        if (authError.message.includes("Email not confirmed")) {
          Alert.alert(
            "Email Not Verified ✉️",
            `Please verify your email first.\n\nEmail sent to: ${userData.email}`,
            [
              {
                text: "Resend Email",
                onPress: async () => {
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: userData.email,
                  })
                  if (!error) {
                    Alert.alert("Success", "Verification email sent!")
                  }
                }
              },
              { text: "OK" }
            ]
          )
        } else {
          setError("Invalid username or password")
        }
        setIsLoading(false)
        return
      }

      console.log("✅ Login successful!")

      setCurrentUser({
        id: authData.user.id,
        username: userData.username,
        email: userData.email,
      })

      router.replace("/OnBoardingScreen") 

    } catch (err) {
      console.error("❌ Login error:", err)
      setError("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    testDatabaseConnection()
  }, [])

  // ==========================================
  // UI SECTION
  // ==========================================
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Database Status Indicator */}
        <View
          style={[
            styles.statusBar,
            isDatabaseConnected === null
              ? styles.statusBarConnecting
              : isDatabaseConnected
                ? styles.statusBarConnected
                : styles.statusBarOffline,
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

        {/* Main Content Card */}
        <View style={styles.contentCard}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={require("../assets/logo.png")} style={styles.logo} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* USERNAME INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View
              style={[
                styles.inputContainer,
                isUsernameFocused && styles.inputFocused, // Apply white bg on focus
              ]}
            >
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                placeholder={username.length > 0 ? "" : "Enter your username"} // Clear placeholder when typing
                style={styles.input}
                placeholderTextColor="#4C4B2C"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                onFocus={() => setIsUsernameFocused(true)}
                onBlur={() => setIsUsernameFocused(false)}
              />
            </View>
          </View>

          {/* PASSWORD INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                isPasswordFocused && styles.inputFocused, 
              ]}
            >
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                placeholder={password.length > 0 ? "" : "Enter your password"} 
                style={styles.input}
                placeholderTextColor="#4C4B2C"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, !isDatabaseConnected && styles.disabledButton]}
            onPress={handleLogin}
            disabled={!isDatabaseConnected}
          >
            <Text style={styles.loginText}>Sign In</Text>
          </TouchableOpacity>

          {/* Sign-up Link */}
          <TouchableOpacity style={styles.signupContainer} onPress={() => router.push("/signup")}>
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupLink}>Sign up</Text>
            </Text>
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
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <StatusBar style="auto" />
      </View>
    </>
  )
}
