"use client"

import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { handleImageSelection } from "../app/screens/ImagePicker"
import { LinearGradient } from "expo-linear-gradient"

export const COLORS = {
  // Primary colors
  primaryGreen: "#1D492C",
  accentGreen: "#84cc16",
  pastelGreen: "#BDE08A",
  lightGreen: "#f0fdf4",
  darkGreen: "#143820",
  mutedGreen: "#4C6444",
  grayText: "#666",
  border: "#e0e0e0",
  white: "#ffffff",
  bgCOlor: "#cfc4b2ff",
  primaryBrown: "#8A6440",
  darkBrown: "#4D2D18",
  accent: "#FF6F00",
  accentLight: "#FFA726",
  background: "#CBBA9E",
  cardBackground: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",

  // Status colors
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#8a1c14ff",
  info: "#2196F3",
}

export default function DiagnosisCard() {
  const router = useRouter()

  const openCameraFlow = () => {
    handleImageSelection((uri: string) => {
      router.push({ pathname: "/diagnosis", params: { imageUri: uri } })
    })
  }

  return (
    <TouchableOpacity style={styles.container} onPress={openCameraFlow} activeOpacity={0.7}>
      <LinearGradient colors={[COLORS.pastelGreen, COLORS.mutedGreen]} style={styles.card}>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconBackground}>
              <Ionicons name="camera" size={32} color={COLORS.primaryGreen} />
            </View>
          </View>

          <View style={styles.textContent}>
            <Text style={styles.title}>Crop Diagnosis</Text>
            <Text style={styles.subtitle}>Take photo to analyze</Text>
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={22} color={COLORS.mutedGreen} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 160,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderTopLeftRadius: 55,
    borderBottomRightRadius: 55,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  content: {
    padding: 20,
    flex: 1,
    justifyContent: "space-between",
  },
  iconWrapper: {
    marginBottom: 16,
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#bee08a48",
    justifyContent: "center",
    alignItems: "center",
  },
  textContent: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.lightGreen,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.pastelGreen,
    lineHeight: 20,
  },
  arrowContainer: {
    position: "absolute",
    top: 20,
    right: 20,
  },
})
