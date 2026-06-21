import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { fetchAllSets } from '../components/pokemonTCG/tcgApi';
import type { TcgSet } from '../components/pokemonTCG/tcgTypes';
import { isAbortError } from '../utils/retryUtils';

export function useTcgSets() {
  const [sets, setSets] = useState<TcgSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchAllSets(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSets(data);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        if (!controller.signal.aborted) setError(isAxiosError(err) ? err : err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { sets, loading, error };
}
