import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { type Quest, setQuestStatus } from '../core/domain';
import { useStore } from '../core/store';
import { Card, color, font, showError, ui } from './ui';

function ResultButton({ quest, status, disabled, onPress }: { quest: Quest; status: 'completed' | 'failed'; disabled: boolean; onPress: () => void }) {
  const [scale] = useState(() => new Animated.Value(1));
  const selected = quest.status === status;
  const success = status === 'completed';
  return <Animated.View style={{ transform: [{ scale }] }}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${quest.title} ${selected ? (success ? '완료 취소' : '실패 취소') : (success ? '완료' : '실패')}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        scale.setValue(1);
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.16, duration: 100, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]).start();
        onPress();
      }}
      style={({ pressed }) => ({ width: 35, height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 5, borderWidth: selected ? 2 : 1, borderColor: success ? (selected ? '#C9F5B5' : '#557B58') : (selected ? '#FFD0C6' : '#855750'), backgroundColor: success ? (selected ? '#4C9655' : pressed ? '#35513A' : '#253E2B') : (selected ? '#B75E56' : pressed ? '#573A35' : '#3E2927') })}
    ><Feather name={success ? 'check' : 'x'} size={selected ? 23 : 20} color={selected ? '#FFFFFF' : success ? color.green : color.red} /></Pressable>
  </Animated.View>;
}

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

  if (!quests.length) return <Card style={{ height: 298, alignItems: 'center', justifyContent: 'center', gap: 9 }}>
    <Text style={{ color: color.gold, fontSize: 28 }}>◇</Text>
    <Text style={ui.heading}>퀘스트가 비어 있어요</Text>
    <Text style={ui.muted}>{future ? '미리 목표를 등록해봐요.' : '오늘의 목표를 등록해봐요.'}</Text>
  </Card>;

  return <Card style={{ paddingVertical: 3, paddingHorizontal: 12, gap: 0 }}>
    {Array.from({ length: 5 }, (_, index) => {
      const quest = quests[index];
      return <View key={quest?.id ?? `blank-${index}`} style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 7, borderBottomWidth: index === 4 ? 0 : 1, borderBottomColor: '#35432D80', paddingVertical: 5 }}>
        {quest ? <>
          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: quest.kind === 'main' ? color.gold : color.green, backgroundColor: quest.kind === 'main' ? '#3A321F' : '#25372B', borderRadius: 3, overflow: 'hidden', paddingHorizontal: 4, paddingVertical: 3, fontFamily: font.pixel, fontSize: 10 }}>{quest.kind === 'main' ? '메인' : '서브'}</Text>
            <View style={{ flex: 1, height: 38, justifyContent: 'center' }}><Text numberOfLines={2} style={{ color: quest.status === 'completed' ? '#C9E9BA' : quest.status === 'failed' ? color.muted : color.text, fontFamily: font.medium, fontSize: 14, lineHeight: 19, ...(quest.status === 'completed' ? { textShadowColor: '#70B477', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 2 } : {}) }}>{quest.title}</Text></View>
          </View>
          {!future && <View style={{ flexDirection: 'row', gap: 3 }}>
            <ResultButton quest={quest} status="completed" disabled={!!busyId} onPress={() => void toggle(quest, 'completed')} />
            <ResultButton quest={quest} status="failed" disabled={!!busyId} onPress={() => void toggle(quest, 'failed')} />
          </View>}
        </> : <View style={{ flex: 1 }} />}
      </View>;
    })}
  </Card>;
}
