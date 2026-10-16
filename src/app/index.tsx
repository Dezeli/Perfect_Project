import { Redirect } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { useStore } from '../core/store';
import { Button, Page, Title, color, ui } from '../components/ui';
export default function Index() {
  const { state, ready, error, reload } = useStore();
  if (!ready) return <Page><Title eyebrow="" title="모험을 준비하고 있어요" />{error ? <><Text style={ui.error}>{error}</Text><Button title="다시 불러오기" onPress={reload} /></> : <ActivityIndicator color={color.gold} />}</Page>;
  return <Redirect href={state.profile ? '/(tabs)' : '/onboarding'} />;
}
