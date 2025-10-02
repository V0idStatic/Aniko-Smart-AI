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

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  // ===== PLANT & NPK STYLES =====
  plantSelectionContainer: {
    marginBottom: 20,
  },
  
  plantSelectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 10,
  },
  
  activePlantBtn: {
    backgroundColor: '#1c4722',
  },
  
  plantSelectText: {
    fontSize: 14,
    color: '#333',
  },
  
  activePlantText: {
    color: 'white',
    fontWeight: 'bold',
  },

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
    height: 200,
    marginTop: 20,
    paddingBottom: 30,
    alignItems: 'flex-end',
  },
  
  npkBar: {
    width: 60,
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  
  npkFill: {
    width: '100%',
    borderRadius: 5,
    position: 'absolute',
    bottom: 0,
  },
  
  npkValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    zIndex: 1,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  npkLabel: {
    position: 'absolute',
    bottom: -25,
    fontSize: 12,
    fontWeight: 'bold',
  },

  optimalConditions: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
    padding: 12,
  },
  
  npkSection: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 12,
  },

  // ===== RECOMMENDATION STYLES =====
  recommendationHeader: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  plantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  plantingMonths: {
    marginVertical: 8,
  },
  
  monthsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },

  riskSection: {
    marginTop: 5,
    marginBottom: 5,
  },
  
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },

  recommendationsSection: {
    marginTop: 5,
    marginBottom: 5,
  },
  
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  
  recommendationText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 5,
  },

  alternativesSection: {
    marginTop: 5,
    marginBottom: 5,
  },
  
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  
  alternativeText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 5,
  },

  conditionText: {
    fontSize: 13,
    color: '#555',
    marginVertical: 2,
    lineHeight: 18,
  },

  // ===== TIPS & CATEGORY STYLES =====
  tipsContainer: {
    marginTop: 15,
    marginBottom: 25,
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    padding: 15,
  },
  
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  
  tipContent: {
    marginLeft: 12,
    flex: 1,
  },
  
  tipTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
    color: '#333',
  },
  
  tipText: {
    fontSize: 13,
    color: '#555',
  },

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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  
  activeCategoryName: {
    color: '#1c4722',
    fontWeight: 'bold',
  },
  
  categoryCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  categorySummary: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  categorySummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c4722',
    marginBottom: 4,
  },
  
  categorySummarySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },

  statusSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  statusSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flex: 0.48,
  },
  
  statusSummaryText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },

  activeStatusSummaryItem: {
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  
  activeStatusSummaryText: {
    color: '#1c4722',
    fontWeight: 'bold',
  },

  // ===== LIST & FILTER STYLES =====
  plantListContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c4722',
    marginBottom: 4,
  },
  
  listSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },

  plantListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    marginBottom: 8,
  },
  
  plantListInfo: {
    flex: 1,
  },
  
  plantListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  
  plantListName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c4722',
    flex: 1,
  },

  quickSummary: {
    marginTop: 4,
  },
  
  quickSummaryText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },

  statusFilterContainer: {
    marginBottom: 15,
  },
  
  statusFilterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  
  statusFilterScrollView: {
    marginTop: 5,
  },
  
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  activeStatusFilterButton: {
    backgroundColor: '#f0f8f0',
    borderColor: '#1c4722',
  },
  
  statusFilterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  
  statusFilterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  
  activeStatusFilterText: {
    color: '#1c4722',
    fontWeight: 'bold',
  },

  // ===== DETAIL VIEW STYLES =====
  detailView: {
    marginBottom: 20,
  },

  detailedRecommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // ===== LAYOUT HELPERS =====
  timeRangeContainer: {
    marginBottom: 20,
  },

  timeRangeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 10,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },

  footerSpace: {
    height: 80,
  },
});

export default analysis;
