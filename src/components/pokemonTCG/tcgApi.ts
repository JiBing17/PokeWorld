import axios from 'axios';
import type {
  TcgCard,
  TcgCardQueryFilters,
  TcgCardsResponse,
  TcgSet,
} from './tcgTypes';

export const POKETCG_BASE = 'https://api.pokemontcg.io/v2';
export const CARDS_ENDPOINT = `${POKETCG_BASE}/cards`;
export const SETS_ENDPOINT = `${POKETCG_BASE}/sets`;

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

export async function fetchAllSets(): Promise<TcgSet[]> {
  const res = await axios.get<{ data: TcgSet[] }>(SETS_ENDPOINT);
  return res.data.data.sort((a, b) =>
    (b.releaseDate || '').localeCompare(a.releaseDate || ''),
  );
}

export async function fetchSetById(setId: string): Promise<TcgSet | null> {
  const res = await axios.get<{ data: TcgSet }>(`${SETS_ENDPOINT}/${setId}`);
  return res.data?.data ?? null;
}

export async function fetchCardsPage(
  query: string,
  page: number,
  pageSize: number,
  orderBy?: string,
): Promise<TcgCardsResponse> {
  const res = await axios.get<TcgCardsResponse>(CARDS_ENDPOINT, {
    params: {
      q: query,
      page,
      pageSize,
      ...(orderBy ? { orderBy } : {}),
    },
  });

  return {
    data: res.data.data ?? [],
    totalCount: res.data.totalCount ?? res.data.total ?? 0,
  };
}

export async function fetchAllMatchingCards(
  query: string,
  pageSize = 250,
): Promise<TcgCard[]> {
  let all: TcgCard[] = [];
  let page = 1;

  while (true) {
    const { data, totalCount } = await fetchCardsPage(query, page, pageSize);
    all = all.concat(data);

    const total = totalCount ?? 0;
    if (page * pageSize >= total || data.length === 0) break;

    page += 1;
  }

  return all;
}

export async function fetchSetCardsPage(
  setId: string,
  page: number,
  pageSize: number,
): Promise<TcgCardsResponse> {
  return fetchCardsPage(`set.id:${setId}`, page, pageSize, 'number');
}
