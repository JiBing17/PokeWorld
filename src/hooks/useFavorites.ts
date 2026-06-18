import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import {
  fetchUserFavorites,
  removeUserFavorite,
  toggleUserFavorite,
} from '../utils/favoritesApi';
import type { FavoritesMap } from '../types';

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoritesMap>({});
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  const fetchFavorites = useCallback(async () => {
    try {
      const favoriteMap = await fetchUserFavorites();
      setFavorites(favoriteMap);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setFavorites({});
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [isAuthenticated, fetchFavorites]);

  const requireAuth = useCallback(() => {
    if (!localStorage.getItem('token')) {
      setShowAuthPopup(true);
      return false;
    }
    return true;
  }, []);

  const toggleFavorite = useCallback(
    async (name: string) => {
      if (!requireAuth()) {
        return;
      }

      try {
        const updatedFavorites = await toggleUserFavorite(name, favorites);
        setFavorites(updatedFavorites);
      } catch (error) {
        console.error('Failed to update favorite:', error);
      }
    },
    [favorites, requireAuth]
  );

  const removeFavorite = useCallback(
    async (name: string) => {
      if (!requireAuth()) {
        return;
      }

      try {
        await removeUserFavorite(name);
        setFavorites((prev) => {
          const updatedFavorites = { ...prev };
          delete updatedFavorites[name];
          return updatedFavorites;
        });
      } catch (error) {
        console.error('Failed to remove favorite:', error);
      }
    },
    [requireAuth]
  );

  return {
    favorites,
    setFavorites,
    showAuthPopup,
    setShowAuthPopup,
    fetchFavorites,
    toggleFavorite,
    removeFavorite,
  };
}
