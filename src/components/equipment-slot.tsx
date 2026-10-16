import { Pressable, View } from 'react-native';
import type { Equipment, Slot } from '../core/domain';
import { color } from './ui';

export const rarityColors: Record<Equipment['rarity'], string> = { 일반: '#F1EEDD', 희귀: '#82A8E6', 영웅: color.gold };
export const rarityBackgrounds: Record<Equipment['rarity'], string> = { 일반: '#424A3C', 희귀: '#293E4C', 영웅: '#49412B' };

export function EquipmentGlyph({ item }: { item: Equipment }) {
  const slot = item.slot;
  const tint = item.id === 'wood-sword' ? '#AD8055' : rarityColors[item.rarity];
  if (item.id === 'sage-staff') return <View style={{ width: 34, height: 34, alignItems: 'center' }}><View style={{ width: 13, height: 13, borderWidth: 3, borderColor: tint, borderRadius: 7 }} /><View style={{ width: 4, height: 21, backgroundColor: '#AD8055' }} /></View>;
  if (slot === 'armor' && item.id !== 'guardian-coat') return <View style={{ width: 34, height: 34, alignItems: 'center' }}><View style={{ position: 'absolute', top: 4, width: 32, height: 11, backgroundColor: item.id === 'forest-coat' ? '#739560' : '#AD9980', transform: [{ rotate: '-8deg' }] }} /><View style={{ width: 20, height: 30, backgroundColor: item.id === 'forest-coat' ? '#739560' : '#AD9980', borderWidth: 2, borderColor: tint }} /><View style={{ position: 'absolute', top: 0, width: 8, height: 6, backgroundColor: '#152016' }} /></View>;
  if (slot === 'weapon') return <View accessible={false} style={{ width: 34, height: 34 }}>
    <View style={{ position: 'absolute', left: 14, top: 1, width: 6, height: 25, backgroundColor: tint, borderColor: '#FFF0C8', borderWidth: 1, transform: [{ rotate: '42deg' }] }} />
    <View style={{ position: 'absolute', left: 8, top: 21, width: 21, height: 4, backgroundColor: tint, transform: [{ rotate: '42deg' }] }} />
    <View style={{ position: 'absolute', left: 9, top: 24, width: 5, height: 11, backgroundColor: '#745638', transform: [{ rotate: '42deg' }] }} />
  </View>;
  return <View accessible={false} style={{ width: 31, height: 34, borderWidth: 3, borderColor: tint, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 3, height: 22, backgroundColor: tint }} />
    <View style={{ position: 'absolute', width: 19, height: 3, backgroundColor: tint }} />
  </View>;
}

export function EquipmentSlot({ slot, item, onPress, size = 58 }: { slot: Slot; item: Equipment; onPress: () => void; size?: number }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${slot === 'weapon' ? '무기' : '방어구'}: ${item.name}. 소유 장비 보기`} onPress={onPress} style={({ pressed }) => ({ width: size, height: size, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color.border, borderRadius: 5, backgroundColor: rarityBackgrounds[item.rarity], opacity: pressed ? 0.72 : 1 })}>
    <EquipmentGlyph item={item} />
  </Pressable>;
}
