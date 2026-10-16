import { Text, View } from 'react-native';
import { Quest, rewardXp, setQuestStatus, statusLabels } from '../core/domain';
import { useStore } from '../core/store';
import { Card, Chip, color, font, showError, ui } from './ui';
export function QuestCard({ quest, readonly = false }: { quest: Quest; readonly?: boolean }) {
  const { mutate } = useStore();
  const statusColor = quest.status === 'completed' ? color.green : quest.status === 'failed' ? color.red : color.gold;
  const main = quest.kind === 'main';
  async function update(status: Quest['status']) { try { await mutate(s => setQuestStatus(s, quest.id, status)); } catch (err) { showError(err); } }
  return <Card style={{ borderLeftWidth: 3, borderLeftColor: statusColor }}><View style={ui.between}><Text style={{ color: main ? color.gold : color.green, backgroundColor: main ? '#3A321F' : '#25372B', borderWidth: 1, borderColor: main ? '#66502B' : '#3A5A42', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3, fontFamily: font.pixel, fontSize: 11 }}>{main ? '메인' : '서브'}</Text><Text style={{ color: statusColor, fontFamily: font.medium, fontSize: 13 }}>{statusLabels[quest.status]} · {quest.status === 'completed' ? rewardXp(quest) : quest.xp} XP</Text></View><Text style={[ui.heading, { fontSize: 18 }]}>{quest.title}</Text>{!!quest.detail && <Text style={ui.muted}>{quest.detail}</Text>}
    {!readonly && <View style={ui.wrap}><Chip title="✓ 완료" selected={quest.status === 'completed'} onPress={() => void update(quest.status === 'completed' ? 'pending' : 'completed')} /><Chip title="실패" selected={quest.status === 'failed'} onPress={() => void update(quest.status === 'failed' ? 'pending' : 'failed')} /></View>}
  </Card>;
}
