import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, growth, initialState, parseState, saveDailyQuestDraft, saveQuest, setQuestStatus, shiftDay, streak, totalXp, validDay } from '../src/core/domain.ts';

function withQuest(date = dayKey()) {
  return { ...initialState(), profile: { name: '모험가', startedAt: dayKey() }, quests: [{ id: 'q1', date, title: '독서', detail: '20쪽', category: '지혜', kind: 'main', xp: 30, status: 'pending' }] };
}
test('완료 반복은 경험치를 중복 지급하지 않고 취소 및 실패는 되돌린다', () => {
  const completed = setQuestStatus(withQuest(), 'q1', 'completed');
  assert.equal(totalXp(setQuestStatus(completed, 'q1', 'completed')), 30);
  assert.equal(totalXp(setQuestStatus(completed, 'q1', 'pending')), 0);
  assert.equal(totalXp(setQuestStatus(completed, 'q1', 'failed')), 0);
});
test('100 경험치 경계에서 레벨과 진행도가 변경된다', () => {
  assert.deepEqual(growth(99), { level: 1, progress: 99, remaining: 1 });
  assert.deepEqual(growth(100), { level: 2, progress: 0, remaining: 100 });
});
test('미래 퀘스트의 완료와 실패는 허용하지 않는다', () => {
  const state = withQuest(shiftDay(dayKey(), 1));
  assert.throws(() => setQuestStatus(state, 'q1', 'completed'));
  assert.throws(() => setQuestStatus(state, 'q1', 'failed'));
});
test('시작 프로필 없이 비어있는 상태와 실제 데이터 모두 직렬화 복원된다', () => {
  for (const state of [initialState(), withQuest()]) {
    const restored = parseState(JSON.parse(JSON.stringify(state)));
    assert.deepEqual(restored.quests, state.quests);
    assert.deepEqual(restored.profile, state.profile);
    assert.equal(restored.selectedTitle, state.profile ? 'adventurer' : null);
    assert.deepEqual(parseState(JSON.parse(JSON.stringify(restored))), restored);
  }
});
test('잘못된 저장 데이터, 중복 퀘스트와 사진 경로 탈출은 거부한다', () => {
  const state = withQuest();
  assert.throws(() => parseState({ ...state, version: 2 }));
  assert.throws(() => parseState({ ...state, quests: [...state.quests, ...state.quests] }));
  assert.throws(() => parseState({ ...state, quests: [{ ...state.quests[0], xp: -1 }] }));
  assert.throws(() => parseState({ ...state, journals: { [dayKey()]: { date: dayKey(), caption: '', photo: 'media/../../data.jpg' } } }));
});
test('로컬 날짜 계산과 연속 달성은 오늘 미완료여도 어제의 연속 기록을 유지한다', () => {
  assert.equal(validDay('2026-02-30'), false);
  assert.equal(validDay('2028-02-29'), true);
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01');
  const state = withQuest('2026-10-12'); state.quests[0].status = 'completed';
  state.quests.push({ ...state.quests[0], id: 'q2', date: '2026-10-11' });
  assert.equal(streak(state, '2026-10-13'), 2);
  assert.equal(streak(state, '2026-10-14'), 0);
});
test('기존 퀘스트는 날짜별 앞의 3개가 메인, 나머지가 서브로 복원된다', () => {
  const state = withQuest();
  state.quests = Array.from({ length: 6 }, (_, index) => ({ ...state.quests[0], id: `old-${index}`, kind: undefined }));
  const restored = parseState(state);
  assert.deepEqual(restored.quests.map(q => q.kind), ['main', 'main', 'main', 'sub', 'sub', 'sub']);
  assert.equal(restored.quests.length, 6);
});
test('새 퀘스트는 하루 메인 3개와 서브 2개까지만 저장한다', () => {
  let state = withQuest();
  const base = state.quests[0];
  state = saveQuest(state, { ...base, id: 'q2' });
  state = saveQuest(state, { ...base, id: 'q3' });
  assert.throws(() => saveQuest(state, { ...base, id: 'q4' }), /3개까지/);
  state = saveQuest(state, { ...base, id: 's1', kind: 'sub' });
  state = saveQuest(state, { ...base, id: 's2', kind: 'sub' });
  assert.throws(() => saveQuest(state, { ...base, id: 's3', kind: 'sub' }), /2개까지/);
  assert.equal(state.quests.length, 5);
  assert.equal(saveQuest(state, { ...base, title: '수정된 독서' }).quests[0].title, '수정된 독서');
});
test('5줄 입력은 메인 최소 1개를 요구하고 XP를 자동 지정한다', () => {
  const date = dayKey();
  assert.throws(() => saveDailyQuestDraft(initialState(), date, { main: ['', '', ''], sub: ['산책', ''] }), /최소 1개/);
  const saved = saveDailyQuestDraft(initialState(), date, { main: ['독서', '', '운동'], sub: ['산책', ''] });
  assert.deepEqual(saved.quests.map(q => [q.kind, q.title, q.xp]), [['main', '독서', 20], ['main', '운동', 20], ['sub', '산책', 10]]);
});
test('5줄 수정은 완료 기록을 보존하고 지운 줄만 삭제한다', () => {
  const date = dayKey();
  let state = saveDailyQuestDraft(initialState(), date, { main: ['독서', '운동', ''], sub: ['산책', ''] });
  const completedId = state.quests[0].id;
  state = setQuestStatus(state, completedId, 'completed');
  const edited = saveDailyQuestDraft(state, date, { main: ['책 읽기', '', ''], sub: ['산책', ''] });
  assert.equal(edited.quests.find(q => q.id === completedId).status, 'completed');
  assert.equal(edited.quests.find(q => q.id === completedId).earnedXp, state.quests[0].earnedXp);
  assert.deepEqual(edited.quests.map(q => q.title), ['책 읽기', '산책']);
});
