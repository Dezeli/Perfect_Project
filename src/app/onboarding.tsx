import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import { useStore } from '../core/store';
import { dayKey } from '../core/domain';
import { Button, Card, Field, Page, Title, ui, showError } from '../components/ui';
import { Hero } from '../components/hero';
export default function Onboarding() {
  const { state, ready, mutate } = useStore();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  if (!ready) return <Redirect href="/" />;
  if (state.profile) return <Redirect href="/(tabs)" />;
  async function start() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try { await mutate(s => ({ ...s, profile: { name: name.trim(), startedAt: dayKey() } })); router.replace('/(tabs)'); }
    catch (err) { showError(err); } finally { setBusy(false); }
  }
  return <Page><Title eyebrow="" title={'완벽그자체\n프로젝트'} /><View style={{ alignItems: 'center', paddingVertical: 12 }}><Hero /></View><Card><Text style={ui.heading}>이름을 입력해줘</Text><Field label="이름 또는 닉네임" placeholder="이름" value={name} onChangeText={setName} maxLength={20} returnKeyType="done" onSubmitEditing={() => void start()} /><Button title="시작하기" disabled={!name.trim()} busy={busy} onPress={() => void start()} /></Card></Page>;
}
