import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useStore } from '../../core/store';
import { dayStats, displayDay, rewardXp, shiftDay, statusLabels, streak, totalXp } from '../../core/domain';
import { useToday } from '../../hooks/use-today';
import { SettingsButton } from '../../components/settings-button';
import { Card, Page, Stat, color, font, ui } from '../../components/ui';

const grassColors = ['#263125', '#3B5036', '#526D45', '#739457', '#A7C981'];
const weekCount = 52;
const cellSize = 14;

export default function Stats() {
  const { state } = useStore();
  const today = useToday();
  const [page, setPage] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const grassScroll = useRef<ScrollView>(null);
  const quests = state.quests.filter(q => q.date <= today);
  const done = quests.filter(q => q.status === 'completed');
  const completedByDate = new Map<string, number>();
  for (const quest of done) completedByDate.set(quest.date, (completedByDate.get(quest.date) ?? 0) + 1);

  const pageEnd = shiftDay(today, -page * weekCount * 7);
  const weekday = (new Date(`${pageEnd}T12:00:00`).getDay() + 6) % 7;
  const firstDay = shiftDay(pageEnd, -weekday - (weekCount - 1) * 7);
  const weeks = Array.from({ length: weekCount }, (_, index) => {
    const monday = shiftDay(firstDay, index * 7);
    return { monday, days: Array.from({ length: 7 }, (_, day) => shiftDay(monday, day)) };
  });
  const earliestDate = [state.profile?.startedAt, ...state.quests.map(q => q.date), ...Object.keys(state.journals)].filter((date): date is string => !!date).sort()[0] ?? today;
  const canGoOlder = firstDay > earliestDate;
  const selected = selectedDate ? dayStats(state, selectedDate) : null;
  const selectedQuests = selectedDate ? state.quests.filter(q => q.date === selectedDate) : [];
  const noteCount = selectedDate ? state.journals[selectedDate]?.notes?.length ?? 0 : 0;

  return <Page backgroundImage={require('../../../assets/backgrounds/adventure-home-calm.png')} backgroundOverlayColor="#10150FE0" contentStyle={{ gap: 14, paddingTop: 24 }}>
    <View style={ui.between}><Text accessibilityRole="header" style={ui.title}>성장 기록</Text><SettingsButton /></View>
    <Card style={{ backgroundColor: '#1B2319ED', paddingHorizontal: 8, paddingVertical: 12 }}>
      <View style={[ui.row, { gap: 0 }]}>
        <Stat compact value={done.length} label="달성" />
        <View style={{ width: 1, height: 30, backgroundColor: color.border }} />
        <Stat compact value={quests.length ? `${Math.round(done.length / quests.length * 100)}%` : '0%'} label="달성률" />
        <View style={{ width: 1, height: 30, backgroundColor: color.border }} />
        <Stat compact value={totalXp(state, today)} label="누적 XP" />
        <View style={{ width: 1, height: 30, backgroundColor: color.border }} />
        <Stat compact value={`${streak(state, today)}일`} label="연속 달성" />
      </View>
    </Card>

    <View style={[ui.between, { marginTop: 8 }]}>
      <Text style={ui.heading}>날짜별 기록</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="이전 1년" accessibilityState={{ disabled: !canGoOlder }} disabled={!canGoOlder} onPress={() => { setPage(value => value + 1); setSelectedDate(null); }} style={({ pressed }) => ({ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', opacity: !canGoOlder ? 0.3 : pressed ? 0.6 : 1 })}><Feather name="chevron-left" size={20} color={color.gold} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="다음 1년" accessibilityState={{ disabled: page === 0 }} disabled={page === 0} onPress={() => { setPage(value => value - 1); setSelectedDate(null); }} style={({ pressed }) => ({ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', opacity: page === 0 ? 0.3 : pressed ? 0.6 : 1 })}><Feather name="chevron-right" size={20} color={color.gold} /></Pressable>
      </View>
    </View>
    <Card style={{ backgroundColor: '#1B2319ED', gap: 12, paddingHorizontal: 14 }}>
      <Text style={ui.muted}>{firstDay.slice(0, 4)}년 {displayDay(firstDay)} - {page === 0 ? displayDay(today) : displayDay(weeks[weekCount - 1].days[6])}</Text>
      <View style={{ flexDirection: 'row', gap: 7 }}>
        <View style={{ width: 16, paddingTop: 19, gap: 3 }}>
          {['월', '', '수', '', '금', '', '일'].map((day, index) => <Text key={index} style={{ height: cellSize, color: color.muted, fontFamily: font.body, fontSize: 9, lineHeight: cellSize }}>{day}</Text>)}
        </View>
        <ScrollView key={page} ref={grassScroll} horizontal showsHorizontalScrollIndicator={false} onContentSizeChange={() => grassScroll.current?.scrollToEnd({ animated: false })}>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {weeks.map((week, index) => <View key={week.monday} style={{ width: cellSize, gap: 3 }}>
              <Text numberOfLines={1} style={{ height: 16, width: 30, color: color.muted, fontFamily: font.body, fontSize: 9 }}>{index === 0 || week.monday.slice(0, 7) !== weeks[index - 1].monday.slice(0, 7) ? `${Number(week.monday.slice(5, 7))}월` : ''}</Text>
              {week.days.map(date => date > today ? <View key={date} style={{ width: cellSize, height: cellSize }} /> : <Pressable key={date} accessibilityRole="button" accessibilityLabel={`${date.slice(0, 4)}년 ${displayDay(date)}, 완료 ${completedByDate.get(date) ?? 0}개`} accessibilityState={{ selected: selectedDate === date }} onPress={() => setSelectedDate(date)} hitSlop={2} style={({ pressed }) => ({ width: cellSize, height: cellSize, borderRadius: 2, borderWidth: selectedDate === date ? 2 : 0, borderColor: color.gold, backgroundColor: grassColors[Math.min(4, completedByDate.get(date) ?? 0)], opacity: pressed ? 0.6 : 1 })} />)}
            </View>)}
          </View>
        </ScrollView>
      </View>
      <View style={[ui.between, { alignSelf: 'flex-end', gap: 5 }]}><Text style={[ui.muted, { fontSize: 10 }]}>완료 적음</Text>{grassColors.map(shade => <View key={shade} style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: shade }} />)}<Text style={[ui.muted, { fontSize: 10 }]}>많음</Text></View>
    </Card>

    {selectedDate && selected && <Card style={{ backgroundColor: '#1B2319F2', gap: 10, borderLeftWidth: 2, borderLeftColor: color.gold }}>
      <View style={ui.between}><Text style={[ui.text, { fontFamily: font.medium }]}>{selectedDate.slice(0, 4)}년 {displayDay(selectedDate)}</Text><Text style={{ color: color.gold, fontFamily: font.display, fontSize: 17 }}>+{selected.xp} XP</Text></View>
      <Text style={ui.muted}>{selected.completed}/{selected.total} 달성 · 실패 {selected.failed}{noteCount ? ` · 노트 ${noteCount}장` : ''}</Text>
      {selectedQuests.map(quest => <View key={quest.id} style={[ui.between, { borderTopWidth: 1, borderTopColor: color.border, paddingTop: 9 }]}><Text style={[ui.text, { flex: 1 }]}>{quest.title}</Text><Text style={{ color: quest.status === 'completed' ? color.green : quest.status === 'failed' ? color.red : color.muted, fontFamily: font.medium, fontSize: 12 }}>{quest.status === 'completed' ? `+${rewardXp(quest)} XP` : statusLabels[quest.status]}</Text></View>)}
      {!selectedQuests.length && !noteCount && <Text style={ui.muted}>이 날짜에는 기록이 없어요.</Text>}
      {noteCount > 0 && <Pressable accessibilityRole="button" accessibilityLabel={`${displayDay(selectedDate)} 노트 보기`} onPress={() => router.push({ pathname: '/notes', params: { date: selectedDate } })} style={({ pressed }) => ({ alignSelf: 'flex-start', minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, opacity: pressed ? 0.6 : 1 })}><Feather name="image" size={15} color={color.gold} /><Text style={[ui.muted, ui.gold]}>노트 보기</Text></Pressable>}
    </Card>}
  </Page>;
}
