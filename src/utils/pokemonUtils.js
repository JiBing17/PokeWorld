import axios from 'axios';
import { POKEMON_URL } from './constants';

export const getIdFromUrl = (url) => {
  return url.split('/').filter(Boolean).pop();
};

export const getSpriteUrl = (url) => {
  const id = getIdFromUrl(url);

  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
};

export const getGeneration = (pokedexId) => {
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

export const enrichPokemon = async (pokemon) => {
  const id = getIdFromUrl(pokemon.url);
  const generation = getGeneration(id);

  try {
    const response = await axios.get(`${POKEMON_URL}/${pokemon.name}`);

    return {
      name: pokemon.name,
      url: pokemon.url,
      id: Number(id),
      generation,
      spriteUrl: getSpriteUrl(pokemon.url),
      types: response.data.types,
    };
  } catch (error) {
    console.error('Failed to fetch Pokémon details for:', pokemon.name, error);

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

export const enrichPokemonList = async (pokemonList) => {
  return Promise.all(pokemonList.map(enrichPokemon));
};