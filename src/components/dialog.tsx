import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { color, ui } from './ui';

export function Dialog({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#000A' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={{ position: 'absolute', inset: 0 }} />
      <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 420, maxHeight: '90%', backgroundColor: color.bg, borderWidth: 1, borderColor: color.border, borderRadius: 8, overflow: 'hidden' }}>
        <View style={[ui.between, { paddingLeft: 18, paddingRight: 8, paddingVertical: 8, borderBottomWidth: 1, borderColor: color.border }]}>
          <Text accessibilityRole="header" style={ui.heading}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}><Feather name="x" size={22} color={color.muted} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </View>
    </SafeAreaView>
  </Modal>;
}
