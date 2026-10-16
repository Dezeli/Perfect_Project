import Feather from '@expo/vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { lazy, Suspense, useState } from 'react';
import { Alert, Image, Platform, Pressable, Text, View } from 'react-native';
import { Button, Card, Page, color, font, showError, ui } from '../components/ui';
import { dayKey, dayStats, displayDay, growth, totalXp, validDay } from '../core/domain';
import { noteUri } from '../core/note-media';
import { useStore } from '../core/store';
import PerfectStory from '../../modules/perfect-story/src/PerfectStoryModule';

type Source = { uri: string; kind: 'image' | 'video' };
type StoryFile = { uri: string; index: number; saved: boolean };
const StoryPreview = lazy(() => import('../components/story-preview'));

export default function Story() {
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const date = validDay(dateParam) ? dateParam : dayKey();
  const { state, ready } = useStore();
  const [sources, setSources] = useState<Source[]>([]);
  const notes = state.journals[date]?.notes ?? [];
  const [planChoice, setPlanChoice] = useState<string | null | undefined>();
  const planUri = planChoice === undefined ? (notes.length ? noteUri(notes[notes.length - 1].path) : null) : planChoice;
  const [files, setFiles] = useState<StoryFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [selectedQuestIds, setSelectedQuestIds] = useState<string[] | null>(null);
  const quests = state.quests.filter(q => q.date === date);
  const displayedQuests = selectedQuestIds === null ? quests : quests.filter(q => selectedQuestIds.includes(q.id));
  const stats = dayStats(state, date);
  if (!ready || !state.profile) return <Redirect href="/" />;

  async function selectSources() {
    try {
      const remaining = 3 - sources.length;
      if (!remaining) return;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, selectionLimit: remaining, orderedSelection: true });
      if (result.canceled) return;
      const picked = result.assets.slice(0, remaining).map((asset): Source => ({ uri: asset.uri, kind: asset.type === 'video' ? 'video' : 'image' }));
      setSources(current => [...current, ...picked].slice(0, 3));
      setFiles([]);
    } catch (error) { showError(error); }
  }

  async function selectPlan() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
      if (!result.canceled && result.assets[0]) { setPlanChoice(result.assets[0].uri); setFiles([]); }
    } catch (error) { showError(error); }
  }

  async function exportStories() {
    if (!PerfectStory) { Alert.alert('개발 앱이 필요해요', '스토리 영상 제작은 Expo Go에서 실행할 수 없어요. 안드로이드 개발 빌드에서 열어주세요.'); return; }
    if (!sources.length || busy) return;
    setBusy(true); setProgress(0); setFiles([]); setPreviewIndex(0);
    const outputs: StoryFile[] = [];
    try {
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const uri = await PerfectStory.exportStory(JSON.stringify({
          mediaUri: source.uri, kind: source.kind, planUri: planUri ?? '',
          name: state.profile!.name, date, level: growth(totalXp(state, date)).level,
          completed: stats.completed, total: stats.total, xp: stats.xp,
          quests: displayedQuests.map(q => ({ title: q.title, kind: q.kind, status: q.status })),
        }));
        outputs.push({ uri, index: i, saved: false });
        setFiles([...outputs]); setProgress(i + 1);
      }
    } catch (error) { showError(error); }
    finally { setBusy(false); }
  }

  async function saveFile(file: StoryFile) {
    try {
      const MediaLibrary = await import('expo-media-library');
      const permission = await MediaLibrary.requestPermissionsAsync(true, ['video']);
      if (!permission.granted) throw new Error('갤러리에 저장하려면 동영상 저장 권한이 필요해요.');
      await MediaLibrary.Asset.create(file.uri);
      setFiles(current => current.map(item => item.uri === file.uri ? { ...item, saved: true } : item));
      Alert.alert('저장했어요', `${file.index + 1}번 스토리를 갤러리에 저장했어요.`);
    } catch (error) { showError(error); }
  }

  async function shareFile(file: StoryFile) {
    try {
      const Sharing = await import('expo-sharing');
      if (!await Sharing.isAvailableAsync()) throw new Error('이 기기에서 공유 기능을 사용할 수 없어요.');
      await Sharing.shareAsync(file.uri, { mimeType: 'video/mp4', dialogTitle: '스토리 공유' });
    } catch (error) { showError(error); }
  }

  const preview = files[previewIndex];
  return <Page backgroundImage={require('../../assets/backgrounds/adventure-home-calm.png')} backgroundOverlayColor="#10150FE8" contentStyle={{ gap: 10, paddingTop: 24 }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
      <View style={{ flex: 1, marginTop: 14 }}><Text accessibilityRole="header" style={ui.title}>스토리 만들기</Text><Text style={ui.muted}>{displayDay(date)}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="퀘스트로 돌아가기" disabled={busy} onPress={() => router.back()} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#786A56', borderRadius: 22, backgroundColor: pressed ? '#4B4338' : '#5A5144' })}><Feather name="arrow-left" size={22} color="#EBCF9B" /></Pressable>
    </View>
    <Card style={{ gap: 8, padding: 12 }}>
      <View style={ui.between}><Text style={[ui.heading, { fontSize: 18, lineHeight: 26 }]}>실천 사진 · 영상</Text><Text style={[ui.muted, { color: color.gold }]}>{sources.length} / 3</Text></View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: 3 }, (_, index) => {
          const source = sources[index];
          return <View key={source?.uri ?? `empty-${index}`} style={{ flex: 1, aspectRatio: 1, borderWidth: 1, borderColor: color.border, borderRadius: 6, overflow: 'hidden', backgroundColor: '#172017' }}>
            {source ? <>
              {source.kind === 'image' ? <Image source={{ uri: source.uri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Feather name="play-circle" size={28} color={color.gold} /></View>}
              <Pressable accessibilityRole="button" accessibilityLabel={`${index + 1}번 장면 제거`} disabled={busy} onPress={() => { setSources(current => current.filter((_, i) => i !== index)); setFiles([]); }} style={{ position: 'absolute', top: 4, right: 4, width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#10150FDD' }}><Feather name="x" size={17} color={color.text} /></Pressable>
            </> : <Pressable accessibilityRole="button" accessibilityLabel="실천 사진 또는 영상 추가" disabled={busy} onPress={() => void selectSources()} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Feather name="plus" size={25} color={color.gold} /></Pressable>}
          </View>;
        })}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: color.border, paddingTop: 10 }}>
        <View style={{ width: 58, height: 58, borderWidth: 1, borderColor: color.border, borderRadius: 6, overflow: 'hidden', backgroundColor: '#172017' }}>
          {planUri ? <><Image source={{ uri: planUri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} /><Pressable accessibilityRole="button" accessibilityLabel="손글씨 계획 사진 제거" disabled={busy} onPress={() => { setPlanChoice(null); setFiles([]); }} style={{ position: 'absolute', top: 3, right: 3, width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#10150FDD' }}><Feather name="x" size={16} color={color.text} /></Pressable></> : <Pressable accessibilityRole="button" accessibilityLabel="손글씨 계획 사진 추가" disabled={busy} onPress={() => void selectPlan()} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Feather name="plus" size={22} color={color.gold} /></Pressable>}
        </View>
        <View style={{ flex: 1 }}><Text style={{ color: color.text, fontFamily: font.medium, fontSize: 15 }}>손글씨 계획</Text><Text style={ui.muted}>선택 사항 · 스토리에 작게 삽입</Text></View>
      </View>
    </Card>
    <Card style={{ gap: 6, padding: 12 }}>
      <View style={ui.between}>
        <Text style={[ui.heading, { fontSize: 18, lineHeight: 26 }]}>표시할 퀘스트</Text>
        <Text style={ui.muted}>{displayedQuests.length} / {quests.length}</Text>
      </View>
      {quests.length ? quests.map(q => {
        const selected = displayedQuests.some(item => item.id === q.id);
        return <Pressable
          key={q.id}
          accessibilityRole="checkbox"
          accessibilityLabel={`${q.kind === 'main' ? '메인' : '서브'} 퀘스트 ${q.title}`}
          accessibilityState={{ checked: selected, disabled: busy }}
          disabled={busy}
          onPress={() => {
            setSelectedQuestIds(current => {
              const ids = current ?? quests.map(item => item.id);
              return ids.includes(q.id) ? ids.filter(id => id !== q.id) : [...ids, q.id];
            });
            setFiles([]);
            setPreviewIndex(0);
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: color.border, minHeight: 38, paddingVertical: 5 }}
        >
          <Text style={{ color: q.kind === 'main' ? color.gold : color.green, fontFamily: font.pixel, fontSize: 11, width: 28 }}>{q.kind === 'main' ? '메인' : '서브'}</Text>
          <Text numberOfLines={1} style={[ui.text, { flex: 1, fontSize: 13, lineHeight: 19, opacity: selected ? 1 : 0.55 }]}>{q.title}</Text>
          <Feather name={selected ? 'check-square' : 'square'} size={18} color={selected ? color.gold : color.muted} />
        </Pressable>;
      }) : <Text style={ui.muted}>등록된 퀘스트 없음</Text>}
    </Card>
    <Button title={busy ? `${progress + 1}/${sources.length} 스토리 만드는 중` : `${sources.length}개 스토리 만들기`} busy={busy} disabled={!sources.length || busy} onPress={() => void exportStories()} />
    {files.length > 0 && <Card style={{ gap: 15 }}><Text style={ui.heading}>완성된 스토리</Text><View style={ui.row}>{files.map((file, i) => <Pressable key={file.uri} accessibilityRole="button" accessibilityState={{ selected: previewIndex === i }} onPress={() => setPreviewIndex(i)} style={{ padding: 10, borderWidth: 1, borderColor: previewIndex === i ? color.gold : color.border, borderRadius: 5 }}><Text style={{ color: previewIndex === i ? color.gold : color.text, fontFamily: font.medium }}>{file.index + 1}번</Text></Pressable>)}</View>{preview && <><Suspense fallback={<Text style={ui.muted}>미리보기를 여는 중...</Text>}><StoryPreview key={preview.uri} uri={preview.uri} /></Suspense><Button title={preview.saved ? '갤러리 저장 완료' : '갤러리에 저장'} kind="secondary" disabled={busy || preview.saved} onPress={() => void saveFile(preview)} /><Button title="공유하기" disabled={busy} onPress={() => void shareFile(preview)} /></>}</Card>}
    {Platform.OS !== 'android' && <Text style={ui.muted}>영상 제작은 현재 안드로이드 개발 빌드에서 지원해요.</Text>}
  </Page>;
}
