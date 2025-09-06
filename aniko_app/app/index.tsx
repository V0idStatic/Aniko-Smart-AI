import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const router = useRouter();
  return (
    <View style={styles.container}>
      {/* Arc background */}
      <View style={styles.arc}>
        {/* Logo */}
        <Image source={require("../assets/image.png")} style={styles.logo} />

        {/* Title */}
        <Text style={styles.title}>LOG-IN YOUR ACCOUNT</Text>

        {/* Email Label + Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            placeholder="Enter your email address"
            style={styles.input}
            placeholderTextColor="#6b4226"
            keyboardType="email-address"
          />
        </View>

        {/* Password Label + Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Enter your password"
              secureTextEntry={!passwordVisible}
              style={styles.passwordInput}
              placeholderTextColor="#6b4226"
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <Ionicons name={passwordVisible ? "eye" : "eye-off"} size={22} color="gray" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginText}>Log-in</Text>
        </TouchableOpacity>

        {/* Sign-up link */}
        <TouchableOpacity onPress={() => router.push("/signup")}>
        <Text style={styles.signupText}>Don’t have an account yet? Click here</Text>
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
    marginTop: 250,
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
    paddingVertical: 15,
    color: "black",
  },

  loginButton: {
    backgroundColor: "green",
    width: "90%",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 20,
  },

  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
})
