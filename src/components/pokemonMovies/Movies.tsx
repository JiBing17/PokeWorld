import React, { useState, useEffect } from 'react';
import { Typography, Container, Grid, Box, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import PageShell from '../layout/PageShell';
import PageLoader from '../layout/PageLoader';
import MovieCard from './MovieCard';
import MovieHero from './MovieHero';
import SearchBar from '../SearchBar';
import { fetchMovieGenres, fetchPokemonMovies, fetchMovieDurations } from '../../utils/moviesAPI';
import { getErrorMessage } from '../../utils/errorUtils';
import { useMovieNavigation } from '../../hooks/useMovieNavigation';
import type { DurationMap, GenreMap, TmdbMovie } from '../../types';

export default function Movies() {
  const [movies, setMovies] = useState<TmdbMovie[]>([]); // full list of Pokémon-related movies from TMDB
  const [filteredMovies, setFilteredMovies] = useState<TmdbMovie[]>([]); // movies shown after applying search filter
  const [genreMap, setGenreMap] = useState<GenreMap>({}); // genre id-to-name map, example: { 12: "Adventure", 16: "Animation" }
  const [loading, setLoading] = useState(true); // true while movies are being fetched
  const [error, setError] = useState<unknown>(null); // stores fetch errors so the UI can show an error message
  const [searchTerm, setSearchTerm] = useState(''); // current movie search input value
  const [heroIndex, setHeroIndex] = useState(0); // index of the currently displayed featured movie
  const [durations, setDurations] = useState<DurationMap>({}); // movie runtime map, example: { 10991: 96, 11836: 74 }
  const { goToMovie } = useMovieNavigation({ genres: genreMap, durations });

  // Fetches TMDB movie genres once when the Movies page first loads
  useEffect(() => {
    const loadGenres = async () => {
      try {
        // Example genres:
        // {
        //   12: "Adventure",
        //   16: "Animation",
        //   10751: "Family"
        // }
        const genres = await fetchMovieGenres();

        // Store genre id-to-name map for movie cards/details
        setGenreMap(genres);
      } catch (err) {
        console.error('Failed to fetch genres:', err);
      }
    };

    loadGenres();
  }, []);

  // Fetches Pokémon-related movies once when the Movies page first loads
  useEffect(() => {
    const loadMovies = async () => {
      try {
        // Example pokemonMovies:
        // [
        //   {
        //     id: 10991,
        //     title: "Pokémon: The First Movie",
        //     overview: "...",
        //     poster_path: "...",
        //     genre_ids: [...]
        //   }
        // ]

        // Searches TMDB for Pokémon movies and returns the filtered results
        const pokemonMovies = await fetchPokemonMovies();

        // Store the full movie list
        setMovies(pokemonMovies);

        // Start filteredMovies with the same list until the user searches
        setFilteredMovies(pokemonMovies);
      } catch (err) {
        // Store error so the UI can show an error message
        setError(err);
      } finally {
        // Stop loading after success or failure
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  // Fetches runtime/duration for each movie after the movie list is loaded
  useEffect(() => {
    // No movies yet, so there are no durations to fetch
    if (movies.length === 0) return;

    const loadDurations = async () => {
      // Example movieDurations:
      // {
      //   10991: 96,
      //   11836: 84
      // }
      //
      // Keys are TMDB movie IDs
      // Values are runtimes in minutes
      const movieDurations = await fetchMovieDurations(movies);

      // Store runtimes so movie details can show duration
      setDurations(movieDurations);
    };

    loadDurations();
  }, [movies]);

  // Filters the movie list whenever the search text changes
  useEffect(() => {
    // If search is empty, show all Pokémon movies
    if (!searchTerm) {
      setFilteredMovies(movies);
    } else {
      // Example:
      // searchTerm = "mewtwo"
      //
      // Keeps movies whose title includes "mewtwo"
      const filtered = movies.filter((movie) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      setFilteredMovies(filtered);
    }
  }, [searchTerm, movies]);

  // Pick top 5 by popularity for the carousel
  const featuredMovies = [...movies]
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 5);

  // Carousel navigation to show prev hero display movie from featured
  const handlePrev = () => {
    setHeroIndex((prev) => (prev === 0 ? featuredMovies.length - 1 : prev - 1));
  };

  // Carousel navigation to show next hero display movie from featured
  const handleNext = () => {
    setHeroIndex((prev) => (prev === featuredMovies.length - 1 ? 0 : prev + 1));
  };

  // Handles clicking on a movie to navigate to its details page
  const handleMovieClick = (movie: TmdbMovie) => {
    goToMovie(movie);
  };

  // Renders a loading UI on the movies page while data is being fetched
  if (loading) {
    return <PageLoader message="Loading movies..." />;
  }

  // Renders an error message if there was a problem fetching movies
  if (error) {
    return (
      <PageShell>
        <Box sx={{ pt: 12 }}>
          <Typography variant="h6" color="error" align="center">
            {`Error: ${getErrorMessage(error)}`}
          </Typography>
        </Box>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* ─── TAILWIND CAROUSEL │ HERO SECTION ───────────────────────────────── */}
      <Box sx={{ pt: { xs: 10, md: 11 } }}>
        <Container maxWidth="lg">
          {featuredMovies.length > 0 && (
            <Box sx={{ position: 'relative' }}>
              <MovieHero
                movie={featuredMovies[heroIndex]}
                genres={genreMap}
                label="Featured Movie"
                primaryButtonText="View Details"
                onPrimaryClick={() => handleMovieClick(featuredMovies[heroIndex])}
              />

              {/* Left Arrow */}
              <IconButton
                onClick={handlePrev}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 18,
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                  width: 42,
                  height: 42,
                  bgcolor: 'rgba(0,0,0,0.42)',
                  color: 'white',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.6)',
                  },
                }}
              >
                <FontAwesomeIcon icon={faArrowLeft} size="sm" />
              </IconButton>

              {/* Right Arrow */}
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: 18,
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                  width: 42,
                  height: 42,
                  bgcolor: 'rgba(0,0,0,0.42)',
                  color: 'white',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.6)',
                  },
                }}
              >
                <FontAwesomeIcon icon={faArrowRight} size="sm" />
              </IconButton>
            </Box>
          )}
        </Container>
      </Box>

      {/* ─── SEARCH & MOVIE GRID ─────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ pb: 8, mt: 4 }}>
        <SearchBar
          label="Search movies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {filteredMovies.length === 0 ? (
          <Typography variant="h6" align="center" color="text.secondary">
            No movies found.
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {filteredMovies.map((movie) => (
              <Grid item key={movie.id} xs={12} sm={6} md={4} lg={3}>
                <MovieCard movie={movie} onClick={() => handleMovieClick(movie)} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </PageShell>
  );
}
