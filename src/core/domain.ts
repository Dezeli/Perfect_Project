export type Category = '체력' | '지혜' | '꾸준함' | '생활';
export type QuestStatus = 'pending' | 'completed' | 'failed';
export type QuestKind = 'main' | 'sub';
export type Slot = 'weapon' | 'armor';
export type Quest = {
  id: string; date: string; title: string; detail: string; category: Category;
  kind: QuestKind; xp: number; status: QuestStatus; sourceText?: string; earnedXp?: number;
};
export type Note = { id: string; path: string; ocrText?: string; inputText?: string; ocrAt?: string };
export type Journal = { date: string; caption: string; photo?: string; note?: string; rawText?: string; notes?: Note[] };
export type AppState = {
  version: 1;
  profile: { name: string; startedAt: string; motto?: string } | null;
  quests: Quest[];
  journals: Record<string, Journal>;
  equipped: Record<Slot, string>;
  inventory: string[]; tickets: number; highestLevel: number; dayBonuses: Record<string, number>; selectedTitle: string | null; unlockedAchievements: string[];
  model: { file: string; name: string } | null;
};
export const categories: Category[] = ['체력', '지혜', '꾸준함', '생활'];
export const statusLabels: Record<QuestStatus, string> = { pending: '진행 중', completed: '완료', failed: '미달성' };
export const questKindLimits: Record<QuestKind, number> = { main: 3, sub: 2 };
export const questXp: Record<QuestKind, number> = { main: 20, sub: 10 };
export type Equipment = { id: string; slot: Slot; name: string; rarity: '일반' | '희귀' | '영웅'; description: string; flat?: number; percent?: number; category?: Category; first?: number; allClear?: number };
export const equipment: Equipment[] = [
  { id: 'wood-sword', slot: 'weapon', name: '기본 나무 검', rarity: '일반', description: '추가 효과 없음' },
  { id: 'iron-sword', slot: 'weapon', name: '철 검', rarity: '일반', description: '퀘스트 달성 시 +3 XP', flat: 3 },
  { id: 'training-sword', slot: 'weapon', name: '수련의 검', rarity: '희귀', description: '체력 퀘스트 달성 시 +7 XP', flat: 7, category: '체력' },
  { id: 'sage-staff', slot: 'weapon', name: '현자의 지팡이', rarity: '희귀', description: '지혜 퀘스트 달성 시 +7 XP', flat: 7, category: '지혜' },
  { id: 'star-sword', slot: 'weapon', name: '별빛 검', rarity: '영웅', description: '퀘스트 경험치 +15%, 달성 시 +2 XP', percent: 15, flat: 2 },
  { id: 'traveler-coat', slot: 'armor', name: '기본 옷', rarity: '일반', description: '추가 효과 없음' },
  { id: 'forest-coat', slot: 'armor', name: '숲의 망토', rarity: '희귀', description: '하루 첫 달성 시 +5 XP', first: 5 },
  { id: 'guardian-coat', slot: 'armor', name: '수호자의 갑옷', rarity: '영웅', description: '하루 퀘스트 모두 달성 시 +9 XP', allClear: 9 },
];
export function initialState(): AppState {
  return { version: 1, profile: null, quests: [], journals: {}, equipped: { weapon: 'wood-sword', armor: 'traveler-coat' }, inventory: ['wood-sword', 'traveler-coat'], tickets: 0, highestLevel: 1, dayBonuses: {}, selectedTitle: null, unlockedAchievements: [], model: null };
}
export function rewardXp(q: Quest) { return q.earnedXp ?? q.xp; }
function dailyBonus(state: AppState, date: string) {
  const quests = state.quests.filter(q => q.date === date);
  return quests.length && quests.every(q => q.status === 'completed') ? state.dayBonuses[date] ?? 0 : 0;
}
export function settleGrowth(state: AppState): AppState {
  const level = growth(totalXp(state)).level;
  const unlockedAchievements = [...new Set([...state.unlockedAchievements, ...achievements(state).filter(a => a.progress >= a.goal).map(a => a.id)])];
  return { ...state, highestLevel: Math.max(state.highestLevel, level), tickets: state.tickets + Math.max(0, level - state.highestLevel), unlockedAchievements };
}
export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.valueOf()) && dayKey(date) === value;
}
export function shiftDay(date: string, offset: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + offset);
  return dayKey(value);
}
export function displayDay(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}
export function displayShortDay(date: string): string { return `${date.slice(2, 4)}년 ${displayDay(date)}`; }
export function newId(): string { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
export function totalXp(state: AppState, through = dayKey()): number {
  return state.quests.filter(q => q.status === 'completed' && q.date <= through).reduce((sum, q) => sum + rewardXp(q), 0) + Object.keys(state.dayBonuses).filter(date => date <= through).reduce((sum, date) => sum + dailyBonus(state, date), 0);
}
export function growth(xp: number) { return { level: 1 + Math.floor(xp / 100), progress: xp % 100, remaining: 100 - xp % 100 }; }
export function dayStats(state: AppState, date: string) {
  const quests = state.quests.filter(q => q.date === date);
  const done = quests.filter(q => q.status === 'completed');
  return { total: quests.length, completed: done.length, failed: quests.filter(q => q.status === 'failed').length, xp: done.reduce((sum, q) => sum + rewardXp(q), 0) + dailyBonus(state, date), rate: quests.length ? Math.round(done.length / quests.length * 100) : 0 };
}
export function streak(state: AppState, today = dayKey()): number {
  let cursor = dayStats(state, today).completed ? today : shiftDay(today, -1);
  let count = 0;
  while (dayStats(state, cursor).completed > 0) { count++; cursor = shiftDay(cursor, -1); }
  return count;
}
export type Achievement = { id: string; title: string; description: string; progress: number; goal: number; progressText: string; unlocked: boolean };
export function achievements(state: AppState): Achievement[] {
  const today = dayKey();
  const completed = state.quests.filter(q => q.status === 'completed' && q.date <= today).length;
  const dates = [...new Set(state.quests.filter(q => q.date <= today).map(q => q.date))].sort();
  const cleared = dates.filter(date => state.quests.some(q => q.date === date) && state.quests.filter(q => q.date === date).every(q => q.status === 'completed')).length;
  let longest = 0; let current = 0; let previous = '';
  for (const date of dates.filter(d => state.quests.some(q => q.date === d && q.status === 'completed'))) {
    current = previous && shiftDay(previous, 1) === date ? current + 1 : 1;
    longest = Math.max(longest, current); previous = date;
  }
  const level = growth(totalXp(state, today)).level;
  const definitions = [
    { id: 'adventurer', title: '모험가', description: '처음으로 프로젝트를 시작했습니다', progress: state.profile ? 1 : 0, goal: 1, current: '0 / 1' },
    { id: 'first-step', title: '첫걸음', description: '퀘스트 1개 달성', progress: completed, goal: 1, current: `${Math.min(completed, 1)} / 1` },
    { id: 'steady', title: '꾸준한 모험가', description: '퀘스트 10개 달성', progress: completed, goal: 10, current: `${Math.min(completed, 10)} / 10` },
    { id: 'veteran', title: '베테랑', description: '레벨 5 달성', progress: level, goal: 5, current: `Lv. ${Math.min(level, 5)} / 5` },
    { id: 'seven-days', title: '칠일 전사', description: '7일 연속 퀘스트 달성', progress: longest, goal: 7, current: `${Math.min(longest, 7)} / 7일` },
    { id: 'perfectionist', title: '완벽주의자', description: '하루 퀘스트 모두 달성 3회', progress: cleared, goal: 3, current: `${Math.min(cleared, 3)} / 3일` },
  ];
  return definitions.map(({ current, ...item }) => {
    const unlocked = state.unlockedAchievements.includes(item.id) || item.progress >= item.goal;
    return { ...item, unlocked, progressText: unlocked ? '획득' : current };
  });
}
export function selectTitle(state: AppState, id: string | null): AppState {
  if (id !== null && !achievements(state).some(a => a.id === id && a.unlocked)) throw new Error('아직 획득하지 않은 호칭이에요.');
  return { ...state, selectedTitle: id };
}
export function activeEquipment(state: AppState, slot: Slot) {
  return equipment.find(e => e.id === state.equipped[slot] && e.slot === slot && state.inventory.includes(e.id)) ?? equipment.find(e => e.slot === slot)!;
}
export function setQuestStatus(state: AppState, id: string, status: QuestStatus): AppState {
  const quest = state.quests.find(q => q.id === id);
  if (!quest) throw new Error('퀘스트를 찾을 수 없어요.');
  if (quest.date > dayKey() && status !== 'pending') throw new Error('미래 퀘스트는 해당 날짜에 완료할 수 있어요.');
  if (quest.status === status) return state;
  const weapon = activeEquipment(state, 'weapon');
  const armor = activeEquipment(state, 'armor');
  const eligible = !weapon.category || weapon.category === quest.category;
  const first = !state.quests.some(q => q.id !== id && q.date === quest.date && (q.status === 'completed' || q.earnedXp !== undefined));
  const earnedXp = quest.earnedXp ?? (Math.floor(quest.xp * (100 + (eligible ? weapon.percent ?? 0 : 0)) / 100) + (eligible ? weapon.flat ?? 0 : 0) + (first ? armor.first ?? 0 : 0));
  let next = { ...state, quests: state.quests.map(q => q.id === id ? { ...q, status, ...(status === 'completed' ? { earnedXp } : {}) } : q) };
  if (status === 'completed' && next.quests.filter(q => q.date === quest.date).every(q => q.status === 'completed') && !(quest.date in state.dayBonuses)) {
    next = { ...next, dayBonuses: { ...next.dayBonuses, [quest.date]: armor.allClear ?? 0 } };
  }
  return settleGrowth(next);
}
export function equip(state: AppState, id: string): AppState {
  const item = equipment.find(e => e.id === id);
  if (!item || !state.inventory.includes(id)) throw new Error('보유하지 않은 장비예요.');
  return { ...state, equipped: { ...state.equipped, [item.slot]: id } };
}
export function drawEquipment(state: AppState, roll = Math.random(), choice = Math.random()): { state: AppState; item: Equipment; duplicate: boolean } {
  if (!state.tickets) throw new Error('레벨을 올려 뽑기권을 모아주세요.');
  if (!Number.isFinite(roll) || !Number.isFinite(choice) || roll < 0 || roll >= 1 || choice < 0 || choice >= 1) throw new Error('잘못된 추첨 값이에요.');
  const rarity = roll < 0.6 ? '일반' : roll < 0.9 ? '희귀' : '영웅';
  const pool = equipment.filter(e => e.rarity === rarity && !['wood-sword', 'traveler-coat'].includes(e.id));
  const item = pool[Math.floor(choice * pool.length)];
  const duplicate = state.inventory.includes(item.id);
  return { state: { ...state, tickets: state.tickets - 1, inventory: duplicate ? state.inventory : [...state.inventory, item.id] }, item, duplicate };
}
export function mediaPaths(state: AppState): string[] {
  return [...new Set(Object.values(state.journals).flatMap(j => [j.photo, j.note, ...(j.notes ?? []).map(n => n.path)]).filter((p): p is string => !!p))];
}
export function addNote(state: AppState, date: string, note: Note): AppState {
  if (!validDay(date) || !safeMediaPath(note.path)) throw new Error('노트 날짜 또는 사진 경로가 올바르지 않아요.');
  const journal = state.journals[date] ?? { date, caption: '' };
  const notes = journal.notes ?? [];
  if (notes.some(n => n.id === note.id)) throw new Error('이미 등록한 사진이에요.');
  if (notes.length >= 30) throw new Error('초안에서는 하루에 노트 사진 30장까지 보관할 수 있어요.');
  return { ...state, journals: { ...state.journals, [date]: { ...journal, notes: [...notes, note] } } };
}
export function updateNote(state: AppState, date: string, id: string, update: Partial<Pick<Note, 'ocrText' | 'inputText' | 'ocrAt'>>): AppState {
  const journal = state.journals[date];
  if (!journal?.notes?.some(n => n.id === id)) throw new Error('저장된 노트를 찾을 수 없어요.');
  return { ...state, journals: { ...state.journals, [date]: { ...journal, notes: journal.notes.map(n => n.id === id ? { ...n, ...update } : n) } } };
}
export function removeNote(state: AppState, date: string, id: string): AppState {
  const journal = state.journals[date];
  if (!journal) return state;
  return { ...state, journals: { ...state.journals, [date]: { ...journal, notes: (journal.notes ?? []).filter(n => n.id !== id) } } };
}

// 백업과 저장 데이터의 형태만 검증합니다. OCR 텍스트를 교정하거나 해석하지 않습니다.
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('데이터 형식이 올바르지 않아요.');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number, required = false): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error('문자열 데이터가 올바르지 않아요.');
  return value;
}
export function safeMediaPath(value: unknown): value is string {
  return typeof value === 'string' && /^media\/[a-zA-Z0-9_-]+\.jpg$/.test(value);
}
export function validateQuest(value: unknown): Quest {
  const q = object(value);
  if (!validDay(q.date) || !categories.includes(q.category as Category) || !['pending', 'completed', 'failed'].includes(q.status as string)
    || (q.kind !== undefined && q.kind !== 'main' && q.kind !== 'sub')
    || !Number.isInteger(q.xp) || (q.xp as number) < 1 || (q.xp as number) > 100) throw new Error('퀘스트 데이터가 올바르지 않아요.');
  if (q.earnedXp !== undefined && (!Number.isInteger(q.earnedXp) || (q.earnedXp as number) < 1 || (q.earnedXp as number) > 300)) throw new Error('성장 또는 경험치 데이터가 올바르지 않아요.');
  return { ...(q.earnedXp === undefined ? {} : { earnedXp: q.earnedXp as number }), id: text(q.id, 100, true), date: q.date, title: text(q.title, 80, true), detail: text(q.detail, 300), category: q.category as Category, kind: (q.kind ?? 'main') as QuestKind, xp: q.xp as number, status: q.status as QuestStatus, ...(q.sourceText === undefined ? {} : { sourceText: text(q.sourceText, 4000) }) };
}
export function saveQuest(state: AppState, quest: Quest): AppState {
  const existing = state.quests.find(q => q.id === quest.id);
  const sameSlot = existing?.date === quest.date && existing.kind === quest.kind;
  const count = state.quests.filter(q => q.id !== quest.id && q.date === quest.date && q.kind === quest.kind).length;
  if (!sameSlot && count >= questKindLimits[quest.kind]) throw new Error(`${quest.kind === 'main' ? '메인' : '서브'} 퀘스트는 하루에 ${questKindLimits[quest.kind]}개까지 등록할 수 있어요.`);
  return { ...state, quests: existing ? state.quests.map(q => q.id === quest.id ? quest : q) : [...state.quests, quest] };
}
export function saveDailyQuestDraft(state: AppState, date: string, draft: Record<QuestKind, string[]>): AppState {
  if (!validDay(date) || draft.main.length !== questKindLimits.main || draft.sub.length !== questKindLimits.sub) throw new Error('퀘스트 입력 형식이 올바르지 않아요.');
  const mainTitles = draft.main.map(title => title.trim());
  const subTitles = draft.sub.map(title => title.trim());
  if (!mainTitles.some(Boolean)) throw new Error('메인 퀘스트를 최소 1개 입력해주세요.');
  if ([...mainTitles, ...subTitles].some(title => title.length > 80)) throw new Error('퀘스트 이름은 80자까지 입력할 수 있어요.');
  const daily = state.quests.filter(q => q.date === date);
  const next: Quest[] = [];
  for (const [kind, titles] of [['main', mainTitles], ['sub', subTitles]] as const) {
    const existing = daily.filter(q => q.kind === kind);
    titles.forEach((title, index) => {
      if (!title) return;
      next.push(existing[index] ? { ...existing[index], title } : { id: newId(), date, title, detail: '', category: '꾸준함', kind, xp: questXp[kind], status: 'pending' });
    });
    next.push(...existing.slice(questKindLimits[kind]));
  }
  return { ...state, quests: [...state.quests.filter(q => q.date !== date), ...next] };
}
export function parseState(value: unknown): AppState {
  const data = object(value);
  if (data.version !== 1 || !Array.isArray(data.quests) || data.quests.length > 20000) throw new Error('지원하지 않는 데이터 버전 또는 크기예요.');
  let profile: AppState['profile'] = null;
  if (data.profile !== null) {
    const p = object(data.profile);
    if (!validDay(p.startedAt)) throw new Error('프로필 날짜가 올바르지 않아요.');
    profile = { name: text(p.name, 20, true), startedAt: p.startedAt, ...(p.motto === undefined ? {} : { motto: text(p.motto, 160) }) };
  }
  const legacyCountByDate = new Map<string, number>();
  const quests = data.quests.map(value => {
    const quest = validateQuest(value);
    if (!(value as Record<string, unknown>).kind) {
      const count = legacyCountByDate.get(quest.date) ?? 0;
      quest.kind = count < questKindLimits.main ? 'main' : 'sub';
      legacyCountByDate.set(quest.date, count + 1);
    }
    return quest.status === 'completed' && quest.earnedXp === undefined ? { ...quest, earnedXp: quest.xp } : quest;
  });
  if (new Set(quests.map(q => q.id)).size !== quests.length) throw new Error('중복된 퀘스트가 있어요.');
  const journals: Record<string, Journal> = {};
  const rawJournals = object(data.journals);
  if (Object.keys(rawJournals).length > 10000) throw new Error('기록이 너무 많아요.');
  for (const [date, value] of Object.entries(rawJournals)) {
    const j = object(value);
    if (!validDay(date) || j.date !== date) throw new Error('기록 날짜가 올바르지 않아요.');
    for (const path of [j.photo, j.note]) if (path !== undefined && !safeMediaPath(path)) throw new Error('사진 경로가 올바르지 않아요.');
    const notes: Note[] = [];
    if (j.notes !== undefined) {
      if (!Array.isArray(j.notes) || j.notes.length > 30) throw new Error('노트 사진 목록이 올바르지 않아요.');
      for (const value of j.notes) {
        const n = object(value);
        if (!safeMediaPath(n.path)) throw new Error('노트 사진 경로가 올바르지 않아요.');
        if (n.ocrAt !== undefined && (typeof n.ocrAt !== 'string' || !Number.isFinite(Date.parse(n.ocrAt)))) throw new Error('인식 날짜가 올바르지 않아요.');
        notes.push({ id: text(n.id, 100, true), path: n.path, ...(n.ocrText === undefined ? {} : { ocrText: text(n.ocrText, 12000) }), ...(n.inputText === undefined ? {} : { inputText: text(n.inputText, 12000) }), ...(n.ocrAt === undefined ? {} : { ocrAt: n.ocrAt as string }) });
      }
      if (new Set(notes.map(n => n.id)).size !== notes.length) throw new Error('중복된 노트가 있어요.');
    }
    if (j.note && !notes.some(n => n.path === j.note)) notes.push({ id: `legacy-${date}`, path: j.note as string, ...(j.rawText === undefined ? {} : { inputText: text(j.rawText, 4000) }) });
    if (notes.length > 30 || new Set(notes.map(n => n.id)).size !== notes.length) throw new Error('노트 사진 목록이 올바르지 않아요.');
    journals[date] = { date, caption: text(j.caption, 200), ...(j.photo ? { photo: j.photo as string } : {}), ...(notes.length || j.notes !== undefined || j.note ? { notes } : {}), ...(j.rawText === undefined ? {} : { rawText: text(j.rawText, 4000) }) };
  }
  const savedEquipment = object(data.equipped);
  const equipped = { ...initialState().equipped };
  for (const slot of ['weapon', 'armor'] as Slot[]) {
    if (!equipment.some(e => e.id === savedEquipment[slot] && e.slot === slot)) throw new Error('장비 데이터가 올바르지 않아요.');
    equipped[slot] = savedEquipment[slot] as string;
  }
  let model: AppState['model'] = null;
  if (data.model != null) {
    const m = object(data.model);
    if (typeof m.file !== 'string' || !/^models\/[a-zA-Z0-9_-]+\.gguf$/.test(m.file)) throw new Error('모델 경로가 올바르지 않아요.');
    model = { file: m.file, name: text(m.name, 150, true) };
  }
  const inventory = data.inventory === undefined ? [...new Set([...initialState().inventory, ...Object.values(equipped)])] : data.inventory;
  if (!Array.isArray(inventory) || inventory.length > equipment.length || new Set(inventory).size !== inventory.length || inventory.some(id => !equipment.some(e => e.id === id)) || Object.values(equipped).some(id => !inventory.includes(id))) throw new Error('보유 장비 데이터가 올바르지 않아요.');
  const dayBonuses: Record<string, number> = {};
  for (const [date, bonus] of Object.entries(object(data.dayBonuses ?? {}))) {
    if (!validDay(date) || !Number.isInteger(bonus) || (bonus as number) < 0 || (bonus as number) > 100) throw new Error('일일 보상 데이터가 올바르지 않아요.');
    dayBonuses[date] = bonus as number;
  }
  const legacyLevel = growth(quests.filter(q => q.status === 'completed' && q.date <= dayKey()).reduce((sum, q) => sum + rewardXp(q), 0)).level;
  const tickets = data.tickets ?? 0; const highestLevel = data.highestLevel ?? legacyLevel;
  if (!Number.isInteger(tickets) || (tickets as number) < 0 || !Number.isInteger(highestLevel) || (highestLevel as number) < 1 || (tickets as number) >= (highestLevel as number)) throw new Error('성장 또는 경험치 데이터가 올바르지 않아요.');
  const achievementIds = ['adventurer', 'first-step', 'steady', 'veteran', 'seven-days', 'perfectionist'];
  const savedAchievements = data.unlockedAchievements ?? [];
  if (!Array.isArray(savedAchievements) || new Set(savedAchievements).size !== savedAchievements.length || savedAchievements.some(id => typeof id !== 'string' || !achievementIds.includes(id))) throw new Error('도전과제 데이터가 올바르지 않아요.');
  const selectedTitle = data.selectedTitle ?? (profile ? 'adventurer' : null);
  if (selectedTitle !== null && (typeof selectedTitle !== 'string' || !achievementIds.includes(selectedTitle))) throw new Error('선택한 호칭 데이터가 올바르지 않아요.');
  const parsed = { version: 1 as const, profile, quests, journals, equipped, inventory: inventory as string[], tickets: tickets as number, highestLevel: highestLevel as number, dayBonuses, selectedTitle: selectedTitle as string | null, unlockedAchievements: savedAchievements as string[], model };
  const unlockedAchievements = [...new Set([...parsed.unlockedAchievements, ...achievements(parsed).filter(a => a.progress >= a.goal).map(a => a.id)])];
  const result = { ...parsed, unlockedAchievements };
  if (result.selectedTitle && !result.unlockedAchievements.includes(result.selectedTitle)) throw new Error('획득하지 않은 호칭이 선택되어 있어요.');
  return result;
}

export type Interpretation = { correctedText: string; warnings: string[]; quests: Omit<Quest, 'id' | 'xp'>[] };
export function parseInterpretation(value: unknown): Interpretation {
  const data = object(value);
  if (!Array.isArray(data.quests) || data.quests.length > 12 || !Array.isArray(data.warnings) || data.warnings.length > 12) throw new Error('AI 응답 형식이 올바르지 않아요. 텍스트를 줄여 다시 분석해주세요.');
  return {
    correctedText: text(data.correctedText, 4000), warnings: data.warnings.map(w => text(w, 300)),
    quests: data.quests.map((value, i) => {
      const q = object(value);
      const result = validateQuest({ ...q, id: `ai-${i}`, xp: 20 });
      return { date: result.date, title: result.title, detail: result.detail, category: result.category, kind: result.kind, status: result.status, sourceText: result.sourceText };
    }),
  };
}
