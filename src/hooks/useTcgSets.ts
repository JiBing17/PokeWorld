import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { fetchAllSets } from '../components/pokemonTCG/tcgApi';
import type { TcgSet } from '../components/pokemonTCG/tcgTypes';

export function useTcgSets() {
  const [sets, setSets] = useState<TcgSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    fetchAllSets()
      .then((data) => {
        if (!cancelled) setSets(data);
      })
      .catch((err) => {
        if (!cancelled) setError(isAxiosError(err) ? err : err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { sets, loading, error };
}
