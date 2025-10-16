"use client"

import type React from "react"
import { useEffect, useState } from "react"
import supabase from "../CONFIG/supabaseClient"
import { useNavigate } from "react-router-dom"

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        navigate("/home", { replace: true })
      }
    } catch (error: any) {
      console.error("Session check error:", error.message)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)

      await supabase.auth.signOut()

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
            hd: "*",
          },
          skipBrowserRedirect: false,
        },
      })

      if (error) {
        throw error
      }

      if (data?.url) {
        window.location.href = data.url
      } else {
        setLoading(false)
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error)
      setError(errorMsg)
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "24px",
        backgroundColor: "#CBBA9E",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Main Card */}
      <div
        style={{
          backgroundColor: "white",
          padding: "48px",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)",
          maxWidth: "440px",
          width: "100%",
          position: "relative",
        }}
      >
        {/* Logo/Brand Area */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img
            src="/PICTURES/Logo-vr.png"
            alt="Aniko Logo"
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 20px",
              display: "block",
              objectFit: "contain",
            }}
          />
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              margin: "0 0 8px 0",
              color: "#1a1a1a",
              letterSpacing: "-0.5px",
            }}
          >
            Welcome to Aniko
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#6b6b6b",
              margin: 0,
              fontWeight: "400",
            }}
          >
            Sign in to continue to your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              borderRadius: "12px",
              marginBottom: "24px",
              border: "1px solid #fecaca",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            <strong style={{ fontWeight: "600" }}>Error:</strong> {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px 24px",
            fontSize: "16px",
            fontWeight: "600",
            backgroundColor: loading ? "#e5e5e5" : "white",
            color: loading ? "#9ca3af" : "#1a1a1a",
            border: "2px solid #e5e5e5",
            borderRadius: "12px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            transition: "all 0.2s ease",
            boxShadow: loading ? "none" : "0 2px 8px rgba(0, 0, 0, 0.05)",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = "#f9fafb"
              e.currentTarget.style.borderColor = "#d1d5db"
              e.currentTarget.style.transform = "translateY(-1px)"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = "white"
              e.currentTarget.style.borderColor = "#e5e5e5"
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)"
            }
          }}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "3px solid #e5e5e5",
                  borderTop: "3px solid #9ca3af",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Footer Text */}
        <p
          style={{
            marginTop: "32px",
            textAlign: "center",
            fontSize: "13px",
            color: "#9ca3af",
            lineHeight: "1.6",
          }}
        >
          By continuing, you agree to our{" "}
          <a
            href="#"
            style={{
              color: "#CBBA9E",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="#"
            style={{
              color: "#CBBA9E",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Privacy Policy
          </a>
        </p>
      </div>

      {/* Keyframe animation for loading spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default Login