import { Text, View } from 'react-native';
import { dayStats, displayDay, rewardXp, shiftDay, statusLabels, streak, totalXp, type AppState } from '../core/domain';
import { Dialog } from './dialog';
import { color, font, ui } from './ui';

export type GrowthStat = 'completed' | 'mainRate' | 'xp' | 'streak';

const titles: Record<GrowthStat, string> = {
  completed: '달성 기록',
  mainRate: '메인 달성률',
  xp: '누적 XP 기록',
  streak: '연속 달성 기록',
};

export function GrowthStatLog({ stat, state, today, onClose }: { stat: GrowthStat | null; state: AppState; today: string; onClose: () => void }) {
  const quests = state.quests.filter(quest => quest.date <= today);
  const completed = quests.filter(quest => quest.status === 'completed').sort((a, b) => b.date.localeCompare(a.date));
  const mainQuests = quests.filter(quest => quest.kind === 'main').sort((a, b) => b.date.localeCompare(a.date));
  const completedMain = mainQuests.filter(quest => quest.status === 'completed').length;
  const bonusEntries = [...new Set(completed.map(quest => quest.date))].map(date => {
    const questXp = completed.filter(quest => quest.date === date).reduce((sum, quest) => sum + rewardXp(quest), 0);
    return { date, bonus: dayStats(state, date).xp - questXp };
  }).filter(entry => entry.bonus > 0);
  const xpEntries = [
    ...completed.map(quest => ({ key: quest.id, date: quest.date, title: quest.title, xp: rewardXp(quest) })),
    ...bonusEntries.map(entry => ({ key: `bonus-${entry.date}`, date: entry.date, title: '하루 올클리어 보너스', xp: entry.bonus })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const currentStreak = streak(state, today);
  const streakDates: string[] = [];
  let cursor = dayStats(state, today).completed ? today : shiftDay(today, -1);
  for (let count = 0; count < currentStreak; count++) {
    streakDates.push(cursor);
    cursor = shiftDay(cursor, -1);
  }

  return <Dialog visible={stat !== null} title={stat ? titles[stat] : ''} onClose={onClose}>
    {stat === 'completed' && <>
      <Text style={[ui.heading, ui.gold]}>{completed.length}개 달성</Text>
      {completed.map(quest => <LogRow key={quest.id} date={quest.date} title={quest.title} value={quest.kind === 'main' ? '메인' : '서브'} />)}
      {!completed.length && <Text style={ui.muted}>아직 달성한 퀘스트가 없어요.</Text>}
    </>}
    {stat === 'mainRate' && <>
      <Text style={[ui.heading, ui.gold]}>{mainQuests.length ? Math.round(completedMain / mainQuests.length * 100) : 0}%</Text>
      <Text style={ui.muted}>완료한 메인 퀘스트 {completedMain}개 / 등록한 메인 퀘스트 {mainQuests.length}개</Text>
      {mainQuests.map(quest => <LogRow key={quest.id} date={quest.date} title={quest.title} value={statusLabels[quest.status]} valueColor={quest.status === 'completed' ? color.green : quest.status === 'failed' ? color.red : color.muted} />)}
      {!mainQuests.length && <Text style={ui.muted}>등록한 메인 퀘스트가 없어요.</Text>}
    </>}
    {stat === 'xp' && <>
      <Text style={[ui.heading, ui.gold]}>{totalXp(state, today)} XP</Text>
      {xpEntries.map(entry => <LogRow key={entry.key} date={entry.date} title={entry.title} value={`+${entry.xp} XP`} valueColor={color.gold} />)}
      {!xpEntries.length && <Text style={ui.muted}>아직 획득한 XP가 없어요.</Text>}
    </>}
    {stat === 'streak' && <>
      <Text style={[ui.heading, ui.gold]}>{currentStreak}일 연속 달성</Text>
      <Text style={ui.muted}>하루에 퀘스트를 하나 이상 완료한 날짜를 세어요.</Text>
      {streakDates.map(date => <LogRow key={date} date={date} title="퀘스트 달성" value={`${dayStats(state, date).completed}개`} valueColor={color.green} />)}
      {!streakDates.length && <Text style={ui.muted}>현재 이어지는 달성 기록이 없어요.</Text>}
    </>}
  </Dialog>;
}

function LogRow({ date, title, value, valueColor = color.text }: { date: string; title: string; value: string; valueColor?: string }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: color.border, paddingTop: 10 }}>
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[ui.muted, { fontSize: 11 }]}>{date.slice(0, 4)}년 {displayDay(date)}</Text>
      <Text style={ui.text}>{title}</Text>
    </View>
    <Text style={{ color: valueColor, fontFamily: font.medium, fontSize: 12 }}>{value}</Text>
  </View>;
}
