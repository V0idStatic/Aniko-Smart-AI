import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { handleImageSelection } from '../app/screens/ImagePicker';

const FooterNavigation = () => {
  const router = useRouter();

  const openCameraFlow = () => {
    handleImageSelection((uri: string) => {
      router.push({ pathname: '/diagnosis', params: { imageUri: uri } });
    });
  };

  return (
    <View style={styles.footerContainer}>
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/Login')}>
          <Ionicons name="home" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/plantdashboard')}>
          <Ionicons name="leaf" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={openCameraFlow}>
          <Ionicons name="camera" size={30} color="#fff" /> 
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Ionicons name="cloud" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/sensor')}>
          <Ionicons name="analytics-outline" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/analysis')}>
          <Ionicons name="stats-chart-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    position: 'absolute',
    bottom: 35,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  footer: {
    backgroundColor: '#1c4722',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderRadius: 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10, 
  },
});

export default FooterNavigation;
