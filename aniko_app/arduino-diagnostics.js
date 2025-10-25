#!/usr/bin/env node

/**
 * Arduino Connection Troubleshooter
 * Comprehensive diagnostic tool for mobile app to Arduino communication
 */

console.log('🚀 Arduino Connection Troubleshooter v1.0');
console.log('===============================================\n');

// Test configuration
const CONFIG = {
  ARDUINO_IP: '192.168.18.56', // Your Arduino IP
  TIMEOUT: 10000, // 10 seconds
  ENDPOINTS: [
    '/',
    '/api/status',
    '/api/sensor-data',
    '/api/device-info'
  ]
};

async function runDiagnostics() {
  console.log(`🎯 Testing Arduino at: ${CONFIG.ARDUINO_IP}`);
  console.log(`⏱️  Timeout set to: ${CONFIG.TIMEOUT}ms\n`);

  const results = [];

  // Test each endpoint
  for (const endpoint of CONFIG.ENDPOINTS) {
    const testResult = await testEndpoint(CONFIG.ARDUINO_IP, endpoint);
    results.push(testResult);
    
    // Add delay between tests
    await sleep(1000);
  }

  // Generate report
  console.log('\n📊 DIAGNOSTIC REPORT');
  console.log('====================');
  
  let successCount = 0;
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const endpoint = CONFIG.ENDPOINTS[index];
    
    console.log(`${status} ${endpoint}`);
    
    if (result.success) {
      successCount++;
      if (result.data) {
        console.log(`   Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
      }
    } else {
      console.log(`   Error: ${result.error}`);
    }
    
    console.log(`   Time: ${result.responseTime}ms\n`);
  });

  // Summary
  console.log('📋 SUMMARY');
  console.log('==========');
  console.log(`✅ Successful tests: ${successCount}/${results.length}`);
  
  if (successCount === 0) {
    console.log('\n❌ CRITICAL: No endpoints responding');
    console.log('🔧 Troubleshooting steps:');
    console.log('   1. Check Arduino power and WiFi connection');
    console.log('   2. Verify Arduino Serial Monitor shows IP address');
    console.log('   3. Test in browser: http://' + CONFIG.ARDUINO_IP);
    console.log('   4. Ensure both devices on same WiFi network');
    console.log('   5. Check router firewall/AP isolation settings');
  } else if (successCount < CONFIG.ENDPOINTS.length) {
    console.log('\n⚠️  PARTIAL: Some endpoints not responding');
    console.log('🔧 Possible issues:');
    console.log('   1. Arduino code might be incomplete');
    console.log('   2. Some API endpoints not implemented');
    console.log('   3. Sensor hardware issues');
  } else {
    console.log('\n🎉 SUCCESS: All endpoints responding correctly!');
    console.log('✅ Your Arduino is ready for mobile app connection');
  }

  // Mobile app specific tests
  console.log('\n📱 MOBILE APP COMPATIBILITY');
  console.log('============================');
  await testMobileCompatibility(CONFIG.ARDUINO_IP);
}

async function testEndpoint(ip, endpoint) {
  const url = `http://${ip}${endpoint}`;
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Testing: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/html, */*',
        'User-Agent': 'Arduino-Troubleshooter/1.0',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime
      };
    }
    
    // Try to parse response
    let data = null;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        data = 'Invalid JSON response';
      }
    } else {
      const text = await response.text();
      data = text.substring(0, 200); // First 200 chars
    }
    
    return {
      success: true,
      data,
      responseTime,
      contentType
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout';
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network request failed (CORS/Security)';
    }
    
    return {
      success: false,
      error: errorMessage,
      responseTime
    };
  }
}

async function testMobileCompatibility(ip) {
  // Test mobile-specific headers
  try {
    console.log('📱 Testing mobile app headers...');
    
    const response = await fetch(`http://${ip}/api/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'User-Agent': 'AniKo-Mobile-App/1.0.0',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'aniko-app://localhost',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.ok) {
      console.log('✅ Mobile headers accepted');
      
      const data = await response.json();
      if (data.device === 'ANIKO_SMART_AI_SENSOR' || data.device_type === 'ANIKO_SMART_AI_SENSOR') {
        console.log('✅ Correct device identification');
      } else {
        console.log('⚠️  Device identification may be incorrect');
        console.log(`   Received: ${data.device || data.device_type || 'Unknown'}`);
      }
    } else {
      console.log('❌ Mobile headers rejected');
    }
    
  } catch (error) {
    console.log('❌ Mobile compatibility test failed:', error.message);
  }
  
  // CORS headers check
  console.log('\n🌐 CORS Headers Check:');
  try {
    const response = await fetch(`http://${ip}/api/status`);
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    };
    
    console.log('📋 CORS Response Headers:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${key}: ${value || 'Not present'}`);
    });
    
  } catch (error) {
    console.log('❌ CORS check failed:', error.message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Node.js compatibility check
if (typeof fetch === 'undefined') {
  console.log('⚠️  Note: This script requires Node.js 18+ or a fetch polyfill');
  console.log('   You can also test these URLs manually in your browser:\n');
  
  CONFIG.ENDPOINTS.forEach(endpoint => {
    console.log(`   http://${CONFIG.ARDUINO_IP}${endpoint}`);
  });
  
  process.exit(0);
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('\n💥 Diagnostic script failed:', error.message);
  console.log('\n🔧 Manual testing recommended:');
  console.log(`   1. Open browser and test: http://${CONFIG.ARDUINO_IP}`);
  console.log(`   2. Check Arduino Serial Monitor for errors`);
  console.log(`   3. Verify network settings on both devices`);
});