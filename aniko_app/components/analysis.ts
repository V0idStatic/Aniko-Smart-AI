import { StyleSheet, Dimensions } from 'react-native';

/**
 * Shared Styles for Aniko Smart AI App
 */

const analysis = StyleSheet.create({
  // ===== CONTAINER STYLES =====
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },

  // ===== HEADER STYLES =====
  headerBackground: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  headerSubtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    marginTop: 5,
  },

  // ===== TAB STYLES =====
  tabContainer: {
    flexDirection: 'row',
    marginTop: -20,
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  
  activeTab: {
    borderBottomColor: '#1c4722',
    backgroundColor: '#f0f8f0',
  },
  
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  
  activeTabText: {
    color: '#1c4722',
    fontWeight: 'bold',
  },

  // ===== BUTTON STYLES =====
  timeRangeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 10,
  },
  
  activeTimeRange: {
    backgroundColor: '#1c4722',
  },
  
  timeRangeText: {
    fontSize: 14,
    color: '#333',
  },
  
  activeTimeRangeText: {
    color: 'white',
    fontWeight: 'bold',
  },

  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1c4722',
  },
  
  expandButtonText: {
    fontSize: 12,
    color: '#1c4722',
    fontWeight: '600',
    marginLeft: 4,
  },

  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8f0',
  },
  
  refreshButtonText: {
    fontSize: 14,
    color: '#1c4722',
    marginLeft: 8,
    fontWeight: '600',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  
  backButtonText: {
    fontSize: 14,
    color: '#1c4722',
    fontWeight: '600',
    marginLeft: 6,
  },

  // ===== CARD STYLES =====
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  weatherPredictionCard: {
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  categoryCard: {
    width: 120,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  
  activeCategoryCard: {
    borderColor: '#1c4722',
    backgroundColor: '#f0f8f0',
  },

  // ===== TEXT STYLES =====
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },

  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },

  chartSubtitle: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1c4722',
    marginBottom: 10,
  },

  plantName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1c4722',
    marginRight: 10,
  },

  subsectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },

  noDataText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },

  loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
    fontStyle: 'italic',
  },

  // ===== CHART STYLES =====
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  chart: {
    borderRadius: 10,
    marginVertical: 10,
    elevation: 3,
  },

  chartScrollView: {
    marginVertical: 10,
  },
  
  expandedChartScrollView: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  
  chartScrollContent: {
    paddingRight: 20,
    paddingLeft: 5,
  },

  dataPointsIndicator: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // ===== TABLE STYLES =====
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  tableRowEven: {
    backgroundColor: '#fff',
  },
  
  tableRowOdd: {
    backgroundColor: '#f9f9f9',
  },
  
  tableCell: {
    flex: 1,
    textAlign: 'center',
    color: '#555',
  },

  // ===== STATS STYLES =====
  statsContainer: {
    marginBottom: 20,
  },
  
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c4722',
  },

  predictionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  
  predictionStat: {
    alignItems: 'center',
    flex: 1,
  },
  
  predictionValue: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333',
    marginTop: 2,
  },
  
  predictionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },

  // ===== BADGE & STATUS STYLES =====
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 3,
  },
  
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  compactStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  
  compactStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  riskIndicator: {
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  
  riskText: {
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },

  monthChip: {
    backgroundColor: '#e0f2f1',
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 8,
    marginBottom: 4,
  },
  
  monthText: {
    fontSize: 12,
    color: '#00796b',
  },

  // ===== STATUS SUMMARY HORIZONTAL SCROLL STYLES =====
statusSummaryScroll: {
  marginTop: 15,
  maxHeight: 100, // Prevent vertical expansion
},

statusSummaryScrollContent: {
  paddingRight: 15, // Add padding to last item
  paddingVertical: 5, // Breathing room
  gap: 12, // Space between cards
},

statusSummaryItemCard: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: '#f5f5f5',
  borderRadius: 12,
  borderWidth: 2,
  borderColor: 'transparent',
  minWidth: 130, // Ensure consistent card width
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 3,
},

activeStatusItemCard: {
  backgroundColor: '#e8f5e9',
  borderColor: '#1c4722',
  borderWidth: 2,
  shadowOpacity: 0.15,
  shadowRadius: 4,
  elevation: 5,
},

statusDot: {
  width: 12,        // ← Changed from 8 to 12
  height: 12,       // ← Changed from 8 to 12
  borderRadius: 6,  // ← Changed from 4 to 6
  marginRight: 10,  // ← Changed from 6 to 10
},

statusTextContainer: {
  flex: 1,
},

statusSummaryText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
  marginBottom: 2,
},

statusCount: {
  fontSize: 12,
  color: '#666',
  fontWeight: '500',
},

activeStatusText: {
  color: '#1c4722',
  fontWeight: 'bold',
},

checkmark: {
  marginLeft: 8,
},



// New category summary styles:
categorySummary: {
  backgroundColor: '#fff',
  padding: 15,
  borderRadius: 12,
  marginVertical: 10,
  marginHorizontal: 15,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},

categorySummaryTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#1c4722',
  marginBottom: 5,
},

categorySummarySubtitle: {
  fontSize: 14,
  color: '#666',
},

// ===== ADD THESE MISSING STYLES =====

// Time Range Styles
timeRangeContainer: {
  marginBottom: 20,
},

timeRangeLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
  marginBottom: 10,
},

sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15,
},

// Container Styles
noDataContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 40,
},

loadingContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 40,
},

recommendationHeader: {
  marginBottom: 20,
},

// Category Styles
categoryContainer: {
  marginBottom: 20,
},

categoryScrollView: {
  marginTop: 10,
},

categoryIconContainer: {
  marginBottom: 8,
},

categoryName: {
  fontSize: 13,
  fontWeight: '600',
  color: '#333',
  textAlign: 'center',
  marginTop: 5,
},

activeCategoryName: {
  color: '#1c4722',
},

categoryCount: {
  fontSize: 11,
  color: '#666',
  marginTop: 2,
},

// Plant Detail Styles
detailView: {
  marginTop: 10,
},

detailedRecommendationCard: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 18,
  marginBottom: 18,
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},

cardHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15,
},

plantInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},

plantingMonths: {
  marginTop: 10,
  marginBottom: 15,
},

monthsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 8,
},

riskSection: {
  marginTop: 15,
  padding: 12,
  backgroundColor: '#fff3e0',
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#ff5722',
},

riskItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 6,
},

recommendationsSection: {
  marginTop: 15,
  padding: 12,
  backgroundColor: '#e8f5e9',
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#4caf50',
},

recommendationItem: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginTop: 6,
},

recommendationText: {
  fontSize: 13,
  color: '#333',
  marginLeft: 8,
  flex: 1,
},

alternativesSection: {
  marginTop: 15,
  padding: 12,
  backgroundColor: '#e3f2fd',
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#2196f3',
},

alternativeItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 6,
},

alternativeText: {
  fontSize: 13,
  color: '#333',
  marginLeft: 8,
  flex: 1,
},

optimalConditions: {
  marginTop: 15,
  padding: 12,
  backgroundColor: '#f5f5f5',
  borderRadius: 8,
},

conditionText: {
  fontSize: 13,
  color: '#555',
  marginTop: 4,
},

npkSection: {
  marginTop: 15,
  padding: 12,
  backgroundColor: '#fff8e1',
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#fbc02d',
},

// Plant List Styles
plantListContainer: {
  marginTop: 10,
},

listTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#1c4722',
  marginBottom: 5,
},

listSubtitle: {
  fontSize: 13,
  color: '#666',
  marginBottom: 15,
},

plantListItem: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 15,
  marginBottom: 10,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
},

plantListInfo: {
  flex: 1,
  marginRight: 10,
},

plantListHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8,
},

plantListName: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#1c4722',
  flex: 1,
},

quickSummary: {
  marginTop: 5,
},

quickSummaryText: {
  fontSize: 12,
  color: '#666',
  marginTop: 3,
},

// NPK Chart Styles
npkContainer: {
  backgroundColor: 'white',
  borderRadius: 10,
  padding: 15,
  marginBottom: 20,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
},

npkChart: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'flex-end',
  height: 200,
  marginTop: 15,
},

npkBar: {
  width: 80,
  alignItems: 'center',
},

npkFill: {
  width: '100%',
  borderTopLeftRadius: 8,
  borderTopRightRadius: 8,
  minHeight: 20,
},

npkValue: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
  marginTop: 8,
},

npkLabel: {
  fontSize: 12,
  color: '#666',
  marginTop: 4,
  textAlign: 'center',
},

// Footer Styles
footerSpace: {
  height: 80,
},

plantSelectionContainer: {
  marginVertical: 15,
  paddingHorizontal: 20,
},
plantSelectBtn: {
  paddingHorizontal: 20,
  paddingVertical: 10,
  marginRight: 10,
  borderRadius: 20,
  backgroundColor: '#f0f0f0',
  borderWidth: 1,
  borderColor: '#ddd',
},
activePlantBtn: {
  backgroundColor: '#e0f7e0',
  borderColor: '#1c4722',
},
plantSelectText: {
  fontSize: 14,
  color: '#666',
},
activePlantText: {
  color: '#1c4722',
  fontWeight: 'bold',
},

// ===== END OF MISSING STYLES =====

});

export default analysis;
