import { CACHE_TTL, getCached } from '../../utils/apiCache';
import { withRetry } from '../../utils/retryUtils';
import { apiClient } from '../../utils/apiClient';
import type {
  TcgCard,
  TcgCardQueryFilters,
  TcgCardsResponse,
  TcgSet,
} from './tcgTypes';
import { getMarketPrice } from './tcgPriceUtils';

const CARDS_ENDPOINT = '/tcg/cards';
const SETS_ENDPOINT = '/tcg/sets';

function tcgGet<T>(url: string, params?: Record<string, unknown>, signal?: AbortSignal) {
  return withRetry(() =>
    apiClient.get<T>(url, {
      params,
      signal,
    }),
  );
}

export function buildCardQuery(filters: TcgCardQueryFilters): string {
  const parts: string[] = [];

  if (filters.nameQuery) {
    const q = filters.nameQuery.replace(/"/g, '');
    parts.push(`name:*${q}*`);
  }

  if (filters.setId && filters.setId !== 'all') {
    parts.push(`set.id:${filters.setId}`);
  }

  if (filters.type && filters.type !== 'all') {
    parts.push(`types:${filters.type}`);
  }

  return parts.join(' ');
}

export async function fetchAllSets(signal?: AbortSignal): Promise<TcgSet[]> {
  return getCached(
    'tcg:sets:all',
    async () => {
      const res = await tcgGet<{ data: TcgSet[] }>(SETS_ENDPOINT, undefined, signal);
      return res.data.data.sort((a, b) =>
        (b.releaseDate || '').localeCompare(a.releaseDate || ''),
      );
    },
    { ttlMs: CACHE_TTL.LONG, persist: 'session' },
  );
}

export async function fetchSetById(
  setId: string,
  signal?: AbortSignal,
): Promise<TcgSet | null> {
  return getCached(
    `tcg:set:${setId}`,
    async () => {
      const res = await tcgGet<{ data: TcgSet }>(
        `${SETS_ENDPOINT}/${setId}`,
        undefined,
        signal,
      );
      return res.data?.data ?? null;
    },
    { ttlMs: CACHE_TTL.LONG },
  );
}

export async function fetchCardsPage(
  query: string,
  page: number,
  pageSize: number,
  orderBy?: string,
  signal?: AbortSignal,
): Promise<TcgCardsResponse> {
  const cacheKey = `tcg:cards:${query}:${page}:${pageSize}:${orderBy ?? ''}`;

  return getCached(
    cacheKey,
    async () => {
      const res = await tcgGet<TcgCardsResponse>(
        CARDS_ENDPOINT,
        {
          q: query,
          page,
          pageSize,
          ...(orderBy ? { orderBy } : {}),
        },
        signal,
      );

      return {
        data: res.data.data ?? [],
        totalCount: res.data.totalCount ?? res.data.total ?? 0,
      };
    },
    { ttlMs: CACHE_TTL.SHORT },
  );
}

export async function fetchAllMatchingCards(
  query: string,
  pageSize = 250,
  signal?: AbortSignal,
): Promise<TcgCard[]> {
  const cacheKey = `tcg:cards:all:${query}:${pageSize}`;

  return getCached(
    cacheKey,
    async () => {
      let all: TcgCard[] = [];
      let page = 1;

      while (true) {
        const { data, totalCount } = await fetchCardsPage(
          query,
          page,
          pageSize,
          undefined,
          signal,
        );
        all = all.concat(data);

        const total = totalCount ?? 0;
        if (page * pageSize >= total || data.length === 0) break;

        page += 1;
      }

      return all;
    },
    { ttlMs: CACHE_TTL.SHORT },
  );
}

export async function fetchTopValuedCards(
  query: string,
  signal?: AbortSignal,
): Promise<TcgCard[]> {
  return getCached(
    `tcg:top-valued:${query}`,
    async () => {
      const all = await fetchAllMatchingCards(query, 250, signal);
      return all
        .filter((card) => getMarketPrice(card) != null)
        .sort((a, b) => (getMarketPrice(b) ?? 0) - (getMarketPrice(a) ?? 0));
    },
    { ttlMs: CACHE_TTL.MEDIUM },
  );
}

export async function fetchSetCardsPage(
  setId: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<TcgCardsResponse> {
  return fetchCardsPage(`set.id:${setId}`, page, pageSize, 'number', signal);
}
