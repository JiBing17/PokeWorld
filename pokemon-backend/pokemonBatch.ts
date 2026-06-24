import axios from 'axios';
import type { Request, Response } from 'express';
import { CACHE_TTL, getCached } from './apiCache';
import { isValidPokemonName } from './authValidation';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const MAX_BATCH_SIZE = 60;
const BATCH_CONCURRENCY = 16;

interface PokemonTypeSlot {
  slot: number;
  type: { name: string; url: string };
}

interface BatchPokemonResult {
  name: string;
  id: number;
  types: PokemonTypeSlot[];
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}

async function fetchPokemonSummary(name: string): Promise<BatchPokemonResult> {
  const cacheKey = `pokeapi:pokemon:${name.toLowerCase()}`;
  const data = await getCached(
    cacheKey,
    async () => {
      const response = await axios.get<{
        name: string;
        id: number;
        types: PokemonTypeSlot[];
      }>(`${POKEAPI_BASE}/pokemon/${name}`, {
        headers: {
          'User-Agent': 'PokeWorld/1.0 (fan project; https://pokeapi.co)',
        },
      });
      return response.data;
    },
    CACHE_TTL.LONG,
  );

  return {
    name: data.name,
    id: data.id,
    types: data.types ?? [],
  };
}

export async function batchFetchPokemon(req: Request, res: Response): Promise<void> {
  const { names } = req.body as { names?: unknown };

  if (!Array.isArray(names) || names.length === 0) {
    res.status(400).json({ error: 'A non-empty names array is required.' });
    return;
  }

  if (names.length > MAX_BATCH_SIZE) {
    res.status(400).json({ error: `Batch size cannot exceed ${MAX_BATCH_SIZE}.` });
    return;
  }

  const validNames = names.filter(isValidPokemonName);
  if (validNames.length === 0) {
    res.status(400).json({ error: 'No valid Pokémon names provided.' });
    return;
  }

  try {
    const results = await mapWithConcurrency(
      validNames,
      BATCH_CONCURRENCY,
      fetchPokemonSummary,
    );

    res.set('Cache-Control', 'public, max-age=300');
    res.json(results);
  } catch (error) {
    console.error('PokeAPI batch error:', error);
    res.status(500).json({ error: 'Failed to fetch Pokémon batch.' });
  }
}
