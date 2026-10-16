import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type Quest, setQuestStatus } from '../core/domain';
import { useStore } from '../core/store';
import { Card, color, font, showError } from './ui';

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
        {quest ? <>
          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: quest.kind === 'main' ? color.gold : color.green, backgroundColor: quest.kind === 'main' ? '#3A321F' : '#25372B', borderRadius: 3, overflow: 'hidden', paddingHorizontal: 4, paddingVertical: 3, fontFamily: font.pixel, fontSize: 10 }}>{quest.kind === 'main' ? '메인' : '서브'}</Text>
            <View style={{ flex: 1, height: 38, justifyContent: 'center' }}><Text numberOfLines={2} style={{ color: quest.status === 'failed' ? color.muted : color.text, fontFamily: font.medium, fontSize: 14, lineHeight: 19, textDecorationLine: quest.status === 'completed' ? 'line-through' : 'none' }}>{quest.title}</Text></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${quest.title} ${quest.status === 'completed' ? '완료 취소' : '완료'}`} accessibilityState={{ selected: quest.status === 'completed', disabled: future || !!busyId }} disabled={future || !!busyId} onPress={() => void toggle(quest, 'completed')} style={({ pressed }) => ({ width: 35, height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 5, borderWidth: 1, borderColor: quest.status === 'completed' ? '#8FC779' : '#557B58', backgroundColor: quest.status === 'completed' ? '#345A39' : pressed ? '#35513A' : '#253E2B', opacity: future ? 0.45 : 1 })}><Feather name="check" size={20} color={quest.status === 'completed' ? '#D4F2B5' : color.green} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`${quest.title} ${quest.status === 'failed' ? '실패 취소' : '실패'}`} accessibilityState={{ selected: quest.status === 'failed', disabled: future || !!busyId }} disabled={future || !!busyId} onPress={() => void toggle(quest, 'failed')} style={({ pressed }) => ({ width: 35, height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 5, borderWidth: 1, borderColor: quest.status === 'failed' ? '#D88C80' : '#855750', backgroundColor: quest.status === 'failed' ? '#684038' : pressed ? '#573A35' : '#3E2927', opacity: future ? 0.45 : 1 })}><Feather name="x" size={20} color={quest.status === 'failed' ? '#FFD0C6' : color.red} /></Pressable>
          </View>
        </> : <Text style={{ flex: 1, color: color.muted, fontFamily: font.body, fontSize: 14 }}>{index === 0 && !quests.length ? '퀘스트가 비어 있어요' : ''}</Text>}
      </View>;
    })}
  </Card>;
}
