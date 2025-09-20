import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchBar() {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={18} color="gray" />
      <TextInput
        placeholder="Search"
        style={styles.searchInput}
        placeholderTextColor="gray"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    margin: 16,
  },
  searchInput: { flex: 1, marginLeft: 8, color: "black" },
});
