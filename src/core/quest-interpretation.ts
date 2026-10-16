import PerfectOcrModule from '../../modules/perfect-ocr/src/PerfectOcrModule';
import { questKindLimits } from './domain';
import { parseQuestDraft, type QuestDraft } from './quest-draft-parser';

export async function questAiStatus() {
  if (!PerfectOcrModule) throw new Error('손글씨 인식과 기기 AI는 안드로이드 개발용 앱에서 사용할 수 있어요. Expo Go에서는 직접 입력해주세요.');
  return PerfectOcrModule.aiStatus();
}

export async function downloadQuestAi() {
  if (!PerfectOcrModule) throw new Error('기기 AI를 사용할 수 없어요.');
  await PerfectOcrModule.downloadAi();
}

export async function interpretQuestText(rawText: string): Promise<QuestDraft> {
  if (!PerfectOcrModule) throw new Error('기기 AI를 사용할 수 없어요.');
  if (!rawText.trim()) throw new Error('사진에서 읽은 글자가 없어요.');
  return parseQuestDraft(await PerfectOcrModule.interpret(rawText), questKindLimits);
}
