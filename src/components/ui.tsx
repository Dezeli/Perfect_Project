import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ImageSourcePropType, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const color = { bg: '#10150F', panel: '#1B2319', border: '#35432D', text: '#F1EEDD', muted: '#9BA891', gold: '#E7BF6A', green: '#A7C981', red: '#DC9B8F' };
export const font = { display: 'Mulmaru', pixel: 'NeoDunggeunmo', body: 'Pretendard', medium: 'Pretendard-Medium', bold: 'Pretendard-Bold' };
export const ui = StyleSheet.create({
  page: { padding: 20, paddingBottom: 36, gap: 16, width: '100%', maxWidth: 600, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, flex: { flex: 1 },
  title: { fontFamily: font.display, fontSize: 30, lineHeight: 44, color: color.text }, heading: { fontFamily: font.display, fontSize: 21, lineHeight: 32, color: color.text },
  text: { fontFamily: font.body, color: color.text, fontSize: 15, lineHeight: 23 }, muted: { fontFamily: font.body, color: color.muted, fontSize: 13, lineHeight: 20 }, eyebrow: { fontFamily: font.pixel, color: color.gold, fontSize: 12 },
  card: { backgroundColor: color.panel, borderRadius: 7, borderWidth: 1, borderColor: color.border, padding: 17, gap: 12 }, gold: { color: color.gold }, green: { color: color.green }, red: { color: color.red },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, error: { fontFamily: font.body, color: color.red, fontSize: 12, lineHeight: 20 },
});
export function Page({ children, contentStyle, backgroundColor = color.bg, backgroundImage, backgroundOverlayColor, scrollEnabled = true }: { children: ReactNode; contentStyle?: StyleProp<ViewStyle>; backgroundColor?: string; backgroundImage?: ImageSourcePropType; backgroundOverlayColor?: string; scrollEnabled?: boolean }) {
  const content = <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: backgroundImage ? 'transparent' : backgroundColor }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView scrollEnabled={scrollEnabled} keyboardShouldPersistTaps="handled" style={{ backgroundColor: backgroundImage ? 'transparent' : backgroundColor }} contentContainerStyle={[ui.page, contentStyle]}>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
  return backgroundImage ? <ImageBackground source={backgroundImage} resizeMode="cover" style={{ flex: 1, backgroundColor }}>{backgroundOverlayColor && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: backgroundOverlayColor }]} />}{content}</ImageBackground> : content;
}
export function Title({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return <View style={{ gap: 7, marginVertical: 4 }}>{!!eyebrow && <Text style={ui.eyebrow}>{eyebrow}</Text>}<Text accessibilityRole="header" style={ui.title}>{title}</Text>{subtitle && <Text style={ui.muted}>{subtitle}</Text>}</View>;
}
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) { return <View style={[ui.card, style]}>{children}</View>; }
export function Button({ title, onPress, kind = 'primary', disabled = false, busy = false }: { title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; busy?: boolean }) {
  const primary = kind === 'primary';
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy }} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => ({ minHeight: 48, paddingVertical: 13, paddingHorizontal: 15, borderRadius: 5, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, borderWidth: 1, borderColor: primary ? color.gold : kind === 'danger' ? '#67473D' : color.border, backgroundColor: primary ? color.gold : color.panel, opacity: disabled || busy ? 0.45 : pressed ? 0.7 : 1 })}>{busy && <ActivityIndicator size="small" color={primary ? color.bg : color.gold} />}<Text style={{ fontFamily: primary ? font.bold : font.medium, fontSize: 14, color: primary ? '#242719' : kind === 'danger' ? color.red : color.text }}>{title}</Text></Pressable>;
}
export function BackButton({ title = '‹ 돌아가기', onPress, disabled = false }: { title?: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} hitSlop={10} style={{ alignSelf: 'flex-start', paddingVertical: 5, paddingRight: 12, opacity: disabled ? 0.5 : 1 }}><Text style={{ fontFamily: font.medium, color: color.muted, fontSize: 14 }}>{title}</Text></Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 7 }}><Text style={ui.muted}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#66715E" selectionColor={color.gold} {...props} style={[{ fontFamily: font.body, backgroundColor: '#11190F', borderColor: color.border, borderWidth: 1, borderRadius: 5, color: color.text, padding: 13, fontSize: 15, minHeight: props.multiline ? 100 : 48, textAlignVertical: props.multiline ? 'top' : 'center' }, props.style]} /></View>;
}
export function Chip({ title, selected = false, onPress }: { title: string; selected?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => ({ paddingHorizontal: 13, paddingVertical: 11, minHeight: 44, borderWidth: 1, borderColor: selected ? color.gold : color.border, borderRadius: 5, backgroundColor: selected ? '#332E1C' : color.panel, opacity: pressed ? 0.7 : 1 })}><Text style={{ fontFamily: font.medium, color: selected ? color.gold : color.muted, fontSize: 13 }}>{title}</Text></Pressable>;
}
export function Empty({ title, detail }: { title: string; detail: string }) { return <View style={[ui.card, { alignItems: 'center', paddingVertical: 30 }]}><Text style={[ui.gold, { fontSize: 28 }]}>◇</Text><Text style={ui.heading}>{title}</Text><Text style={[ui.muted, { textAlign: 'center' }]}>{detail}</Text></View>; }
export function showError(err: unknown) { Alert.alert('잠깐 확인해주세요', err instanceof Error ? err.message : String(err)); }
export function confirm(title: string, detail: string, action: () => void, destructive = false) { Alert.alert(title, detail, [{ text: '취소', style: 'cancel' }, { text: '확인', style: destructive ? 'destructive' : 'default', onPress: action }]); }
export function Stat({ value, label, compact = false }: { value: string | number; label: string; compact?: boolean }) { return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: compact ? 2 : 6 }}><Text style={{ fontFamily: font.display, color: color.text, fontSize: compact ? 18 : 22, ...(compact ? { lineHeight: 22 } : {}) }}>{value}</Text><Text style={[ui.muted, compact && { fontSize: 11, lineHeight: 16 }]}>{label}</Text></View>; }
