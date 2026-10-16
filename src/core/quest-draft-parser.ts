import type { QuestKind } from './domain';

export type QuestDraft = Record<QuestKind, string[]>;

export function parseQuestDraft(output: string, limits: Record<QuestKind, number>): QuestDraft {
  const start = output.indexOf('{');
  const end = output.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI 응답에서 퀘스트를 찾지 못했어요. 다시 시도하거나 직접 입력해주세요.');
  let value: unknown;
  try { value = JSON.parse(output.slice(start, end + 1)); }
  catch { throw new Error('AI 응답 형식이 올바르지 않아요. 다시 시도하거나 직접 입력해주세요.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('AI 응답 형식이 올바르지 않아요.');
  const data = value as Record<string, unknown>;
  const draft = {} as QuestDraft;
  for (const kind of ['main', 'sub'] as const) {
    const titles = data[kind];
    if (!Array.isArray(titles) || titles.length > limits[kind] || titles.some(title => typeof title !== 'string' || title.trim().length > 80)) throw new Error('AI가 퀘스트 개수나 길이를 잘못 만들었어요. 다시 시도해주세요.');
    draft[kind] = Array.from({ length: limits[kind] }, (_, index) => (titles[index] as string | undefined)?.trim() ?? '');
  }
  if (!draft.main.some(Boolean)) throw new Error('메인 퀘스트를 읽지 못했어요. 사진을 다시 선택하거나 직접 입력해주세요.');
  return draft;
}
