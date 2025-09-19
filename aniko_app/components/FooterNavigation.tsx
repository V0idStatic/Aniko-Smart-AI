// components/FooterNavigation.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const FooterNavigation = () => {
  const router = useRouter();

  return (
    <View style={styles.footer}>
      <TouchableOpacity>
        <Ionicons name="home" size={28} color="white" />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push("/plantdashboard")}>
        <Ionicons name="leaf" size={28} color="white" />
      </TouchableOpacity>
      
      <TouchableOpacity>
        <Ionicons name="camera" size={28} color="white" />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push("/dashboard")}>
        <Ionicons name="cloud" size={28} color="white" />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push("/sensor")}>
        <Ionicons name="analytics-outline" size={28} color="white" />
      </TouchableOpacity>
      
      <TouchableOpacity>
        <Ionicons name="menu" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

export default FooterNavigation;
