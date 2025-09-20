// components/FooterNavigation.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const FooterNavigation = () => {
  const router = useRouter();

  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={() => router.push("/")}>
        <Ionicons name="home" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/plantdashboard")}>
        <Ionicons name="leaf" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity>
        <Ionicons name="camera" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/dashboard")}>
        <Ionicons name="cloud" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/sensor")}>
        <Ionicons name="analytics-outline" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity>
        <Ionicons name="menu" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1c4722",     // dark green background
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default FooterNavigation;
