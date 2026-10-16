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

type Source = { uri: string; kind: 'image' | 'video'; name: string };
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
  const quests = state.quests.filter(q => q.date === date);
  const stats = dayStats(state, date);
  if (!ready || !state.profile) return <Redirect href="/" />;

  async function selectSources() {
    try {
      const remaining = 3 - sources.length;
      if (!remaining) return;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, selectionLimit: remaining, orderedSelection: true });
      if (result.canceled) return;
      const picked = result.assets.slice(0, remaining).map((asset, i): Source => ({ uri: asset.uri, kind: asset.type === 'video' ? 'video' : 'image', name: asset.fileName || `장면 ${sources.length + i + 1}` }));
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
          quests: quests.map(q => ({ title: q.title, kind: q.kind, status: q.status })),
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
  return <Page backgroundImage={require('../../assets/backgrounds/adventure-home-calm.png')} backgroundOverlayColor="#10150FE8">
    <Pressable accessibilityRole="button" accessibilityLabel="퀘스트로 돌아가기" disabled={busy} onPress={() => router.back()} style={{ alignSelf: 'flex-start', width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: '#263123', borderRadius: 19 }}><Feather name="arrow-left" size={20} color={color.gold} /></Pressable>
    <View><Text accessibilityRole="header" style={ui.title}>스토리 만들기</Text><Text style={ui.muted}>{displayDay(date)} · 실천 장면마다 한 편씩</Text></View>
    <Card><Text style={ui.heading}>실천 사진 · 영상</Text><Text style={ui.muted}>최대 3개 · 선택한 순서대로 각각 스토리 생성</Text>
      {sources.map((source, index) => <View key={`${source.uri}-${index}`} style={[ui.between, { backgroundColor: '#253020', borderRadius: 5, paddingHorizontal: 10, minHeight: 46 }]}><Text numberOfLines={1} style={[ui.text, { flex: 1 }]}>{index + 1}. {source.kind === 'video' ? '영상' : '사진'} · {source.name}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${index + 1}번 장면 제거`} disabled={busy} onPress={() => { setSources(current => current.filter((_, i) => i !== index)); setFiles([]); }} hitSlop={8}><Feather name="x" size={20} color={color.muted} /></Pressable></View>)}
      {sources.length < 3 && <Button title={sources.length ? '장면 더하기' : '사진 · 영상 선택'} kind="secondary" disabled={busy} onPress={() => void selectSources()} />}
    </Card>
    <Card><Text style={ui.heading}>손글씨 계획</Text><Text style={ui.muted}>스토리 측면에 작게 들어가요. 없어도 만들 수 있어요.</Text>
      {!!planUri && <Image source={{ uri: planUri }} resizeMode="contain" style={{ width: '100%', height: 120, backgroundColor: '#10150F', borderRadius: 5 }} />}
      <View style={ui.row}><View style={ui.flex}><Button title={planUri ? '사진 바꾸기' : '계획 사진 선택'} kind="secondary" disabled={busy} onPress={() => void selectPlan()} /></View>{!!planUri && <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setPlanChoice(null); setFiles([]); }} style={{ padding: 12 }}><Text style={[ui.muted, { color: color.red }]}>제외</Text></Pressable>}</View>
    </Card>
    <Card><Text style={ui.heading}>스토리에 표시할 퀘스트</Text>{quests.length ? quests.map(q => <Text key={q.id} numberOfLines={1} style={ui.text}><Text style={{ color: color.gold, fontFamily: font.bold }}>{q.kind === 'main' ? 'M' : 'S'}  </Text>{q.title}</Text>) : <Text style={ui.muted}>이 날짜에 등록한 퀘스트가 없어요.</Text>}</Card>
    <Button title={busy ? `${progress + 1}/${sources.length} 스토리 만드는 중` : `${sources.length || ''}개 스토리 만들기`.trim()} busy={busy} disabled={!sources.length || busy} onPress={() => void exportStories()} />
    {files.length > 0 && <Card><Text style={ui.heading}>완성된 스토리</Text><View style={ui.row}>{files.map((file, i) => <Pressable key={file.uri} accessibilityRole="button" accessibilityState={{ selected: previewIndex === i }} onPress={() => setPreviewIndex(i)} style={{ padding: 10, borderWidth: 1, borderColor: previewIndex === i ? color.gold : color.border, borderRadius: 5 }}><Text style={{ color: previewIndex === i ? color.gold : color.text, fontFamily: font.medium }}>{file.index + 1}번</Text></Pressable>)}</View>{preview && <><Suspense fallback={<Text style={ui.muted}>미리보기를 여는 중...</Text>}><StoryPreview key={preview.uri} uri={preview.uri} /></Suspense><View style={ui.row}><View style={ui.flex}><Button title={preview.saved ? '저장 완료' : '갤러리에 저장'} kind="secondary" disabled={busy || preview.saved} onPress={() => void saveFile(preview)} /></View><View style={ui.flex}><Button title="공유하기" disabled={busy} onPress={() => void shareFile(preview)} /></View></View></>}</Card>}
    {Platform.OS !== 'android' && <Text style={ui.muted}>영상 제작은 현재 안드로이드 개발 빌드에서 지원해요.</Text>}
  </Page>;
}
