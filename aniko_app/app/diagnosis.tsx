"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from "react-native"
import { useLocalSearchParams, Stack, useRouter } from "expo-router"
import { diagnosePlant } from "./utils/PlantDiagnosis"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { styles } from "./styles/diagnosis.style"
import { handleImageSelection } from "./screens/ImagePicker"

export default function DiagnosisScreen() {
  const { imageUri } = useLocalSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [diagnosis, setDiagnosis] = useState<null | Awaited<ReturnType<typeof diagnosePlant>>>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [sidePanelVisible, setSidePanelVisible] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(imageUri as string)

  useEffect(() => {
    const runDiagnosis = async () => {
      try {
        if (imageUri) {
          const result = await diagnosePlant(imageUri as string)
          console.log("Diagnosis:", result)
          setDiagnosis(result)

          // Save to history
          const newEntry = {
            date: new Date().toLocaleString(),
            imageUri,
            result,
          }
          const storedHistory = await AsyncStorage.getItem("diagnosisHistory")
          const parsedHistory = storedHistory ? JSON.parse(storedHistory) : []
          const updatedHistory = [newEntry, ...parsedHistory]
          await AsyncStorage.setItem("diagnosisHistory", JSON.stringify(updatedHistory))
          setHistory(updatedHistory)
        }
      } catch (err) {
        setError("Error diagnosing plant")
      } finally {
        setLoading(false)
      }
    }

    runDiagnosis()
  }, [imageUri])

  // Load history on screen mount
  useEffect(() => {
    const loadHistory = async () => {
      const storedHistory = await AsyncStorage.getItem("diagnosisHistory")
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory))
      }
    }
    loadHistory()
  }, [])

  // 🔴 Delete history item
  const deleteHistoryItem = async (index: number) => {
    Alert.alert("Delete History", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updatedHistory = history.filter((_, i) => i !== index)
          setHistory(updatedHistory)
          await AsyncStorage.setItem("diagnosisHistory", JSON.stringify(updatedHistory))
        },
      },
    ])
  }

  // 🟢 Load old history into main screen
  const loadHistoryItem = (item: any) => {
    setSidePanelVisible(false)
    setDiagnosis(item.result)
    setCurrentImage(item.imageUri)
    setError(null)
    setLoading(false)
  }

  const handleRetake = () => {
    handleImageSelection((uri: string) => {
      setCurrentImage(uri)
      setLoading(true)
      setError(null)
      setDiagnosis(null)

      // Run diagnosis on new image
      diagnosePlant(uri)
        .then((result) => {
          setDiagnosis(result)

          // Save to history
          const newEntry = {
            date: new Date().toLocaleString(),
            imageUri: uri,
            result,
          }
          AsyncStorage.getItem("diagnosisHistory").then((storedHistory) => {
            const parsedHistory = storedHistory ? JSON.parse(storedHistory) : []
            const updatedHistory = [newEntry, ...parsedHistory]
            AsyncStorage.setItem("diagnosisHistory", JSON.stringify(updatedHistory))
            setHistory(updatedHistory)
          })
        })
        .catch(() => {
          setError("Error diagnosing plant")
        })
        .finally(() => {
          setLoading(false)
        })
    })
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8faf9" }}>
      {/* ✅ Hide default Expo Router header */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Bar with Burger Menu */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)} style={styles.menuButton}>
          <MaterialCommunityIcons name="menu" size={26} color="#ffffff" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Plant Diagnosis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {currentImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: currentImage }} style={styles.image} />
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake} activeOpacity={0.8}>
              <MaterialCommunityIcons name="camera-retake" size={20} color="#ffffff" />
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>
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
              <TouchableOpacity onPress={() => setSidePanelVisible(false)} style={styles.closeButton}>
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
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#5f6368" />
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
                            {item.result.diseases.map((d: any) => d.name).join(", ")}
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
  )
}
