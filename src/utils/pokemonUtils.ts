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

  // Generation 1
  if (id >= 1 && id <= 151) return 1;

  // Generation 2
  if (id >= 152 && id <= 251) return 2;

  // Generation 3
  if (id >= 252 && id <= 386) return 3;

  // Generation 4
  if (id >= 387 && id <= 493) return 4;

  // Generation 5
  if (id >= 494 && id <= 649) return 5;

  // Generation 6
  if (id >= 650 && id <= 721) return 6;

  // Generation 7
  if (id >= 722 && id <= 809) return 7;

  // Generation 8
  if (id >= 810 && id <= 898) return 8;

  // Generation 9
  if (id >= 899 && id <= 1010) return 9;

  // Returns 0 if the Pokémon ID does not match a supported generation
  return 0;
};

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

// Adds extra display-ready data to a Pokémon object
// Example input:
// { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" }
//
// Example output:
// {
//   name: "pikachu",
//   url: "https://pokeapi.co/api/v2/pokemon/25/",
//   id: 25,
//   generation: 1,
//   spriteUrl: ".../25.png",
//   types: ["electric"] OR types: [] 
// }
export const enrichPokemon = async (pokemon: PokemonListItem): Promise<EnrichedPokemon> => {
  const id = getIdFromUrl(pokemon.url);
  const generation = getGeneration(id);

  try {
    // Fetch detailed Pokémon data from the backend API
    const response = await withRetry(() =>
      apiClient.get<{ types: EnrichedPokemon['types'] }>(`/pokemon/${pokemon.name}`),
    );

    return {
      name: pokemon.name,
      url: pokemon.url,
      id: Number(id),
      generation,
      spriteUrl: getSpriteUrl(pokemon.url),
      types: response.data.types, // types returned from backend as a result
    };
  } catch (error) {
    console.error('Failed to fetch Pokémon details for:', pokemon.name, error);

    // Return fallback data if the detailed API request fails
    // This keeps the Pokémon card usable even without type information
    return {
      name: pokemon.name,
      url: pokemon.url,
      id: Number(id),
      generation,
      spriteUrl: getSpriteUrl(pokemon.url),
      types: [],
    };
  }
};

// Example input:
// [
//   { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
//   { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" }
// ]
//
// Example output:
// [
//   { name: "bulbasaur", id: 1, generation: 1, spriteUrl: ".../1.png", types: [...] },
//   { name: "pikachu", id: 25, generation: 1, spriteUrl: ".../25.png", types: [...] }
// ]

// Enriches every Pokémon in the list
export const enrichPokemonList = async (
  pokemonList: PokemonListItem[]
): Promise<EnrichedPokemon[]> => {
  return mapWithConcurrency(pokemonList, 6, enrichPokemon);
};

// Maps a full Pokémon API response into the enriched shape used by cards
export const mapApiResponseToEnrichedPokemon = (
  data: PokemonApiResponse
): EnrichedPokemon => ({
  name: data.name,
  url: `${POKEMON_URL}/${data.name}`,
  id: data.id,
  generation: getGeneration(data.id),
  spriteUrl: getSpriteUrl(`${POKEMON_URL}/${data.id}/`),
  types: data.types,
  sprites: data.sprites,
});

// Fetches enriched Pokémon details for a list of favorite names
export const fetchEnrichedPokemonByNames = async (
  names: string[]
): Promise<Record<string, EnrichedPokemon>> => {
  const details: Record<string, EnrichedPokemon> = {};

  await mapWithConcurrency(names, 6, async (name) => {
    try {
      const { data } = await withRetry(() =>
        apiClient.get<PokemonApiResponse>(`/pokemon/${name}`),
      );
      details[name] = mapApiResponseToEnrichedPokemon(data);
    } catch (error) {
      console.error('Failed to fetch details for:', name, error);
    }
  });

  return details;
};
