import { useVideoPlayer, VideoView } from 'expo-video';

export default function StoryPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} nativeControls contentFit="contain" style={{ width: '100%', aspectRatio: 9 / 16, maxHeight: 480, backgroundColor: '#080D08', borderRadius: 7 }} />;
}
