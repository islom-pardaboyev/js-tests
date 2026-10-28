import { useCallback, useEffect, useState } from 'react';
import { listAttempts, type Attempt } from '../lib/db';

interface UseAttempts {
  attempts: Attempt[];
  loading: boolean;
  error: boolean;
  reload: () => void;
}

export function useAttempts(uid: string | undefined): UseAttempts {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setLoading(true);
    listAttempts(uid)
      .then((rows) => {
        if (cancelled) return;
        setAttempts(rows);
        setError(false);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [uid, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { attempts, loading, error, reload };
}
