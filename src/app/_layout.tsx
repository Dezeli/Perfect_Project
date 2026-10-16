import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../core/store';
import { color } from '../components/ui';
import Feather from '@expo/vector-icons/Feather';
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Feather.font,
    Mulmaru: require('../../assets/fonts/Mulmaru.ttf'),
    NeoDunggeunmo: require('../../assets/fonts/neodgm.ttf'),
    Pretendard: require('../../assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-Bold': require('../../assets/fonts/Pretendard-Bold.ttf'),
  });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: color.bg }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="quest" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="notes" options={{ gestureEnabled: false }} />
          <Stack.Screen name="story" />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
