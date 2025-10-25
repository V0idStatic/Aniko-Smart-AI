import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
}

const ArduinoConnectionTester: React.FC = () => {
  const [testIP, setTestIP] = useState('192.168.18.56');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<ConnectionTestResult[]>([]);

  const runConnectionTest = async () => {
    setIsTesting(true);
    setTestResults([]);
    const results: ConnectionTestResult[] = [];

    // Test 1: Basic connectivity
    try {
      console.log('Testing basic connectivity...');
      const response = await Promise.race([
        fetch(`http://${testIP}/`, { method: 'HEAD' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      results.push({
        success: true,
        message: 'Basic connectivity ✅',
        details: `Arduino responds on port 80`
      });
    } catch (error: any) {
      results.push({
        success: false,
        message: 'Basic connectivity ❌',
        details: `Cannot reach ${testIP}: ${error.message}`
      });
    }

    // Test 2: Status endpoint
    try {
      console.log('Testing status endpoint...');
      const response = await Promise.race([
        fetch(`http://${testIP}/api/status`, {
          headers: { 'Accept': 'application/json' }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
      ]) as Response;

      if (response && response.ok) {
        const data = await response.json();
        results.push({
          success: true,
          message: 'Status API ✅',
          details: `Device: ${data.device || data.device_type || 'Unknown'}`
        });
      } else {
        results.push({
          success: false,
          message: 'Status API ❌',
          details: `HTTP ${response.status}`
        });
      }
    } catch (error: any) {
      results.push({
        success: false,
        message: 'Status API ❌',
        details: `API error: ${error.message}`
      });
    }

    // Test 3: Sensor data
    try {
      console.log('Testing sensor data...');
      const response = await Promise.race([
        fetch(`http://${testIP}/api/sensor-data`, {
          headers: { 'Accept': 'application/json' }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
      ]) as Response;

      if (response && response.ok) {
        const data = await response.json();
        results.push({
          success: true,
          message: 'Sensor Data ✅',
          details: `Temperature: ${data.temperature}°C, pH: ${data.ph}`
        });
      } else {
        results.push({
          success: false,
          message: 'Sensor Data ❌',
          details: `HTTP ${response.status}`
        });
      }
    } catch (error: any) {
      results.push({
        success: false,
        message: 'Sensor Data ❌',
        details: `Sensor error: ${error.message}`
      });
    }

    setTestResults(results);
    setIsTesting(false);

    // Show summary alert
    const successCount = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    if (successCount === totalTests) {
      Alert.alert('✅ All Tests Passed!', 'Your Arduino connection is working perfectly. You can now use the sensor dashboard.');
    } else if (successCount > 0) {
      Alert.alert('⚠️ Partial Success', `${successCount}/${totalTests} tests passed. Check the details below for specific issues.`);
    } else {
      Alert.alert('❌ Connection Failed', 'No tests passed. Please check your Arduino and network setup.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="analytics" size={32} color="#1D492C" />
        <Text style={styles.title}>Arduino Connection Tester</Text>
        <Text style={styles.subtitle}>Diagnose connection issues quickly</Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Arduino IP Address:</Text>
        <TextInput
          style={styles.input}
          value={testIP}
          onChangeText={setTestIP}
          placeholder="192.168.x.x"
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity
        style={[styles.testButton, isTesting && styles.testingButton]}
        onPress={runConnectionTest}
        disabled={isTesting}
      >
        {isTesting ? (
          <Text style={styles.buttonText}>🔄 Testing...</Text>
        ) : (
          <Text style={styles.buttonText}>🧪 Run Connection Test</Text>
        )}
      </TouchableOpacity>

      {testResults.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map((result, index) => (
            <View key={index} style={[
              styles.resultItem,
              result.success ? styles.successResult : styles.failureResult
            ]}>
              <Text style={styles.resultMessage}>{result.message}</Text>
              <Text style={styles.resultDetails}>{result.details}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.troubleshootingSection}>
        <Text style={styles.troubleshootingTitle}>🔧 Quick Troubleshooting:</Text>
        <Text style={styles.troubleshootingText}>
          1. Make sure Arduino is powered on{'\n'}
          2. Check Arduino Serial Monitor for IP address{'\n'}
          3. Ensure both devices are on same WiFi{'\n'}
          4. Try opening http://{testIP} in your phone browser{'\n'}
          5. Restart Arduino if needed{'\n'}
          6. Check router settings (disable AP isolation)
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D492C',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D492C',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  testButton: {
    backgroundColor: '#1D492C',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  testingButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D492C',
    marginBottom: 10,
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  successResult: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  failureResult: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: '#666',
  },
  troubleshootingSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D492C',
    marginBottom: 10,
  },
  troubleshootingText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ArduinoConnectionTester;