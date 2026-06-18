import axios from 'axios';
import type { FavoritesMap } from '../types';
import { BASE_URL } from './constants';

// Gets the saved login token and formats it for protected API requests
const getAuthHeaders = (): Record<string, string> | null => {
  const token = localStorage.getItem('token');

  // No token means the user is not logged in
  if (!token) {
    return null;
  }

  // Example output:
  // { Authorization: "Bearer abc123token" }
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Fetches the logged-in user's favorite Pokémon
export const fetchUserFavorites = async (): Promise<FavoritesMap> => {
  const headers = getAuthHeaders();

  // If not logged in, return an empty favorites object
  if (!headers) {
    return {};
  }

  const response = await axios.get<string[]>(`${BASE_URL}/users/favorites`, {
    headers,
  });

  // Example response.data:
  // ["pikachu", "charizard"]
  //
  // Example favoriteMap:
  // {
  //   pikachu: true,
  //   charizard: true
  // }
  const favoriteMap: FavoritesMap = {};

  response.data.forEach((name) => {
    favoriteMap[name] = true;
  });

  return favoriteMap;
};

// Adds one Pokémon to the user's favorites
export const addUserFavorite = async (pokemonName: string): Promise<void> => {
  const headers = getAuthHeaders();

  // Adding requires the user to be logged in
  if (!headers) {
    throw new Error('Not authenticated');
  }

  await axios.post(
    `${BASE_URL}/users/favorites`,
    { pokemonName },
    { headers }
  );
};

// Removes one Pokémon from the user's favorites
export const removeUserFavorite = async (pokemonName: string): Promise<void> => {
  const headers = getAuthHeaders();

  // Removing requires the user to be logged in
  if (!headers) {
    throw new Error('Not authenticated');
  }

  await axios.delete(`${BASE_URL}/users/favorites/${pokemonName}`, {
    headers,
  });
};

// Toggles a Pokémon favorite on or off
export const toggleUserFavorite = async (
  pokemonName: string,
  favorites: FavoritesMap
): Promise<FavoritesMap> => {
  // If already favorited, remove it
  if (favorites[pokemonName]) {
    await removeUserFavorite(pokemonName);

    // Copy favorites before changing it so state is not mutated directly
    const updatedFavorites = { ...favorites };

    delete updatedFavorites[pokemonName];

    return updatedFavorites;
  }

  // If not favorited, add it
  await addUserFavorite(pokemonName);

  // Return a new favorites object with this Pokémon marked as true
  return {
    ...favorites,
    [pokemonName]: true,
  };
};
