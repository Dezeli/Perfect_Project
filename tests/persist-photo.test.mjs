import test from 'node:test';
import assert from 'node:assert/strict';
import { persistPhoto } from '../src/core/persist-photo.ts';

function fixture() {
  const events = [];
  const destination = { exists: false, size: 0, delete() { events.push('delete-destination'); this.exists = false; } };
  const source = { exists: true, delete() { events.push('delete-source'); this.exists = false; }, async copy(target) { target.exists = true; target.size = 100; } };
  return { source, destination, events };
}

test('느린 비동기 복사가 완료되기 전에는 캐시 삭제나 저장 완료가 일어나지 않는다', async () => {
  const { source, destination, events } = fixture();
  let finish;
  let returned = false;
  source.copy = target => new Promise(resolve => { finish = () => { assert.equal(source.exists, true); events.push('copy-completed'); target.exists = true; target.size = 100; resolve(); }; });
  const pending = persistPhoto(source, destination).then(() => { returned = true; });
  await Promise.resolve();
  assert.equal(returned, false);
  assert.equal(source.exists, true);
  assert.deepEqual(events, []);
  finish();
  await pending;
  assert.equal(destination.exists, true);
  assert.equal(returned, true);
  assert.deepEqual(events, ['copy-completed', 'delete-source']);
});

test('복사 실패를 호출자에게 전달하고 부분 저장 파일과 캐시를 정리한다', async () => {
  const { source, destination, events } = fixture();
  const failure = new Error('NoSuchFileException');
  source.copy = async target => { target.exists = true; throw failure; };
  await assert.rejects(persistPhoto(source, destination), error => error === failure);
  assert.deepEqual(events, ['delete-destination', 'delete-source']);
  assert.equal(destination.exists, false);
});

test('복사가 종료되어도 파일이 없거나 비어 있으면 성공으로 처리하지 않는다', async () => {
  for (const exists of [false, true]) {
    const { source, destination } = fixture();
    source.copy = async target => { target.exists = exists; target.size = 0; };
    await assert.rejects(persistPhoto(source, destination), /사진이 저장되지/);
    assert.equal(source.exists, false);
  }
});
