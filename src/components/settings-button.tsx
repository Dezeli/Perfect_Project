import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Pressable } from 'react-native';

export function SettingsButton() {
  return <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel="설정" style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#786A56', borderRadius: 22, backgroundColor: pressed ? '#4B4338' : '#5A5144' })}>
    <Feather name="settings" color="#EBCF9B" size={22} />
  </Pressable>;
}
