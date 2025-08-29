import React, { useEffect, useState } from "react";
import "../App.css";
import { auth, db, supabase } from "../firebase";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";

const Login: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [supabaseHealthy, setSupabaseHealthy] = useState<boolean>(false);

  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Test Supabase connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      addDebugInfo("🔍 Testing Supabase connection...");
      addDebugInfo(`🌐 Connecting to: https://cmzhjmfeukwievsgeqoo.supabase.co`);
      
      try {
        // Test with a simple request first
        const response = await fetch('https://cmzhjmfeukwievsgeqoo.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtemhqbWZldWt3aWV2c2dlcW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzYxNDMsImV4cCI6MjA3MjA1MjE0M30.3FZcf9P1ZPAIgKjZRRtqXyTQIYE5XRW_Sph5DfpAcDc',
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          addDebugInfo("✅ Basic network connection to Supabase successful");
        } else {
          addDebugInfo(`❌ Network response not OK: ${response.status} ${response.statusText}`);
          return;
        }
        
      } catch (networkError) {
        addDebugInfo(`❌ Network error: ${networkError}`);
        return;
      }

      try {
        // Now test with Supabase client
        const { data, error } = await supabase
          .from('users')
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          addDebugInfo(`❌ Supabase query error: ${error.message}`);
          addDebugInfo(`Error code: ${error.code}`);
          if (error.details) {
            addDebugInfo(`Error details: ${error.details}`);
          }
        } else {
          addDebugInfo("✅ Supabase client connection successful");
          setSupabaseHealthy(true);
          
          // Test insert permissions
          addDebugInfo("🔍 Testing insert permissions...");
          const testUid = `test-${Date.now()}`;
          const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert([{
              uid: testUid,
              email: 'test@test.com',
              username: 'Test User',
              profile_picture: '',
              last_login: new Date().toISOString()
            }])
            .select();
          
          if (insertError) {
            addDebugInfo(`❌ Insert test failed: ${insertError.message}`);
            if (insertError.code) {
              addDebugInfo(`Insert error code: ${insertError.code}`);
            }
          } else {
            addDebugInfo("✅ Insert permissions working");
            // Clean up test record
            await supabase.from('users').delete().eq('uid', testUid);
            addDebugInfo("🧹 Test record cleaned up");
          }
        }
      } catch (clientError) {
        addDebugInfo(`❌ Supabase client error: ${clientError}`);
      }
    };
    
    testConnection();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Google login
  const googleLogin = async () => {
    setStatus("Logging in...");
    setDebugInfo([]); // Clear previous debug info
    
    try {
      addDebugInfo("🔄 Starting Google login...");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const u = result.user;

      addDebugInfo(`✅ Google login successful for: ${u.email}`);
      addDebugInfo(`User UID: ${u.uid}`);

      // Save data to Firebase first
      addDebugInfo("🔄 Saving to Firebase...");
      await set(ref(db, "users/" + u.uid), {
        username: u.displayName ?? "",
        email: u.email ?? "",
        profile_picture: u.photoURL ?? "",
        last_login: new Date().toISOString(),
      });

      addDebugInfo("✅ Data saved to Firebase successfully");

      // Only attempt Supabase if connection is healthy
      if (supabaseHealthy) {
        await insertDataToSupabase(u);
      } else {
        addDebugInfo("⚠️ Skipping Supabase insertion due to connection issues");
        setStatus("Logged in (Firebase only - Supabase unavailable)");
      }

    } catch (e: any) {
      addDebugInfo(`❌ Login error: ${e.message}`);
      setStatus(`Error: ${e.message}`);
    }
  };

  // Insert user data from Firebase to Supabase
  const insertDataToSupabase = async (user: User) => {
    try {
      addDebugInfo("🔄 Starting Supabase insertion...");

      const userData = {
        uid: user.uid,
        email: user.email ?? "",
        username: user.displayName ?? "",
        profile_picture: user.photoURL ?? "",
        last_login: new Date().toISOString(),
      };

      addDebugInfo(`📝 User data: ${JSON.stringify(userData)}`);

      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('uid')
        .eq('uid', user.uid)
        .maybeSingle();

      if (fetchError) {
        addDebugInfo(`❌ Error checking user: ${fetchError.message}`);
        return;
      }

      if (existingUser) {
        addDebugInfo('👤 Updating existing user...');
        const { data, error } = await supabase
          .from('users')
          .update({
            last_login: userData.last_login,
            profile_picture: userData.profile_picture,
            username: userData.username,
          })
          .eq('uid', user.uid)
          .select();

        if (error) {
          addDebugInfo(`❌ Update failed: ${error.message}`);
          setStatus(`Supabase update error: ${error.message}`);
        } else {
          addDebugInfo("✅ User updated in Supabase");
          setStatus("Logged in successfully!");
        }
      } else {
        addDebugInfo('➕ Inserting new user...');
        const { data, error } = await supabase
          .from('users')
          .insert([userData])
          .select();

        if (error) {
          addDebugInfo(`❌ Insert failed: ${error.message}`);
          addDebugInfo(`Error code: ${error.code}`);
          setStatus(`Supabase insert error: ${error.message}`);
        } else {
          addDebugInfo("✅ User inserted in Supabase");
          setStatus("Logged in successfully!");
        }
      }
    } catch (error) {
      addDebugInfo(`❌ Unexpected Supabase error: ${error}`);
    }
  };

  // Logout function
  const logout = async () => {
    setStatus("Logging out...");
    try {
      await signOut(auth);
      setStatus("Logged out");
      setDebugInfo([]);
    } catch (e: any) {
      setStatus(`Logout error: ${e.message}`);
    }
  };

  return (
    <div className="App" style={{ padding: 24 }}>
      <h1>Aniko Smart Monitoring System</h1>
      
      {/* Connection Status */}
      <div style={{ 
        padding: 10, 
        marginBottom: 16, 
        backgroundColor: supabaseHealthy ? '#d4edda' : '#f8d7da',
        border: `1px solid ${supabaseHealthy ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: 4,
        color: supabaseHealthy ? '#155724' : '#721c24'
      }}>
        Supabase Status: {supabaseHealthy ? '✅ Connected' : '❌ Connection Issues'}
      </div>

      {!user ? (
        <button onClick={googleLogin}>Sign in with Google</button>
      ) : (
        <div style={{ marginTop: 16 }}>
          <img
            src={user.photoURL || ""}
            alt="avatar"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: "2px solid #4285F4",
            }}
          />
          <h2>Welcome, {user.displayName}</h2>
          <p><b>Email:</b> {user.email}</p>
          <p><b>User ID:</b> {user.uid}</p>
          <button onClick={logout} style={{ marginTop: 12 }}>
            Log Out
          </button>
        </div>
      )}

      {status && (
        <p style={{
          marginTop: 16,
          color: status.toLowerCase().includes("error") ? "#c5221f" : "#137333",
        }}>
          {status}
        </p>
      )}

      {/* Debug Information */}
      {debugInfo.length > 0 && (
        <div style={{ 
          marginTop: 20, 
          padding: 16, 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: 8,
          maxHeight: 400,
          overflowY: 'auto'
        }}>
          <h3>Debug Information:</h3>
          <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.4 }}>
            {debugInfo.map((info, index) => (
              <div key={index} style={{ marginBottom: 2 }}>
                {info}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;