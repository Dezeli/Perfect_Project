import { Redirect, Tabs } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../core/store';
import { color, font } from '../../components/ui';
export default function TabLayout() {
  const { state, ready } = useStore();
  const insets = useSafeAreaInsets();
  const androidBottomSpace = Math.max(insets.bottom, 24);
  if (!ready) return <Redirect href="/" />;
  if (!state.profile) return <Redirect href="/onboarding" />;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#EBCF9B', tabBarInactiveTintColor: '#CDC4B4', tabBarStyle: { backgroundColor: '#5A5144', borderTopColor: '#786A56', paddingTop: 0, ...(Platform.OS === 'android' ? { height: 56 + androidBottomSpace, paddingBottom: androidBottomSpace + 14 } : {}) }, tabBarLabelStyle: { fontFamily: font.medium, fontSize: 12, transform: [{ translateY: -4 }] }, sceneStyle: { backgroundColor: color.bg } }}>
    {([['index', '홈', 'home'], ['goals', '퀘스트', 'check-square'], ['stats', '기록', 'bar-chart-2']] as const).map(([name, title, icon], index) => <Tabs.Screen key={name} name={name} options={{ title, tabBarItemStyle: { borderLeftWidth: index === 0 ? 0 : 1, borderLeftColor: '#786A56', marginVertical: 5 }, tabBarIcon: ({ color }) => <Feather name={icon} color={color} size={22} style={{ transform: [{ translateY: -4 }] }} /> }} />)}
  </Tabs>;
}
