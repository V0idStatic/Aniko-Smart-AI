import React, { useState, useEffect, useRef } from 'react';
import supabase from "./CONFIG/supaBase"; // Import Supabase client
import { getCurrentUser } from './CONFIG/currentUser';
import { useAppContext } from './CONFIG/GlobalContext';
import type { SensorData as GlobalSensorData } from './CONFIG/GlobalContext';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'


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
  secondaryBrown: "#ecc096ff",
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

interface SensorData {
  temperature: number;
  moisture: number;
  ec: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  timestamp: number;
}

interface ReadingRow {
  id: number;
  user_id: number;
  measured_at: string;
  temp_c: string | null;
  moisture_pct: string | null;
  ec_us_cm: string | null;
  ph_level: string | null;
  nitrogen_ppm: string | null;
  phosphorus_ppm: string | null;
  potassium_ppm: string | null;
  humidity_pct: string | null;
}

const { width } = Dimensions.get('window');

const NPKSensorDashboard: React.FC = () => {
  // Use global context for sensor state and Arduino IP
  const { sensorData, setSensorData, isSensorConnected, setIsSensorConnected, arduinoIP, setArduinoIP } = useAppContext();
  
  const [recentReadings, setRecentReadings] = useState<ReadingRow[]>([]);
  const [dbStatus, setDbStatus] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [showIPInput, setShowIPInput] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const fetchIntervalRef = useRef<number | null>(null);
  const router = useRouter();

  // Fetch data from Arduino
  const fetchSensorData = async () => {
    try {
      console.log(`Fetching sensor data from: http://${arduinoIP}/api/sensor-data`);
      
      const response = await fetch(`http://${arduinoIP}/api/sensor-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Remove AbortController for now to simplify debugging
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Received sensor data:', data);
        
        const normalized: SensorData = {
          temperature: data.temperature || 0,
          moisture: data.moisture || 0,
          ec: data.ec || 0,
          ph: data.ph || 0,
          nitrogen: data.nitrogen || 0,
          phosphorus: data.phosphorus || 0,
          potassium: data.potassium || 0,
          timestamp: Date.now() // Always use current timestamp to force updates
        };
        
        console.log('🔄 Updating global sensor data:', normalized);
        setSensorData(normalized);

        // Insert into database for current user
        const current = getCurrentUser();
        if (current) {
          const insertPayload = {
            user_id: current.id,
            measured_at: new Date().toISOString(),
            temp_c: normalized.temperature,
            moisture_pct: normalized.moisture,
            ec_us_cm: normalized.ec,
            ph_level: normalized.ph,
            nitrogen_ppm: normalized.nitrogen,
            phosphorus_ppm: normalized.phosphorus,
            potassium_ppm: normalized.potassium,
            // humidity_pct intentionally omitted (not in sensorData yet)
          };
          const { error: insertError } = await supabase.from('esp32_readings').insert(insertPayload);
          if (insertError) {
            console.log('Insert error:', insertError.message);
            setDbStatus('Insert failed: ' + insertError.message);
          } else {
            setDbStatus('Inserted at ' + new Date().toLocaleTimeString());
          }
        } else {
          setDbStatus('No current user in session; cannot store reading');
        }
        
        if (!isSensorConnected) {
          setIsSensorConnected(true);
          setConnectionStatus('Connected');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error fetching sensor data:', error);
      console.error('Error details:', error.message);
      
      if (isSensorConnected) {
        setIsSensorConnected(false);
        setConnectionStatus('Connection Lost');
        Alert.alert('Connection Error', `Lost connection to Arduino sensor: ${error.message}`);
      }
    }
  };

  // Test connection to Arduino
  const testConnection = async () => {
    if (isConnecting) return; // Prevent multiple simultaneous connection attempts
    
    setIsConnecting(true);
    setConnectionStatus('Testing Connection...');
    
    try {
      // Clear any existing interval first
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
        fetchIntervalRef.current = null;
      }

      console.log(`Testing connection to: http://${arduinoIP}/api/status`);

      // First, let's try a simple fetch without timeout to see what happens
      const response = await fetch(`http://${arduinoIP}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Status response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('Status data received:', data);
        
        setConnectionStatus('Connected');
        setIsSensorConnected(true);
        setShowIPInput(false);
        
        // Set up interval and store the reference (every 5 minutes)
        fetchIntervalRef.current = setInterval(fetchSensorData, 5 * 60 * 1000);
        
        // Fetch initial data immediately
        await fetchSensorData();
        
        Alert.alert('Success', 'Connected to Arduino NPK sensor!');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      setConnectionStatus('Connection Failed');
      setIsSensorConnected(false);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network request failed - check WiFi connection';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout - Arduino may be unreachable';
      } else if (error.message.includes('HTTP')) {
        errorMessage = `Server error: ${error.message}`;
      } else {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Connection Failed', 
        `Cannot connect to Arduino at ${arduinoIP}\n\nError: ${errorMessage}\n\nMake sure:\n1. Arduino is powered on\n2. Connected to same WiFi\n3. IP address is correct\n4. Both devices on same network`
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (fetchIntervalRef.current) {
      clearInterval(fetchIntervalRef.current);
      fetchIntervalRef.current = null;
    }
    setIsSensorConnected(false);
    setConnectionStatus('Disconnected');
    setSensorData(null);
  };

  // Start/stop fetching based on connection status only
  useEffect(() => {
    if (!isSensorConnected) {
      console.log('⚠️ Not connected - stopping fetch')
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current)
        fetchIntervalRef.current = null
      }
      return
    }
    
    console.log('✅ Connected - starting continuous fetch')
    
    // Clear any existing interval
    if (fetchIntervalRef.current) {
      clearInterval(fetchIntervalRef.current)
      fetchIntervalRef.current = null
    }
    
    // Start fetching immediately
    fetchSensorData()
    
    // Set up continuous fetching (every 5 minutes)
    const intervalId = setInterval(() => {
      fetchSensorData()
    }, 5 * 60 * 1000)
    fetchIntervalRef.current = intervalId as unknown as number
    
    console.log('📡 Fetch interval started, ID:', fetchIntervalRef.current)
    
    // DON'T cleanup on unmount - let it keep running!
    return () => {
      console.log('⚠️ Component cleanup but keeping interval active')
      // Don't clear interval here - only clear when explicitly disconnecting
    }
  }, [isSensorConnected]) // Only depend on connection status

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, []);

  // Initial load of last N readings & realtime subscription
  useEffect(() => {
    const current = getCurrentUser();
    if (!current) {
      setDbStatus('No logged-in user; cannot load readings');
      return;
    }
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data, error } = await supabase
        .from('esp32_readings')
        .select('*')
        .eq('user_id', current.id)
        .order('measured_at', { ascending: false })
        .limit(20);
      if (!error && data) setRecentReadings(data as any);
      channel = supabase
        .channel('public:esp32_readings:user:' + current.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'esp32_readings', filter: 'user_id=eq.' + current.id }, (payload: any) => {
          const row = payload.new as ReadingRow;
          setRecentReadings(prev => [row, ...prev.slice(0, 49)]); // keep up to 50
        })
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const getSensorStatus = (value: number, type: string): string => {
    switch (type) {
      case 'temperature':
        return value >= 18 && value <= 28 ? 'optimal' : value >= 15 && value <= 32 ? 'good' : 'warning';
      case 'moisture':
        return value >= 50 ? 'good' : value >= 30 ? 'warning' : 'danger';
      case 'ph':
        return value >= 6.0 && value <= 7.0 ? 'optimal' : value >= 5.5 && value <= 7.5 ? 'good' : 'warning';
      case 'potassium':
        return value >= 100 && value <= 400 ? 'optimal' : value >= 50 ? 'good' : 'warning';
      default:
        return 'good';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'optimal': return '#4CAF50';
      case 'good': return '#2196F3';
      case 'warning': return '#FF9800';
      case 'danger': return COLORS.error;
      default: return '#9E9E9E';
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return 'thermometer-outline';
      case 'moisture': return 'water-outline';
      case 'ec': return 'flash-outline';
      case 'ph': return 'flask-outline';
      case 'nitrogen': return 'leaf-outline';
      case 'phosphorus': return 'flower-outline';
      case 'potassium': return 'nutrition-outline';
      default: return 'analytics-outline';
    }
  };

  const SensorCard = ({ 
    title, 
    value, 
    unit, 
    type, 
    icon 
  }: { 
    title: string; 
    value: number; 
    unit: string; 
    type: string; 
    icon: string; 
  }) => {
    const status = getSensorStatus(value, type);
    const statusColor = getStatusColor(status);

    return (
      <View style={styles.sensorCard}>
        <View style={styles.cardHeader}>
          <Ionicons name={icon as any} size={24} color="#1c4722" />
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
        <Text style={styles.sensorValue}>
          {value.toFixed(type === 'nitrogen' ? 3 : 1)}{unit}
        </Text>
        <Text style={styles.sensorTitle}>{title}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primaryGreen, COLORS.darkGreen]} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NPK Sensor Dashboard</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowIPInput(!showIPInput)}
        >
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* IP Configuration */}
        {showIPInput && (
          <View style={styles.ipConfigPanel}>
            <Text style={styles.ipConfigTitle}>Arduino IP Address</Text>
            <TextInput
              style={styles.ipInput}
              value={arduinoIP}
              onChangeText={setArduinoIP}
              placeholder="192.168.1.100"
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.saveIPButton}
              onPress={() => setShowIPInput(false)}
            >
              <Text style={styles.saveIPButtonText}>Save</Text>
            </TouchableOpacity>
            
            {/* Debug Info */}
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>Debug Info:</Text>
              <Text style={styles.debugText}>Target URL: http://{arduinoIP}/api/status</Text>
              <Text style={styles.debugText}>Status: {connectionStatus}</Text>
            </View>
          </View>
        )}

        {/* Connection Panel */}
        <View style={styles.connectionPanel}>
          <View style={styles.connectionInfo}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: isSensorConnected ? '#4CAF50' : '#F44336' }
            ]} />
            <View>
              <Text style={styles.connectionText}>
                Status: {connectionStatus}
              </Text>
              <Text style={styles.connectionSubText}>
                Arduino: {arduinoIP}
              </Text>
            </View>
          </View>
          
          {!isSensorConnected ? (
            <TouchableOpacity
              style={[styles.connectButton, isConnecting && styles.connectingButton]}
              onPress={testConnection}
              disabled={isConnecting}
            >
              <Text style={styles.connectButtonText}>
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.connectButton, styles.disconnectButton]}
              onPress={disconnect}
            >
              <Text style={styles.connectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sensor Data Grid */}
        {sensorData && (
          <>
            <Text style={styles.sectionTitle}>Live Sensor Readings</Text>
            <View style={styles.sensorGrid}>
              <SensorCard
                title="Temperature"
                value={sensorData.temperature}
                unit="°C"
                type="temperature"
                icon="thermometer-outline"
              />
              <SensorCard
                title="Moisture"
                value={sensorData.moisture}
                unit="%"
                type="moisture"
                icon="water-outline"
              />
              <SensorCard
                title="EC"
                value={sensorData.ec}
                unit=" μS/cm"
                type="ec"
                icon="flash-outline"
              />
              <SensorCard
                title="pH Level"
                value={sensorData.ph}
                unit=""
                type="ph"
                icon="flask-outline"
              />
              <SensorCard
                title="Nitrogen (N)"
                value={sensorData.nitrogen}
                unit=" ppm"
                type="nitrogen"
                icon="leaf-outline"
              />
              <SensorCard
                title="Phosphorus (P)"
                value={sensorData.phosphorus}
                unit=" ppm"
                type="phosphorus"
                icon="flower-outline"
              />
              <SensorCard
                title="Potassium (K)"
                value={sensorData.potassium}
                unit=" ppm"
                type="potassium"
                icon="nutrition-outline"
              />
            </View>

           
          </>
        )}

        {!sensorData && isSensorConnected && (
          <View style={styles.waitingContainer}>
            <Ionicons name="sync-outline" size={48} color="#9E9E9E" />
            <Text style={styles.waitingText}>Fetching sensor data...</Text>
          </View>
        )}

        {!isSensorConnected && !showIPInput && (
          <View style={styles.instructionContainer}>
            <Ionicons name="information-circle-outline" size={48} color="#9E9E9E" />
            <Text style={styles.instructionTitle}>Setup Instructions</Text>
            <Text style={styles.instructionText}>
              1. Upload the Arduino code to your ESP32{'\n'}
              2. Connect to the same WiFi network{'\n'}
              3. Check serial monitor for IP address{'\n'}
              4. Enter the IP address and connect
            </Text>
            
            {/* Test URLs for manual verification */}
            <View style={styles.testUrlContainer}>
              <Text style={styles.testUrlTitle}>Emergency url:</Text>
              <Text style={styles.testUrl}>http://{arduinoIP}/api/status</Text>
              <Text style={styles.testUrl}>http://{arduinoIP}/api/sensor-data</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e7dbc8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  ipConfigPanel: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ipConfigTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: COLORS.primaryGreen
  },
  ipInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  saveIPButton: {
    backgroundColor: COLORS.mutedGreen,
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  saveIPButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: COLORS.lightGreen,
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  connectionPanel: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  connectionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryGreen
  },
  connectionSubText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: COLORS.mutedGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  connectingButton: {
    backgroundColor: '#666',
  },
  disconnectButton: {
    backgroundColor: COLORS.error,
  },
  connectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primaryBrown,
    marginBottom: 15,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sensorCard: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    width: (width - 60) / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sensorValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    marginBottom: 5,
  },
  sensorTitle: {
    fontSize: 14,
    color: '#666',
  },
  lastUpdated: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lastUpdatedTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  lastUpdatedTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c4722',
  },
  lastUpdatedSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  waitingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  waitingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  instructionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c4722',
    marginTop: 10,
    marginBottom: 15,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  testUrlContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    width: '100%',
  },
  testUrlTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1c4722',
  },
  testUrl: {
    fontSize: 12,
    color: '#0066cc',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
});
export default NPKSensorDashboard;