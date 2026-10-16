import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import type { Quest } from '../core/domain';
import { Dialog } from './dialog';
import { color, font, ui } from './ui';

const resultColors = { all: '#5B745C80', some: '#9B6F4780', none: '#965A5A80' };

export function QuestDatePicker({ date, today, quests, onSelect, onClose }: { date: string; today: string; quests: Quest[]; onSelect: (date: string) => void; onClose: () => void }) {
  const [month, setMonth] = useState(date.slice(0, 7));
  const [yearNumber, monthNumber] = month.split('-').map(Number);
  const firstWeekday = (new Date(yearNumber, monthNumber - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= daysInMonth ? `${month}-${String(day).padStart(2, '0')}` : null;
  });
  const results = new Map<string, { total: number; completed: number }>();
  for (const quest of quests) {
    if (!quest.date.startsWith(month)) continue;
    const previous = results.get(quest.date) ?? { total: 0, completed: 0 };
    results.set(quest.date, { total: previous.total + 1, completed: previous.completed + (quest.status === 'completed' ? 1 : 0) });
  }
  function moveMonth(amount: number) {
    const next = new Date(yearNumber, monthNumber - 1 + amount, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  }

  return <Dialog visible title="날짜 선택" onClose={onClose}>
    <View style={ui.between}>
      <Pressable accessibilityRole="button" accessibilityLabel="이전 달" onPress={() => moveMonth(-1)} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}><Feather name="chevron-left" size={23} color={color.gold} /></Pressable>
      <Text style={{ color: color.text, fontFamily: font.display, fontSize: 20 }}>{month.slice(2, 4)}년 {monthNumber}월</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="다음 달" onPress={() => moveMonth(1)} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}><Feather name="chevron-right" size={23} color={color.gold} /></Pressable>
    </View>
    <View style={{ flexDirection: 'row' }}>
      {['월', '화', '수', '목', '금', '토', '일'].map(day => <Text key={day} style={{ flex: 1, textAlign: 'center', color: color.muted, fontFamily: font.medium, fontSize: 12 }}>{day}</Text>)}
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {days.map((day, index) => {
        if (!day) return <View key={`blank-${index}`} style={{ width: '14.2857%', height: 44 }} />;
        const result = results.get(day);
        const shade = !result || day > today ? 'transparent' : result.completed === result.total ? resultColors.all : result.completed > 0 ? resultColors.some : resultColors.none;
        return <Pressable key={day} accessibilityRole="button" accessibilityLabel={`${Number(day.slice(5, 7))}월 ${Number(day.slice(8, 10))}일${day === today ? ', 오늘' : ''}${result ? `, 퀘스트 ${result.completed}/${result.total} 완료` : ', 등록된 퀘스트 없음'}`} accessibilityState={{ selected: day === date }} onPress={() => onSelect(day)} style={{ width: '14.2857%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
          {({ pressed }) => <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: day === date ? 2 : 0, borderColor: color.gold, backgroundColor: shade, opacity: pressed ? 0.65 : 1 }}><Text style={{ color: color.text, fontFamily: day === date ? font.bold : font.body, fontSize: 15 }}>{Number(day.slice(8, 10))}</Text>{day === today && <View style={{ position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: color.gold }} />}</View>}
        </Pressable>;
      })}
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 13 }}>{([['완료', resultColors.all], ['일부', resultColors.some], ['미완료', resultColors.none]] as const).map(([label, shade]) => <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: shade }} /><Text style={[ui.muted, { fontSize: 11 }]}>{label}</Text></View>)}</View>
  </Dialog>;
}
