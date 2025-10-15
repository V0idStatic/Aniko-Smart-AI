"use client";

import { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ImageBackground,
} from "react-native";
import supabase from "./CONFIG/supaBase";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import styles from "./styles/signup.style";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const validatePassword = (password: string): boolean => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
    return passwordRegex.test(password);
  };

  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "");
  };

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.error("Error checking username:", error);
        return false;
      }
      const usernameExists = data.users.some(
        (user) =>
          user.user_metadata?.username?.toLowerCase() === username.toLowerCase()
      );
      return usernameExists;
    } catch (error) {
      console.error("Username check error:", error);
      return false;
    }
  };

  const handleEmailChange = (text: string) => {
    const sanitized = sanitizeInput(text);
    setEmail(sanitized);
    if (sanitized && !validateEmail(sanitized)) {
      setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
    } else {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const handleUsernameChange = (text: string) => {
    const sanitized = sanitizeInput(text);
    setUsername(sanitized);
    if (sanitized && !validateUsername(sanitized)) {
      setErrors((prev) => ({
        ...prev,
        username:
          "Must be 3-20 characters (letters, numbers, underscore only)",
      }));
    } else {
      setErrors((prev) => ({ ...prev, username: "" }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text && !validatePassword(text)) {
      setErrors((prev) => ({
        ...prev,
        password:
          "Must be 8+ chars with uppercase, lowercase, number & special char",
      }));
    } else {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
    if (confirmPassword && text !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else if (confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (text && text !== password) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const getPasswordStrength = (
    password: string
  ): { strength: string; color: string; score: number } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    if (score <= 2) return { strength: "Weak", color: "#F44336", score };
    if (score <= 4) return { strength: "Medium", color: "#FF9800", score };
    return { strength: "Strong", color: "#4CAF50", score };
  };

  const handleSignup = async () => {
    try {
      setIsLoading(true);
      setErrors({ email: "", username: "", password: "", confirmPassword: "" });

      if (!email || !username || !password || !confirmPassword) {
        Alert.alert("Error", "Please fill in all fields");
        setIsLoading(false);
        return;
      }

      if (!validateEmail(email)) {
        Alert.alert("Error", "Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      if (!validateUsername(username)) {
        Alert.alert(
          "Error",
          "Username must be 3-20 characters (letters, numbers, underscore)"
        );
        setIsLoading(false);
        return;
      }

      if (!validatePassword(password)) {
        Alert.alert(
          "Weak Password",
          "Password must be at least 8 characters with:\n• 1 uppercase letter\n• 1 lowercase letter\n• 1 number\n• 1 special character"
        );
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        setIsLoading(false);
        return;
      }

      const { data: existingUser } = await supabase
        .from("users")
        .select("username")
        .ilike("username", username.trim())
        .single();

      if (existingUser) {
        Alert.alert("Error", "Username already taken");
        setIsLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: "aniko-smart-ai://verify-email",
          data: {
            username: sanitizeInput(username),
          },
        },
      });

      if (authError) {
        Alert.alert("Error", authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        Alert.alert("Error", "Failed to create account");
        setIsLoading(false);
        return;
      }

      await supabase.from("users").insert([
        {
          auth_id: authData.user.id,
          username: sanitizeInput(username),
          email: email.toLowerCase(),
          display_name: sanitizeInput(username),
          created_at: new Date().toISOString(),
        },
      ]);

      Alert.alert(
        "Success! 📧",
        `Account created!\n\nA verification email has been sent to:\n${email}\n\nPlease verify your email before logging in.`,
        [{ text: "OK", onPress: () => router.replace("/") }]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <ImageBackground
      source={require("../assets/gradientBG.png")} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Stack.Screen options={{ headerShown: false }} />
          <StatusBar style="dark" />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Image source={require("../assets/logo.png")} style={styles.logo} />
              <Text style={styles.title}>CREATE YOUR ACCOUNT</Text>
              <Text style={styles.subtitle}>Sign up to get started</Text>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.email && styles.inputContainerError,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Enter your email address"
                    style={styles.input}
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={handleEmailChange}
                  />
                </View>
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}
              </View>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.username && styles.inputContainerError,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Choose a username"
                    style={styles.input}
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={handleUsernameChange}
                  />
                </View>
                {errors.username ? (
                  <Text style={styles.errorText}>{errors.username}</Text>
                ) : (
                  <Text style={styles.helperText}>
                    3-20 characters (letters, numbers, underscore)
                  </Text>
                )}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.password && styles.inputContainerError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Create a password"
                    secureTextEntry={!passwordVisible}
                    style={styles.input}
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    value={password}
                    onChangeText={handlePasswordChange}
                  />
                  <TouchableOpacity
                    onPress={() => setPasswordVisible(!passwordVisible)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={passwordVisible ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : (
                  <Text style={styles.helperText}>
                    At least 8 characters with uppercase, lowercase, number & special char
                  </Text>
                )}

                {password.length > 0 && passwordStrength && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBarContainer}>
                      <View
                        style={[
                          styles.strengthBar,
                          {
                            width: `${(passwordStrength.score / 6) * 100}%`,
                            backgroundColor: passwordStrength.color,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.strengthText,
                        { color: passwordStrength.color },
                      ]}
                    >
                      Password Strength: {passwordStrength.strength}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.confirmPassword && styles.inputContainerError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Re-enter your password"
                    secureTextEntry={!confirmPasswordVisible}
                    style={styles.input}
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setConfirmPasswordVisible(!confirmPasswordVisible)
                    }
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={
                        confirmPasswordVisible ? "eye-outline" : "eye-off-outline"
                      }
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                <Text style={styles.signUpButtonText}>
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity style={styles.googleButton}>
                <Image
                  source={{ uri: "https://img.icons8.com/color/48/000000/google-logo.png" }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace("/Login")}
                style={styles.footerContainer}
              >
                <Text style={styles.footerText}>
                  Already have an account? <Text style={styles.footerLink}>Log in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </ImageBackground>
  );
}
