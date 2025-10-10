"use client"

import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { handleImageSelection } from "../app/screens/ImagePicker"

export default function DiagnosisCard() {
  const router = useRouter()

  const openCameraFlow = () => {
    handleImageSelection((uri: string) => {
      router.push({ pathname: "/diagnosis", params: { imageUri: uri } })
    })
  }

  return (
    <TouchableOpacity style={styles.container} onPress={openCameraFlow} activeOpacity={0.7}>
      <View style={styles.card}>
        <View style={styles.gradientBar} />

        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconBackground}>
              <Ionicons name="camera" size={32} color="#2E7D32" />
            </View>
          </View>

          <View style={styles.textContent}>
            <Text style={styles.title}>Crop Diagnosis</Text>
            <Text style={styles.subtitle}>Take photo to analyze</Text>
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </View>
        </View>
      </View>
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
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  gradientBar: {
    height: 6,
    width: "100%",
    backgroundColor: "#2E7D32",
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
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
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
    color: "#1A1A1A",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    lineHeight: 20,
  },
  arrowContainer: {
    position: "absolute",
    top: 20,
    right: 20,
  },
})
