import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import * as SQLite from 'expo-sqlite';
import { AppState, initialState, parseState, settleGrowth } from './domain';

type Store = { state: AppState; ready: boolean; error: string | null; clearError: () => void; mutate: (update: (current: AppState) => AppState) => Promise<void>; reload: () => void };
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const current = useRef(state);
  const db = useRef<SQLite.SQLiteDatabase | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let live = true;
    async function load() {
      try {
        const database = await SQLite.openDatabaseAsync('perfect-project.db');
        await database.execAsync('PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL);');
        const row = await database.getFirstAsync<{ payload: string }>('SELECT payload FROM app_state WHERE id = 1');
        const loaded = row ? parseState(JSON.parse(row.payload)) : initialState();
        if (live) { db.current = database; current.current = loaded; setState(loaded); setReady(true); setError(null); }
      } catch (err) { if (live) setError(`기록을 불러오지 못했어요. ${err instanceof Error ? err.message : String(err)}`); }
    }
    void load();
    return () => { live = false; };
  }, [attempt]);

  function mutate(update: (state: AppState) => AppState): Promise<void> {
    const task = queue.current.then(async () => {
      if (!db.current || !ready) throw new Error('저장공간을 준비하고 있어요.');
      const next = parseState(settleGrowth(update(current.current)));
      await db.current.runAsync('INSERT INTO app_state (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload', JSON.stringify(next));
      current.current = next;
      setState(next);
    });
    queue.current = task.catch(() => undefined);
    return task;
  }
  return <Context.Provider value={{ state, ready, error, clearError: () => setError(null), mutate, reload: () => setAttempt(a => a + 1) }}>{children}</Context.Provider>;
}
export function useStore() { const value = useContext(Context); if (!value) throw new Error('StoreProvider가 필요해요.'); return value; }
