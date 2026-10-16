import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { useStore } from '../core/store';
import { BackButton, Button, Card, Field, Page, Title, showError, ui } from '../components/ui';
export default function Settings() {
  const { state, mutate } = useStore();
  const [name, setName] = useState(state.profile?.name ?? '');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await mutate(s => ({ ...s, profile: s.profile ? { ...s.profile, name: name.trim() } : null }));
      Alert.alert('이름을 변경했어요', '홈 화면에도 새 이름이 표시돼요.');
    } catch (err) { showError(err); } finally { setBusy(false); }
  }
  return <Page><BackButton onPress={() => router.back()} /><Title eyebrow="" title="설정" /><Card><Text style={ui.heading}>모험가 프로필</Text><Field label="이름 또는 닉네임" value={name} onChangeText={setName} maxLength={20} /><Button title="이름 저장" disabled={!name.trim() || name.trim() === state.profile?.name} busy={busy} onPress={() => void save()} /><Text style={ui.muted}>모험 시작일 · {state.profile?.startedAt}</Text></Card><Card><Text style={ui.heading}>기록 저장</Text><Text style={ui.text}>이름과 퀘스트는 이 기기의 저장공간에 자동으로 저장돼요.</Text><Text style={ui.muted}>현재 {state.quests.length}개의 퀘스트 · 앱 삭제나 데이터 초기화 시 기록도 지워져요. 백업·복원은 후속 작업이에요.</Text></Card><Card><Text style={ui.heading}>성장 규칙</Text><Text style={ui.muted}>완료 퀘스트 XP로 성장해요. 100 XP마다 레벨업하고, 레벨마다 뽑기권을 받아요. 완료를 취소하거나 퀘스트를 삭제하면 XP를 회수해요.</Text></Card></Page>;
}
