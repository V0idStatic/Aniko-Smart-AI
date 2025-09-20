import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";

// Types
interface WeatherDay {
  day: string;
  color: string;
  status: string;
  temp: string | number;
  humidity: string | number;
}

interface WeatherHistoryProps {
  weeklyWeather: WeatherDay[];
}

// ---- Legend Item ----
const LegendItem = ({ label, color }: { label: string; color: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendColor, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

// ---- Day Item ----
const DayItem = ({
  item,
  onPress,
}: {
  item: WeatherDay;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.historyDayWrapper}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.dayBox, { backgroundColor: item.color }]}>
      <Text style={styles.historyDayText}>{item.day}</Text>
    </View>
  </TouchableOpacity>
);

// ---- Main Component ----
const WeatherHistory: React.FC<WeatherHistoryProps> = ({ weeklyWeather }) => {
  const [selectedDay, setSelectedDay] = useState<WeatherDay | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const legendLabels = [
    { label: "Very Good", color: "#4CAF50" },
    { label: "Good", color: "#8BC34A" },
    { label: "Warning", color: "#FFC107" },
    { label: "Bad", color: "#F44336" },
  ];

  return (
    <View style={styles.historyCard}>
      {/* Header */}
      <View style={styles.historyHeader}>
        <View style={styles.historyHeaderRow}>
          <Text style={styles.historyTitle}>Weather History: This Week</Text>
          <View style={styles.legendRow}>
            {legendLabels.map((l, i) => (
              <LegendItem key={i} label={l.label} color={l.color} />
            ))}
          </View>
        </View>
      </View>

      {/* Days */}
      <View style={styles.historyRow}>
        {weeklyWeather.map((item, i) => (
          <DayItem
            key={i}
            item={item}
            onPress={() => {
              setSelectedDay(item);
              setShowDayModal(true);
            }}
          />
        ))}
      </View>

      {/* Day Analysis Modal */}
      <Modal visible={showDayModal} transparent animationType="fade">
        <View style={styles.locationModalOverlay}>
          <View style={styles.locationModalContainer}>
            <Text style={styles.locationModalTitle}>
              {selectedDay ? `${selectedDay.day} — Analysis` : "Day Analysis"}
            </Text>

            {selectedDay && (
              <View>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: selectedDay.color },
                    ]}
                  />
                  <Text style={styles.statusText}>{selectedDay.status}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailText}>
                    Temperature (max): {selectedDay.temp}
                  </Text>
                  <Text style={styles.detailText}>
                    Humidity (avg): {selectedDay.humidity}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.closeModalBtn, { marginTop: 16 }]}
              onPress={() => setShowDayModal(false)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default WeatherHistory;

//
// ---- Styles ----
//
const styles = StyleSheet.create({
  historyCard: {
    marginTop: 15,
    backgroundColor: "#1c4722",
    borderRadius: 20,
    padding: 15,
  },
  historyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  historyHeader: {
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  historyTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  legendText: {
    color: "white",
    fontSize: 8,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: 10,
  },
  historyDayWrapper: {
    flexBasis: "13%",
    marginBottom: 8,
  },
  dayBox: {
    width: 45,
    height: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  historyDayText: {
    color: "white",
    fontWeight: "bold",
  },
  // ---- Modal ----
  locationModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  locationModalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "80%",
  },
  locationModalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1c4722",
    marginBottom: 12,
    textAlign: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusText: {
    color: "#2e4d2f",
    fontWeight: "600",
  },
  detailSection: {
    paddingVertical: 6,
  },
  detailText: {
    color: "#1c4722",
    marginBottom: 4,
  },
  closeModalBtn: {
    backgroundColor: "#1c4722",
    paddingVertical: 8,
    borderRadius: 10,
  },
  closeModalText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
});
