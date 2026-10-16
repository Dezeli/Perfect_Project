import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useStore } from '../core/store';
import { addNote, dayKey, displayShortDay, mediaPaths, newId, questKindLimits, questXp, removeNote, saveDailyQuestDraft, updateNote, validDay, type QuestKind } from '../core/domain';
import { discardNotePhoto, selectNotePhoto } from '../core/note-media';
import { recognizeNote } from '../core/ocr';
import { downloadQuestAi, interpretQuestText, questAiStatus } from '../core/quest-interpretation';
import { Button, Card, Page, color, font, confirm, showError, ui } from '../components/ui';

export default function QuestEditor() {
  const { date: selectedDay } = useLocalSearchParams<{ date?: string }>();
  const date = validDay(selectedDay) ? selectedDay : dayKey();
  const { state, mutate } = useStore();
  const daily = state.quests.filter(q => q.date === date);
  const [draft, setDraft] = useState<Record<QuestKind, string[]>>(() => ({
    main: Array.from({ length: questKindLimits.main }, (_, index) => daily.filter(q => q.kind === 'main')[index]?.title ?? ''),
    sub: Array.from({ length: questKindLimits.sub }, (_, index) => daily.filter(q => q.kind === 'sub')[index]?.title ?? ''),
  }));
  const [busy, setBusy] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [undoStack, setUndoStack] = useState<{ draft: Record<QuestKind, string[]>; id: string; path: string }[]>([]);
  const photoLock = useRef(false);
  const hasMain = draft.main.some(title => title.trim());

  function change(kind: QuestKind, index: number, title: string) {
    setDraft(current => ({ ...current, [kind]: current[kind].map((value, position) => position === index ? title : value) }));
  }
  async function commit() {
    if (busy || photoLock.current) return;
    setBusy(true);
    try {
      await mutate(current => saveDailyQuestDraft(current, date, draft));
      router.back();
    } catch (err) { showError(err); }
    finally { setBusy(false); }
  }
  function save() {
    if (!hasMain || busy || photoLock.current) return;
    const removingCompleted = (['main', 'sub'] as QuestKind[]).some(kind => daily.filter(q => q.kind === kind).slice(0, questKindLimits[kind]).some((quest, index) => quest.status === 'completed' && !draft[kind][index].trim()));
    if (removingCompleted) confirm('완료한 퀘스트를 삭제할까요?', '빈칸으로 지운 퀘스트와 해당 XP가 사라져요.', () => void commit(), true);
    else void commit();
  }

  async function recognizeFromPhoto(download: boolean) {
    if (photoLock.current || busy) return;
    photoLock.current = true;
    setRecognizing(true);
    let imported: { id: string; path: string } | null = null;
    try {
      if (download) await downloadQuestAi();
      const path = await selectNotePhoto('library');
      if (!path) return;
      const id = newId();
      try { await mutate(current => addNote(current, date, { id, path })); }
      catch (error) { discardNotePhoto(path); throw error; }
      imported = { id, path };
      const rawText = await recognizeNote(path);
      await mutate(current => updateNote(current, date, id, { ocrText: rawText, ocrAt: new Date().toISOString() }));
      const interpreted = await interpretQuestText(rawText);
      setUndoStack(current => [...current, { draft, id, path }]);
      setDraft(interpreted);
      imported = null;
      Alert.alert('초안을 채웠어요', '인식한 내용을 확인하고 필요한 부분을 고친 뒤 저장해주세요.');
    } catch (error) {
      if (imported) {
        const { id, path } = imported;
        try {
          let shared = false;
          await mutate(current => { const next = removeNote(current, date, id); shared = mediaPaths(next).includes(path); return next; });
          if (!shared) discardNotePhoto(path);
        } catch { /* 원래 인식 오류를 표시합니다. */ }
      }
      showError(error);
    }
    finally { photoLock.current = false; setRecognizing(false); }
  }

  async function checkPhotoRecognition() {
    if (photoLock.current || busy) return;
    photoLock.current = true;
    setRecognizing(true);
    let ready = false;
    try {
      const status = await questAiStatus();
      if (status === 'available') ready = true;
      else if (status === 'downloadable') Alert.alert('기기 AI 준비', '처음 한 번 AI 모델을 내려받아야 해요. 이후에는 오프라인에서 사용할 수 있어요.', [
        { text: '취소', style: 'cancel' },
        { text: '모델 받기', onPress: () => void recognizeFromPhoto(true) },
      ]);
      else if (status === 'downloading') throw new Error('기기 AI 모델을 내려받는 중이에요. 잠시 후 다시 시도해주세요.');
      else throw new Error('이 기기에서 AI 해석을 사용할 수 없어요. 퀘스트를 직접 입력해주세요.');
    } catch (error) { showError(error); }
    finally { photoLock.current = false; setRecognizing(false); }
    if (ready) void recognizeFromPhoto(false);
  }

  async function undoRecognition() {
    if (photoLock.current || busy || undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    photoLock.current = true;
    setRecognizing(true);
    try {
      let shared = false;
      await mutate(current => { const next = removeNote(current, date, previous.id); shared = mediaPaths(next).includes(previous.path); return next; });
      if (!shared) discardNotePhoto(previous.path);
      setDraft(previous.draft);
      setUndoStack(current => current.slice(0, -1));
    } catch (error) { showError(error); }
    finally { photoLock.current = false; setRecognizing(false); }
  }

  function requestPhotoRecognition() {
    if (photoLock.current || busy) return;
    if ([...draft.main, ...draft.sub].some(title => title.trim())) {
      confirm('입력한 내용을 바꿀까요?', '사진 인식이 끝나면 현재 입력칸의 내용이 새 초안으로 바뀌어요.', () => void checkPhotoRecognition());
    } else void checkPhotoRecognition();
  }

  return <Page contentStyle={{ paddingTop: 24 }}>
    <View style={{ alignItems: 'flex-end' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="뒤로가기" onPress={() => router.back()} disabled={busy || recognizing} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#786A56', borderRadius: 22, backgroundColor: pressed ? '#4B4338' : '#5A5144' })}>
        <Feather name="arrow-left" size={22} color="#EBCF9B" />
      </Pressable>
    </View>
    <Text style={ui.muted}>{displayShortDay(date)}</Text>
    <View style={ui.between}>
      <Text accessibilityRole="header" style={[ui.title, { flexShrink: 1 }]}>퀘스트 설정</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="손글씨 사진 인식" disabled={busy || recognizing} onPress={requestPhotoRecognition} style={({ pressed }) => ({ minHeight: 38, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: color.border, borderRadius: 5, backgroundColor: '#263123', opacity: busy || recognizing ? 0.5 : pressed ? 0.7 : 1 })}>
        {recognizing ? <ActivityIndicator size="small" color={color.gold} /> : <Feather name="camera" size={16} color={color.gold} />}
        <Text style={{ color: color.text, fontFamily: font.medium, fontSize: 12 }}>{recognizing ? '인식 중' : '손글씨 인식'}</Text>
      </Pressable>
    </View>
    <Card style={{ gap: 10, padding: 14 }}>
      <Text style={[ui.heading, { fontSize: 18, lineHeight: 27 }]}>메인 퀘스트 <Text style={[ui.muted, { fontSize: 13 }]}>(각각 {questXp.main} XP)</Text></Text>
      <View style={{ gap: 8 }}>{draft.main.map((title, index) => <View key={`main-${index}`} style={[ui.row, { gap: 8 }]}><Text style={{ width: 22, color: color.gold, fontFamily: font.pixel, fontSize: 17 }}>{index + 1}.</Text><TextInput accessibilityLabel={`메인 퀘스트 ${index + 1}`} value={title} onChangeText={value => change('main', index, value)} placeholder="메인 퀘스트 입력" placeholderTextColor={color.muted} maxLength={80} editable={!busy && !recognizing} style={{ flex: 1, height: 44, borderWidth: 1, borderColor: color.border, borderRadius: 6, backgroundColor: '#11190F', color: color.text, fontFamily: font.body, fontSize: 15, paddingHorizontal: 12 }} /></View>)}</View>
      <View style={{ height: 1, backgroundColor: color.border, marginVertical: 2 }} />
      <Text style={[ui.heading, { fontSize: 18, lineHeight: 27 }]}>서브 퀘스트 <Text style={[ui.muted, { fontSize: 13 }]}>(각각 {questXp.sub} XP)</Text></Text>
      <View style={{ gap: 8 }}>{draft.sub.map((title, index) => <View key={`sub-${index}`} style={[ui.row, { gap: 8 }]}><Text style={{ width: 22, color: color.gold, fontFamily: font.pixel, fontSize: 17 }}>{index + 1}.</Text><TextInput accessibilityLabel={`서브 퀘스트 ${index + 1}`} value={title} onChangeText={value => change('sub', index, value)} placeholder="서브 퀘스트 입력" placeholderTextColor={color.muted} maxLength={80} editable={!busy && !recognizing} style={{ flex: 1, height: 44, borderWidth: 1, borderColor: color.border, borderRadius: 6, backgroundColor: '#11190F', color: color.text, fontFamily: font.body, fontSize: 15, paddingHorizontal: 12 }} /></View>)}</View>
    </Card>
    {undoStack.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="사진 인식 전으로 되돌리기" disabled={busy || recognizing} onPress={() => void undoRecognition()} style={({ pressed }) => ({ alignSelf: 'flex-end', minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.6 : 1 })}><Feather name="rotate-ccw" size={15} color={color.gold} /><Text style={{ color: color.gold, fontFamily: font.medium, fontSize: 13 }}>인식 전으로 되돌리기</Text></Pressable>}
    {daily.length > 0 && <Text style={ui.muted}>빈칸으로 저장하면 해당 줄의 기존 퀘스트가 삭제돼요.</Text>}
    <Button title="저장하기" onPress={save} disabled={!hasMain || recognizing} busy={busy} />
  </Page>;
}
