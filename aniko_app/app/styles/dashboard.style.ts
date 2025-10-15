import { StyleSheet } from "react-native"

export const COLORS = {
  // Primary colors
  primaryGreen: "#1D492C",
  accentGreen: "#84cc16",
  pastelGreen: "#BDE08A",
  lightGreen: "#f0fdf4",
  darkGreen: "#143820",
  mutedGreen: "#4C6444",
  grayText: "#666",
  border: "#e0e0e0",
  white: "#ffffff",
  bgCOlor: "#cfc4b2ff",
  primaryBrown: "#8A6440",
  darkBrown: "#4D2D18",
  accent: "#FF6F00",
  accentLight: "#FFA726",
  background: "#CBBA9E",
  cardBackground: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",

  // Status colors
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#8a1c14ff",
  info: "#2196F3",
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCOlor,
  },

  // Header Styles
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 25,
  },

  headerContent: {
    width: "100%",
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap", // Added flex wrap for responsiveness
  },

  greetingContainer: {
    flex: 1,
    minWidth: 150, // Added minimum width for responsiveness
  },

  greeting: {
    fontSize: 14,
    color: COLORS.lightGreen,
    fontWeight: "500",
    marginBottom: 4,
  },

  username: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.lightGreen,
    letterSpacing: 0.5,
  },

  headerActions: {
    flexDirection: "row",
    gap: 12,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },

  // Weather Card Styles
  weatherCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },

  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    flexWrap: "wrap", // Added flex wrap for responsiveness
    gap: 8, // Added gap for better spacing when wrapped
  },

  weatherLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1, // Added flex for better responsiveness
    minWidth: 120, // Added minimum width
  },

  weatherCity: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.lightGreen,
    flexShrink: 1, // Allow text to shrink if needed
  },

  changeLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f0fdf484",
    borderRadius: 12,
  },

  changeLocationText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primaryGreen,
  },

  dropdownContainer: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  dropdownLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },

  dropdownButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textPrimary,
    flex: 1,
  },

  dropdownButtonPlaceholder: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textSecondary,
    flex: 1,
  },

  dropdownList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },

  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  dropdownItemLast: {
    borderBottomWidth: 0,
  },

  dropdownItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textPrimary,
    flex: 1,
    marginLeft: 8,
  },

  // Inline Picker Styles
  inlinePicker: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  inlinePickerLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  inlineChipContainer: {
    marginBottom: 8,
  },

  inlineChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.darkBrown,
  },

  inlineChipActive: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },

  inlineChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },

  inlineChipTextActive: {
    color: COLORS.white,
  },

  inlineCityList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
  },

  inlineCityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryBrown,
  },

  inlineCityText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textPrimary,
    flex: 1,
  },

  // Weather Main Section
  weatherMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap", // Added flex wrap for responsiveness
  },

  weatherLeft: {
    flex: 1,
    minWidth: 150, // Added minimum width for responsiveness
  },

  temperature: {
    fontSize: 56,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: -2,
  },

  condition: {
    fontSize: 18,
    fontWeight: "500",
    color: COLORS.lightGreen,
    marginTop: 4,
  },

  highLow: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.lightGreen,
    marginTop: 8,
  },

  weatherRight: {
    justifyContent: "center",
    alignItems: "center",
  },

  weatherIcon: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },

  // Weather Meta
  weatherMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap", // Added flex wrap for responsiveness
    gap: 8, // Added gap for better spacing
  },

  weatherMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  weatherMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.mutedGreen,
    marginBottom: 16,
  },

  // Hourly Forecast
  hourlyForecast: {
    marginTop: 8,
  },

  hourlyItem: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#f0fdf4a4",
    minWidth: 70,
  },

  hourlyItemActive: {
    backgroundColor: COLORS.lightGreen,
  },

  hourlyTime: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },

  hourlyTimeActive: {
    color: COLORS.white,
  },

  hourlyTemp: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 8,
  },

  hourlyTempActive: {
    color: COLORS.white,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  sectionLink: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primaryGreen,
  },

  // Crop Row
  cropRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },

  // Chatbot Card
  chatbotCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.pastelGreen,
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  chatbotIconWrapper: {
    marginRight: 16,
  },

  chatbotIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  chatbotContent: {
    flex: 1,
  },

  chatbotTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },

  chatbotSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.textSecondary,
    justifyContent: "center",
    alignItems: "center",
  },

  selectorLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  chipContainer: {
    marginBottom: 16,
  },

  chip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },

  chipActive: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },

  chipText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  chipTextActive: {
    color: COLORS.white,
  },

  locationList: {
    maxHeight: 300,
    marginTop: 12,
  },

  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 12,
    marginBottom: 8,
  },

  locationItemContent: {
    flex: 1,
  },

  locationItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },

  locationItemCoords: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
})
