import React from "react";
import { View, Text, StyleSheet } from "react-native";


interface StatusCardProps {
  status?: string;
  color?: string;
}

export default function StatusCard({ status = "GOOD", color = "#FFD700" }: StatusCardProps) {
  return (
    <View style={styles.statusCard}>
      <Text style={styles.statusLabel}>Status</Text>
      <View style={styles.statusCircleWrapper}>
        <View style={[styles.outerCircle, { borderColor: color }]}>
          <Text style={styles.circleText}>{status}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    flex: 1,
    backgroundColor: "#1c4722",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginRight: 10,
  },
  statusLabel: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 10,
  },
  statusCircleWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    width: 90,
    height: 90,
    borderRadius: 60,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  circleText: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#FFC107",
  },
});
