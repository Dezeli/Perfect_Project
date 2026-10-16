import { Text, View } from 'react-native';
import { Dialog } from './dialog';
import { dayStats, displayDay, rewardXp } from '../core/domain';
import { useStore } from '../core/store';
import { ui } from './ui';

export function XpLog({ visible, date, onClose }: { visible: boolean; date: string; onClose: () => void }) {
  const { state } = useStore();
  const completed = state.quests.filter(q => q.date === date && q.status === 'completed');
  const daily = dayStats(state, date);
  const bonus = daily.xp - completed.reduce((sum, q) => sum + rewardXp(q), 0);
  return <Dialog visible={visible} title="오늘 XP" onClose={onClose}>
          <View style={ui.between}><Text style={ui.muted}>{date.slice(0, 4)}년 {displayDay(date)}</Text><Text style={[ui.heading, ui.gold]}>+{daily.xp} XP</Text></View>
          {completed.length === 0 && <Text style={[ui.muted, { paddingVertical: 20 }]}>오늘 획득한 XP가 없어.</Text>}
          {completed.map(quest => <View key={quest.id} style={[ui.card, { gap: 5 }]}>
            <View style={ui.between}><Text style={[ui.text, { flex: 1 }]}>{quest.title}</Text><Text style={ui.gold}>+{rewardXp(quest)} XP</Text></View>
            <Text style={ui.muted}>기본 {quest.xp} XP{rewardXp(quest) > quest.xp ? ` · 장비 +${rewardXp(quest) - quest.xp} XP` : ''}</Text>
          </View>)}
          {bonus > 0 && <View style={[ui.card, ui.between]}><Text style={[ui.text, { flex: 1 }]}>올클리어 보너스</Text><Text style={ui.gold}>+{bonus} XP</Text></View>}
  </Dialog>;
}
