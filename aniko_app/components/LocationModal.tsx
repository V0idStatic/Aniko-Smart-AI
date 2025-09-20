import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

interface Barangay {
  id: string;
  name: string;
}

interface Province {
  id: string;
  name: string;
  barangays: Barangay[];
}

interface LocationModalProps {
  visible: boolean;
  provinces: Province[];
  activeProvince: Province | null;
  setActiveProvince: (province: Province) => void;
  onSelectLocation: (province: string, barangay: string) => void;
  onClose: () => void;
}

export default function LocationModal({
  visible,
  provinces,
  activeProvince,
  setActiveProvince,
  onSelectLocation,
  onClose,
}: LocationModalProps) {
  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Location</Text>

          {/* Province List */}
          <FlatList
            data={provinces}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.provinceButton,
                  activeProvince?.id === item.id && styles.activeProvince,
                ]}
                onPress={() => setActiveProvince(item)}
              >
                <Text
                  style={[
                    styles.provinceText,
                    activeProvince?.id === item.id && styles.activeProvinceText,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Barangays */}
          {activeProvince && (
            <FlatList
              data={activeProvince.barangays}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.barangayButton}
                  onPress={() =>
                    onSelectLocation(activeProvince.name, item.name)
                  }
                >
                  <Text style={styles.barangayText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Close */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  provinceButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  activeProvince: {
    backgroundColor: "#4d7f39",
  },
  provinceText: {
    color: "#333",
    fontSize: 14,
  },
  activeProvinceText: {
    color: "white",
    fontWeight: "bold",
  },
  barangayButton: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  barangayText: {
    fontSize: 16,
    color: "#333",
  },
  closeButton: {
    marginTop: 16,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#4d7f39",
    borderRadius: 8,
  },
  closeText: {
    color: "white",
    fontWeight: "bold",
  },
});
