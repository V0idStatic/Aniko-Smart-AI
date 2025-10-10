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
import { useLocalSearchParams, Stack } from 'expo-router'; 
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
    <View style={{ flex: 1, backgroundColor: '#f8faf9' }}>
      {/* ✅ Hide default Expo Router header */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Bar with Burger Menu */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          onPress={() => setSidePanelVisible(true)}
          style={styles.menuButton}
        >
          <MaterialCommunityIcons name="menu" size={26} color="#ffffff" />
        </TouchableOpacity>
        
        <Text style={styles.topBarTitle}>Plant Diagnosis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {currentImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: currentImage }} style={styles.image} />
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1c4722" />
            <Text style={styles.loadingText}>Analyzing plant health...</Text>
          </View>
        ) : error ? (
          <View style={styles.messageCard}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#c62828" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : diagnosis ? (
          diagnosis.isHealthy ? (
            <View style={styles.healthyCard}>
              <MaterialCommunityIcons name="check-circle" size={56} color="#1c4722" />
              <Text style={styles.healthyTitle}>Plant is Healthy!</Text>
              <Text style={styles.healthySubtitle}>No issues detected</Text>
            </View>
          ) : diagnosis.diseases.length > 0 ? (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeader}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#c62828" />
                <Text style={styles.resultsTitle}>Issues Detected</Text>
              </View>
              
              {diagnosis.diseases.map((disease, index) => (
                <View key={index} style={styles.diseaseCard}>
                  <View style={styles.diseaseHeader}>
                    <View style={styles.diseaseIconContainer}>
                      <MaterialCommunityIcons name="virus" size={24} color="#c62828" />
                    </View>
                    <Text style={styles.diseaseName}>{disease.name}</Text>
                  </View>
                  
                  <View style={styles.diseaseSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="information" size={18} color="#1c4722" />
                      <Text style={styles.sectionTitle}>Description</Text>
                    </View>
                    <Text style={styles.sectionBody}>{disease.description}</Text>
                  </View>

                  <View style={styles.diseaseSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#1c4722" />
                      <Text style={styles.sectionTitle}>Cause</Text>
                    </View>
                    <Text style={styles.sectionBody}>{disease.cause}</Text>
                  </View>

                  <View style={styles.diseaseSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="medical-bag" size={18} color="#1c4722" />
                      <Text style={styles.sectionTitle}>Treatment</Text>
                    </View>
                    <Text style={styles.sectionBody}>{disease.treatment}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.messageCard}>
              <MaterialCommunityIcons name="image-off" size={48} color="#f57c00" />
              <Text style={styles.warningText}>
                This image does not appear to contain a plant. Please try again with a clear plant photo.
              </Text>
            </View>
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
          <TouchableOpacity 
            style={styles.overlayTouchable} 
            activeOpacity={1} 
            onPress={() => setSidePanelVisible(false)}
          />
          <View style={styles.sidePanel}>
            <View style={styles.sidePanelHeader}>
              <View>
                <Text style={styles.historyTitle}>History</Text>
                <Text style={styles.historySubtitle}>Past diagnoses</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setSidePanelVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#1c4722" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={history}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onLongPress={() => deleteHistoryItem(index)} 
                  onPress={() => loadHistoryItem(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <MaterialCommunityIcons 
                        name="clock-outline" 
                        size={16} 
                        color="#5f6368" 
                      />
                      <Text style={styles.historyDate}>{item.date}</Text>
                    </View>
                    
                    {item.result.isHealthy ? (
                      <View style={styles.historyStatusContainer}>
                        <View style={styles.healthyBadge}>
                          <MaterialCommunityIcons name="check" size={14} color="#1c4722" />
                          <Text style={styles.historyHealthy}>Healthy</Text>
                        </View>
                      </View>
                    ) : item.result.diseases.length > 0 ? (
                      <View style={styles.historyStatusContainer}>
                        <View style={styles.diseasedBadge}>
                          <MaterialCommunityIcons name="alert" size={14} color="#c62828" />
                          <Text style={styles.historyDiseased}>
                            {item.result.diseases.map((d: any) => d.name).join(', ')}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.historyStatusContainer}>
                        <View style={styles.warningBadge}>
                          <MaterialCommunityIcons name="help" size={14} color="#f57c00" />
                          <Text style={styles.historyWarning}>Unhealthy</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyHistory}>
                  <MaterialCommunityIcons name="history" size={48} color="#c0c0c0" />
                  <Text style={styles.emptyHistoryText}>No history yet</Text>
                </View>
              }
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    backgroundColor: '#1c4722',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  container: {
    padding: 20,
    backgroundColor: '#f8faf9',
    flexGrow: 1,
  },
  imageContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#5f6368',
    fontWeight: '500',
  },
  messageCard: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  errorText: {
    fontSize: 16,
    color: '#c62828',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  warningText: {
    fontSize: 16,
    color: '#f57c00',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  healthyCard: {
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1c4722',
    shadowColor: '#1c4722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  healthyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c4722',
    marginTop: 16,
    letterSpacing: 0.3,
  },
  healthySubtitle: {
    fontSize: 16,
    color: '#5f6368',
    marginTop: 8,
    fontWeight: '500',
  },
  resultsContainer: {
    gap: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202124',
    letterSpacing: 0.3,
  },
  diseaseCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#c62828',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  diseaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  diseaseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diseaseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#c62828',
    flex: 1,
    letterSpacing: 0.2,
  },
  diseaseSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c4722',
    letterSpacing: 0.3,
  },
  sectionBody: {
    fontSize: 15,
    color: '#3c4043',
    lineHeight: 22,
    paddingLeft: 26,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  overlayTouchable: {
    flex: 1,
  },
  sidePanel: {
    width: '80%',
    backgroundColor: '#ffffff',
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  sidePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c4722',
    letterSpacing: 0.3,
  },
  historySubtitle: {
    fontSize: 14,
    color: '#5f6368',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  historyCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8faf9',
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 13,
    color: '#5f6368',
    fontWeight: '500',
  },
  historyStatusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  healthyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  historyHealthy: {
    fontSize: 14,
    color: '#1c4722',
    fontWeight: '600',
  },
  diseasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flex: 1,
  },
  historyDiseased: {
    fontSize: 14,
    color: '#c62828',
    fontWeight: '600',
    flex: 1,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  historyWarning: {
    fontSize: 14,
    color: '#f57c00',
    fontWeight: '600',
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#9aa0a6',
    marginTop: 12,
    fontWeight: '500',
  },
});