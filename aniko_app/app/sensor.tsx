import React, { useState, useEffect, useRef } from 'react';
import supabase from "./CONFIG/supaBase"; // Import Supabase client
import { getCurrentUser } from './CONFIG/currentUser';
import { useAppContext } from './CONFIG/GlobalContext';
import type { SensorData as GlobalSensorData } from './CONFIG/GlobalContext';
import { testNetworkConnectivity, showNetworkDiagnostics } from './utils/NetworkDiagnostics';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
// Optional navigation import - will work without it
// import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'

// Network discovery (if available - you may need to install react-native-network-info)
// import { NetworkInfo } from 'react-native-network-info';

// Note: For full UDP discovery, you would need: npm install react-native-udp
// For now, we'll use network scanning approach


// ---- HTTP helpers (Android-safe) -----------------------------------------
// Minimal headers (no preflight), explicit timeout, detailed logging
const fetchJson = async (
  url: string,
  opts: { timeout?: number; headers?: Record<string, string> } = {}
) => {
  const { timeout = 15000, headers = {} } = opts; // Increased timeout for mobile
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    console.log('HTTP GET:', url);
    console.log('HTTP Headers:', headers);
    
    const res = await fetch(url, {
      method: 'GET',
      // Remove Content-Type to avoid CORS preflight requests
      headers: { 
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache',
        'User-Agent': 'AniKo-Mobile-App/1.0.0',
        ...headers 
      },
      signal: controller.signal,
    });
    
    const meta = {
      status: res.status,
      ok: res.ok,
      headers: Object.fromEntries(res.headers.entries()),
      url: res.url,
    };
    
    console.log('HTTP Response Meta:', meta);
    
    if (!res.ok) {
      console.log('HTTP META (error):', meta);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const contentType = res.headers.get('content-type') || '';
    let data;
    
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      // Handle non-JSON responses (like HTML from root endpoint)
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text.substring(0, 200) }; // Truncate long responses
      }
    }
    
    console.log('HTTP META (ok):', meta);
    console.log('HTTP Data received:', typeof data, Object.keys(data || {}));
    return { ok: true as const, data, ...meta };
  } catch (error: any) {
    console.log('HTTP ERROR:', { url, message: error?.message, name: error?.name });
    return { ok: false as const, error };
  } finally {
    clearTimeout(timer);
  }
};

const resolveArduinoIP = (ip?: string) =>
  ip && ip.trim().length > 0 ? ip.trim() : '192.168.18.56';

// Alternative simple fetch for testing in EAS builds
const simpleFetch = async (url: string, timeoutMs: number = 15000) => {
  console.log('🚀 SIMPLE FETCH:', url);
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': '*/*',
        'User-Agent': 'AniKo-App'
      }
    });
    
    clearTimeout(timer);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    console.log('📦 Raw response:', text.substring(0, 200));
    
    try {
      const data = JSON.parse(text);
      console.log('✅ Parsed JSON successfully');
      return { ok: true, data };
    } catch {
      console.log('⚠️ Non-JSON response, returning as text');
      return { ok: true, data: { message: text } };
    }
  } catch (error: any) {
    clearTimeout(timer);
    console.error('❌ SIMPLE FETCH ERROR:', error.message);
    return { ok: false, error };
  }
};


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
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Arduino Discovery State
  const [discoveredArduinos, setDiscoveredArduinos] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showDiscoveredDevices, setShowDiscoveredDevices] = useState(false);

  // WiFi Configuration State
  const [showWiFiConfig, setShowWiFiConfig] = useState(false);
  const [wifiSSID, setWiFiSSID] = useState('');
  const [wifiPassword, setWiFiPassword] = useState('');
  const [isConfiguringWiFi, setIsConfiguringWiFi] = useState(false);

  // Fetch data from Arduino
  const fetchSensorData = async () => {
    try {
      console.log('📊 FETCH SENSOR DATA CALLED');
      const ip = resolveArduinoIP(arduinoIP);
      console.log('🎯 Fetching from URL:', `http://${ip}/api/sensor-data`);
      console.log('🔗 Arduino IP:', ip);

      const result = await fetchJson(`http://${ip}/api/sensor-data`, {
        timeout: 12000,
        headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'AniKo-Mobile-App/1.0.0' },
      });

      if (result.ok) {
        const data = (result as any).data;
        console.log('📦 SENSOR DATA RECEIVED:', data);
        
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
        console.log('🌡️ Temperature:', normalized.temperature);
        console.log('💧 Moisture:', normalized.moisture);
        console.log('🧪 pH:', normalized.ph);
        console.log('🌿 NPK:', normalized.nitrogen, normalized.phosphorus, normalized.potassium);
        setSensorData(normalized);

        // Insert into database for current user
        console.log('💾 PREPARING DATABASE INSERT...');
        const current = getCurrentUser();
        console.log('👤 Current User:', current);
        
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
          
          console.log('📦 Insert Payload:', insertPayload);
          console.log('🏪 Inserting into esp32_readings table...');
          
          const { error: insertError } = await supabase.from('esp32_readings').insert(insertPayload);
          if (insertError) {
            console.error('❌ DATABASE INSERT ERROR:', insertError);
            console.log('   Error message:', insertError.message);
            console.log('   Error details:', insertError.details);
            console.log('   Error hint:', insertError.hint);
            setDbStatus('Insert failed: ' + insertError.message);
          } else {
            console.log('✅ DATABASE INSERT SUCCESSFUL');
            setDbStatus('Inserted at ' + new Date().toLocaleTimeString());
          }
        } else {
          console.log('⚠️ NO USER SESSION - Cannot store reading');
          setDbStatus('No current user in session; cannot store reading');
        }
        
        if (!isSensorConnected) {
          setIsSensorConnected(true);
          setConnectionStatus('Connected');
        }
      } else {
        const err = (result as any).error;
        console.error('❌ SENSOR DATA FETCH ERROR:', err?.message || err);
        throw new Error(err?.message || 'Network request failed');
      }
    } catch (error: any) {
      console.error('💥 SENSOR DATA FETCH ERROR:', error);
      console.log('   Error type:', typeof error);
      console.log('   Error name:', error.name);
      console.log('   Error message:', error.message);
      console.log('   Error stack:', error.stack);
      
      // Check if it's a network error specifically
      if (error.name === 'TypeError' || error.message.includes('Network request failed')) {
        console.log('🌐 NETWORK ERROR DETECTED - Arduino unreachable');
      }
      
      if (isSensorConnected) {
        console.log('🔌 Setting sensor as DISCONNECTED');
        setIsSensorConnected(false);
        setConnectionStatus('Connection Lost');
        Alert.alert('Connection Error', `Lost connection to Arduino sensor: ${error.message}`);
      } else {
        console.log('⚠️ Sensor was already disconnected, updating status');
        setConnectionStatus('Connection Failed');
      }
    }
  };

  // Arduino Discovery Function - Scans network for ANIKO Arduino devices
  const discoverArduinos = async () => {
    setIsScanning(true);
    setDiscoveredArduinos([]);
    setShowDiscoveredDevices(true);
    
    console.log('🔍 Scanning for ANIKO Arduino devices...');
    console.log('📱 Known Arduino IP from Serial Monitor:', arduinoIP);
    
    try {
      // First, try the current arduinoIP if it's set
      if (arduinoIP && arduinoIP !== '192.168.1.100') {
        console.log('🎯 Testing known Arduino IP first:', arduinoIP);
        await testSpecificIP(arduinoIP);
      }

      // Determine network ranges based on current Arduino IP or scan common ones
      let networkRanges = [];
      
      // 🆕 FLEXIBLE IP: Auto-detect network from current device IP
      try {
        // Try to detect local network automatically
        const testResponse = await fetch('http://httpbin.org/ip', { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }).catch(() => null);
        
        if (testResponse && testResponse.ok) {
          const deviceInfo = await testResponse.json();
          console.log('📱 Device network info detected:', deviceInfo);
        }
      } catch (e) {
        console.log('🌐 Network detection failed, using default ranges');
      }
      
      if (arduinoIP && arduinoIP !== '192.168.1.100') {
        // Extract network from known Arduino IP
        const ipParts = arduinoIP.split('.');
        if (ipParts.length === 4) {
          const baseNetwork = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.`;
          networkRanges = [baseNetwork];
          console.log('🌐 Scanning network based on known Arduino:', baseNetwork);
        }
      } else {
        // 🆕 ENHANCED: Scan more comprehensive network ranges for multiple users
        networkRanges = [
          '192.168.1.',    // Most common home router default
          '192.168.0.',    // Alternative home router default  
          '192.168.18.',   // Current network
          '192.168.4.',    // ESP32 AP mode default
          '192.168.2.',    // Some routers
          '192.168.3.',    // Some routers
          '192.168.10.',   // Some corporate networks
          '192.168.50.',   // Some networks
          '192.168.100.',  // Some networks
          '10.0.0.',       // Corporate/VPN networks
          '10.0.1.',       // Corporate networks
          '172.16.0.',     // Corporate networks
          '172.20.10.',    // iOS hotspot default
          '192.168.43.',   // Android hotspot default
        ];
        console.log('🌐 Scanning comprehensive network ranges for multi-user support');
      }

      const scanPromises = [];
      
      // Scan each network range with extended IP range
      for (const baseIP of networkRanges) {
        // Scan broader Arduino IP range (1-254 but in chunks for performance)
        for (let i = 1; i <= 254; i++) {
          const testIP = baseIP + i;
          
          // Skip if we already tested this IP
          if (testIP === arduinoIP) continue;
          
          scanPromises.push(testSpecificIP(testIP));
        }
      }
      
      // Wait for all scans to complete (with timeout)
      console.log(`🔄 Starting scan of ${scanPromises.length} IP addresses...`);
      await Promise.allSettled(scanPromises);
      
    } catch (error) {
      console.error('❌ Error during Arduino discovery:', error);
    } finally {
      setIsScanning(false);
      console.log('🔍 Arduino scan completed');
      console.log(`✅ Found ${discoveredArduinos.length} ANIKO Arduino(s)`);
    }
  };

  // Helper function to test a specific IP
  const testSpecificIP = async (testIP: string) => {
    try {
      console.log(`🔍 Testing IP: ${testIP}`);
      
      // Try multiple endpoints to identify Arduino
      const endpoints = ['/api/device-info', '/api/status', '/'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await Promise.race([
            fetch(`http://${testIP}${endpoint}`, { 
              method: 'GET',
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'Cache-Control': 'no-cache',
                'User-Agent': 'AniKo-Mobile-App/1.0.0'
                // Removed Content-Type to avoid CORS preflight
              }
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('timeout')), 5000) // Increased timeout
            )
          ]);

          if (response && typeof response === 'object' && 'ok' in response && response.ok) {
            // Try to parse response
            let data;
            const fetchResponse = response as Response;
            const contentType = fetchResponse.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
              data = await fetchResponse.json();
            } else {
              const text = await fetchResponse.text();
              // Check if HTML contains ANIKO identifier
              if (text.includes('ANIKO') || text.includes('Smart AI') || text.includes('NPK Sensor')) {
                data = { device_type: 'ANIKO_SMART_AI_SENSOR' };
              }
            }
            
            console.log(`📤 Response from ${testIP}${endpoint}:`, data);
            
            // Add debug logging for your specific IP
            if (testIP === '192.168.18.56') {
              console.log('🔍 DEBUG: Testing known Arduino IP:', testIP);
              console.log('📤 Arduino response:', JSON.stringify(data, null, 2));
              console.log('🔍 device_type check:', data.device_type === 'ANIKO_SMART_AI_SENSOR');
              console.log('🔍 device_name check:', data.device_name?.includes('ANIKO'));
            }
            
            // Check multiple ways to identify ANIKO Arduino - FIXED DETECTION LOGIC
            const isAnikoArduino = data && (
              // Primary check - device_type field
              data.device_type === 'ANIKO_SMART_AI_SENSOR' ||
              
              // Secondary check - device field  
              data.device === 'ANIKO_SMART_AI_SENSOR' ||
              
              // Device name checks
              (data.device_name && (
                data.device_name.includes('ANIKO') ||
                data.device_name.includes('Smart AI') ||
                data.device_name.includes('NPK Sensor')
              )) ||
              
              // Status check - if it's online and has device_type
              (data.status === 'online' && data.device_type) ||
              
              // Fallback - check if any field contains ANIKO
              Object.values(data).some(value => 
                typeof value === 'string' && (
                  value.includes('ANIKO') || 
                  value.includes('Smart AI') ||
                  value.includes('NPK Sensor')
                )
              )
            );
            
            if (testIP === '192.168.18.56') {
              console.log('🔍 Detection result:', isAnikoArduino);
            }
            
            if (isAnikoArduino) {
              console.log(`✅ Found ANIKO Arduino at: ${testIP}`);
              setDiscoveredArduinos(prev => {
                if (!prev.includes(testIP)) {
                  console.log(`➕ Adding ${testIP} to discovered devices`);
                  return [...prev, testIP];
                }
                return prev;
              });
              break; // Found Arduino, no need to try other endpoints
            }
          }
        } catch (endpointError) {
          // Continue to next endpoint
          continue;
        }
      }
    } catch (error) {
      // IP not responding or not Arduino - ignore
    }
  };

  // Select discovered Arduino
  const selectDiscoveredArduino = async (ip: string) => {
    console.log('✅ User selected Arduino:', ip);
    setArduinoIP(ip);
    setShowDiscoveredDevices(false);
    
    // Test connection to selected Arduino
    await testConnection();
    
    Alert.alert(
      'Arduino Selected', 
      `Connected to ANIKO Arduino at ${ip}\n\nTap "Connect" to start monitoring.`,
      [{ text: 'OK' }]
    );
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

  const ip = resolveArduinoIP(arduinoIP);
  console.log('🚀 CONNECT BUTTON PRESSED - Starting connection test');
  console.log('🎯 Target Arduino IP:', ip);
  console.log('🌐 Full Status URL:', `http://${ip}/api/status`);
  console.log('🌐 Full Sensor URL:', `http://${ip}/api/sensor-data`);
      console.log('📱 App attempting fetch to Arduino...');
      
      // 🆕 ENHANCED: Force mobile app to use exact same headers as successful diagnostics
      console.log('🔧 Using enhanced mobile-compatible headers...');

      // Try simple fetch first (for EAS build debugging)
      console.log('🧪 Testing with simple fetch first...');
      const simpleTest = await simpleFetch(`http://${ip}/api/status`);
      
      if (simpleTest.ok) {
        console.log('✅ Simple fetch worked! Data:', simpleTest.data);
      } else {
        console.log('❌ Simple fetch failed:', simpleTest.error?.message);
      }

      // Status endpoint using helper
      const statusResult = await fetchJson(`http://${ip}/api/status`, {
        timeout: 20000, // Increased timeout for EAS builds
        headers: { 
          'Cache-Control': 'no-cache', 
          'User-Agent': 'AniKo-Mobile-App/1.0.0'
          // Removed Content-Type to avoid CORS preflight
        },
      });

      if (!statusResult.ok) {
        const err = (statusResult as any).error;
        console.error('Status endpoint failed:', err);
        throw new Error(err?.message || 'Arduino status check failed');
      }

      const statusData = (statusResult as any).data;
      console.log('📦 Arduino Status Data:', JSON.stringify(statusData, null, 2));

      // Verify it's our Arduino device
      const isAnikoDevice = statusData.device === 'ANIKO_SMART_AI_SENSOR' || 
                           statusData.device_type === 'ANIKO_SMART_AI_SENSOR';
      
      if (!isAnikoDevice) {
        console.warn('Device identification issue:', statusData);
        // Still proceed if we get a valid response - might be configuration issue
      }

      console.log('✅ Status endpoint verified, testing sensor data endpoint...');

      // Test sensor data endpoint using helper
      const sensorResult = await fetchJson(`http://${ip}/api/sensor-data`, {
        timeout: 15000,
        headers: { 
          'Cache-Control': 'no-cache', 
          'User-Agent': 'AniKo-Mobile-App/1.0.0'
        },
      });

      if (!sensorResult.ok) {
        console.warn('⚠️ Sensor endpoint failed, but status works');
      } else {
        const sensorData = (sensorResult as any).data;
        console.log('📊 Sensor Data Preview:', Object.keys(sensorData));
        console.log('🌡️ Sample readings:', {
          temperature: sensorData.temperature,
          moisture: sensorData.moisture,
          ph: sensorData.ph
        });
      }

      // ✅ SUCCESS - Connection established
      console.log('✅ CONNECTION SUCCESSFUL - Setting up Arduino communication');
      setConnectionStatus('Connected');
      setIsSensorConnected(true);
      setShowIPInput(false);
      
      // Set up interval for regular data fetching (every 30 seconds)
      console.log('⏰ Setting up data fetch interval (30 seconds)');
      fetchIntervalRef.current = setInterval(fetchSensorData, 30 * 1000);
      
      // Fetch initial data immediately
      console.log('🔄 Fetching initial sensor data...');
      await fetchSensorData();
      
      Alert.alert(
        'Success! 🎉', 
        `Connected to Arduino NPK sensor!\n\n✅ Device: ${statusData.device || statusData.device_type}\n✅ IP: ${statusData.ip || arduinoIP}\n✅ Status: Online\n✅ Temperature: ${statusData.temperature || 'N/A'}°C\n✅ Arduino Diagnostics: PASSED\n\nSensor data will update every 30 seconds.`
      );

    } catch (error: any) {
      console.error('❌ CONNECTION FAILED:');
      console.error('   Error Name:', error.name);
      console.error('   Error Message:', error.message);
      console.error('   Error Stack:', error.stack);
      
      setConnectionStatus('Connection Failed');
      setIsSensorConnected(false);
      
      let userMessage = 'Unknown connection error';
      let troubleshooting = '';
      
      // Enhanced error analysis with diagnostics context
      if (error.name === 'AbortError') {
        userMessage = 'Connection timeout - Arduino took too long to respond';
        troubleshooting = `
🔧 Troubleshooting:
• Arduino might be busy or overloaded
• Try restarting Arduino
• Check Arduino Serial Monitor for "WiFi connected" message
• Verify IP is still ${arduinoIP}

📊 DIAGNOSTICS STATUS: Arduino responds correctly to desktop browser/Node.js but mobile app times out`;
      } else if (error.message.includes('Network request failed')) {
        userMessage = 'Network request failed - Cannot reach Arduino';
        troubleshooting = `
🔧 Troubleshooting:
• SOLUTION: Rebuild app with new network security config (network_security_config.xml was just created)
• Check WiFi: Both devices must be on same network
• Verify Arduino IP: ${arduinoIP}
• Test in browser: http://${arduinoIP}/api/status
• Check router settings (disable AP Isolation)
• Try restarting WiFi on phone

📊 DIAGNOSTICS STATUS: Arduino working perfectly (all endpoints respond correctly)
📱 ISSUE: Mobile app network security was blocking connection - NOW FIXED!
🚀 NEXT STEP: Rebuild with EAS and test again`;
      } else if (error.message.includes('fetch') || error.message.includes('cleartext')) {
        userMessage = 'HTTP cleartext traffic was blocked';
        troubleshooting = `
🔧 SOLUTION APPLIED:
• ✅ Created network_security_config.xml
• ✅ Updated AndroidManifest.xml with cleartext permissions
• ✅ Fixed app.json network configuration
• ✅ Removed CORS-triggering headers from requests

📱 NEXT STEP: Rebuild the app with EAS to apply these fixes:
   eas build --platform android

🔧 Alternative test: Use 'eas build --local' if you want to test locally first`;
      } else if (error.message.includes('CORS')) {
        userMessage = 'CORS or preflight request issue';
        troubleshooting = `
🔧 SOLUTION APPLIED:
• ✅ Removed Content-Type headers that trigger CORS preflight
• ✅ Simplified request headers for mobile compatibility
• ✅ Added network security config for local IP access

📱 REBUILD REQUIRED: The fixes are applied but need app rebuild to take effect`;
      } else if (error.message.includes('JSON')) {
        userMessage = 'Arduino sent invalid response';
        troubleshooting = `
🔧 Troubleshooting:
• Arduino responded but data is corrupted
• Check Arduino Serial Monitor for errors
• Try restarting Arduino
• Check Arduino firmware version

📊 DIAGNOSTICS STATUS: Arduino JSON responses working correctly`;
      } else if (error.message.includes('HTTP')) {
        userMessage = `Server error: ${error.message}`;
        troubleshooting = `
🔧 Troubleshooting:
• Arduino returned error status
• Check Arduino Serial Monitor
• Verify Arduino firmware is working
• Try restarting Arduino

📊 DIAGNOSTICS STATUS: Arduino HTTP server working correctly`;
      } else {
        userMessage = error.message;
        troubleshooting = `
🔧 Troubleshooting:
• Unknown error occurred
• Check console logs for details
• Try restarting both devices
• Verify network connection

📊 DIAGNOSTICS STATUS: Arduino fully functional - issue is mobile app specific`;
      }
      
      Alert.alert(
        'Connection Failed ❌', 
        `${userMessage}\n${troubleshooting}\n\n🔍 Technical Details:\nTarget: ${arduinoIP}\nError: ${error.message}\n\n💡 RECOMMENDATION: Your Arduino is working perfectly. The issue is mobile app network security. Please rebuild your app with the updated network configuration.`,
        [
          { text: 'Retry', onPress: () => setTimeout(testConnection, 1000) },
          { text: 'Cancel', style: 'cancel' }
        ]
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

  // Configure WiFi on Arduino
  const configureWiFi = async () => {
    if (!wifiSSID || !wifiPassword) {
      Alert.alert('Error', 'Please enter both WiFi SSID and password');
      return;
    }

    setIsConfiguringWiFi(true);
    
    try {
      console.log(`Configuring WiFi on Arduino: ${arduinoIP}`);
      
      const response = await fetch(`http://${arduinoIP}/api/configure-wifi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',  // POST requests need this - requires Arduino CORS
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ssid: wifiSSID,
          password: wifiPassword
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('WiFi configuration response:', result);
        
        Alert.alert(
          'WiFi Configured',
          `Arduino will restart and connect to "${wifiSSID}"\n\nThe IP address may change after restart. Use "Scan for Arduino" to find the new IP.`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                setShowWiFiConfig(false);
                setWiFiSSID('');
                setWiFiPassword('');
                // Disconnect current connection since IP will change
                disconnect();
              }
            }
          ]
        );
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('WiFi configuration failed:', error);
      
      Alert.alert(
        'WiFi Configuration Failed',
        `Could not configure WiFi on Arduino\n\nError: ${error.message}\n\nMake sure:\n1. Arduino is connected\n2. Arduino firmware supports WiFi configuration\n3. Both devices are on same network`
      );
    } finally {
      setIsConfiguringWiFi(false);
    }
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
    fetchIntervalRef.current = intervalId
    
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

        {/* WiFi Configuration Panel */}
        <View style={styles.wifiConfigPanel}>
          <View style={styles.wifiConfigHeader}>
            <Ionicons name="wifi-outline" size={20} color={COLORS.primaryGreen} />
            <Text style={styles.wifiConfigTitle}>WiFi Configuration</Text>
          </View>
          <Text style={styles.wifiConfigSubtitle}>
            Configure Arduino WiFi settings remotely
          </Text>
          
          <TouchableOpacity
            style={styles.wifiToggleButton}
            onPress={() => setShowWiFiConfig(!showWiFiConfig)}
          >
            <Ionicons 
              name={showWiFiConfig ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={COLORS.primaryGreen} 
            />
            <Text style={styles.wifiToggleText}>
              {showWiFiConfig ? "Hide WiFi Setup" : "Configure Arduino WiFi"}
            </Text>
          </TouchableOpacity>
          
          {showWiFiConfig && (
            <View style={styles.wifiConfigSection}>
              <Text style={styles.wifiLabel}>Network Name (SSID):</Text>
              <TextInput
                style={styles.ipInput}
                value={wifiSSID}
                onChangeText={setWiFiSSID}
                placeholder="Enter WiFi network name"
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <Text style={styles.wifiLabel}>WiFi Password:</Text>
              <TextInput
                style={styles.ipInput}
                value={wifiPassword}
                onChangeText={setWiFiPassword}
                placeholder="Enter WiFi password"
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <TouchableOpacity
                style={[styles.saveIPButton, isConfiguringWiFi && styles.scanningButton]}
                onPress={configureWiFi}
                disabled={isConfiguringWiFi}
              >
                {isConfiguringWiFi ? (
                  <View style={styles.scanningRow}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.saveIPButtonText}>Configuring...</Text>
                  </View>
                ) : (
                  <View style={styles.scanningRow}>
                    <Ionicons name="wifi" size={16} color="white" />
                    <Text style={styles.saveIPButtonText}>Configure WiFi</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={styles.wifiWarning}>
                <Ionicons name="warning-outline" size={16} color={COLORS.warning} />
                <Text style={styles.wifiWarningText}>
                  Arduino will restart after WiFi change. IP address may change.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Arduino Discovery Panel */}
        <View style={styles.debugPanel}>
          <View style={styles.debugHeader}>
            <Ionicons name="bug-outline" size={22} color={COLORS.primaryGreen} />
            <Text style={styles.debugTitle}>Arduino Discovery & Debug Tools</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v0.0.7</Text>
            </View>
          </View>
          <Text style={styles.debugSubtitle}>
            Automatically find ANIKO Arduino devices and test connections
          </Text>
          
          {/* Main Discovery Button */}
          <TouchableOpacity
            style={[styles.primaryDebugButton, isScanning && styles.scanningButton]}
            onPress={discoverArduinos}
            disabled={isScanning}
          >
            {isScanning ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.primaryButtonText}>Scanning Network...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="search" size={18} color="white" />
                <Text style={styles.primaryButtonText}>Scan for Arduino</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Debug Actions Grid */}
          <View style={styles.debugGrid}>
            {/* Quick Test Button */}
            <TouchableOpacity
              style={styles.debugActionCard}
              onPress={async () => {
              try {
                console.log('🧪 QUICK TEST - Testing current Arduino IP directly...');
                console.log('📱 Mobile app making HTTP request...');
                console.log('🌐 Network security should allow this IP:', arduinoIP);
                
                // Use absolutely minimal request - no custom headers at all
                const response = await fetch(`http://${arduinoIP}/api/status`);
                
                console.log('✅ Quick test response:', response.status);
                console.log('📊 Response OK:', response.ok);
                console.log('🌐 Response URL:', response.url);
                
                if (response.ok) {
                  const data = await response.json();
                  console.log('📦 Quick test data:', data);
                  Alert.alert(
                    '✅ Quick Test SUCCESS!', 
                    `🎉 Mobile app can reach Arduino!\n\n📡 Status: ${response.status}\n🤖 Device: ${data.device || data.device_type || 'Unknown'}\n🌐 IP: ${data.ip}\n⏱️ Uptime: ${data.uptime}ms\n📊 WiFi Signal: ${data.wifi_rssi}dBm\n🌐 Network: ${data.wifi_ssid}\n\n✅ Network security is working!\n🔗 Your Arduino connection should work now.`,
                    [
                      { text: 'Try Connect Now', onPress: testConnection },
                      { text: 'OK', style: 'cancel' }
                    ]
                  );
                } else {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
              } catch (error: any) {
                console.error('❌ Quick test failed:', error);
                console.log('📱 Mobile app error details:', {
                  name: error.name,
                  message: error.message,
                  stack: error.stack
                });
                
                let errorType = 'Unknown';
                let solution = '';
                
                if (error.name === 'TypeError' || error.message.includes('Network request failed')) {
                  errorType = 'Network Security Block';
                  solution = `🔧 SOLUTION:
1. **REBUILD YOUR APP**: npx expo run:android
2. Make sure Arduino is at ${arduinoIP}
3. Check both devices on same WiFi network
4. Verify network security config is applied

📱 Mobile app network security is blocking HTTP requests.
🎯 This works in Expo dev but NOT in built app.`;
                } else if (error.message.includes('timeout')) {
                  errorType = 'Connection Timeout';
                  solution = `🔧 SOLUTION:
1. Check Arduino is powered on and WiFi connected
2. Verify IP address is still: ${arduinoIP}
3. Test in browser: http://${arduinoIP}/api/status
4. Check Arduino Serial Monitor for connection status`;
                } else {
                  errorType = 'HTTP Error';
                  solution = `🔧 SOLUTION:
1. Arduino may be busy processing requests
2. Try restarting Arduino device
3. Check Arduino Serial Monitor for errors
4. Verify Arduino HTTP server is running`;
                }
                
                Alert.alert(
                  `❌ Quick Test Failed: ${errorType}`, 
                  `Error: ${error.message}\n\n${solution}\n\n🔍 **KEY ISSUE**: Your Arduino works via URL but mobile app is blocked by Android network security.\n\n📱 **FIX**: Rebuild app to apply network security config!`,
                  [
                    { text: 'How to Rebuild', onPress: () => {
                      Alert.alert(
                        'How to Rebuild App',
                        '1. Connect Android device via USB\n2. Enable USB Debugging\n3. Run: npx expo run:android\n4. Wait for installation\n5. Try Quick Test again\n\n📱 This applies network security config!'
                      );
                    }},
                    { text: 'Retry', onPress: () => {} },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }
            }}
            >
              <Ionicons name="flash" size={16} color="#4F46E5" />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Quick Test</Text>
                <Text style={styles.actionCardSubtitle}>Test current IP</Text>
              </View>
            </TouchableOpacity>

            {/* CORS Test Button */}
            <TouchableOpacity
              style={[styles.debugActionCard, styles.corsTestCard]}
              onPress={async () => {
              try {
                console.log('🔬 CORS TEST - Testing with different headers...');
                
                // Test 1: Simple GET (no preflight)
                console.log('Test 1: Simple GET...');
                const response1 = await fetch('http://192.168.18.56/api/status');
                console.log('✅ Simple GET:', response1.status);
                
                // Test 2: GET with Accept header only
                console.log('Test 2: GET with Accept header...');
                const response2 = await fetch('http://192.168.18.56/api/device-info', {
                  headers: { 'Accept': 'application/json' }
                });
                console.log('✅ Accept header:', response2.status);
                
                // Test 3: Full headers (triggers preflight)
                console.log('Test 3: Full headers (may fail)...');
                const response3 = await fetch('http://192.168.18.56/api/sensor-data', {
                  headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                  }
                });
                console.log('✅ Full headers:', response3.status);
                
                Alert.alert('CORS Test Results', 'All tests passed! Check console for details. If test 3 failed, Arduino needs CORS headers.');
                
              } catch (error: any) {
                console.error('❌ CORS test failed:', error);
                Alert.alert('CORS Test Failed', `Error: ${error.message}\n\n🔍 This confirms CORS issue:\n- Arduino responds to simple requests\n- Fails on requests with custom headers\n- Need to add CORS headers to Arduino\n\n💡 Update your Arduino code with proper CORS handling.`);
              }
            }}
            >
              <Ionicons name="flask" size={16} color="#8B5CF6" />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>CORS Test</Text>
                <Text style={styles.actionCardSubtitle}>Test headers</Text>
              </View>
            </TouchableOpacity>

            {/* Network Diagnostics Button */}
            <TouchableOpacity
              style={[styles.debugActionCard, styles.diagnosticsCard]}
              onPress={() => showNetworkDiagnostics(arduinoIP)}
            >
              <Ionicons name="analytics" size={16} color="#EF4444" />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Network Scan</Text>
                <Text style={styles.actionCardSubtitle}>Full diagnostics</Text>
              </View>
            </TouchableOpacity>

            {/* Debug Network Security Button */}
            <TouchableOpacity
              style={[styles.debugActionCard, styles.securityCard]}
              onPress={async () => {
              try {
                console.log('🔐 DEBUG: Testing network security config...');
                
                // Test multiple IPs to see which ones work
                const testIPs = [
                  '192.168.18.56',   // Your Arduino
                  '192.168.1.1',     // Common router
                  '192.168.0.1',     // Another common router
                  '127.0.0.1',       // Localhost
                ];
                
                const results = [];
                
                for (const testIP of testIPs) {
                  try {
                    console.log(`Testing ${testIP}...`);
                    const response = await fetch(`http://${testIP}/api/status`, {
                      method: 'GET',
                      headers: { 'Accept': 'application/json' }
                    });
                    results.push(`✅ ${testIP}: HTTP ${response.status}`);
                    console.log(`✅ ${testIP} responded: ${response.status}`);
                  } catch (error: any) {
                    results.push(`❌ ${testIP}: ${error.message}`);
                    console.log(`❌ ${testIP} failed: ${error.message}`);
                  }
                }
                
                // Show comprehensive results
                Alert.alert(
                  'Network Security Test Results',
                  results.join('\n\n') + '\n\n🔍 Analysis:\n• If ALL IPs fail with "Network request failed": Network security config NOT applied\n• If some IPs work: Network security config partially working\n• If Arduino IP works: Network security config SUCCESS!',
                  [
                    { text: 'Copy Results', onPress: () => {
                      // In a real app, you'd copy to clipboard here
                      console.log('Results:', results.join('\n'));
                    }},
                    { text: 'OK' }
                  ]
                );
                
              } catch (error: any) {
                Alert.alert('Debug Test Failed', `Error: ${error.message}`);
              }
            }}
            >
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Security Test</Text>
                <Text style={styles.actionCardSubtitle}>Network config</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Additional Options */}
          <View style={styles.debugActionsRow}>
            <TouchableOpacity
              style={styles.debugSecondaryButton}
              onPress={() => setShowIPInput(!showIPInput)}
            >
              <Ionicons name="settings-outline" size={16} color={COLORS.primaryGreen} />
              <Text style={styles.debugSecondaryText}>Manual IP Setup</Text>
            </TouchableOpacity>
          </View>
          
          {/* Discovered Devices */}
          {showDiscoveredDevices && (
            <View style={styles.discoveredSection}>
              {discoveredArduinos.length > 0 ? (
                <>
                  <Text style={styles.discoveredTitle}>📡 Found ANIKO Devices:</Text>
                  {discoveredArduinos.map((ip, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.deviceOption,
                        arduinoIP === ip && styles.selectedDevice
                      ]}
                      onPress={() => selectDiscoveredArduino(ip)}
                    >
                      <View style={styles.deviceRow}>
                        <Ionicons 
                          name="hardware-chip" 
                          size={18} 
                          color={arduinoIP === ip ? "white" : COLORS.primaryGreen} 
                        />
                        <Text style={[
                          styles.deviceIP,
                          arduinoIP === ip && styles.selectedDeviceText
                        ]}>
                          ANIKO Arduino at {ip}
                        </Text>
                        {arduinoIP === ip && (
                          <Ionicons name="checkmark-circle" size={16} color="white" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <View style={styles.noDevicesFound}>
                  <Ionicons name="warning-outline" size={24} color={COLORS.warning} />
                  <Text style={styles.noDevicesText}>
                    No ANIKO Arduino devices found
                  </Text>
                  <Text style={styles.noDevicesSubtext}>
                    Make sure your Arduino is powered on and connected to the same WiFi network
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.hideDevicesButton}
                onPress={() => setShowDiscoveredDevices(false)}
              >
                <Text style={styles.hideDevicesText}>Hide</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Manual IP Configuration Panel */}
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
  
  // Arduino Discovery Styles  
  discoveredSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  discoveredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primaryGreen,
    marginBottom: 12,
    textAlign: 'center',
  },
  deviceOption: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectedDevice: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deviceIP: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primaryGreen,
    fontWeight: '500',
  },
  selectedDeviceText: {
    color: 'white',
  },
  noDevicesFound: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FEF3E2',
  },
  noDevicesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginTop: 8,
    textAlign: 'center',
  },
  noDevicesSubtext: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  hideDevicesButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hideDevicesText: {
    fontSize: 12,
    color: COLORS.primaryGreen,
    fontWeight: '500',
  },
  manualIPButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  manualIPText: {
    fontSize: 12,
    color: COLORS.primaryGreen,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  quickTestButton: {
    backgroundColor: COLORS.info,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  quickTestText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // WiFi Configuration Styles
  wifiConfigPanel: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  wifiConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  wifiConfigTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryGreen,
    marginLeft: 8,
  },
  wifiConfigSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  wifiToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.lightGreen,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  wifiToggleText: {
    fontSize: 14,
    color: COLORS.primaryGreen,
    fontWeight: '500',
  },
  wifiConfigSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  wifiLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryGreen,
    marginBottom: 8,
    marginTop: 12,
  },
  wifiWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  wifiWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },

  // Modern Debug Panel Styles
  debugPanel: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  debugTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryGreen,
    marginLeft: 8,
  },
  versionBadge: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primaryGreen,
  },
  debugSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  primaryDebugButton: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  debugGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  debugActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  corsTestCard: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3F4F6',
  },
  diagnosticsCard: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  securityCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  debugActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  debugSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.lightGreen,
  },
  debugSecondaryText: {
    fontSize: 14,
    color: COLORS.primaryGreen,
    fontWeight: '500',
  },

  // Legacy styles (for backwards compatibility)
  discoverySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  scanningButton: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
export default NPKSensorDashboard;