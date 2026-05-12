import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const fetchUserFavorites = async () => {
  const headers = getAuthHeaders();

  if (!headers) {
    return {};
  }

  const response = await axios.get(`${BASE_URL}/users/favorites`, {
    headers,
  });

  const favoriteMap = {};

  response.data.forEach((name) => {
    favoriteMap[name] = true;
  });

  return favoriteMap;
};

export const addUserFavorite = async (pokemonName) => {
  const headers = getAuthHeaders();

  if (!headers) {
    throw new Error('Not authenticated');
  }

  await axios.post(
    `${BASE_URL}/users/favorites`,
    { pokemonName },
    { headers }
  );
};

export const removeUserFavorite = async (pokemonName) => {
  const headers = getAuthHeaders();

  if (!headers) {
    throw new Error('Not authenticated');
  }

  await axios.delete(`${BASE_URL}/users/favorites/${pokemonName}`, {
    headers,
  });
};

export const toggleUserFavorite = async (pokemonName, favorites) => {
  if (favorites[pokemonName]) {
    await removeUserFavorite(pokemonName);

    const updatedFavorites = { ...favorites };
    delete updatedFavorites[pokemonName];

    return updatedFavorites;
  }

  await addUserFavorite(pokemonName);

  return {
    ...favorites,
    [pokemonName]: true,
  };
};