import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Header from '../Header';
import { useAuth } from '../../AuthContext';
import Authpopup from '../Authpopup';
import { fetchUserFavorites, removeUserFavorite } from '../../utils/favoritesApi';
import PokemonCard from './PokemonCard';

const BASE_URL = "http://localhost:5000/api";
const POKEMON_URL = `${BASE_URL}/pokemon`;

function Favorites() {
  const [favorites, setFavorites] = useState({});
  const [pokemonDetails, setPokemonDetails] = useState({});
  const [sortOrder, setSortOrder] = useState('recent');
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchFavorites = async () => {
    try {
      const favoriteMap = await fetchUserFavorites();
      setFavorites(favoriteMap);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setFavorites({});
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchDetails = async () => {
      const details = {};

      for (const name in favorites) {
        try {
          const { data } = await axios.get(`${POKEMON_URL}/${name}`);
          details[name] = data;
        } catch (error) {
          console.error("Failed to fetch details for:", name, error);
        }
      }

      setPokemonDetails(details);
    };

    fetchDetails();
  }, [favorites]);

  const removeFavorite = async (name) => {
    const token = localStorage.getItem('token');

    if (!token) {
      setShowAuthPopup(true);
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
  };

  const handleSort = (a, b) => {
    if (sortOrder === 'asc') {
      return a.localeCompare(b);
    }

    if (sortOrder === 'desc') {
      return b.localeCompare(a);
    }

    return 0;
  };

  const sortedFavorites = Object.keys(favorites).sort(handleSort);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F6F8FC',
        color: '#111827',
      }}
    >
      <Header />

      <Box
        sx={{
          maxWidth: 1400,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          pt: { xs: 11, md: 12 },
          pb: 6,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' },
            gap: 4,
            alignItems: 'start',
          }}
        >
          <Card
            sx={{
              borderRadius: 5,
              bgcolor: 'white',
              color: '#111827',
              border: '1px solid #E5E7EB',
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
              position: { lg: 'sticky' },
              top: { lg: 96 },
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: 160,
                background: 'linear-gradient(135deg, #C22E28, #FFCC00)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
            </Box>

            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  mb: 1,
                }}
              >
                Favorites
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.7,
                  mb: 3,
                }}
              >
                Your saved Pokémon collection. Open a card to view details or remove it from your list.
              </Typography>

              <Stack spacing={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: '#F8FAFC',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Saved Pokémon
                  </Typography>

                  <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                    {sortedFavorites.length}
                  </Typography>
                </Box>

                <FormControl
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#F8FAFC',
                      borderRadius: 3,
                      '& fieldset': {
                        borderColor: '#E5E7EB',
                      },
                      '&:hover fieldset': {
                        borderColor: '#C22E28',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#C22E28',
                      },
                    },
                  }}
                >
                  <InputLabel id="sort-label">Sort By</InputLabel>
                  <Select
                    labelId="sort-label"
                    id="sort-select"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    label="Sort By"
                  >
                    <MenuItem value="recent">Most Recent</MenuItem>
                    <MenuItem value="asc">Name Ascending</MenuItem>
                    <MenuItem value="desc">Name Descending</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  onClick={() => navigate('/')}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: '#C22E28',
                    color: 'white',
                    borderRadius: 3,
                    py: 1.1,
                    fontWeight: 900,
                    textTransform: 'none',
                    boxShadow: '0 10px 24px rgba(194,46,40,0.22)',
                    '&:hover': {
                      bgcolor: '#B22222',
                      boxShadow: '0 14px 32px rgba(194,46,40,0.28)',
                    },
                  }}
                >
                  Browse Pokémon
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Box>
            <Box
              sx={{
                mb: 3,
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '2rem', md: '2.75rem' },
                    mb: 0.5,
                  }}
                >
                  My Collection
                </Typography>

                <Typography sx={{ color: 'text.secondary' }}>
                  Manage the Pokémon you have added to your favorites.
                </Typography>
              </Box>

              <Chip
                icon={<FavoriteIcon sx={{ color: '#C22E28 !important' }} />}
                label={`${sortedFavorites.length} saved`}
                sx={{
                  bgcolor: 'white',
                  color: '#111827',
                  fontWeight: 800,
                  px: 1,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 8px 20px rgba(15,23,42,0.06)',
                }}
              />
            </Box>

            {sortedFavorites.length === 0 ? (
              <Card
                sx={{
                  minHeight: 420,
                  borderRadius: 5,
                  bgcolor: 'white',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  p: 4,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >

                <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>

                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                    {isAuthenticated
                      ? 'No favorites saved yet'
                      : 'Login to view your collection'}
                  </Typography>

                  <Typography
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.7,
                      mb: 3,
                    }}
                  >
                    {isAuthenticated
                      ? 'Start browsing and click the heart icon on any Pokémon to add it here.'
                      : 'Create an account or log in to save your favorite Pokémon across devices.'}
                  </Typography>

                  {isAuthenticated ? (
                    <Button
                      variant="contained"
                      onClick={() => navigate('/')}
                      sx={{
                        bgcolor: '#C22E28',
                        color: 'white',
                        borderRadius: 999,
                        px: 4,
                        py: 1.2,
                        textTransform: 'none',
                        fontWeight: 800,
                        '&:hover': {
                          bgcolor: '#B22222',
                        },
                      }}
                    >
                      Go Browse
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => setShowAuthPopup(true)}
                      sx={{
                        bgcolor: '#C22E28',
                        color: 'white',
                        borderRadius: 999,
                        px: 4,
                        py: 1.2,
                        textTransform: 'none',
                        fontWeight: 800,
                        '&:hover': {
                          bgcolor: '#B22222',
                        },
                      }}
                    >
                      Login / Sign Up
                    </Button>
                  )}
                </Box>
              </Card>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 3,
                }}
              >
                {sortedFavorites.map((name, index) => {
                  const pokemon = pokemonDetails[name];
                    return (
                      <PokemonCard
                        key={name}
                        pokemon={pokemon || { name }}
                        onRemoveClick={removeFavorite}
                        to={`/pokemon/${name}`}
                        variant="favorite"
                      />
                    )
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {showAuthPopup && (
        <Authpopup
          onClose={() => setShowAuthPopup(false)}
          onSuccess={fetchFavorites}
        />
      )}
    </Box>
  );
}

export default Favorites;