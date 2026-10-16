import { Text, View } from 'react-native';
import { color, font } from './ui';
const pixels = ['....hhhh....', '...hhhhhh...', '...hssssh...', '...ssdsds...', '....ssss....', '..gggggggg..', '.gggGggGggg.', '.ssgGggGgss.', '.ssggggggss.', '...bbbbbb...', '...bb..bb...', '...bb..bb...', '..ddd..ddd..'];
export function Hero({ upgraded = false, title = '모험가', framed = true, shadow = true }: { upgraded?: boolean; title?: string; framed?: boolean; shadow?: boolean }) {
  const palette: Record<string, string> = { h: '#55432E', s: '#E6B78C', d: '#302A22', g: upgraded ? '#7B849A' : '#739560', G: upgraded ? '#E7BF6A' : '#C4C981', b: '#5C665C' };
  return <View accessible accessibilityLabel="픽셀 모험가 캐릭터" style={{ width: framed ? 112 : 84, minHeight: framed ? 142 : 112, alignItems: 'center', justifyContent: 'center', paddingVertical: framed ? 12 : 6, borderWidth: framed ? 1 : 0, borderColor: color.border, borderRadius: 4, backgroundColor: '#202B1C' }}>
    {pixels.map((row, y) => <View key={y} style={{ flexDirection: 'row' }}>{[...row].map((p, x) => <View key={x} style={{ width: 6, height: 7, backgroundColor: palette[p] ?? 'transparent' }} />)}</View>)}
    {shadow && <View style={{ width: 58, height: 5, backgroundColor: '#121C12', marginTop: 8 }} />}{!!title && <Text numberOfLines={2} style={{ color: color.gold, fontFamily: font.pixel, fontSize: 11, marginTop: 7, paddingHorizontal: 6, textAlign: 'center' }}>{title}</Text>}
  </View>;
}
