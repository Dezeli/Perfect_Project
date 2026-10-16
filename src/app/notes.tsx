import { useCallback, useRef, useState } from 'react';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Alert, BackHandler, Image, Pressable, ScrollView, Text } from 'react-native';
import { useStore } from '../core/store';
import { addNote, dayKey, displayDay, mediaPaths, newId, removeNote, updateNote, validDay } from '../core/domain';
import { discardNotePhoto, noteUri, selectNotePhoto } from '../core/note-media';
import { ocrAvailable, recognizeNote } from '../core/ocr';
import { BackButton, Button, Card, Empty, Field, Page, Title, color, confirm, showError, ui } from '../components/ui';

export default function Notes() {
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const date = validDay(dateParam) ? dateParam : dayKey();
  const { state, ready, mutate } = useStore();
  const notes = state.journals[date]?.notes ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = notes.find(n => n.id === selectedId) ?? notes[notes.length - 1];
  const [draft, setDraft] = useState<{ id: string; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const lock = useRef(false);
  const savedInput = selected?.inputText ?? selected?.ocrText ?? '';
  const input = selected && draft?.id === selected.id ? draft.text : savedInput;
  const dirty = !!selected && input !== savedInput;
  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (lock.current) return true;
      if (!dirty) return false;
      confirm('입력한 내용을 저장하지 않았어요', '저장하지 않고 돌아갈까요?', () => { setDraft(null); router.back(); });
      return true;
    });
    return () => sub.remove();
  }, [dirty]));
  if (!ready || !state.profile) return <Redirect href="/" />;

  // 연속 탭에도 사진 저장과 인식은 한 번에 한 건만 처리합니다.
  async function run(label: string, action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(label);
    try { await action(); } catch (err) { showError(err); }
    finally { lock.current = false; setBusy(null); }
  }
  function afterDraftCheck(action: () => void) {
    if (lock.current) return;
    if (dirty) confirm('입력한 내용을 저장하지 않았어요', '저장하지 않고 이동할까요? 입력한 내용은 사라져요.', () => { setDraft(null); action(); });
    else action();
  }
  async function addPhoto(source: 'camera' | 'library') {
    await run('사진을 저장하고 있어요', async () => {
      if (notes.length >= 30) throw new Error('하루에 노트 사진 30장까지 보관할 수 있어요.');
      const path = await selectNotePhoto(source);
      if (!path) return;
      const id = newId();
      try { await mutate(s => addNote(s, date, { id, path })); }
      catch (err) { discardNotePhoto(path); throw err; }
      setSelectedId(id); setDraft(null);
    });
  }
  async function recognize() {
    if (!selected) return;
    const note = selected;
    await run('글자를 읽고 있어요', async () => {
      const text = await recognizeNote(note.path);
      await mutate(s => updateNote(s, date, note.id, { ocrText: text, ocrAt: new Date().toISOString() }));
      setDraft(null);
      if (!text.trim()) Alert.alert('읽을 수 있는 글자를 찾지 못했어요', '사진은 그대로 보관했어요. 밝고 선명하게 다시 촬영하거나 내용을 직접 입력해주세요.');
    });
  }
  async function saveInput() {
    if (!selected) return;
    const id = selected.id;
    await run('텍스트를 저장하고 있어요', async () => {
      await mutate(s => updateNote(s, date, id, { inputText: input }));
      setDraft(null);
      Alert.alert('텍스트를 저장했어요', '다음 AI 단계에서 이 내용을 해석하게 돼요. 퀘스트에는 아직 반영하지 않았어요.');
    });
  }
  async function deleteSelected() {
    if (!selected) return;
    const note = selected;
    await run('노트를 삭제하고 있어요', async () => {
      let shared = false;
      await mutate(s => { const next = removeNote(s, date, note.id); shared = mediaPaths(next).includes(note.path); return next; });
      if (!shared) discardNotePhoto(note.path);
      setSelectedId(null); setDraft(null);
    });
  }

  return <Page>
    <BackButton title="‹ 돌아가기" disabled={!!busy} onPress={() => afterDraftCheck(() => router.back())} />
    <Title eyebrow="" title="손글씨 노트" subtitle={`${displayDay(date)} · ${notes.length}장`} />
    <Card><Text style={ui.heading}>노트 추가</Text><Text style={ui.muted}>사진은 이 기기에 저장돼요.</Text><Button title="갤러리에서 선택" kind="secondary" disabled={!!busy} onPress={() => afterDraftCheck(() => void addPhoto('library'))} /><Button title="사진 촬영" disabled={!!busy} onPress={() => afterDraftCheck(() => void addPhoto('camera'))} /></Card>
    {!ocrAvailable && <Card><Text style={[ui.text, ui.gold]}>사진과 텍스트 입력부터 테스트할 수 있어요</Text><Text style={ui.muted}>Expo Go에서는 자동 글자 인식을 실행할 수 없어요. 안드로이드 개발용 APK에서 사용할 수 있어요. 아래에 잘못 읽힌 것처럼 텍스트를 직접 적어 저장해도 돼요.</Text></Card>}
    {busy && <Text accessibilityLiveRegion="polite" style={[ui.text, ui.gold]}>{busy}</Text>}
    {notes.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
      {notes.map((note, index) => <Pressable key={note.id} accessibilityRole="button" accessibilityLabel={`${index + 1}번째 노트 사진`} accessibilityState={{ selected: note.id === selected?.id, disabled: !!busy }} disabled={!!busy} onPress={() => afterDraftCheck(() => { setSelectedId(note.id); setDraft(null); })} style={({ pressed }) => ({ borderWidth: 2, borderColor: note.id === selected?.id ? color.gold : color.border, padding: 4, borderRadius: 7, opacity: pressed ? 0.7 : 1 })}><Image source={{ uri: noteUri(note.path) }} resizeMethod="resize" style={{ width: 64, height: 80, borderRadius: 3 }} /><Text style={[ui.muted, { textAlign: 'center', fontSize: 10 }]}>{index + 1} · {note.ocrText !== undefined ? '인식됨' : note.inputText !== undefined ? '입력됨' : '사진'}</Text></Pressable>)}
    </ScrollView>}
    {selected ? <>
      <Card><Text style={ui.heading}>선택한 노트 · {notes.findIndex(n => n.id === selected.id) + 1}</Text><Image key={selected.path} source={{ uri: noteUri(selected.path) }} resizeMethod="resize" resizeMode="contain" accessibilityLabel="선택한 손글씨 노트 사진" style={{ width: '100%', height: 300, borderRadius: 6, backgroundColor: '#0E160E' }} onError={() => showError(new Error('사진을 불러오지 못했어요. 사진을 다시 등록해주세요.'))} /><Button title={selected.ocrText !== undefined ? '글자 다시 인식하기' : '사진에서 글자 인식하기'} disabled={!!busy || !ocrAvailable} onPress={() => afterDraftCheck(() => void recognize())} kind="secondary" />{selected.ocrAt && <Text style={ui.muted}>마지막 인식 · {new Date(selected.ocrAt).toLocaleString('ko-KR')}</Text>}</Card>
      {selected.ocrText !== undefined && <Card><Text style={ui.heading}>OCR 원문</Text><Text selectable style={ui.text}>{selected.ocrText || '(인식한 글자가 없어요)'}</Text><Text style={ui.muted}>인식 결과는 교정하지 않고 그대로 보관해요.</Text></Card>}
      <Card><Field label="AI에 전달할 텍스트 · 직접 입력 또는 테스트" multiline maxLength={12000} value={input} editable={!busy} onChangeText={text => setDraft({ id: selected.id, text })} placeholder="예: 저녁에 3O분 달리기. 책은 2O쪽 읽자." /><Text style={ui.muted}>오타를 일부러 넣어 다음 단계의 AI 해석 테스트에 사용할 수 있어요. 저장해도 OCR 원문은 바뀌지 않아요.</Text><Button title="입력 텍스트 저장" busy={busy === '텍스트를 저장하고 있어요'} disabled={!!busy || !dirty} onPress={() => void saveInput()} /></Card>
      <Button title="선택한 노트 삭제" kind="danger" disabled={!!busy} onPress={() => confirm('이 노트를 삭제할까요?', '선택한 사진과 인식·입력 텍스트가 삭제돼요. 다른 노트와 퀘스트는 유지돼요.', () => void deleteSelected(), true)} />
    </> : <Empty title="아직 노트가 없어요" detail="손으로 쓴 하루의 목표를 사진으로 남겨보세요." />}
  </Page>;
}
