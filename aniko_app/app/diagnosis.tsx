import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { diagnosePlant } from './utils/PlantDiagnosis';

export default function DiagnosisScreen() {
  const { imageUri } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);

  useEffect(() => {
    const runDiagnosis = async () => {
      if (imageUri) {
        const result = await diagnosePlant(imageUri as string);
        setDiagnosis(result);
        setLoading(false);
      }
    };

    runDiagnosis();
  }, [imageUri]);

  return (
    <View style={styles.container}>
      {imageUri && (
        <Image source={{ uri: imageUri as string }} style={styles.image} />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#1c4722" />
      ) : (
        <View style={styles.resultBox}>
          <Text style={styles.title}>Diagnosis Result</Text>
          <Text style={styles.result}>{diagnosis}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    marginBottom: 20,
  },
  resultBox: {
    backgroundColor: '#e0f2e9',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c4722',
    marginBottom: 10,
  },
  result: {
    fontSize: 18,
    color: '#333',
  },
});
