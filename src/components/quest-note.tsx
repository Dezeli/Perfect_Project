import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type Quest, rewardXp, setQuestStatus } from '../core/domain';
import { useStore } from '../core/store';
import { Card, color, font, showError, ui } from './ui';

export function QuestNote({ quests, future }: { quests: Quest[]; future: boolean }) {
  const { mutate } = useStore();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(quest: Quest, status: 'completed' | 'failed') {
    if (busyId || future) return;
    setBusyId(quest.id);
    try { await mutate(state => setQuestStatus(state, quest.id, quest.status === status ? 'pending' : status)); }
    catch (error) { showError(error); }
    finally { setBusyId(null); }
  }

  return <Card style={{ paddingVertical: 3, paddingHorizontal: 12, gap: 0 }}>
    {Array.from({ length: 5 }, (_, index) => {
      const quest = quests[index];
      return <View key={quest?.id ?? `blank-${index}`} style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 7, borderBottomWidth: index === 4 ? 0 : 1, borderBottomColor: '#35432D80', paddingVertical: 5 }}>
        <Text style={{ width: 17, color: color.muted, fontFamily: font.pixel, fontSize: 12 }}>{index + 1}.</Text>
        {quest ? <>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text numberOfLines={1} style={{ color: quest.status === 'failed' ? color.muted : color.text, fontFamily: font.medium, fontSize: 14, lineHeight: 19, textDecorationLine: quest.status === 'completed' ? 'line-through' : 'none' }}>{quest.title}</Text>
            <Text style={[ui.muted, { fontSize: 11, lineHeight: 15 }]}><Text style={{ color: quest.kind === 'main' ? color.gold : color.green, fontFamily: font.pixel }}>{quest.kind === 'main' ? '메인' : '서브'}</Text> · +{quest.status === 'completed' ? rewardXp(quest) : quest.xp} XP</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${quest.title} ${quest.status === 'completed' ? '완료 취소' : '완료'}`} accessibilityState={{ selected: quest.status === 'completed', disabled: future || !!busyId }} disabled={future || !!busyId} onPress={() => void toggle(quest, 'completed')} style={({ pressed }) => ({ width: 34, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: quest.status === 'completed' ? '#2C4931' : pressed ? '#35432D' : '#263123', opacity: future ? 0.45 : 1 })}><Feather name="check" size={18} color={quest.status === 'completed' ? color.green : color.muted} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`${quest.title} ${quest.status === 'failed' ? '실패 취소' : '실패'}`} accessibilityState={{ selected: quest.status === 'failed', disabled: future || !!busyId }} disabled={future || !!busyId} onPress={() => void toggle(quest, 'failed')} style={({ pressed }) => ({ width: 34, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: quest.status === 'failed' ? '#49312D' : pressed ? '#35432D' : '#263123', opacity: future ? 0.45 : 1 })}><Feather name="x" size={18} color={quest.status === 'failed' ? color.red : color.muted} /></Pressable>
          </View>
        </> : <Text style={{ flex: 1, color: color.muted, fontFamily: font.body, fontSize: 14 }}>{index === 0 && !quests.length ? '퀘스트가 비어 있어요' : ''}</Text>}
      </View>;
    })}
  </Card>;
}
