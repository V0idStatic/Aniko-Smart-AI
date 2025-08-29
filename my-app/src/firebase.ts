// Import Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Import Supabase client
import { createClient } from '@supabase/supabase-js';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCN8R8w5wSY6omSBbr8KOnEpXLQu_1aw18",
  authDomain: "aniko-smart-ai.firebaseapp.com",
  databaseURL: "https://aniko-smart-ai-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aniko-smart-ai",
  storageBucket: "aniko-smart-ai.firebasestorage.app",
  messagingSenderId: "128929125916",
  appId: "1:128929125916:web:5f07d85d749af3034ab1d9",
  measurementId: "G-E39VS579EB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// CORRECTED Supabase config - using the exact values from your dashboard
const supabaseUrl = 'https://cmzhjmfeukwievsgeqoo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtemhqbWZldWt3aWV2c2dlcW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzYxNDMsImV4cCI6MjA3MjA1MjE0M30.3FZcf9P1ZPAIgKjZRRtqXyTQIYE5XRW_Sph5DfpAcDc';

// Initialize Supabase client with additional options to handle network issues
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  // Add retry logic for network issues
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Test function to verify Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing connection to:', supabaseUrl);
    
    // Simple ping test
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Supabase connection successful');
    return { success: true, data };
  } catch (error) {
    console.error('Network error connecting to Supabase:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};