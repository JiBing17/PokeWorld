import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Divider,
} from '@mui/material';
import {
  ArrowForward,
  ArrowBackIosNew,
} from '@mui/icons-material';
import Header from '../Header';
import MovieCard from './MovieCard';
import MovieHero from './MovieHero';
import { TMDB_POSTER_BASE_URL, PLACEHOLDER } from '../../utils/constants';
import {
  fetchPokemonMovies,
  fetchMovieCast,
} from '../../utils/moviesAPI';
import type { MovieNavigationState, TmdbCastMember, TmdbMovie } from '../../types';

type ActiveTab = 'Pokémon Movies' | 'Cast';

export default function MovieDetail() {
  const location = useLocation(); // Reads data passed from the Movies page through navigate state
  const navigate = useNavigate(); // Lets this page navigate back or open another movie details page

  // Movie data passed from Movies.js
  // Example location.state:
  // {
  //   movie: { id: 10991, title: "Pokémon: The First Movie", ... },
  //   genres: { 12: "Adventure", 16: "Animation" },
  //   durations: { 10991: 96 }
  // }
  const { movie, genres, durations } = (location.state as MovieNavigationState | null) ?? {};

  const [pokemonMovies, setPokemonMovies] = useState<TmdbMovie[]>([]); // related Pokémon movies shown in the carousel
  const [castMembers, setCastMembers] = useState<TmdbCastMember[]>([]); // cast list for the selected movie

  const [activeTab, setActiveTab] = useState<ActiveTab>('Pokémon Movies'); // current tab, either "Pokémon Movies" or "Cast"

  // Ref for the horizontal carousel container
  // Used to scroll left/right with arrow buttons
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Resets the carousel scroll position when switching tabs
  useEffect(() => {
    // Example:
    // User switches from "Pokémon Movies" to "Cast"
    // Carousel starts back at the far left
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [activeTab]);

  // Scrolls the carousel left or right
  const handleScroll = (amount: number) => {
    // Example:
    // handleScroll(-750) scrolls left
    // handleScroll(750) scrolls right
    scrollContainerRef.current?.scrollBy({
      left: amount,
      behavior: 'smooth',
    });
  };

  // Opens another movie details page and passes the same shared movie data forward
  const handleMovieClick = (selectedMovie: TmdbMovie) => {
    navigate(`/movie/${selectedMovie.id}`, {
      state: {
        movie: selectedMovie,
        genres,
        durations,
      },
    });
  };

  // UI if no movie data is available
  if (!movie) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F6F8FC' }}>
        <Header />

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
              onClick={() => navigate('/movies')}
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
      </Box>
    );
  }
  // Get the runtime of the current movie in the case that it is available
  const runtime = durations?.[movie.id] ? `${durations[movie.id]} mins` : 'N/A';
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F6F8FC' }}>
      <Header />

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
            onBack={() => navigate('/movies')}
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
              <Box
                key={activeTab}
                ref={scrollContainerRef}
                sx={{
                  display: 'flex',
                  gap: 3,
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  pb: 1,
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                }}
              >
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
                      <Card
                        key={`cast-${member.cast_id || member.id}`}
                        elevation={0}
                        sx={{
                          flex: {
                            xs: '0 0 250px',
                            sm: '0 0 260px',
                            md: '0 0 270px',
                          },
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 3,
                          border: '1px solid #E5E7EB',
                          overflow: 'hidden',
                          bgcolor: 'white',
                          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={
                            member.profile_path
                              ? `${TMDB_POSTER_BASE_URL}${member.profile_path}`
                              : PLACEHOLDER
                          }
                          alt={member.name}
                          sx={{
                            height: { xs: 250, md: 300 },
                            objectFit: 'cover',
                            bgcolor: '#F3F4F6',
                          }}
                        />

                        <CardContent
                          sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            flexGrow: 1,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 900,
                              color: '#111827',
                              lineHeight: 1.25,
                              mb: 1.25,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {member.name}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              lineHeight: 1.6,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {member.character || 'Unknown role'}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
              </Box>

              <IconButton
                onClick={() => handleScroll(-750)}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: { xs: 8, md: 18 },
                  transform: 'translateY(-50%)',
                  bgcolor: 'white',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 12px 28px rgba(15,23,42,0.16)',
                  '&:hover': {
                    bgcolor: '#F9FAFB',
                  },
                }}
              >
                <ArrowBackIosNew fontSize="small" />
              </IconButton>

              <IconButton
                onClick={() => handleScroll(750)}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: { xs: 8, md: 18 },
                  transform: 'translateY(-50%)',
                  bgcolor: 'white',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 12px 28px rgba(15,23,42,0.16)',
                  '&:hover': {
                    bgcolor: '#F9FAFB',
                  },
                }}
              >
                <ArrowForward fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
