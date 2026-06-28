import axios from 'axios';
import { CACHE_TTL, getCached } from './apiCache';
import { withRetry } from './retryUtils';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

export interface EnrichedItem {
  name: string;
  id: number;
  cost: number | null;
  category: string | null;
  effect: string | null;
  spriteUrl: string;
}

interface PokeApiItemDetail {
  name: string;
  id: number;
  cost: number;
  category: { name: string };
  effect_entries: { language: { name: string }; short_effect: string }[];
}

const getItemSpriteUrl = (name: string): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;

function mapItemDetail(data: PokeApiItemDetail): EnrichedItem {
  return {
    name: data.name,
    id: data.id,
    cost: data.cost,
    category: data.category.name,
    effect: data.effect_entries.find((e) => e.language.name === 'en')?.short_effect ?? null,
    spriteUrl: getItemSpriteUrl(data.name),
  };
}

export async function fetchItemDetail(
  nameOrUrl: string,
  signal?: AbortSignal,
): Promise<EnrichedItem> {
  const url = nameOrUrl.startsWith('http') ? nameOrUrl : `${POKEAPI_BASE}/item/${nameOrUrl}`;
  const cacheKey = `pokeapi:item:${url}`;

  return getCached(
    cacheKey,
    async () => {
      const res = await withRetry(() => axios.get<PokeApiItemDetail>(url, { signal }));
      return mapItemDetail(res.data);
    },
    { ttlMs: CACHE_TTL.LONG },
  );
}

export async function fetchEnrichedItems(
  items: Array<{ name: string; url: string }>,
  signal?: AbortSignal,
): Promise<EnrichedItem[]> {
  return Promise.all(
    items.map(async (item) => {
      try {
        return await fetchItemDetail(item.url, signal);
      } catch {
        return {
          name: item.name,
          id: parseInt(item.url.split('/').filter(Boolean).pop() ?? '0', 10),
          cost: null,
          category: 'unknown',
          effect: '',
          spriteUrl: getItemSpriteUrl(item.name),
        };
      }
    }),
  );
}
