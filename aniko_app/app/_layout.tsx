import { Stack } from 'expo-router';
import { AppProvider } from './CONFIG/GlobalContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="OnBoardingScreen" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="plantdashboard" options={{ headerShown: false }} />
        <Stack.Screen name="sensor" options={{ headerShown: false }} />
        <Stack.Screen name="analysis" options={{ headerShown: false }} />
        <Stack.Screen name="chatbot" options={{ headerShown: false }} />
        <Stack.Screen name="diagnosis" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  );
}