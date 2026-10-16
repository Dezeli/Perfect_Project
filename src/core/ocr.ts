import PerfectOcrModule from '../../modules/perfect-ocr/src/PerfectOcrModule';
import { noteFile } from './note-media';

export const ocrAvailable = PerfectOcrModule !== null;
let recognizing = false;
export async function recognizeNote(path: string): Promise<string> {
  if (!PerfectOcrModule) throw new Error('자동 OCR은 안드로이드 개발용 APK에서 사용할 수 있어요. Expo Go에서는 텍스트를 직접 입력해 저장할 수 있어요.');
  if (recognizing) throw new Error('이전 사진을 인식하고 있어요. 잠시 기다려주세요.');
  const file = noteFile(path);
  if (!file.exists) throw new Error('사진 파일을 찾을 수 없어요. 다시 등록해주세요.');
  recognizing = true;
  try {
    const raw = await PerfectOcrModule.recognize(file.uri);
    if (typeof raw !== 'string') throw new Error('인식 결과 형식이 올바르지 않아요.');
    if (raw.length > 12000) throw new Error('인식한 내용이 12,000자를 넘어요. 사진 영역을 나누어 등록해주세요.');
    return raw;
  } finally { recognizing = false; }
}
