import { Text, View } from 'react-native';
import { Dialog } from './dialog';
import { dayStats, displayDay, rewardXp } from '../core/domain';
import { useStore } from '../core/store';
import { color, font, ui } from './ui';

export function XpLog({ visible, date, onClose }: { visible: boolean; date: string; onClose: () => void }) {
  const { state } = useStore();
  const completed = state.quests.filter(q => q.date === date && q.status === 'completed');
  const daily = dayStats(state, date);
  const bonus = daily.xp - completed.reduce((sum, q) => sum + rewardXp(q), 0);
  return <Dialog visible={visible} title="오늘 XP" onClose={onClose}>
    <View style={ui.between}><Text style={ui.muted}>{date.slice(0, 4)}년 {displayDay(date)}</Text><Text style={[ui.heading, ui.gold]}>+{daily.xp} XP</Text></View>
    {completed.length > 0 || bonus > 0 ? <View style={{ backgroundColor: color.panel, borderWidth: 1, borderColor: color.border, borderRadius: 6, paddingHorizontal: 12 }}>
      {completed.map((quest, index) => {
        const equipmentBonus = rewardXp(quest) - quest.xp;
        return <View key={quest.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: index === completed.length - 1 && !bonus ? 0 : 1, borderBottomColor: color.border }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text numberOfLines={2} style={[ui.text, { fontSize: 13, lineHeight: 18 }]}>{quest.title}</Text>
            <Text style={[ui.muted, { fontSize: 11, lineHeight: 15 }]}>기본 {quest.xp} XP{equipmentBonus > 0 ? ` · 장비 +${equipmentBonus} XP` : ''}</Text>
          </View>
          <Text style={{ color: color.gold, fontFamily: font.medium, fontSize: 14 }}>+{rewardXp(quest)} XP</Text>
        </View>;
      })}
      {bonus > 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
        <View style={{ flex: 1, gap: 2 }}><Text style={[ui.text, { fontSize: 13 }]}>하루 올클리어</Text><Text style={[ui.muted, { fontSize: 11, lineHeight: 15 }]}>장비 보너스</Text></View>
        <Text style={{ color: color.gold, fontFamily: font.medium, fontSize: 14 }}>+{bonus} XP</Text>
      </View>}
    </View> : <Text style={[ui.muted, { textAlign: 'center', paddingVertical: 12 }]}>오늘 획득한 XP가 없어요.</Text>}
  </Dialog>;
}
