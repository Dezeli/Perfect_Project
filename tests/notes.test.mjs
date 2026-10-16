import test from 'node:test';
import assert from 'node:assert/strict';
import { addNote, initialState, mediaPaths, parseState, removeNote, totalXp, updateNote } from '../src/core/domain.ts';

const date = '2026-10-13';
test('한 날짜의 여러 노트와 날짜가 다른 노트를 따로 보관한다', () => {
  let state = addNote(initialState(), date, { id: 'n1', path: 'media/one.jpg' });
  state = addNote(state, date, { id: 'n2', path: 'media/two.jpg' });
  state = addNote(state, '2026-10-14', { id: 'n3', path: 'media/three.jpg' });
  assert.equal(state.journals[date].notes.length, 2);
  assert.equal(state.journals['2026-10-14'].notes.length, 1);
  assert.deepEqual(parseState(JSON.parse(JSON.stringify(state))), state);
});
test('OCR 원문과 의도적으로 잘못 적은 AI 테스트 입력은 서로 덮어쓰지 않는다', () => {
  let state = addNote(initialState(), date, { id: 'n1', path: 'media/one.jpg' });
  state = updateNote(state, date, 'n1', { ocrText: '독서 20쪽', ocrAt: '2026-10-13T00:00:00Z' });
  state = updateNote(state, date, 'n1', { inputText: '독서 2O쭉' });
  state = updateNote(state, date, 'n1', { ocrText: '독서 20 쪽', ocrAt: '2026-10-13T01:00:00Z' });
  const note = parseState(JSON.parse(JSON.stringify(state))).journals[date].notes[0];
  assert.equal(note.ocrText, '독서 20 쪽');
  assert.equal(note.inputText, '독서 2O쭉');
  assert.equal(state.quests.length, 0);
  assert.equal(totalXp(state), 0);
});
test('사진 한 장 삭제 시 다른 노트와 날짜별 기록은 보존한다', () => {
  let state = addNote(initialState(), date, { id: 'n1', path: 'media/one.jpg' });
  state = addNote(state, date, { id: 'n2', path: 'media/two.jpg', inputText: '기록' });
  const next = removeNote(state, date, 'n1');
  assert.deepEqual(next.journals[date].notes, [state.journals[date].notes[1]]);
  assert.deepEqual(mediaPaths(next), ['media/two.jpg']);
  assert.equal(state.journals[date].notes.length, 2);
});
test('기존 단일 사진 데이터는 여러 장 목록으로 옮겨진다', () => {
  const state = { ...initialState(), journals: { [date]: { date, caption: '오늘의 기록', note: 'media/legacy.jpg', rawText: '독서 20쪽' } } };
  const migrated = parseState(state);
  assert.equal(migrated.journals[date].notes[0].path, 'media/legacy.jpg');
  assert.equal(migrated.journals[date].notes[0].inputText, '독서 20쪽');
  assert.deepEqual(parseState(JSON.parse(JSON.stringify(migrated))), migrated);
});
test('중복 ID, 잘못된 경로와 과도한 텍스트를 저장 데이터로 허용하지 않는다', () => {
  const note = { id: 'n1', path: 'media/one.jpg' };
  const state = addNote(initialState(), date, note);
  assert.throws(() => addNote(state, date, note));
  assert.throws(() => addNote(state, date, { id: 'n2', path: '../one.jpg' }));
  assert.throws(() => parseState(updateNote(state, date, 'n1', { inputText: 'a'.repeat(12001) })));
  assert.throws(() => parseState({ ...state, journals: { [date]: { date, caption: '', notes: [note, note] } } }));
  assert.throws(() => updateNote(state, date, 'missing', { inputText: '내용' }));
});
