import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, dayStats, drawEquipment, equip, initialState, parseState, setQuestStatus, totalXp } from '../src/core/domain.ts';

function fixture(xp = 50) {
  return { ...initialState(), quests: ['a', 'b'].map(id => ({ id, date: dayKey(), title: id, detail: '', category: '체력', kind: 'main', xp, status: 'pending' })) };
}
test('장비를 바꿔도 기존 보상과 완료 취소 후 재달성 보상이 유지된다', () => {
  let s = setQuestStatus(fixture(), 'a', 'completed');
  assert.equal(totalXp(s), 50);
  s = equip({ ...s, inventory: [...s.inventory, 'star-sword'] }, 'star-sword');
  assert.equal(totalXp(s), 50);
  s = setQuestStatus(setQuestStatus(s, 'a', 'pending'), 'a', 'completed');
  assert.equal(totalXp(s), 50);
  s = setQuestStatus(s, 'b', 'completed');
  assert.equal(totalXp(s), 109);
});
test('같은 레벨을 다시 달성해도 뽑기권이 추가 지급되지 않는다', () => {
  let s = setQuestStatus(setQuestStatus(fixture(), 'a', 'completed'), 'b', 'completed');
  assert.equal(s.tickets, 1);
  s = setQuestStatus(setQuestStatus(s, 'b', 'pending'), 'b', 'completed');
  assert.equal(s.tickets, 1);
  assert.deepEqual(parseState(JSON.parse(JSON.stringify(s))), s);
});
test('올클리어 보상은 취소 시 회수하고 장비 변경 후 재달성해도 유지한다', () => {
  let s = fixture(20);
  s = equip({ ...s, inventory: [...s.inventory, 'guardian-coat'] }, 'guardian-coat');
  s = setQuestStatus(setQuestStatus(s, 'a', 'completed'), 'b', 'completed');
  assert.equal(dayStats(s, dayKey()).xp, 49);
  s = setQuestStatus(s, 'b', 'pending');
  assert.equal(totalXp(s), 20);
  s = equip(s, 'traveler-coat');
  assert.equal(totalXp(setQuestStatus(s, 'b', 'completed')), 49);
});
test('추첨은 등급과 장비를 정하고 중복 시에도 뽑기권을 소비한다', () => {
  const s = { ...initialState(), tickets: 1, highestLevel: 2 };
  const rare = drawEquipment(s, 0.7, 0);
  assert.equal(rare.item.rarity, '희귀');
  assert.equal(rare.state.tickets, 0);
  assert.ok(rare.state.inventory.includes(rare.item.id));
  const first = drawEquipment(s, 0, 0);
  assert.equal(first.duplicate, false);
  assert.equal(first.item.id, 'iron-sword');
  const duplicate = drawEquipment({ ...first.state, tickets: 1 }, 0, 0);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.state.tickets, 0);
  assert.throws(() => drawEquipment(initialState()));
  assert.throws(() => equip(initialState(), 'star-sword'));
});
test('이전 세 슬롯 저장 데이터는 두 슬롯으로 옮기며 기존 경험치를 보존한다', () => {
  const old = fixture();
  delete old.inventory; delete old.tickets; delete old.highestLevel; delete old.dayBonuses;
  old.equipped.accessory = 'notebook'; old.quests[0].status = 'completed';
  const s = parseState(old);
  assert.equal(totalXp(s), 50);
  assert.equal('accessory' in s.equipped, false);
  assert.equal(totalXp(setQuestStatus(setQuestStatus(s, 'a', 'pending'), 'a', 'completed')), 50);
});
