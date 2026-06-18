import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DurationMap, GenreMap, TmdbMovie } from '../types';

interface MovieNavigationContext {
  genres?: GenreMap;
  durations?: DurationMap;
}

export function useMovieNavigation(context: MovieNavigationContext = {}) {
  const navigate = useNavigate();
  const { genres, durations } = context;

  const goToMovie = useCallback(
    (movie: TmdbMovie) => {
      navigate(`/movie/${movie.id}`, {
        state: {
          movie,
          genres,
          durations,
        },
      });
    },
    [navigate, genres, durations]
  );

  const goToMovies = useCallback(() => {
    navigate('/movies');
  }, [navigate]);

  return { goToMovie, goToMovies };
}
