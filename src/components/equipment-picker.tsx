import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { drawEquipment, equip, equipment, type Slot } from '../core/domain';
import { useStore } from '../core/store';
import { Button, color, font, showError, ui } from './ui';
import { Dialog } from './dialog';
import { EquipmentGlyph, rarityBackgrounds } from './equipment-slot';

export function EquipmentPicker({ slot, onClose }: { slot: Slot | null; onClose: () => void }) {
  return <Dialog visible={slot !== null} title={slot === 'weapon' ? '무기' : '방어구'} onClose={onClose}>
    {slot && <Inventory key={slot} slot={slot} />}
  </Dialog>;
}

function Inventory({ slot }: { slot: Slot }) {
  const { state, mutate } = useStore();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(state.equipped[slot]);
  const ranks = { 영웅: 3, 희귀: 2, 일반: 1 };
  const items = equipment.filter(item => item.slot === slot && state.inventory.includes(item.id))
    .sort((a, b) => ranks[b.rarity] - ranks[a.rarity] || a.name.localeCompare(b.name, 'ko'));
  const pages = Math.max(1, Math.ceil(items.length / 12));
  const currentPage = Math.min(page, pages - 1);
  const selected = items.find(item => item.id === selectedId) ?? items[0];
  async function wear() {
    if (busy || !selected) return;
    setBusy(true);
    try { await mutate(s => equip(s, selected.id)); }
    catch (err) { showError(err); }
    finally { setBusy(false); }
  }
  async function draw() {
    if (busy) return;
    setBusy(true);
    try {
      let message = '';
      await mutate(s => {
        const result = drawEquipment(s);
        message = result.duplicate ? `${result.item.name} · 중복` : `${result.item.name} 획득`;
        return result.state;
      });
      setNotice(message);
    } catch (err) { showError(err); }
    finally { setBusy(false); }
  }
  return <>
    <View style={[ui.row, { flexWrap: 'wrap', gap: 12 }]}>
      {(['일반', '희귀', '영웅'] as const).map(rarity => <View key={rarity} style={[ui.row, { gap: 5 }]}><View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: rarityBackgrounds[rarity] }} /><Text style={[ui.muted, { fontSize: 11 }]}>{rarity === '일반' ? '노말' : rarity} {rarity === '일반' ? '60%' : rarity === '희귀' ? '30%' : '10%'}</Text></View>)}
    </View>
    <View style={{ gap: 8 }}>
      {Array.from({ length: 3 }, (_, row) => <View key={row} style={{ flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: 4 }, (_, column) => {
          const item = items[currentPage * 12 + row * 4 + column];
          if (!item) return <View key={column} accessible={false} style={{ flex: 1, aspectRatio: 1, borderWidth: 1, borderColor: color.border, borderRadius: 4, backgroundColor: '#151C13' }} />;
          const equipped = state.equipped[slot] === item.id;
          return <Pressable key={column} accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.rarity}${equipped ? ', 장착 중' : ''}`} accessibilityState={{ selected: selected?.id === item.id }} onPress={() => setSelectedId(item.id)} style={({ pressed }) => ({ flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: selected?.id === item.id ? 2 : 1, borderColor: selected?.id === item.id ? color.text : color.border, borderRadius: 4, backgroundColor: rarityBackgrounds[item.rarity], opacity: pressed ? 0.6 : 1 })}>
            <EquipmentGlyph item={item} />
            {equipped && <View style={{ position: 'absolute', right: 3, top: 3 }}><Feather name="check" size={13} color={color.green} /></View>}
          </Pressable>;
        })}
      </View>)}
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="이전 페이지" accessibilityState={{ disabled: currentPage === 0 }} disabled={currentPage === 0} onPress={() => setPage(currentPage - 1)} style={{ padding: 11, opacity: currentPage === 0 ? 0.3 : 1 }}><Feather name="chevron-left" size={22} color={color.text} /></Pressable>
      <Text style={ui.muted}>{currentPage + 1} / {pages}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="다음 페이지" accessibilityState={{ disabled: currentPage === pages - 1 }} disabled={currentPage === pages - 1} onPress={() => setPage(currentPage + 1)} style={{ padding: 11, opacity: currentPage === pages - 1 ? 0.3 : 1 }}><Feather name="chevron-right" size={22} color={color.text} /></Pressable>
    </View>
    {selected && <View style={{ gap: 8 }}>
      <View style={ui.between}>
        <Text style={{ flex: 1, color: color.text, fontFamily: font.display, fontSize: 21, lineHeight: 30 }}>{selected.name}</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || state.equipped[slot] === selected.id }} disabled={busy || state.equipped[slot] === selected.id} onPress={() => void wear()} style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4, opacity: pressed || busy ? 0.5 : 1 })}>
          <View style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 4, backgroundColor: '#303A26', borderWidth: 1, borderColor: color.border }}><Text style={{ color: state.equipped[slot] === selected.id ? color.muted : color.gold, fontFamily: font.medium, fontSize: 12 }}>{state.equipped[slot] === selected.id ? '장착 중' : '장착'}</Text></View>
        </Pressable>
      </View>
      <Text style={ui.muted}>{selected.description}</Text>
    </View>}
    <View style={{ borderTopWidth: 1, borderColor: color.border, paddingTop: 12, gap: 8 }}>
      <Button title={`장비 뽑기 · ${state.tickets}장`} kind="secondary" busy={busy} disabled={!state.tickets} onPress={() => void draw()} />
      {!!notice && <Text accessibilityLiveRegion="polite" style={[ui.muted, ui.gold]}>{notice}</Text>}
    </View>
  </>;
}
