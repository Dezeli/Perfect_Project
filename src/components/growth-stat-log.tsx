import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { dayStats, displayDay, rewardXp, shiftDay, statusLabels, streak, totalXp, type AppState } from '../core/domain';
import { Dialog } from './dialog';
import { color, font, ui } from './ui';

export type GrowthStat = 'completed' | 'mainRate' | 'xp' | 'streak';
type LogEntry = { key: string; date: string; title: string; value: string; tint: string };

const titles: Record<GrowthStat, string> = {
  completed: '달성 기록',
  mainRate: '메인 달성률',
  xp: '누적 XP 기록',
  streak: '연속 달성 기록',
};

export function GrowthStatLog({ stat, state, today, onClose }: { stat: GrowthStat; state: AppState; today: string; onClose: () => void }) {
  const [visibleCount, setVisibleCount] = useState(10);
  const quests = state.quests.filter(quest => quest.date <= today);
  const completed = quests.filter(quest => quest.status === 'completed').sort((a, b) => b.date.localeCompare(a.date));
  const mainQuests = quests.filter(quest => quest.kind === 'main').sort((a, b) => b.date.localeCompare(a.date));
  const completedMain = mainQuests.filter(quest => quest.status === 'completed').length;
  let summary = '';
  let description = '';
  let emptyMessage = '';
  let entries: LogEntry[] = [];

  if (stat === 'completed') {
    summary = `${completed.length}개 달성`;
    description = '완료한 메인·서브 퀘스트';
    emptyMessage = '아직 달성한 퀘스트가 없어요.';
    entries = completed.map(quest => ({ key: quest.id, date: quest.date, title: quest.title, value: quest.kind === 'main' ? '메인' : '서브', tint: quest.kind === 'main' ? color.gold : color.green }));
  } else if (stat === 'mainRate') {
    summary = `${mainQuests.length ? Math.round(completedMain / mainQuests.length * 100) : 0}%`;
    description = `완료 ${completedMain} / 등록 ${mainQuests.length}`;
    emptyMessage = '등록한 메인 퀘스트가 없어요.';
    entries = mainQuests.map(quest => ({ key: quest.id, date: quest.date, title: quest.title, value: statusLabels[quest.status], tint: quest.status === 'completed' ? color.green : quest.status === 'failed' ? color.red : color.muted }));
  } else if (stat === 'xp') {
    summary = `${totalXp(state, today)} XP`;
    description = '퀘스트 보상과 하루 올클리어 보너스';
    emptyMessage = '아직 획득한 XP가 없어요.';
    const questXpByDate = new Map<string, number>();
    for (const quest of completed) questXpByDate.set(quest.date, (questXpByDate.get(quest.date) ?? 0) + rewardXp(quest));
    const bonusEntries = [...questXpByDate].map(([date, questXp]) => ({ date, bonus: dayStats(state, date).xp - questXp })).filter(entry => entry.bonus > 0);
    entries = [
      ...completed.map(quest => ({ key: quest.id, date: quest.date, title: quest.title, value: `+${rewardXp(quest)} XP`, tint: color.gold })),
      ...bonusEntries.map(entry => ({ key: `bonus-${entry.date}`, date: entry.date, title: '하루 올클리어 보너스', value: `+${entry.bonus} XP`, tint: color.gold })),
    ].sort((a, b) => b.date.localeCompare(a.date));
  } else {
    const currentStreak = streak(state, today);
    summary = `${currentStreak}일 연속 달성`;
    description = '하루에 하나 이상 완료한 날짜';
    emptyMessage = '현재 이어지는 달성 기록이 없어요.';
    let cursor = dayStats(state, today).completed ? today : shiftDay(today, -1);
    for (let count = 0; count < currentStreak; count++) {
      entries.push({ key: cursor, date: cursor, title: '퀘스트 달성', value: `${dayStats(state, cursor).completed}개`, tint: color.green });
      cursor = shiftDay(cursor, -1);
    }
  }

  const visible = entries.slice(0, visibleCount);
  const groups: { date: string; items: LogEntry[] }[] = [];
  for (const entry of visible) {
    const last = groups[groups.length - 1];
    if (last?.date === entry.date) last.items.push(entry);
    else groups.push({ date: entry.date, items: [entry] });
  }

  return <Dialog visible title={titles[stat]} onClose={onClose}>
    <View style={{ backgroundColor: '#263123', borderWidth: 1, borderColor: color.border, borderRadius: 7, padding: 14, gap: 3 }}>
      <Text style={{ color: color.gold, fontFamily: font.display, fontSize: 23, lineHeight: 32 }}>{summary}</Text>
      <Text style={ui.muted}>{description}</Text>
    </View>
    {entries.length ? <>
      <View style={ui.between}><Text style={[ui.text, { fontFamily: font.medium }]}>기록 내역</Text><Text style={ui.muted}>{visible.length} / {entries.length}</Text></View>
      {groups.map(group => <View key={group.date} style={{ backgroundColor: color.panel, borderWidth: 1, borderColor: color.border, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, gap: 7 }}>
        <Text style={{ color: color.gold, fontFamily: font.medium, fontSize: 12 }}>{group.date.slice(0, 4)}년 {displayDay(group.date)}</Text>
        {group.items.map((entry, index) => <View key={entry.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: index ? 1 : 0, borderTopColor: color.border, paddingTop: index ? 7 : 0 }}>
          <Text numberOfLines={2} style={[ui.text, { flex: 1, fontSize: 13, lineHeight: 19 }]}>{entry.title}</Text>
          <Text style={{ color: entry.tint, fontFamily: font.medium, fontSize: 12 }}>{entry.value}</Text>
        </View>)}
      </View>)}
      {visibleCount < entries.length && <Pressable accessibilityRole="button" accessibilityLabel="기록 10개 더 보기" onPress={() => setVisibleCount(count => count + 10)} style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: color.border, borderRadius: 6, backgroundColor: color.panel, opacity: pressed ? 0.6 : 1 })}>
        <Text style={{ color: color.gold, fontFamily: font.medium, fontSize: 13 }}>10개 더 보기</Text><Feather name="chevron-down" size={16} color={color.gold} />
      </Pressable>}
    </> : <Text style={[ui.muted, { textAlign: 'center', paddingVertical: 12 }]}>{emptyMessage}</Text>}
  </Dialog>;
}
