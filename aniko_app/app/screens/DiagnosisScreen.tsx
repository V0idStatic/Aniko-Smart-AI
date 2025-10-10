import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { diagnosePlant } from "../utils/PlantDiagnosis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

type DiagnosisResult = {
  isPlant: boolean;
  isHealthy: boolean;
  diseases: {
    name: string;
    probability: string;
    description: string;
    treatment: string;
    cause: string;
  }[];
  message?: string;
  imageUri: string;
  date: string;
};

const DiagnosisScreen = () => {
  const { imageUri } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runDiagnosis = async () => {
      if (imageUri) {
        try {
          setError(null);
          setLoading(true);

          const result = await diagnosePlant(imageUri as string);

          const newResult: DiagnosisResult = {
            ...result,
            imageUri: imageUri as string,
            date: new Date().toISOString(),
          };

          setDiagnosis(newResult);
          await saveToHistory(newResult);
        } catch (err) {
          console.error("Error diagnosing plant:", err);
          setError("Something went wrong while analyzing the image.");
        } finally {
          setLoading(false);
        }
      }
    };
    runDiagnosis();
  }, [imageUri]);

  const saveToHistory = async (result: DiagnosisResult) => {
    try {
      const existing = await AsyncStorage.getItem("diagnosisHistory");
      let history = existing ? JSON.parse(existing) : [];
      history.unshift(result);
      await AsyncStorage.setItem("diagnosisHistory", JSON.stringify(history));
    } catch (err) {
      console.error("Error saving history:", err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {imageUri && (
        <Image source={{ uri: imageUri as string }} style={styles.image} />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#1c4722" />
      ) : error ? (
        <Text style={styles.error}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={18}
            color="#b00020"
          />{" "}
          {error}
        </Text>
      ) : diagnosis ? (
        <View style={styles.resultBox}>
          <Text style={styles.title}>Diagnosis Result</Text>

          {/* 🚫 Not a plant */}
          {!diagnosis.isPlant ? (
            <View style={styles.notPlantBox}>
              <MaterialCommunityIcons
                name="alert-decagram-outline"
                size={22}
                color="#b00020"
              />
              <Text style={styles.notPlantText}>
                {diagnosis.message ||
                  "This image does not appear to contain a plant. Please try again with a clear plant photo."}
              </Text>
            </View>
          ) : diagnosis.isHealthy ? (
            // ✅ Healthy plant
            <View style={styles.row}>
              <MaterialIcons name="check-circle" size={22} color="green" />
              <Text style={styles.healthy}>Your plant looks healthy</Text>
            </View>
          ) : diagnosis.diseases?.length ? (
            // 🌿 Diseased plant
            diagnosis.diseases.map((d, i) => (
              <View key={i} style={styles.diseaseCard}>
                <View style={styles.row}>
                  <MaterialIcons name="error-outline" size={20} color="red" />
                  <Text style={styles.diseaseName}>{d.name}</Text>
                </View>
                <Text>Probability: {d.probability}</Text>
                <Text>Cause: {d.cause}</Text>
                <Text>Treatment: {d.treatment}</Text>
                <Text>Description: {d.description}</Text>
              </View>
            ))
          ) : (
            // ⚠️ Unhealthy but no disease identified
            <Text style={styles.warning}>
              <MaterialCommunityIcons
                name="alert-decagram-outline"
                size={18}
                color="#ff9800"
              />{" "}
            This image does not appear to contain a plant. Please try again with a clear plant photo.
            </Text>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: 280,
    borderRadius: 15,
    marginBottom: 20,
  },
  resultBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1c4722",
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  healthy: {
    fontSize: 16,
    color: "green",
    fontWeight: "600",
  },
  notPlantBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdeaea",
    padding: 12,
    borderRadius: 8,
    borderColor: "#f5bebe",
    borderWidth: 1,
  },
  notPlantText: {
    fontSize: 15,
    color: "#b00020",
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  diseaseCard: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#fdf1f1",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f5c2c2",
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
    marginLeft: 5,
  },
  warning: {
    color: "#ff9800",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 5,
  },
  error: {
    color: "#b00020",
    fontSize: 15,
    textAlign: "center",
  },
});

export default DiagnosisScreen;
