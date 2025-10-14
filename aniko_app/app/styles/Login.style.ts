import { StyleSheet } from "react-native"
import { LinearGradient } from "expo-linear-gradient";


export default StyleSheet.create({ 
  container: {
    flex: 1,
    justifyContent: "center",  
    alignItems: "center",      
    backgroundColor: "#cfc4b2ff", 
  },
  // Status Bar Styles
  statusBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    zIndex: 10,
  },
  statusBarChecking: {
    backgroundColor: "#f59e0b", // Orange
  },
  statusBarConnected: {
    backgroundColor: "#10b981", // Green
  },
  statusBarDisconnected: {
    backgroundColor: "#ef4444", // Red
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotConnecting: {
    backgroundColor: "#fff",
  },
  dotConnected: {
    backgroundColor: "#fff",
  },
  dotOffline: {
    backgroundColor: "#fff",
  },

  // Content Card
  contentCard: {
    position: "absolute",   
    bottom: 0,                 
    left: 0,
    right: 0,
    marginHorizontal: "auto",   
    width: "100%",              
    maxWidth: 500,              
    backgroundColor: "#E6DED1",
    borderRadius: 0,
    borderTopRightRadius: 180,
    borderTopLeftRadius: 180,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignSelf: "center",
    paddingTop: 50,
  },

  // Logo
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },

  // Title
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4D2D18",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#374151",
    textAlign: "center",
    marginBottom: 32,
    letterSpacing: 0.2,
  },

  // Input Group
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4C4B2C",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#756C65",
    paddingHorizontal: 16,
    height: 52,
  },
  inputFocused: {
    backgroundColor: "#FEF5E6", 
    borderColor: "#4C6444",  
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1f2937",
    height: "100%",
  },
  eyeIcon: {
    padding: 4,
  },

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#ef4444",
    fontWeight: "500",
  },

  // Login Button
  loginButton: {
    backgroundColor: "#4C6444",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#374151",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#374151",
    opacity: 0.6,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Sign-up
  signupContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  signupText: {
    fontSize: 14,
    color: "#6A7D4F",
  },
  signupLink: {
    color: "#4C4B2C",
    fontWeight: "600",
  },

  // Divider
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#756C65",
  },
  orText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: "#756C65",
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Google Button
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#cfc4b2ff",
    borderRadius: 25,
    paddingVertical: 14,
    borderWidth: 0,
    borderColor: "none",
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleText: {
    fontSize: 15,
    color: "#4D2D18",
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  statusBarConnecting: {
    backgroundColor: "#f59e0b", // Orange/Amber
  },
  statusBarOffline: {
    backgroundColor: "#ef4444", // Red
  },
})
