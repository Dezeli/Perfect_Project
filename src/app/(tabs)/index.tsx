import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useStore } from '../../core/store';
import { activeEquipment, achievements, dayStats, displayDay, growth, streak, totalXp, type Slot } from '../../core/domain';
import { useToday } from '../../hooks/use-today';
import { Hero } from '../../components/hero';
import { EquipmentSlot } from '../../components/equipment-slot';
import { EquipmentPicker } from '../../components/equipment-picker';
import { TitlePicker } from '../../components/title-picker';
import { XpLog } from '../../components/xp-log';
import { Button, Card, Field, Page, Stat, color, font, showError, ui } from '../../components/ui';
import { Dialog } from '../../components/dialog';
import { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';

export default function Home() {
  const { state, mutate } = useStore();
  const today = useToday();
  const daily = dayStats(state, today);
  const g = growth(totalXp(state, today));
  const weapon = activeEquipment(state, 'weapon');
  const armor = activeEquipment(state, 'armor');
  const [openSlot, setOpenSlot] = useState<Slot | null>(null);
  const [titlesOpen, setTitlesOpen] = useState(false);
  const [xpOpen, setXpOpen] = useState(false);
  const [mottoOpen, setMottoOpen] = useState(false);
  const [mottoDraft, setMottoDraft] = useState('');
  const [savingMotto, setSavingMotto] = useState(false);
  const motto = state.profile?.motto ?? '완벽하려고 애쓰지 말고, 내 하루를 내가 통제하는 힘을 길러보자.';
  async function saveMotto() {
    if (savingMotto || !mottoDraft.trim()) return;
    setSavingMotto(true);
    try {
      await mutate(s => ({ ...s, profile: s.profile ? { ...s.profile, motto: mottoDraft.trim() } : null }));
      setMottoOpen(false);
    } catch (err) { showError(err); }
    finally { setSavingMotto(false); }
  }
  const currentTitle = achievements(state).find(item => item.id === state.selectedTitle)?.title;
  return <Page backgroundImage={require('../../../assets/backgrounds/adventure-home-calm.png')} backgroundOverlayColor="#10150F9C" scrollEnabled={false} contentStyle={{ flexGrow: 1, justifyContent: 'flex-start', gap: 0, paddingTop: 16, paddingBottom: 36 }}>
    <View style={{ flex: 1 }} />
    <View style={{ gap: 10, paddingTop: 14, paddingBottom: 2, paddingLeft: 10 }}>
      <Text style={ui.muted}>{today.slice(0, 4)}년 {displayDay(today)}</Text>
      <Text accessibilityRole="header" style={ui.title}>완벽그자체{'\n'}<Text style={{ color: color.gold, textShadowColor: '#E7BF6A66', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 }}><Text style={{ fontSize: 14 }}>✦ </Text>{state.profile?.name}<Text style={{ fontSize: 14 }}> ✦</Text></Text> 프로젝트</Text>
    </View>
    <Card style={{ height: 270, paddingTop: 12, paddingBottom: 0, paddingHorizontal: 14, gap: 12, marginTop: 4, transform: [{ translateY: 11 }], backgroundColor: '#1B2319F2', borderColor: color.border }}>
      <Text style={[ui.eyebrow, { position: 'absolute', top: 5, right: 7, color: color.muted, fontSize: 14, lineHeight: 20 }]}>내 캐릭터</Text>
      <View style={[ui.row, { gap: 24 }]}>
        <View style={{ paddingHorizontal: 5, paddingVertical: 4, backgroundColor: '#202B1C', borderWidth: 1, borderColor: color.border, borderRadius: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ gap: 8 }}>
            <EquipmentSlot slot="weapon" size={48} item={weapon} onPress={() => setOpenSlot('weapon')} />
            <EquipmentSlot slot="armor" size={48} item={armor} onPress={() => setOpenSlot('armor')} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`${currentTitle ?? '모험가'}, 도전과제와 호칭 선택`} onPress={() => setTitlesOpen(true)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"><Hero framed={false} shadow={false} upgraded={armor.id !== 'traveler-coat'} title="" /></View>
          </Pressable>
          </View>
          <View accessible={false} style={{ alignItems: 'center', marginTop: 6, marginBottom: 0 }}>
            <View style={{ width: 104, height: 3, backgroundColor: '#172013' }} />
            <View style={{ width: 124, height: 4, backgroundColor: '#121C12' }} />
            <View style={{ width: 104, height: 3, backgroundColor: '#172013' }} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="칭호 선택" hitSlop={8} onPress={() => setTitlesOpen(true)} style={({ pressed }) => ({ width: '100%', maxWidth: 136, height: 28, paddingTop: 3, alignItems: 'center', justifyContent: 'flex-start', opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ color: color.gold, fontFamily: font.pixel, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>{currentTitle ?? '모험가'}</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 7, paddingTop: 22 }}>
      <Text style={{ color: color.gold, fontFamily: font.display, fontSize: 25 }}>Lv. {g.level}</Text>
      <Text style={[ui.muted, ui.gold]}>{totalXp(state, today)} XP</Text>
      <View style={{ height: 8, backgroundColor: color.bg, borderRadius: 2, overflow: 'hidden', borderWidth: 1, borderColor: color.border }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: g.progress }}>
        <View style={{ width: `${g.progress}%`, height: '100%', backgroundColor: color.gold }} />
      </View>
      <Text style={[ui.muted, { fontSize: 11 }]}>다음 레벨까지 {g.remaining} XP</Text>
        </View>
      </View>
      <View style={[ui.row, { borderTopWidth: 1, borderColor: color.border, paddingTop: 8, gap: 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`오늘 달성 ${daily.completed}/${daily.total}, 퀘스트 보기`} onPress={() => router.navigate({ pathname: '/(tabs)/goals', params: { resetDay: String(Date.now()) } })} style={({ pressed }) => ({ flex: 1, minHeight: 72, opacity: pressed ? 0.6 : 1 })}><Stat compact value={`${daily.completed}/${daily.total}`} label="오늘 달성" /></Pressable>
        <View accessible={false} style={{ width: 1, height: 24, backgroundColor: color.border, opacity: 0.65 }} />
        <Pressable accessibilityRole="button" accessibilityLabel={`오늘 XP ${daily.xp}, 획득 내역 보기`} onPress={() => setXpOpen(true)} style={({ pressed }) => ({ flex: 1, minHeight: 72, opacity: pressed ? 0.6 : 1 })}><Stat compact value={`+${daily.xp}`} label="오늘 XP" /></Pressable>
        <View accessible={false} style={{ width: 1, height: 24, backgroundColor: color.border, opacity: 0.65 }} />
        <Pressable accessibilityRole="button" accessibilityLabel={`퀘스트 연속 달성 ${streak(state, today)}일, 기록 보기`} onPress={() => router.navigate('/(tabs)/stats')} style={({ pressed }) => ({ flex: 1, minHeight: 72, opacity: pressed ? 0.6 : 1 })}><Stat compact value={`${streak(state, today)}일`} label="연속 달성" /></Pressable>
      </View>
    </Card>
    <Pressable accessibilityRole="button" accessibilityLabel={`다짐 수정: ${motto}`} onPress={() => { setMottoDraft(motto); setMottoOpen(true); }} style={({ pressed }) => ({ alignItems: 'stretch', gap: 2, paddingHorizontal: 18, paddingVertical: 14, marginTop: 28, backgroundColor: '#10150FC2', opacity: pressed ? 0.6 : 1 })}>
      <View pointerEvents="none" accessible={false} style={{ position: 'absolute', top: 0, left: 0, width: 22, height: 22, borderTopWidth: 1, borderLeftWidth: 1, borderColor: color.gold }} />
      <View pointerEvents="none" accessible={false} style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderBottomWidth: 1, borderRightWidth: 1, borderColor: color.gold }} />
      <Text style={{ color: '#C3C3A8', fontFamily: font.display, fontSize: 18, lineHeight: 29, textAlign: 'left' }}>{motto}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 7 }}>
        <Text style={{ color: color.muted, fontFamily: font.body, fontSize: 11 }}>- {state.profile?.name}</Text>
        <Feather name="edit-2" size={11} color={color.muted} />
      </View>
    </Pressable>
    <EquipmentPicker slot={openSlot} onClose={() => setOpenSlot(null)} />
    <TitlePicker visible={titlesOpen} onClose={() => setTitlesOpen(false)} />
    <XpLog visible={xpOpen} date={today} onClose={() => setXpOpen(false)} />
    <Dialog visible={mottoOpen} title="다짐의 한마디" onClose={() => { if (!savingMotto) setMottoOpen(false); }}>
      <Field label="나에게 해주고 싶은 말" value={mottoDraft} onChangeText={setMottoDraft} multiline maxLength={160} editable={!savingMotto} />
      <Text style={[ui.muted, { textAlign: 'right' }]}>{mottoDraft.length} / 160</Text>
      <Button title="저장" busy={savingMotto} disabled={!mottoDraft.trim()} onPress={() => void saveMotto()} />
    </Dialog>
  </Page>;
}
