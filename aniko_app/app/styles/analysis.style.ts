import { StyleSheet } from "react-native"

/**
 * Professional Styles for Aniko Smart AI App
 * Enhanced with refined color palette, typography hierarchy, and consistent spacing
 */

const analysis = StyleSheet.create({
  // ===== CONTAINER STYLES =====
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA", // More professional neutral background
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },

  // ===== HEADER STYLES =====
  headerBackground: {
    paddingTop: 50,
    paddingBottom: 32, // Consistent spacing scale
    paddingHorizontal: 20,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  headerSubtitle: {
    color: "white",
    fontSize: 15,
    opacity: 0.95,
    marginTop: 6,
    fontWeight: "400",
  },

  // ===== TAB STYLES =====
  tabContainer: {
    flexDirection: "row",
    marginTop: -20,
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 16, // More consistent with other cards
    elevation: 4, // Refined elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Softer, more professional shadow
    shadowRadius: 8,
    overflow: "hidden",
  },

  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16, // Consistent spacing
    backgroundColor: "#fff",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },

  activeTab: {
    borderBottomColor: "#1c4722",
    backgroundColor: "#F0F9F4", // Softer active background
  },

  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B", // Professional gray
  },

  activeTabText: {
    color: "#1c4722",
    fontWeight: "700",
  },

  // ===== BUTTON STYLES =====
  timeRangeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: "#F1F5F9", // Better neutral color
    marginRight: 10,
    borderWidth: 1.5, // Slightly thicker border
    borderColor: "#E2E8F0", // Professional border color
  },

  activeTimeRange: {
    backgroundColor: "#1c4722",
    borderColor: "#1c4722",
    elevation: 3, // Better elevation
    shadowColor: "#1c4722",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, // Stronger shadow for active state
    shadowRadius: 4,
  },

  timeRangeText: {
    fontSize: 14,
    color: "#475569", // Professional text color
    fontWeight: "600",
  },

  activeTimeRangeText: {
    color: "white",
    fontWeight: "700",
  },

  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F0F9F4", // Consistent with theme
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#1c4722",
  },

  expandButtonText: {
    fontSize: 12,
    color: "#1c4722",
    fontWeight: "700",
    marginLeft: 4,
  },

  refreshButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: "#F0F9F4", // Consistent with theme
    borderWidth: 1.5, // Consistent border width
    borderColor: "#D1E7DD", // Professional border
    alignItems: "center", // Centers content horizontally
    justifyContent: "center", // Centers content vertically
    flexDirection: "row", // Ensures icon + text are aligned in a row
  },

  refreshButtonText: {
    fontSize: 14,
    color: "#1c4722",
    marginLeft: 8,
    fontWeight: "700",
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9F4", // Consistent with theme
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 15,
    alignSelf: "flex-start",
    borderWidth: 1.5, // Consistent border width
    borderColor: "#D1E7DD", // Professional border
  },

  backButtonText: {
    fontSize: 14,
    color: "#1c4722",
    fontWeight: "700",
    marginLeft: 6,
  },

  // ===== CARD STYLES =====
  chartContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20, // Consistent spacing
    marginBottom: 20,
    elevation: 2, // Refined elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, // Softer shadow
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Professional border
  },

  statCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20, // Consistent spacing
    alignItems: "center",
    elevation: 2, // Refined elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, // Softer shadow
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Professional border
  },

  recommendationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    elevation: 2, // Refined elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, // Softer shadow
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Professional border
  },

  weatherPredictionCard: {
    backgroundColor: "#FAFBFC", // Professional background
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Professional border
  },

  categoryCard: {
    width: 120,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginRight: 15,
    alignItems: "center",
    elevation: 2, // Refined elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, // Softer shadow
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: "#E2E8F0", // Default border
  },

  activeCategoryCard: {
    borderColor: "#1c4722",
    backgroundColor: "#F0F9F4", // Consistent active background
    elevation: 4, // Higher elevation when active
    shadowOpacity: 0.12,
  },

  // ===== TEXT STYLES =====
  sectionTitle: {
    fontSize: 18, // Better hierarchy
    fontWeight: "700",
    color: "#1E293B", // Professional dark color
    marginBottom: 16, // Consistent spacing
    letterSpacing: 0.3,
  },

  chartTitle: {
    fontSize: 18, // Better hierarchy
    fontWeight: "700",
    marginBottom: 16, // Consistent spacing
    color: "#1E293B", // Professional dark color
    letterSpacing: 0.3,
  },

  chartSubtitle: {
    fontSize: 12,
    color: "#64748B", // Professional gray
    fontStyle: "italic",
    marginBottom: 10,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748B", // Professional gray
    marginBottom: 16, // Consistent spacing
    lineHeight: 20,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c4722",
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  plantName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1c4722",
    marginRight: 10,
    letterSpacing: 0.3,
  },

  subsectionTitle: {
    fontSize: 15, // Better hierarchy
    fontWeight: "700",
    color: "#334155", // Professional color
    marginBottom: 8,
    marginTop: 10,
  },

  noDataText: {
    fontSize: 16,
    color: "#94A3B8", // Professional gray
    marginTop: 10,
    fontWeight: "500",
  },

  loadingText: {
    fontSize: 16,
    color: "#64748B", // Professional gray
    marginTop: 12,
    fontStyle: "italic",
    fontWeight: "500",
  },

  // ===== CHART STYLES =====
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16, // Consistent spacing
  },

  chart: {
    borderRadius: 12,
    marginVertical: 10,
    elevation: 1, // Subtle elevation
  },

  chartScrollView: {
    marginVertical: 10,
  },

  expandedChartScrollView: {
    backgroundColor: "#FAFBFC", // Professional background
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  chartScrollContent: {
    paddingRight: 20,
    paddingLeft: 5,
  },

  dataPointsIndicator: {
    fontSize: 11,
    color: "#94A3B8", // Professional gray
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },

  // ===== TABLE STYLES =====
  tableContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2, // Refined elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, // Softer shadow
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Professional border
  },

  weatherRecordCard: {
    backgroundColor: "#FAFBFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  weatherRecordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  weatherRecordDate: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: 0.3,
  },

  weatherRecordDay: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },

  weatherDescriptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9F4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1E7DD",
  },

  weatherDescriptionText: {
    fontSize: 12,
    color: "#1c4722",
    fontWeight: "600",
    marginLeft: 5,
  },

  weatherMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  weatherMetricItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  weatherMetricContent: {
    marginLeft: 8,
    flex: 1,
  },

  weatherMetricLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  weatherMetricValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 2,
  },

  // Temperature color variants
  tempCold: {
    color: "#3B82F6",
  },
  tempMild: {
    color: "#10B981",
  },
  tempWarm: {
    color: "#F59E0B",
  },
  tempHot: {
    color: "#EF4444",
  },

  // Rainfall indicator
  rainfallHigh: {
    color: "#2563EB",
  },
  rainfallMedium: {
    color: "#3B82F6",
  },
  rainfallLow: {
    color: "#60A5FA",
  },

  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9F4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: "#1c4722",
  },

  showMoreText: {
    fontSize: 14,
    color: "#1c4722",
    fontWeight: "700",
    marginLeft: 6,
  },

  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#E2E8F0", // Professional border
    backgroundColor: "#F8FAFC", // Professional background
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },

  tableHeaderCell: {
    flex: 1,
    fontWeight: "700",
    color: "#334155", // Professional dark color
    textAlign: "center",
    fontSize: 13,
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9", // Lighter border
  },

  tableRowEven: {
    backgroundColor: "#fff",
  },

  tableRowOdd: {
    backgroundColor: "#FAFBFC", // Professional alternating color
  },

  tableCell: {
    flex: 1,
    textAlign: "center",
    color: "#475569", // Professional color
    fontSize: 13,
  },

  // ===== STATS STYLES =====
  statsContainer: {
    marginBottom: 20,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  statTitle: {
    fontSize: 13,
    color: "#64748B", // Professional gray
    marginTop: 10,
    marginBottom: 4,
    fontWeight: "500",
  },

  statValue: {
    fontSize: 24, // More prominent
    fontWeight: "700",
    color: "#1c4722",
    letterSpacing: 0.5,
  },

  predictionStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  predictionStat: {
    alignItems: "center",
    flex: 1,
  },

  predictionValue: {
    fontWeight: "700",
    fontSize: 18,
    color: "#1E293B", // Professional dark color
    marginTop: 4,
    letterSpacing: 0.3,
  },

  predictionLabel: {
    fontSize: 12,
    color: "#64748B", // Professional gray
    marginTop: 2,
    fontWeight: "500",
  },

  // ===== BADGE & STATUS STYLES =====
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 3,
    elevation: 1,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  compactStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    elevation: 1,
  },

  compactStatusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  riskIndicator: {
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    marginTop: 8,
    elevation: 1,
  },

  riskText: {
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 1,
  },

  riskBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155", // Professional dark color
    letterSpacing: 0.8,
  },

  monthChip: {
    backgroundColor: "#D1FAE5", // Professional green tint
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#A7F3D0", // Professional border
  },

  monthText: {
    fontSize: 12,
    color: "#065F46", // Professional dark green
    fontWeight: "600",
  },

  // ===== STATUS SUMMARY HORIZONTAL SCROLL STYLES =====
  statusSummaryScroll: {
    marginTop: 15,
    maxHeight: 100,
  },

  statusSummaryScrollContent: {
    paddingRight: 15,
    paddingVertical: 5,
    gap: 12,
  },

  statusSummaryItemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC", // Professional background
    borderRadius: 16,
    borderWidth: 1.5, // Consistent border width
    borderColor: "#E2E8F0", // Professional border
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  activeStatusItemCard: {
    backgroundColor: "#F0F9F4", // Consistent active background
    borderColor: "#1c4722",
    borderWidth: 2,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    elevation: 1,
  },

  statusTextContainer: {
    flex: 1,
  },

  statusSummaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155", // Professional color
    marginBottom: 2,
  },

  statusCount: {
    fontSize: 12,
    color: "#64748B", // Professional gray
    fontWeight: "600",
  },

  activeStatusText: {
    color: "#1c4722",
    fontWeight: "700",
  },

  checkmark: {
    marginLeft: 8,
  },

  // Category summary styles
  categorySummary: {
    backgroundColor: "#fff",
    padding: 20, // Consistent spacing
    borderRadius: 16,
    marginVertical: 10,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, // Softer shadow
    shadowRadius: 8,
    elevation: 2, // Refined elevation
    borderWidth: 1,
    borderColor: "#E2E8F0", // Professional border
  },

  categorySummaryTitle: {
    fontSize: 20, // Better hierarchy
    fontWeight: "700",
    color: "#1c4722",
    marginBottom: 6,
    letterSpacing: 0.3,
  },

  categorySummarySubtitle: {
    fontSize: 14,
    color: "#64748B", // Professional gray
    fontWeight: "500",
  },

  // ===== TIME RANGE & SECTION STYLES =====
  timeRangeContainer: {
    marginBottom: 20,
  },

  timeRangeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155", // Professional color
    marginBottom: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16, // Consistent spacing
  },

  // ===== CONTAINER STYLES =====
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  recommendationHeader: {
    marginBottom: 20,
  },

  // ===== CATEGORY STYLES =====
  categoryContainer: {
    marginBottom: 20,
  },

  categoryScrollView: {
    marginTop: 10,
  },

  categoryIconContainer: {
    marginBottom: 10,
  },

  categoryName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155", // Professional color
    textAlign: "center",
    marginTop: 6,
  },

  activeCategoryName: {
    color: "#1c4722",
  },

  categoryCount: {
    fontSize: 11,
    color: "#64748B", // Professional gray
    marginTop: 3,
    fontWeight: "500",
  },

  // ===== PLANT DETAIL STYLES =====
  detailView: {
    marginTop: 10,
  },

  detailedRecommendationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    elevation: 3, // Better elevation for detailed cards
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Slightly stronger shadow
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Professional border
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  plantInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  plantingMonths: {
    marginTop: 12,
    marginBottom: 16,
  },

  monthsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },

  riskSection: {
    marginTop: 16,
    padding: 16, // Consistent spacing
    backgroundColor: "#FEF3C7", // Professional warning background
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B", // Professional warning color
  },

  riskItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  recommendationsSection: {
    marginTop: 16,
    padding: 16, // Consistent spacing
    backgroundColor: "#D1FAE5", // Professional success background
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981", // Professional success color
  },

  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
  },

  recommendationText: {
    fontSize: 13,
    color: "#334155", // Professional color
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },

  alternativesSection: {
    marginTop: 16,
    padding: 16, // Consistent spacing
    backgroundColor: "#DBEAFE", // Professional info background
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6", // Professional info color
  },

  alternativeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  alternativeText: {
    fontSize: 13,
    color: "#334155", // Professional color
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },

  cropDetailText: {
    fontSize: 13,
    color: "#475569", // Professional gray
    lineHeight: 20,
    marginTop: 4,
    fontWeight: "500",
  },

  optimalConditions: {
    marginTop: 16,
    padding: 16, // Consistent spacing
    backgroundColor: "#F1F5F9", // Professional neutral background
    borderRadius: 12,
  },

  conditionText: {
    fontSize: 13,
    color: "#475569", // Professional color
    marginTop: 5,
    lineHeight: 18,
  },

  npkSection: {
    marginTop: 16,
    padding: 16, // Consistent spacing
    backgroundColor: "#FEF3C7", // Professional background
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B", // Professional color
  },

  // ===== PLANT LIST STYLES =====
  plantListContainer: {
    marginTop: 10,
  },

  listTitle: {
    fontSize: 20, // Better hierarchy
    fontWeight: "700",
    color: "#1c4722",
    marginBottom: 6,
    letterSpacing: 0.3,
  },

  listSubtitle: {
    fontSize: 13,
    color: "#64748B", // Professional gray
    marginBottom: 16,
    fontWeight: "500",
  },

  plantListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Professional border
  },

  plantListInfo: {
    flex: 1,
    marginRight: 10,
  },

  plantListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  plantListName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c4722",
    flex: 1,
    letterSpacing: 0.3,
  },

  quickSummary: {
    marginTop: 6,
  },

  quickSummaryText: {
    fontSize: 12,
    color: "#64748B", // Professional gray
    marginTop: 4,
    lineHeight: 16,
  },

  // ===== NPK CHART STYLES =====
  npkContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20, // Consistent spacing
    marginBottom: 20,
    elevation: 2, // Refined elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, // Softer shadow
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Professional border
  },

  npkChart: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 200,
    marginTop: 15,
  },

  npkBar: {
    width: 80,
    alignItems: "center",
  },

  npkFill: {
    width: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    minHeight: 20,
    elevation: 2,
  },

  npkValue: {
    fontSize: 18, // Better hierarchy
    fontWeight: "700",
    color: "#1E293B", // Professional dark color
    marginTop: 10,
    letterSpacing: 0.3,
  },

  npkLabel: {
    fontSize: 12,
    color: "#64748B", // Professional gray
    marginTop: 5,
    textAlign: "center",
    fontWeight: "600",
  },

  // ===== FOOTER STYLES =====
  footerSpace: {
    height: 80,
  },

  // ===== PLANT SELECTION STYLES =====
  plantSelectionContainer: {
    marginVertical: 15,
    paddingHorizontal: 20,
  },

  plantSelectBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 24,
    backgroundColor: "#F1F5F9", // Professional background
    borderWidth: 1.5,
    borderColor: "#CBD5E1", // Professional border
  },

  activePlantBtn: {
    backgroundColor: "#F0F9F4", // Consistent active background
    borderColor: "#1c4722",
    elevation: 3, // Better elevation
    shadowColor: "#1c4722",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  plantSelectText: {
    fontSize: 14,
    color: "#64748B", // Professional gray
    fontWeight: "600",
  },

  activePlantText: {
    color: "#1c4722",
    fontWeight: "700",
  },
})

export default analysis
