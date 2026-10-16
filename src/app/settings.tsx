import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { initialState, mediaPaths } from '../core/domain';
import { discardNotePhoto } from '../core/note-media';
import { useStore } from '../core/store';
import { Button, Card, Field, Page, color, font, showError, ui } from '../components/ui';
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
  async function reset() {
    if (busy) return;
    setBusy(true);
    try {
      let paths: string[] = [];
      await mutate(current => { paths = mediaPaths(current); return initialState(); });
      paths.forEach(discardNotePhoto);
      router.replace('/onboarding');
    } catch (err) { showError(err); setBusy(false); }
  }
  function confirmReset() {
    Alert.alert('모든 기록 초기화', '닉네임, 퀘스트, 장비, 노트 사진과 성장 기록이 이 기기에서 삭제돼요. 갤러리에 저장한 스토리는 그대로 남아요.', [
      { text: '취소', style: 'cancel' },
      { text: '초기화', style: 'destructive', onPress: () => void reset() },
    ]);
  }
  return <Page backgroundImage={require('../../assets/backgrounds/adventure-home-calm.png')} backgroundOverlayColor="#10150FE8" contentStyle={{ paddingTop: 24 }}>
    <View style={ui.between}>
      <Text accessibilityRole="header" style={ui.title}>설정</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="뒤로가기" disabled={busy} onPress={() => router.back()} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#786A56', borderRadius: 22, backgroundColor: pressed ? '#4B4338' : '#5A5144' })}>
        <Feather name="arrow-left" size={22} color="#EBCF9B" />
      </Pressable>
    </View>
    <Card style={{ gap: 10, padding: 14, marginTop: 30 }}>
      <Text style={ui.heading}>모험가 프로필</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <View style={{ flex: 1 }}><Field label="닉네임" value={name} onChangeText={setName} maxLength={20} returnKeyType="done" onSubmitEditing={() => void save()} /></View>
        <Button title="저장" disabled={!name.trim() || name.trim() === state.profile?.name} busy={busy} onPress={() => void save()} />
      </View>
      <Text style={ui.muted}>모험 시작일 · {state.profile?.startedAt}</Text>
    </Card>
    <Card style={{ gap: 10, padding: 14 }}>
      <Text style={ui.heading}>만든 사람</Text>
      <Text style={ui.text}>친구가 매일의 계획과 실천을 기록하고, 작은 성장을 게임처럼 즐길 수 있도록 만들었어요.</Text>
      <View style={{ borderTopWidth: 1, borderTopColor: color.border, paddingTop: 10, gap: 3 }}>
        <Text style={{ color: color.gold, fontFamily: font.medium, fontSize: 14 }}>Dezeli</Text>
        <Text selectable style={ui.muted}>haterecursive@gmail.com</Text>
      </View>
    </Card>
    <Card style={{ gap: 10, padding: 14 }}>
      <Text style={ui.heading}>데이터 초기화</Text>
      <Button title="모든 기록 초기화" kind="danger" disabled={busy} onPress={confirmReset} />
    </Card>
  </Page>;
}
