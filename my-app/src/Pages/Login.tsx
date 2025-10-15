import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      addDebug("🔍 Checking for existing session...");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        addDebug("✅ User already logged in: " + session.user.email);
        navigate("/home", { replace: true });
      } else {
        addDebug("📭 No active session found");
      }
    } catch (error: any) {
      addDebug("❌ Session check error: " + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      addDebug("🔵 Google login button clicked");
      setLoading(true);
      setError(null);

      addDebug("🔵 Current origin: " + window.location.origin);
      addDebug("🔵 Callback URL: " + `${window.location.origin}/auth/callback`);

      addDebug("🔵 Initiating OAuth sign-in...");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      addDebug("🔵 OAuth Response received");
      console.log("OAuth data:", data);
      console.log("OAuth error:", error);

      if (error) {
        addDebug("❌ OAuth error: " + error.message);
        throw error;
      }

      if (data?.url) {
        addDebug("✅ Redirect URL received: " + data.url);
        addDebug("🔵 Redirecting to Google...");

        // Immediate redirect - no timeout needed
        window.location.href = data.url;
      } else {
        addDebug("⚠️ No redirect URL in response");
        addDebug("Response data: " + JSON.stringify(data));
        setLoading(false);
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      addDebug("❌ Login error: " + errorMsg);
      setError(errorMsg);
      alert("Login failed: " + errorMsg);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "20px",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <h1 style={{ marginBottom: "10px", textAlign: "center" }}>Welcome to Aniko</h1>
        <p style={{ color: "#666", textAlign: "center", marginBottom: "30px" }}>
          Sign in to continue
        </p>

        {error && (
          <div
            style={{
              padding: "15px",
              backgroundColor: "#fee",
              color: "#c00",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #fcc",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px 24px",
            fontSize: "16px",
            backgroundColor: loading ? "#ccc" : "#4285F4",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            fontWeight: "500",
            transition: "background-color 0.3s",
          }}
        >
          <img
            src="https://img.icons8.com/color/48/000000/google-logo.png"
            alt="Google"
            style={{ width: "24px", height: "24px" }}
          />
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        {/* Debug Panel */}
        <details style={{ marginTop: "30px" }}>
          <summary
            style={{
              cursor: "pointer",
              color: "#666",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            🔍 Show Debug Info
          </summary>
          <div
            style={{
              marginTop: "15px",
              padding: "15px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              fontSize: "12px",
              fontFamily: "monospace",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            <p>
              <strong>Current URL:</strong> {window.location.href}
            </p>
            <p>
              <strong>Origin:</strong> {window.location.origin}
            </p>
            <p>
              <strong>Callback:</strong> {window.location.origin}/auth/callback
            </p>
            <hr
              style={{
                margin: "10px 0",
                border: "none",
                borderTop: "1px solid #ddd",
              }}
            />
            <p>
              <strong>Debug Log:</strong>
            </p>
            {debugInfo.length === 0 ? (
              <p style={{ color: "#999" }}>No logs yet</p>
            ) : (
              debugInfo.map((info, idx) => (
                <p
                  key={idx}
                  style={{
                    margin: "5px 0",
                    color:
                      info.includes("❌")
                        ? "#c00"
                        : info.includes("✅")
                        ? "#0a0"
                        : info.includes("⚠️")
                        ? "#f90"
                        : "#333",
                  }}
                >
                  {info}
                </p>
              ))
            )}
          </div>
        </details>
      </div>
    </div>
  );
};

export default Login;
