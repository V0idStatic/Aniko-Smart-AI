import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { diagnosePlant } from './utils/PlantDiagnosis';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DiagnosisScreen() {
  const { imageUri } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState<null | Awaited<ReturnType<typeof diagnosePlant>>>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(imageUri as string);

  useEffect(() => {
    const runDiagnosis = async () => {
      try {
        if (imageUri) {
          const result = await diagnosePlant(imageUri as string);
          console.log('Diagnosis:', result);
          setDiagnosis(result);

          // Save to history
          const newEntry = {
            date: new Date().toLocaleString(),
            imageUri,
            result,
          };
          const storedHistory = await AsyncStorage.getItem('diagnosisHistory');
          const parsedHistory = storedHistory ? JSON.parse(storedHistory) : [];
          const updatedHistory = [newEntry, ...parsedHistory];
          await AsyncStorage.setItem('diagnosisHistory', JSON.stringify(updatedHistory));
          setHistory(updatedHistory);
        }
      } catch (err) {
        setError('Error diagnosing plant');
      } finally {
        setLoading(false);
      }
    };

    runDiagnosis();
  }, [imageUri]);

  // Load history on screen mount
  useEffect(() => {
    const loadHistory = async () => {
      const storedHistory = await AsyncStorage.getItem('diagnosisHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    };
    loadHistory();
  }, []);

  // 🔴 Delete history item
  const deleteHistoryItem = async (index: number) => {
    Alert.alert(
      "Delete History",
      "Are you sure you want to delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedHistory = history.filter((_, i) => i !== index);
            setHistory(updatedHistory);
            await AsyncStorage.setItem('diagnosisHistory', JSON.stringify(updatedHistory));
          },
        },
      ]
    );
  };

  // 🟢 Load old history into main screen
  const loadHistoryItem = (item: any) => {
    setSidePanelVisible(false);
    setDiagnosis(item.result);
    setCurrentImage(item.imageUri);
    setError(null);
    setLoading(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Top Bar with Burger Menu */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <MaterialCommunityIcons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Plant Diagnosis</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {currentImage && (
          <Image source={{ uri: currentImage }} style={styles.image} />
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#1c4722" />
        ) : error ? (
          <Text style={styles.error}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} /> {error}
          </Text>
        ) : diagnosis ? (
          diagnosis.isHealthy ? (
            <Text style={styles.healthyMessage}>
              <MaterialCommunityIcons name="leaf-circle-outline" size={18} /> This plant looks healthy! No issues detected.
            </Text>
          ) : diagnosis.diseases.length > 0 ? (
            <View style={styles.resultBox}>
              {diagnosis.diseases.map((disease, index) => (
                <View key={index} style={styles.diseaseCard}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="virus-outline" size={20} color="#b00020" style={styles.cardIcon} />
                    <Text style={styles.diseaseName}>{disease.name}</Text>
                  </View>
                  <Text style={styles.label}>
                    <MaterialCommunityIcons name="text-box-outline" size={16} /> Description:
                  </Text>
                  <Text style={styles.body}>{disease.description}</Text>
                  <Text style={styles.label}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} /> Cause:
                  </Text>
                  <Text style={styles.body}>{disease.cause}</Text>
                  <Text style={styles.label}>
                    <MaterialCommunityIcons name="medical-bag" size={16} /> Treatment:
                  </Text>
                  <Text style={styles.body}>{disease.treatment}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.warning}>
              <MaterialCommunityIcons name="alert-decagram-outline" size={18} /> This plant appears unhealthy, but no specific disease was identified.
            </Text>
          )
        ) : null}
      </ScrollView>

      {/* Side Panel (History Drawer) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={sidePanelVisible}
        onRequestClose={() => setSidePanelVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sidePanel}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.historyTitle}>Diagnosis History</Text>
              <TouchableOpacity onPress={() => setSidePanelVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={history}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onLongPress={() => deleteHistoryItem(index)} // 👈 long press delete
                  onPress={() => loadHistoryItem(item)}        // 👈 tap to load history
                >
                  <View style={styles.historyCard}>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    {item.result.isHealthy ? (
                      <Text style={styles.historyHealthy}>Healthy</Text>
                    ) : item.result.diseases.length > 0 ? (
                      <Text style={styles.historyDiseased}>
                        Diseases: {item.result.diseases.map((d: any) => d.name).join(', ')}
                      </Text>
                    ) : (
                      <Text style={styles.historyWarning}>Unhealthy (No disease identified)</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f1f1f1',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  container: {
    padding: 24,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  image: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    marginBottom: 24,
    resizeMode: 'cover',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resultBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  diseaseCard: {
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    marginRight: 8,
  },
  diseaseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#b00020',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
    color: '#1c4722',
  },
  body: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  healthyMessage: {
    fontSize: 17,
    color: '#2e7d32',
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: '600',
  },
  warning: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: '500',
  },
  error: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  sidePanel: {
    width: '75%',
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  historyCard: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  historyDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  historyHealthy: {
    fontSize: 15,
    color: '#2e7d32',
    fontWeight: '600',
  },
  historyDiseased: {
    fontSize: 15,
    color: '#b00020',
    fontWeight: '600',
  },
  historyWarning: {
    fontSize: 15,
    color: '#d32f2f',
    fontWeight: '600',
  },
});
