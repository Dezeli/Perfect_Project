import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuestDraft } from '../src/core/quest-draft-parser.ts';
import { questKindLimits } from '../src/core/domain.ts';

test('AI JSON 응답을 메인 3줄·서브 2줄 초안으로 만든다', () => {
  assert.deepEqual(parseQuestDraft('```json\n{"main":[" 30분 걷기 ","독서"],"sub":["스트레칭"]}\n```', questKindLimits), {
    main: ['30분 걷기', '독서', ''], sub: ['스트레칭', ''],
  });
});

test('빈 메인, 초과 개수, 잘못된 JSON을 거부한다', () => {
  assert.throws(() => parseQuestDraft('{"main":[],"sub":["독서"]}', questKindLimits));
  assert.throws(() => parseQuestDraft('{"main":["a","b","c","d"],"sub":[]}', questKindLimits));
  assert.throws(() => parseQuestDraft('설명만 있는 응답', questKindLimits));
});
