import React, { useState } from "react";
import {StyleSheet,Text,View,TextInput,TouchableOpacity,Image,} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const router = useRouter();

  return (
    <LinearGradient colors={["#2e6b37", "#a5cfa6"]} style={styles.container}>
      <View style={styles.card}>
        {/* Logo */}
        <Image source={require("../assets/logo2.png")} style={styles.logo} />

        {/* Title */}
        <Text style={styles.title}>CREATE YOUR ACCOUNT</Text>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            placeholder="Enter your Email Address"
            style={styles.input}
            placeholderTextColor="#6b4226"
            keyboardType="email-address"
          />
        </View>

        {/* Username */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            placeholder="must contain special characters and numbers"
            style={styles.input}
            placeholderTextColor="#6b4226"
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Create Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="must be at least 8 characters with special characters"
              secureTextEntry={!passwordVisible}
              style={styles.passwordInput}
              placeholderTextColor="#6b4226"
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              <Ionicons
                name={passwordVisible ? "eye" : "eye-off"}
                size={22}
                color="gray"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="re-enter your password"
              secureTextEntry={!confirmPasswordVisible}
              style={styles.passwordInput}
              placeholderTextColor="#6b4226"
            />
            <TouchableOpacity
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            >
              <Ionicons
                name={confirmPasswordVisible ? "eye" : "eye-off"}
                size={22}
                color="gray"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign-in Button */}
        <TouchableOpacity style={styles.signinButton}>
          <Text style={styles.signinText}>Sign-in</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.divider} />
        </View>

        {/* Google Login */}
        <TouchableOpacity style={styles.googleButton}>
          <Image
            source={{ uri: "https://img.icons8.com/color/48/000000/google-logo.png" }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
        </View>
        {/* Already have account */}
        <TouchableOpacity onPress={() => router.replace("/")}>
        <Text style={styles.footerText}>Already have an account? Log in</Text>
      </TouchableOpacity>
     

      <StatusBar style="auto" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: "#F0FFF0",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    width: "90%",
    alignSelf: "center",
    marginTop: 80,
    padding: 25,
    alignItems: "center",
  },
  logo: {
    height: 80,
    width: 80,
    resizeMode: "contain",
    marginBottom: 15,
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    color: "brown",
    marginBottom: 20,
  },
  inputGroup: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    color: "black",
    fontWeight: "600",
    marginBottom: 5,
  },
  input: {
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "black",
    color: "black",
    
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "black",
    paddingHorizontal: 15,
    
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    color: "black",
  },
  signinButton: {
    backgroundColor: "#3e5c3e",
    width: "100%",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  signinText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
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
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "brown",
    borderWidth: 1,
    borderRadius: 25,
    padding: 12,
    width: "100%",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
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
  footerText: {
    color: "brown",
    alignItems: "center",
    alignSelf: "center",
  },
  link: {
    color: "#0000EE",
    textDecorationLine: "underline",
  },
});
