import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const redirectTo = (location.state as { redirectTo?: string })?.redirectTo || "/home";

  useEffect(() => {
    checkUser();
  }, []);

  // Check if user is already logged in
  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        console.log("✅ User already logged in:", session.user.email);
        navigate(redirectTo, { replace: true });
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Session check error:", error);
      setLoading(false);
    }
  };

  // Google Sign-In with Supabase
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

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

      if (error) throw error;

      console.log("✅ Google login initiated");
    } catch (error: any) {
      console.error("❌ Login error:", error.message);
      alert("Login failed: " + error.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        gap: "20px",
      }}
    >
      <h1>Welcome to Aniko</h1>
      <p>Sign in to continue</p>

      <button
        onClick={handleGoogleLogin}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          backgroundColor: "#4285F4",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <img
          src="https://img.icons8.com/color/48/000000/google-logo.png"
          alt="Google"
          style={{ width: "24px", height: "24px" }}
        />
        Continue with Google
      </button>
    </div>
  );
};

export default Login;
