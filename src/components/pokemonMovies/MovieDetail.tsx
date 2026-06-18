import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import PageShell from '../layout/PageShell';
import MovieCard from './MovieCard';
import MovieHero from './MovieHero';
import CastCard from './CastCard';
import HorizontalScrollRow from './HorizontalScrollRow';
import {
  fetchPokemonMovies,
  fetchMovieCast,
} from '../../utils/moviesAPI';
import { useMovieNavigation } from '../../hooks/useMovieNavigation';
import type { MovieNavigationState, TmdbCastMember, TmdbMovie } from '../../types';

type ActiveTab = 'Pokémon Movies' | 'Cast';

export default function MovieDetail() {
  const location = useLocation(); // Reads data passed from the Movies page through navigate state
  const { movie, genres, durations } = (location.state as MovieNavigationState | null) ?? {};
  const { goToMovie, goToMovies } = useMovieNavigation({ genres, durations });

  const [pokemonMovies, setPokemonMovies] = useState<TmdbMovie[]>([]); // related Pokémon movies shown in the carousel
  const [castMembers, setCastMembers] = useState<TmdbCastMember[]>([]); // cast list for the selected movie

  const [activeTab, setActiveTab] = useState<ActiveTab>('Pokémon Movies'); // current tab, either "Pokémon Movies" or "Cast"

  // Fetches related Pokémon movies and cast for the selected movie
  useEffect(() => {
    if (!movie) return;

    const loadMovieExtraData = async () => {
      try {
        // Reuse shared Pokémon movie search helper
        const allPokemonMovies = await fetchPokemonMovies();

        // Example allPokemonMovies:
        // [
        //   { id: 10991, title: "Pokémon: The First Movie" },
        //   { id: 11836, title: "Pokémon 3: The Movie" }
        // ]

        // Remove the movie currently being viewed from the related list
        const relatedMovies = allPokemonMovies.filter((m) => m.id !== movie.id);

        setPokemonMovies(relatedMovies);

        // Fetch cast for the current movie
        const cast = await fetchMovieCast(movie.id);

        // Example cast:
        // [
        //   { name: "Ikue Otani", character: "Pikachu", profile_path: "..." }
        // ]

        setCastMembers(cast);
      } catch (err) {
        console.error('Error fetching movie extra data:', err);
      }
    };

    loadMovieExtraData();
  }, [movie]);

  // Opens another movie details page and passes the same shared movie data forward
  const handleMovieClick = (selectedMovie: TmdbMovie) => {
    goToMovie(selectedMovie);
  };

  // UI if no movie data is available
  if (!movie) {
    return (
      <PageShell>

        <Box
          sx={{
            minHeight: '100vh',
            pt: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              border: '1px solid #E5E7EB',
              textAlign: 'center',
              maxWidth: 420,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              No movie data available.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please return to the movies page and select a movie again.
            </Typography>

            <Button
              variant="contained"
              onClick={goToMovies}
              sx={{
                bgcolor: '#C22E28',
                textTransform: 'none',
                fontWeight: 800,
                '&:hover': {
                  bgcolor: '#B22222',
                },
              }}
            >
              Back to Movies
            </Button>
          </Paper>
        </Box>
      </PageShell>
    );
  }
  // Get the runtime of the current movie in the case that it is available
  const runtime = durations?.[movie.id] ? `${durations[movie.id]} mins` : 'N/A';
  
  return (
    <PageShell>

      {/* Backdrop + Overlay + Info */}
      <Box sx={{ pt: { xs: 10, md: 11 }, pb: 5 }}>
        <Box
          sx={{
            maxWidth: 1180,
            mx: 'auto',
            px: { xs: 2, md: 4 },
          }}
        >
          <MovieHero
            movie={movie}
            genres={genres}
            runtime={runtime}
            showBackButton
            onBack={goToMovies}
            primaryButtonText="View on TMDB"
            onPrimaryClick={() =>
              window.open(
                `https://www.themoviedb.org/movie/${movie.id}`,
                '_blank',
                'noopener,noreferrer'
              )
            }
          />
        </Box>
      </Box>

      {/* Pokémon Movies / Cast Section */}
      <Box sx={{ pb: 8 }}>
        <Box
          sx={{
            maxWidth: 1180,
            mx: 'auto',
            px: { xs: 2, md: 4 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 5,
              border: '1px solid #E5E7EB',
              bgcolor: 'white',
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: { xs: 2.5, md: 4 },
                pt: 3,
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    color: '#111827',
                    mb: 0.5,
                  }}
                >
                  Explore More
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Browse other Pokémon movies or view the cast.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  onClick={() => setActiveTab('Pokémon Movies')}
                  variant={
                    activeTab === 'Pokémon Movies' ? 'contained' : 'outlined'
                  }
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: 999,
                    bgcolor:
                      activeTab === 'Pokémon Movies' ? '#C22E28' : 'white',
                    borderColor: '#E5E7EB',
                    color:
                      activeTab === 'Pokémon Movies' ? 'white' : '#374151',
                    '&:hover': {
                      bgcolor:
                        activeTab === 'Pokémon Movies'
                          ? '#B22222'
                          : '#F9FAFB',
                      borderColor: '#D1D5DB',
                    },
                  }}
                >
                  Pokémon Movies
                </Button>

                <Button
                  onClick={() => setActiveTab('Cast')}
                  variant={activeTab === 'Cast' ? 'contained' : 'outlined'}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: 999,
                    bgcolor: activeTab === 'Cast' ? '#C22E28' : 'white',
                    borderColor: '#E5E7EB',
                    color: activeTab === 'Cast' ? 'white' : '#374151',
                    '&:hover': {
                      bgcolor: activeTab === 'Cast' ? '#B22222' : '#F9FAFB',
                      borderColor: '#D1D5DB',
                    },
                  }}
                >
                  Cast
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ mt: 3 }} />

            <Box sx={{ position: 'relative', p: { xs: 2.5, md: 4 } }}>
              <HorizontalScrollRow resetKey={activeTab}>
                {activeTab === 'Pokémon Movies'
                  ? pokemonMovies.map((pokeMovie) => (
                      <Box
                        key={`movie-${pokeMovie.id}`}
                        sx={{
                          flex: {
                            xs: '0 0 250px',
                            sm: '0 0 260px',
                            md: '0 0 270px',
                          },
                        }}
                      >
                        <MovieCard
                          movie={pokeMovie}
                          onClick={() => handleMovieClick(pokeMovie)}
                        />
                      </Box>
                    ))
                  : castMembers.map((member) => (
                      <CastCard key={`cast-${member.cast_id || member.id}`} member={member} />
                    ))}
              </HorizontalScrollRow>
            </Box>
          </Paper>
        </Box>
      </Box>
    </PageShell>
  );
}
