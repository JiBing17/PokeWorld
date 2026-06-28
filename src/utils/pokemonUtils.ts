import type { EnrichedPokemon, PokemonListItem, PokemonTypeSlot } from '../types';
import { POKEMON_URL } from './constants';
import { apiClient } from './apiClient';
import { withRetry } from './retryUtils';

interface PokemonApiResponse {
  name: string;
  id: number;
  types: PokemonTypeSlot[];
  sprites?: EnrichedPokemon['sprites'];
}

interface BatchPokemonSummary {
  name: string;
  id: number;
  types: PokemonTypeSlot[];
}

// Gets the Pokédex ID from a Pokémon API URL
// Example: "https://pokeapi.co/api/v2/pokemon/25/" returns "25"
export const getIdFromUrl = (url: string): string => {
  return url.split('/').filter(Boolean).pop() ?? '';
};

// Builds the official artwork image URL for a Pokémon
// Uses the Pokémon ID taken from the API URL
export const getSpriteUrl = (url: string): string => {
  const id = getIdFromUrl(url);

  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
};

// Returns the Pokémon generation based on its Pokédex ID
export const getGeneration = (pokedexId: string | number): number => {
  const id = Number(pokedexId);

  if (id >= 1 && id <= 151) return 1;
  if (id >= 152 && id <= 251) return 2;
  if (id >= 252 && id <= 386) return 3;
  if (id >= 387 && id <= 493) return 4;
  if (id >= 494 && id <= 649) return 5;
  if (id >= 650 && id <= 721) return 6;
  if (id >= 722 && id <= 809) return 7;
  if (id >= 810 && id <= 898) return 8;
  if (id >= 899 && id <= 1010) return 9;

  return 0;
};

export function buildEnrichedPokemonFromListItem(pokemon: PokemonListItem): EnrichedPokemon {
  const id = getIdFromUrl(pokemon.url);

  return {
    name: pokemon.name,
    url: pokemon.url,
    id: Number(id),
    generation: getGeneration(id),
    spriteUrl: getSpriteUrl(pokemon.url),
    types: [],
  };
}

async function fetchPokemonTypesBatch(names: string[]): Promise<Record<string, PokemonTypeSlot[]>> {
  if (names.length === 0) {
    return {};
  }

  const { data } = await withRetry(() =>
    apiClient.post<BatchPokemonSummary[]>('/pokemon/batch', { names }),
  );

  const typeMap: Record<string, PokemonTypeSlot[]> = {};
  data.forEach((entry) => {
    typeMap[entry.name] = entry.types;
  });

  return typeMap;
}

export const enrichPokemon = async (pokemon: PokemonListItem): Promise<EnrichedPokemon> => {
  const base = buildEnrichedPokemonFromListItem(pokemon);

  try {
    const typeMap = await fetchPokemonTypesBatch([pokemon.name]);
    return {
      ...base,
      types: typeMap[pokemon.name] ?? [],
    };
  } catch (error) {
    console.error('Failed to fetch Pokémon details for:', pokemon.name, error);
    return base;
  }
};

export const enrichPokemonList = async (
  pokemonList: PokemonListItem[],
): Promise<EnrichedPokemon[]> => {
  if (pokemonList.length === 0) {
    return [];
  }

  const baseList = pokemonList.map(buildEnrichedPokemonFromListItem);

  try {
    const typeMap = await fetchPokemonTypesBatch(pokemonList.map((pokemon) => pokemon.name));
    return baseList.map((pokemon) => ({
      ...pokemon,
      types: typeMap[pokemon.name] ?? [],
    }));
  } catch (error) {
    console.error('Failed to batch enrich Pokémon list:', error);
    return baseList;
  }
};

export const mapApiResponseToEnrichedPokemon = (data: PokemonApiResponse): EnrichedPokemon => ({
  name: data.name,
  url: `${POKEMON_URL}/${data.name}`,
  id: data.id,
  generation: getGeneration(data.id),
  spriteUrl: getSpriteUrl(`${POKEMON_URL}/${data.id}/`),
  types: data.types,
  sprites: data.sprites,
});

export const fetchEnrichedPokemonByNames = async (
  names: string[],
): Promise<Record<string, EnrichedPokemon>> => {
  const details: Record<string, EnrichedPokemon> = {};

  if (names.length === 0) {
    return details;
  }

  try {
    const { data } = await withRetry(() =>
      apiClient.post<BatchPokemonSummary[]>('/pokemon/batch', { names }),
    );

    data.forEach((entry) => {
      details[entry.name] = mapApiResponseToEnrichedPokemon(entry);
    });
  } catch (error) {
    console.error('Failed to batch fetch favorite Pokémon details:', error);
  }

  return details;
};
