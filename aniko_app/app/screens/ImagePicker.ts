import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const handleImageSelection = async (onImageSelected: (uri: string) => void) => {
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
  const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!cameraPermission.granted || !galleryPermission.granted) {
    Alert.alert('Permission denied', 'Camera and gallery access are required.');
    return;
  }

  Alert.alert('Upload Plant Image', 'Choose an option', [
    {
      text: 'Camera',
      onPress: async () => {
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 1,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
          onImageSelected(result.assets[0].uri);
        } else {
          Alert.alert('No image captured');
        }
      },
    },
    {
      text: 'Gallery',
      onPress: async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 1,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
          onImageSelected(result.assets[0].uri);
        } else {
          Alert.alert('No image selected');
        }
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
};
