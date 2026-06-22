import { CACHE_TTL, getCached } from './apiCache';
import { withRetry } from './retryUtils';
import type { DurationMap, GenreMap, TmdbCastMember, TmdbMovie } from '../types';
import { apiClient } from './apiClient';

const tmdbGet = <T>(path: string, params?: Record<string, unknown>) =>
  withRetry(() =>
    apiClient.get<T>(`/tmdb${path}`, {
      params,
    }),
  );

export const fetchMovieGenres = async (): Promise<GenreMap> => {
  return getCached(
    'tmdb:genres',
    async () => {
      const res = await tmdbGet<{ genres: { id: number; name: string }[] }>(
        '/genre/movie/list',
        { language: 'en-US' },
      );

      const genreMap: GenreMap = {};
      res.data.genres.forEach((genre) => {
        genreMap[genre.id] = genre.name;
      });
      return genreMap;
    },
    { ttlMs: CACHE_TTL.LONG, persist: 'session' },
  );
};

export const filterPokemonMovies = (movies: TmdbMovie[]): TmdbMovie[] => {
  return movies.filter((movie) => {
    const title = movie.title?.toLowerCase() || '';
    const overview = movie.overview?.toLowerCase() || '';
    return (
      title.includes('pokémon') ||
      title.includes('pokemon') ||
      overview.includes('pokémon') ||
      overview.includes('pokemon')
    );
  });
};

export const fetchPokemonMovies = async (): Promise<TmdbMovie[]> => {
  return getCached(
    'tmdb:pokemon-movies',
    async () => {
      const first = await tmdbGet<{ total_pages: number; results: TmdbMovie[] }>(
        '/search/movie',
        {
          query: 'Pokémon',
          include_adult: false,
          page: 1,
        },
      );

      const pages = first.data.total_pages;
      let allMovies = [...first.data.results];

      if (pages > 1) {
        const calls = Array.from({ length: pages - 1 }, (_, index) =>
          tmdbGet<{ results: TmdbMovie[] }>('/search/movie', {
            query: 'Pokémon',
            include_adult: false,
            page: index + 2,
          }),
        );
        const responses = await Promise.all(calls);
        responses.forEach((response) => {
          allMovies.push(...response.data.results);
        });
      }

      return filterPokemonMovies(allMovies);
    },
    { ttlMs: CACHE_TTL.MEDIUM, persist: 'session' },
  );
};

export const fetchMovieDurations = async (movies: TmdbMovie[]): Promise<DurationMap> => {
  const ids = movies.map((movie) => movie.id).sort((a, b) => a - b);
  const cacheKey = `tmdb:durations:${ids.join(',')}`;

  return getCached(
    cacheKey,
    async () => {
      const durations: DurationMap = {};

      await Promise.all(
        movies.map(async (movie) => {
          try {
            const detailRes = await tmdbGet<{ runtime: number }>(`/movie/${movie.id}`);
            durations[movie.id] = detailRes.data.runtime;
          } catch {
            // Ignore individual runtime failures.
          }
        }),
      );

      return durations;
    },
    { ttlMs: CACHE_TTL.MEDIUM, persist: 'session' },
  );
};

export const fetchMovieCast = async (movieId: number): Promise<TmdbCastMember[]> => {
  return getCached(
    `tmdb:cast:${movieId}`,
    async () => {
      const res = await tmdbGet<{ cast: TmdbCastMember[] }>(
        `/movie/${movieId}/credits`,
        { language: 'en-US' },
      );
      return res.data.cast || [];
    },
    { ttlMs: CACHE_TTL.MEDIUM },
  );
};
