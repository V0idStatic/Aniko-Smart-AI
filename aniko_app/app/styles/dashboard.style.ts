import { StyleSheet } from "react-native"

export const colors = {
  // Primary colors
  primary: "#2E7D32",
  primaryDark: "#1B5E20",
  primaryLight: "#4CAF50",

  // Accent colors
  accent: "#FF6F00",
  accentLight: "#FFA726",

  // Background colors
  background: "#F5F7FA",
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header Styles
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  headerContent: {
    width: "100%",
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greetingContainer: {
    flex: 1,
  },

  greeting: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    marginBottom: 4,
  },

  username: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.white,
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
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  weatherLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  weatherCity: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  changeLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.gray100,
    borderRadius: 12,
  },

  changeLocationText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  // Inline Picker Styles
  inlinePicker: {
    backgroundColor: colors.gray100,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  inlinePickerLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
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
    backgroundColor: colors.white,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },

  inlineChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  inlineChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },

  inlineChipTextActive: {
    color: colors.white,
  },

  inlineCityList: {
    backgroundColor: colors.white,
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
    borderBottomColor: colors.borderLight,
  },

  inlineCityText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    flex: 1,
  },

  // Weather Main Section
  weatherMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  weatherLeft: {
    flex: 1,
  },

  temperature: {
    fontSize: 56,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -2,
  },

  condition: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 4,
  },

  highLow: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textLight,
    marginTop: 8,
  },

  weatherRight: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Weather Meta
  weatherMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  weatherMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  weatherMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
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
    backgroundColor: colors.gray100,
    minWidth: 70,
  },

  hourlyItemActive: {
    backgroundColor: colors.primary,
  },

  hourlyTime: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },

  hourlyTimeActive: {
    color: colors.white,
  },

  hourlyTemp: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 8,
  },

  hourlyTempActive: {
    color: colors.white,
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
    color: colors.textPrimary,
  },

  sectionLink: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
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
    backgroundColor: colors.cardBackground,
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
    color: colors.textPrimary,
    marginBottom: 4,
  },

  chatbotSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: colors.white,
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
    color: colors.textPrimary,
  },

  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },

  selectorLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
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
    backgroundColor: colors.gray100,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },

  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  chipText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  chipTextActive: {
    color: colors.white,
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
    backgroundColor: colors.gray100,
    borderRadius: 12,
    marginBottom: 8,
  },

  locationItemContent: {
    flex: 1,
  },

  locationItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },

  locationItemCoords: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
})
