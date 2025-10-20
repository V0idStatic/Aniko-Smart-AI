// Network Security Test for Arduino Communication
// This file helps diagnose network connectivity issues

import { Alert } from 'react-native';

export const testNetworkConnectivity = async (targetIP: string = '192.168.18.56') => {
  console.log('🔍 NETWORK CONNECTIVITY TEST STARTING...');
  console.log('🎯 Target IP:', targetIP);
  
  const results = {
    basicFetch: false,
    statusEndpoint: false,
    sensorEndpoint: false,
    networkError: null,
    httpError: null,
    responseData: null
  };

  try {
    // Test 1: Basic fetch to status endpoint
    console.log('🧪 Test 1: Basic fetch to status endpoint');
    const statusResponse = await fetch(`http://${targetIP}/api/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    results.basicFetch = true;
    console.log('✅ Basic fetch successful');
    console.log('   Status:', statusResponse.status);
    console.log('   OK:', statusResponse.ok);

    if (statusResponse.ok) {
      results.statusEndpoint = true;
      const data = await statusResponse.json();
      results.responseData = data;
      console.log('✅ Status endpoint successful');
      console.log('   Device:', data.device || data.device_type);
    } else {
      results.httpError = `HTTP ${statusResponse.status}: ${statusResponse.statusText}`;
      console.log('❌ Status endpoint failed:', results.httpError);
    }

    // Test 2: Sensor data endpoint
    console.log('🧪 Test 2: Sensor data endpoint');
    try {
      const sensorResponse = await fetch(`http://${targetIP}/api/sensor-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (sensorResponse.ok) {
        results.sensorEndpoint = true;
        console.log('✅ Sensor endpoint successful');
      } else {
        console.log('⚠️ Sensor endpoint failed:', sensorResponse.status);
      }
    } catch (sensorError: any) {
      console.log('⚠️ Sensor endpoint error:', sensorError.message);
    }

  } catch (error: any) {
    results.networkError = error.message;
    console.error('❌ Network test failed:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
  }

  // Generate report
  const report = generateNetworkReport(results, targetIP);
  console.log('📊 NETWORK TEST REPORT:');
  console.log(report);

  return { results, report };
};

const generateNetworkReport = (results: any, targetIP: string) => {
  let report = `🔍 Network Connectivity Test Report\n`;
  report += `🎯 Target: ${targetIP}\n\n`;

  if (results.basicFetch) {
    report += `✅ Basic HTTP request: SUCCESS\n`;
  } else {
    report += `❌ Basic HTTP request: FAILED\n`;
  }

  if (results.statusEndpoint) {
    report += `✅ Status endpoint: SUCCESS\n`;
    if (results.responseData) {
      report += `   Device: ${results.responseData.device || results.responseData.device_type}\n`;
    }
  } else {
    report += `❌ Status endpoint: FAILED\n`;
  }

  if (results.sensorEndpoint) {
    report += `✅ Sensor endpoint: SUCCESS\n`;
  } else {
    report += `⚠️ Sensor endpoint: FAILED or SKIPPED\n`;
  }

  if (results.networkError) {
    report += `\n❌ NETWORK ERROR: ${results.networkError}\n`;
    
    if (results.networkError.includes('Network request failed')) {
      report += `\n🔧 Likely causes:\n`;
      report += `• Devices on different WiFi networks\n`;
      report += `• Arduino not responding\n`;
      report += `• Firewall blocking requests\n`;
      report += `• Wrong IP address\n`;
    }
  }

  if (results.httpError) {
    report += `\n❌ HTTP ERROR: ${results.httpError}\n`;
  }

  return report;
};

export const showNetworkDiagnostics = async (targetIP: string) => {
  try {
    const { results, report } = await testNetworkConnectivity(targetIP);
    
    Alert.alert(
      'Network Diagnostics',
      report,
      [
        { text: 'Copy to Clipboard', onPress: () => {
          // In a real app, you'd use Clipboard API here
          console.log('📋 Report copied to clipboard');
        }},
        { text: 'OK' }
      ]
    );
    
    return results;
  } catch (error) {
    Alert.alert('Diagnostics Failed', `Could not run network test: ${error}`);
    return null;
  }
};