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
import placeHolder from '../../static/placeholder.jpg';

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export default function MovieDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { movie, genres, durations } = location.state || {};

  const [pokemonMovies, setPokemonMovies] = useState([]);
  const [castMembers, setCastMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('Pokémon Movies');

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!movie) return;

    const fetchPokemonMovies = async () => {
      try {
        const firstRes = await fetch(
          `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=Pokémon&include_adult=false&language=en-US&page=1`
        );

        const firstData = await firstRes.json();
        const totalPages = Math.min(firstData.total_pages || 1, 5);
        let allMovies = firstData.results || [];

        const calls = [];

        for (let i = 2; i <= totalPages; i++) {
          calls.push(
            fetch(
              `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=Pokémon&include_adult=false&language=en-US&page=${i}`
            ).then((res) => res.json())
          );
        }

        const responses = await Promise.all(calls);

        responses.forEach((data) => {
          allMovies.push(...(data.results || []));
        });

        const filteredMovies = allMovies
          .filter((m) => m.id !== movie.id)
          .filter((m) => {
            const title = m.title?.toLowerCase() || '';
            const overview = m.overview?.toLowerCase() || '';

            return (
              title.includes('pokémon') ||
              title.includes('pokemon') ||
              overview.includes('pokémon') ||
              overview.includes('pokemon')
            );
          });

        setPokemonMovies(filteredMovies);
      } catch (err) {
        console.error('Error fetching Pokémon movies:', err);
      }
    };

    const fetchCast = async () => {
      try {
        const res = await fetch(
          `${TMDB_BASE_URL}/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}&language=en-US`
        );

        const data = await res.json();
        setCastMembers(data.cast || []);
      } catch (err) {
        console.error('Error fetching cast:', err);
      }
    };

    fetchPokemonMovies();
    fetchCast();
  }, [movie]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [activeTab]);

  const handleScroll = (amount) => {
    scrollContainerRef.current?.scrollBy({
      left: amount,
      behavior: 'smooth',
    });
  };

  const handleMovieClick = (selectedMovie) => {
    navigate(`/movie/${selectedMovie.id}`, {
      state: {
        movie: selectedMovie,
        genres,
        durations,
      },
    });
  };

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
                              ? `${POSTER_BASE_URL}${member.profile_path}`
                              : placeHolder
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