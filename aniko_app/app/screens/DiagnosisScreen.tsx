import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { diagnosePlant } from "../utils/PlantDiagnosis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";

type DiagnosisResult = {
  isHealthy: boolean;
  diseases: {
    name: string;
    probability: string;
    description: string;
    treatment: string;
    cause: string;
  }[];
  imageUri: string;
  date: string;
};

const DiagnosisScreen = () => {
  const { imageUri } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    const runDiagnosis = async () => {
      if (imageUri) {
        try {
          const result = await diagnosePlant(imageUri as string);

          const newResult: DiagnosisResult = {
            ...result,
            imageUri: imageUri as string,
            date: new Date().toISOString(),
          };

          setDiagnosis(newResult);

          // Save to history
          await saveToHistory(newResult);
        } catch (err) {
          console.error("Error diagnosing plant:", err);
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
      history.unshift(result); // add to top
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
      ) : (
        <View style={styles.resultBox}>
          <Text style={styles.title}>Diagnosis Result</Text>

          {diagnosis?.isHealthy ? (
            <View style={styles.row}>
              <MaterialIcons name="check-circle" size={22} color="green" />
              <Text style={styles.healthy}>Your plant looks healthy</Text>
            </View>
          ) : diagnosis?.diseases?.length ? (
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
            <Text>No specific disease detected.</Text>
            
          )}

          
        </View>
      )}

      
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
});



export default DiagnosisScreen;
