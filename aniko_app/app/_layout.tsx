import { Stack } from 'expo-router';
import { AppProvider } from './CONFIG/GlobalContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="plantdashboard" options={{ headerShown: false }} />
        <Stack.Screen name="sensor" options={{ headerShown: false }} />
        <Stack.Screen name="waterdashboard" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  );
}