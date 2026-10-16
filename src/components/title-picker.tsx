import { Pressable, Text, View } from 'react-native';
import { Dialog } from './dialog';
import { achievements, selectTitle } from '../core/domain';
import { useStore } from '../core/store';
import { color, font, showError, ui } from './ui';

export function TitlePicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, mutate } = useStore();
  const records = achievements(state);
  async function choose(id: string | null) {
    try { await mutate(s => selectTitle(s, id)); onClose(); }
    catch (err) { showError(err); }
  }
  return <Dialog visible={visible} title="도전과제" onClose={onClose}>
          {records.map(record => {
            const unlocked = record.unlocked;
            const selected = state.selectedTitle === record.id;
            return <Pressable key={record.id} accessibilityRole="button" accessibilityState={{ disabled: !unlocked, selected }} disabled={!unlocked} onPress={() => void choose(record.id)} style={{ borderWidth: 1, borderColor: selected ? color.gold : color.border, borderRadius: 5, padding: 13, backgroundColor: color.panel, gap: 7, opacity: unlocked ? 1 : 0.68 }}>
              <View style={ui.between}><Text style={[ui.text, { fontFamily: font.medium, color: unlocked ? color.gold : color.text }]}>{unlocked ? '✦ ' : '◇ '}{record.title}</Text><Text style={ui.muted}>{record.progressText}</Text></View>
              <Text style={ui.muted}>{record.description}{selected ? ' · 장착 중' : ''}</Text>
              <View style={{ height: 4, backgroundColor: color.bg, borderRadius: 2, overflow: 'hidden' }}><View style={{ width: `${Math.min(record.progress / record.goal, 1) * 100}%`, height: '100%', backgroundColor: unlocked ? color.gold : color.green }} /></View>
            </Pressable>;
          })}
  </Dialog>;
}
