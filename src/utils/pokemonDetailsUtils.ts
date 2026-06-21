import axios from 'axios';
import { CACHE_TTL, getCached } from './apiCache';
import { withRetry } from './retryUtils';
import type {
  EvolutionChainNode,
  EvolutionStage,
  FlavorTextEntry,
  MoveDetail,
  PokemonMoveRef,
} from '../types';

interface EvolutionChainResponse {
  chain: EvolutionChainNode;
}

interface MoveApiResponse {
  name: string;
  type: { name: string };
  power: number | null;
  accuracy: number | null;
  pp: number;
  effect_entries: { language: { name: string }; effect: string }[];
}

export const INITIAL_MOVE_BATCH = 12;
export const MOVE_LOAD_MORE_BATCH = 9;

export const getEnglishDescription = (flavorTextEntries: FlavorTextEntry[]): string => {
  const englishEntry = flavorTextEntries.find(
    (entry) => entry.language.name === 'en',
  );
  return englishEntry?.flavor_text.replace(/\f/g, ' ') || '';
};

async function fetchMoveDetail(url: string): Promise<MoveDetail> {
  return getCached(
    `pokeapi:move:${url}`,
    async () => {
      const response = await withRetry(() => axios.get<MoveApiResponse>(url));
      return {
        name: response.data.name.replace('-', ' '),
        type: response.data.type.name,
        power: response.data.power,
        accuracy: response.data.accuracy,
        pp: response.data.pp,
        description: response.data.effect_entries.find(
          (entry) => entry.language.name === 'en',
        )?.effect,
      };
    },
    { ttlMs: CACHE_TTL.LONG },
  );
}

export const getMoveDetails = async (
  moves: PokemonMoveRef[],
  options?: { offset?: number; limit?: number },
): Promise<MoveDetail[]> => {
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? INITIAL_MOVE_BATCH;
  const slice = moves.slice(offset, offset + limit);

  return Promise.all(slice.map((move) => fetchMoveDetail(move.move.url)));
};

export const parseEvolutionChain = (chain: EvolutionChainResponse): EvolutionStage[] => {
  const stages: EvolutionStage[] = [];
  let currentStage: EvolutionChainNode | undefined = chain.chain;

  while (currentStage) {
    stages.push({
      name: currentStage.species.name,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentStage.species.url.split('/')[6]}.png`,
    });
    currentStage = currentStage.evolves_to[0];
  }

  return stages;
};
