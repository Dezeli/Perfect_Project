import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { newId, safeMediaPath } from './domain';
import { persistPhoto } from './persist-photo';

export function noteFile(path: string): File {
  if (!safeMediaPath(path)) throw new Error('사진 경로가 올바르지 않아요.');
  return new File(Paths.document, path);
}
export function noteUri(path: string): string { return noteFile(path).uri; }
export function discardNotePhoto(path: string): void {
  try { const file = noteFile(path); if (file.exists) file.delete(); } catch { /* 기록 삭제는 파일 정리 실패에도 유지합니다. */ }
}
export async function selectNotePhoto(source: 'camera' | 'library'): Promise<string | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('카메라 권한이 필요해요. 휴대폰 설정에서 허용해주세요.');
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, quality: 1 };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  let cache: File | undefined;
  let saved: File | undefined;
  try {
    if (Math.max(asset.width, asset.height) > 2048) context.resize(asset.width >= asset.height ? { width: 2048 } : { height: 2048 });
    rendered = await context.renderAsync();
    const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.92 });
    cache = new File(image.uri);
    new Directory(Paths.document, 'media').create({ idempotent: true, intermediates: true });
    const path = `media/${newId()}.jpg`;
    saved = noteFile(path);
    await persistPhoto<File>(cache, saved);
    return path;
  } catch (err) {
    try { if (saved?.exists) saved.delete(); } catch { /* 원래 저장 오류를 유지합니다. */ }
    throw err;
  } finally {
    rendered?.release(); context.release();
    try { if (cache?.exists) cache.delete(); } catch { /* 캐시는 OS가 정리할 수 있습니다. */ }
  }
}
