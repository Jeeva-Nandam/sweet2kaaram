import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

/** GET helper with loading/error state. Pass null to skip the request. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!path);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) { setLoading(false); return; }
    let live = true;
    setLoading(true); setError('');
    api.get<T>(path)
      .then((d) => { if (live) setData(d); })
      .catch((e: Error) => { if (live) setError(e.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload, setData };
}
