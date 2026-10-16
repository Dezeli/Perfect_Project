import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { dayKey } from '../core/domain';
export function useToday() {
  const [today, setToday] = useState(dayKey);
  useEffect(() => {
    const refresh = () => setToday(dayKey());
    const timer = setInterval(refresh, 30_000);
    const sub = AppState.addEventListener('change', status => { if (status === 'active') refresh(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, []);
  return today;
}
