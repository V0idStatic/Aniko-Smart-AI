import { StyleSheet, Platform, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const colors = {
  // Primary colors
  primary: "#2E7D32",
  primaryDark: "#1B5E20",
  primaryLight: "#4CAF50",

  // Accent colors
  accent: "#FF6F00",
  accentLight: "#FFA726",

  // Background colors
  background: "#CBBA9E",
  cardBackground: "#FFFFFF",

  // Text colors
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",

  // Status colors
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#F44336",
  info: "#2196F3",

  // Neutral colors
  white: "#FFFFFF",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Border colors
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
}


export const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#E6DED1",
  },
  container: {
    flex: 1,
    backgroundColor: "#E6DED1",
  },
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 10,
  },
  sidePanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: "#fff",
    padding: 16,
    zIndex: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E7D32",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  historyText: {
    marginLeft: 10,
    color: "#333",
  },
  noHistory: {
    marginTop: 20,
    textAlign: "center",
    color: "#777",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    padding: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  clearBtnText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
  burgerBtn: {
    marginRight: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 55,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#1b5e20",
    borderBottomWidth: 1,
    borderColor: "#C8E6C9",
    elevation: 3,
      borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f5f5f0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#1c4722",
  },
  messages: {
    flex: 1,
    paddingHorizontal: 15,
  },
  msg: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 14,
    marginVertical: 6,
    maxWidth: "85%",
  },
  userMsg: {
    alignSelf: "flex-end",
    backgroundColor: "#4d7f39",
    borderBottomRightRadius: 2,
  },
  botMsg: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe6e0",
    borderBottomLeftRadius: 2,
  },
  msgText: {
    color: "white",
    fontSize: 15,
    lineHeight: 20,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 15,
    marginVertical: 6,
  },
  typingText: {
    color: "#4d7f39",
    fontStyle: "italic",
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "android" ? 15 : 30,
    paddingHorizontal: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    borderRadius: 30,
    paddingVertical: 25,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    color: "#000",
    maxHeight: 100,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#2E7D32",
    padding: 10,
    borderRadius: 25,
  },
});
