import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { diagnosePlant } from './utils/PlantDiagnosis';

export default function DiagnosisScreen() {
  const { imageUri } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState<null | Awaited<ReturnType<typeof diagnosePlant>>>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runDiagnosis = async () => {
      try {
        if (imageUri) {
          const result = await diagnosePlant(imageUri as string);
          console.log('✅ Diagnosis:', result);
          setDiagnosis(result);
        }
      } catch (err) {
        setError('Error diagnosing plant');
      } finally {
        setLoading(false);
      }
    };

    runDiagnosis();
  }, [imageUri]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {imageUri && (
        <Image source={{ uri: imageUri as string }} style={styles.image} />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#1c4722" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : diagnosis ? (
        diagnosis.isHealthy ? (
          <Text style={styles.healthyMessage}>
            ✅ This plant looks healthy! No issues detected.
          </Text>
        ) : diagnosis.diseases.length > 0 ? (
          <View style={styles.resultBox}>
            {diagnosis.diseases.map((disease, index) => (
              <View key={index} style={styles.diseaseCard}>
                <Text style={styles.diseaseName}>{disease.name}</Text>
                <Text style={styles.label}>🧬 Description:</Text>
                <Text style={styles.body}>{disease.description}</Text>
                <Text style={styles.label}>⚠️ Cause:</Text>
                <Text style={styles.body}>{disease.cause}</Text>
                <Text style={styles.label}>🛠️ Treatment:</Text>
                <Text style={styles.body}>{disease.treatment}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.warning}>
            ⚠️ This plant appears unhealthy, but no specific disease was identified.
          </Text>
        )
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    marginBottom: 20,
  },
  resultBox: {
    backgroundColor: '#ffeaea',
    padding: 20,
    borderRadius: 10,
  },
  diseaseCard: {
    marginBottom: 20,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#b00020',
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    color: '#1c4722',
  },
  body: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
  },
  healthyMessage: {
    fontSize: 16,
    color: '#1c4722',
    textAlign: 'center',
    marginTop: 20,
  },
  warning: {
    fontSize: 15,
    color: '#b00020',
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});
