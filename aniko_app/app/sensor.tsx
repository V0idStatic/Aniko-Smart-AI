import React, { useState, useEffect, useRef } from 'react';
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

const { width } = Dimensions.get('window');

const NPKSensorDashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [arduinoIP, setArduinoIP] = useState('192.168.18.56'); // Default IP
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
        
        setSensorData({
          temperature: data.temperature || 0,
          moisture: data.moisture || 0,
          ec: data.ec || 0,
          ph: data.ph || 0,
          nitrogen: data.nitrogen || 0,
          phosphorus: data.phosphorus || 0,
          potassium: data.potassium || 0,
          timestamp: data.timestamp || Date.now()
        });
        
        if (!isConnected) {
          setIsConnected(true);
          setConnectionStatus('Connected');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error fetching sensor data:', error);
      console.error('Error details:', error.message);
      
      if (isConnected) {
        setIsConnected(false);
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
        setIsConnected(true);
        setShowIPInput(false);
        
        // Set up interval and store the reference
        fetchIntervalRef.current = setInterval(fetchSensorData, 3000);
        
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
      setIsConnected(false);
      
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
    setIsConnected(false);
    setConnectionStatus('Disconnected');
    setSensorData(null);
  };

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
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
      case 'danger': return '#F44336';
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
      <LinearGradient colors={["#1c4722", "#4d7f39"]} style={styles.header}>
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
              { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
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
          
          {!isConnected ? (
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
                unit="%"
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

            {/* Last Updated */}
            <View style={styles.lastUpdated}>
              <Text style={styles.lastUpdatedTitle}>Data Source</Text>
              <Text style={styles.lastUpdatedTime}>
                Live from Arduino NPK Sensor
              </Text>
              <Text style={styles.lastUpdatedSubtitle}>
                Updates every 3 seconds
              </Text>
            </View>
          </>
        )}

        {!sensorData && isConnected && (
          <View style={styles.waitingContainer}>
            <Ionicons name="sync-outline" size={48} color="#9E9E9E" />
            <Text style={styles.waitingText}>Fetching sensor data...</Text>
          </View>
        )}

        {!isConnected && !showIPInput && (
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
              <Text style={styles.testUrlTitle}>Test URLs manually first:</Text>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
    backgroundColor: 'white',
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
    fontWeight: '600',
    marginBottom: 10,
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
    backgroundColor: '#1c4722',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  saveIPButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: '#f5f5f5',
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
    backgroundColor: 'white',
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
    fontWeight: '500',
  },
  connectionSubText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: '#1c4722',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  connectingButton: {
    backgroundColor: '#666',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  connectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c4722',
    marginBottom: 15,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sensorCard: {
    backgroundColor: 'white',
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
    color: '#1c4722',
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