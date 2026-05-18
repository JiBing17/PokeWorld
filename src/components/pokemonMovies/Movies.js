import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  Container,
  Grid,
  CircularProgress,
  Box,
  IconButton,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import MovieCard from './MovieCard';
import MovieHero from './MovieHero';
import SearchBar from '../SearchBar';

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [genreMap, setGenreMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const [durations, setDurations] = useState({});
  const navigate = useNavigate();

  // 1) Fetch genre list ONCE
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
          params: { api_key: TMDB_API_KEY, language: 'en-US' },
        });

        const map = {};

        res.data.genres.forEach((g) => {
          map[g.id] = g.name;
        });

        setGenreMap(map);
      } catch (err) {
        console.error('Failed to fetch genres:', err);
      }
    };

    fetchGenres();
  }, []);

  // 2) Fetch all Pokémon movies (possibly multiple pages)
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const first = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
          params: {
            api_key: TMDB_API_KEY,
            query: 'Pokémon',
            include_adult: false,
            page: 1,
          },
        });

        const pages = first.data.total_pages;
        let all = [...first.data.results];

        // Fetch remaining pages in parallel
        const calls = [];

        for (let i = 2; i <= pages; i++) {
          calls.push(
            axios.get(`${TMDB_BASE_URL}/search/movie`, {
              params: {
                api_key: TMDB_API_KEY,
                query: 'Pokémon',
                include_adult: false,
                page: i,
              },
            })
          );
        }

        const responses = await Promise.all(calls);

        responses.forEach((r) => {
          all.push(...r.data.results);
        });

        const pokemonOnly = all.filter((m) => {
          const title = m.title?.toLowerCase() || '';
          const overview = m.overview?.toLowerCase() || '';

          return (
            title.includes('pokémon') ||
            title.includes('pokemon') ||
            overview.includes('pokémon') ||
            overview.includes('pokemon')
          );
        });

        setMovies(pokemonOnly);
        setFilteredMovies(pokemonOnly);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // 3) Once `movies` is set, fetch every movie’s runtime exactly ONCE
  useEffect(() => {
    if (movies.length === 0) return;

    const fetchAllRuntimes = async () => {
      const newDurations = {};

      await Promise.all(
        movies.map(async (m) => {
          try {
            const detailRes = await axios.get(`${TMDB_BASE_URL}/movie/${m.id}`, {
              params: { api_key: TMDB_API_KEY },
            });

            newDurations[m.id] = detailRes.data.runtime;
          } catch (_) {
            // swallow 404 or other errors for individual movies
          }
        })
      );

      setDurations(newDurations);
    };

    fetchAllRuntimes();
  }, [movies]);

  // 4) Filter based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredMovies(movies);
    } else {
      setFilteredMovies(
        movies.filter((m) =>
          m.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, movies]);

  // Pick top 5 by popularity for the carousel
  const featuredMovies = [...movies]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5);

  // Carousel nav
  const handlePrev = () => {
    setHeroIndex((prev) =>
      prev === 0 ? featuredMovies.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setHeroIndex((prev) =>
      prev === featuredMovies.length - 1 ? 0 : prev + 1
    );
  };

  const handleMovieClick = (movie) => {
    navigate(`/movie/${movie.id}`, {
      state: {
        movie,
        genres: genreMap,
        durations,
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F6F8FC' }}>
        <Header />

        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ minHeight: '100vh' }}
        >
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F6F8FC' }}>
        <Header />

        <Box sx={{ pt: 12 }}>
          <Typography variant="h6" color="error" align="center">
            {`Error: ${error.message}`}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F6F8FC' }}>
      <Header />

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
                <MovieCard
                  movie={movie}
                  onClick={() => handleMovieClick(movie)}
                />
              </Grid>
            ))}
          </Grid>
        )}    
      </Container>
      
    </Box>
  );
}