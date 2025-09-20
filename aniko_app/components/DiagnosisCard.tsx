import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function DiagnosisCard() {
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.diagnosisCard}>
      <Image source={require("../assets/plant-bg.png")} style={styles.diagnosisImage} />
      <View style={styles.diagnosisOverlay}>
        <Text style={styles.diagnosisTitle}>Plant Diagnosis</Text>
        <TouchableOpacity
          style={styles.tryNowButton}
          onPress={() => router.push("/plantdashboard")}
        >
          <Text style={styles.tryNowText}>Try Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  diagnosisCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    marginLeft: 10,
    height: 150,
    position: "relative",
  },
  diagnosisImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  diagnosisOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  diagnosisTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
  tryNowButton: {
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  tryNowText: {
    color: "#1c4722",
    fontWeight: "bold",
  },
});
