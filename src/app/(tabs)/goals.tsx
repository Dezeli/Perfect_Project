import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useStore } from '../../core/store';
import { dayStats, displayShortDay, shiftDay } from '../../core/domain';
import { useToday } from '../../hooks/use-today';
import { QuestCard } from '../../components/quest-card';
import { QuestDatePicker } from '../../components/quest-date-picker';
import { SettingsButton } from '../../components/settings-button';
import { Button, Empty, Page, color, font, ui } from '../../components/ui';

export default function Goals() {
  const { resetDay } = useLocalSearchParams<{ resetDay?: string }>();
  return <GoalsContent key={resetDay ?? 'default'} />;
}

function GoalsContent() {
  const { state } = useStore();
  const today = useToday();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const date = selectedDate ?? today;
  const [calendarOpen, setCalendarOpen] = useState(false);
  const daily = dayStats(state, date);
  const quests = state.quests.filter(q => q.date === date);
  return <Page backgroundImage={require('../../../assets/backgrounds/adventure-home-calm.png')} backgroundOverlayColor="#10150FE0" contentStyle={{ gap: 14, paddingTop: 24 }}>
    <View style={ui.between}><Text accessibilityRole="header" style={ui.title}>일일 퀘스트</Text><SettingsButton /></View>
    <View style={[ui.row, { gap: 3, marginTop: 10 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="이전 날짜" onPress={() => setSelectedDate(shiftDay(date, -1))} style={({ pressed }) => ({ width: 34, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: pressed ? '#35432D' : '#263123' })}><Feather name="chevron-left" size={20} color={color.gold} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${displayShortDay(date)} 날짜 선택`} onPress={() => setCalendarOpen(true)} style={({ pressed }) => ({ flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, borderRadius: 5, backgroundColor: pressed ? '#35432D' : '#263123' })}>
          <Feather name="calendar" size={16} color={color.gold} />
          <Text numberOfLines={1} style={{ flex: 1, color: color.text, fontFamily: font.display, fontSize: 15 }}>{displayShortDay(date)}</Text>
        </Pressable>
        {date !== today && <Pressable accessibilityRole="button" accessibilityLabel="오늘로 되돌리기" onPress={() => setSelectedDate(null)} style={({ pressed }) => ({ width: 34, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: pressed ? '#35432D' : '#263123' })}><Feather name="rotate-ccw" size={17} color={color.gold} /></Pressable>}
        <Pressable accessibilityRole="button" accessibilityLabel="다음 날짜" onPress={() => setSelectedDate(shiftDay(date, 1))} style={({ pressed }) => ({ width: 34, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: pressed ? '#35432D' : '#263123' })}><Feather name="chevron-right" size={20} color={color.gold} /></Pressable>
    </View>
    <View style={[ui.between, { marginTop: 5, paddingHorizontal: 2 }]}><Text style={{ color: color.text, fontFamily: font.display, fontSize: 20 }}>퀘스트</Text><Text style={[ui.muted, { fontSize: 12 }]}>{daily.completed}/{daily.total} 달성 · <Text style={ui.gold}>+{daily.xp} XP</Text></Text></View>
    {quests.length ? quests.map(q => <QuestCard key={q.id} quest={q} />) : <Empty title="퀘스트가 비어 있어요" detail="오늘의 목표를 등록해봐요." />}
    <View style={ui.row}>
      <View style={ui.flex}><Button title={quests.length ? '퀘스트 수정' : '퀘스트 추가'} onPress={() => router.push({ pathname: '/quest', params: { date } })} /></View>
      <View style={ui.flex}><Button title="스토리 만들기" kind="secondary" onPress={() => router.push({ pathname: '/story', params: { date } })} /></View>
    </View>
    {calendarOpen && <QuestDatePicker date={date} today={today} quests={state.quests} onSelect={selected => { setSelectedDate(selected === today ? null : selected); setCalendarOpen(false); }} onClose={() => setCalendarOpen(false)} />}
  </Page>;
}
