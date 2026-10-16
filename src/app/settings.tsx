import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useStore } from '../core/store';
import { Button, Card, Field, Page, showError, ui } from '../components/ui';
export default function Settings() {
  const { state, mutate } = useStore();
  const [name, setName] = useState(state.profile?.name ?? '');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!name.trim() || name.trim() === state.profile?.name || busy) return;
    setBusy(true);
    try {
      await mutate(s => ({ ...s, profile: s.profile ? { ...s.profile, name: name.trim() } : null }));
      Alert.alert('닉네임을 변경했어요', '홈 화면에도 새 닉네임이 표시돼요.');
    } catch (err) { showError(err); } finally { setBusy(false); }
  }
  return <Page backgroundImage={require('../../assets/backgrounds/adventure-home-calm.png')} backgroundOverlayColor="#10150FE8" contentStyle={{ paddingTop: 24 }}>
    <View style={ui.between}>
      <Text accessibilityRole="header" style={ui.title}>설정</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="뒤로가기" disabled={busy} onPress={() => router.back()} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#786A56', borderRadius: 22, backgroundColor: pressed ? '#4B4338' : '#5A5144' })}>
        <Feather name="arrow-left" size={22} color="#EBCF9B" />
      </Pressable>
    </View>
    <Card style={{ gap: 10, padding: 14 }}>
      <Text style={ui.heading}>모험가 프로필</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <View style={{ flex: 1 }}><Field label="닉네임" value={name} onChangeText={setName} maxLength={20} returnKeyType="done" onSubmitEditing={() => void save()} /></View>
        <Button title="저장" disabled={!name.trim() || name.trim() === state.profile?.name} busy={busy} onPress={() => void save()} />
      </View>
    </Card>
  </Page>;
}
