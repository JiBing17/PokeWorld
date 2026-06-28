import React, { useState, useEffect } from 'react';
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
  SelectChangeEvent,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PageShell from '../layout/PageShell';
import { useAuth } from '../../AuthContext';
import Authpopup from '../Authpopup';
import { useFavorites } from '../../hooks/useFavorites';
import PokemonCard from './PokemonCard';
import { POKEMON_URL } from '../../utils/constants';
import { fetchEnrichedPokemonByNames } from '../../utils/pokemonUtils';
import type { EnrichedPokemon } from '../../types';

type SortOrder = 'recent' | 'asc' | 'desc';

function Favorites() {
  const [pokemonDetails, setPokemonDetails] = useState<Record<string, EnrichedPokemon>>({});
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { favorites, showAuthPopup, setShowAuthPopup, fetchFavorites, removeFavorite } =
    useFavorites();

  // Fetches full Pokémon details for each favorite whenever favorites changes
  useEffect(() => {
    const fetchDetails = async () => {
      const names = Object.keys(favorites);
      if (names.length === 0) {
        setPokemonDetails({});
        return;
      }

      const details = await fetchEnrichedPokemonByNames(names);
      setPokemonDetails(details);
    };

    fetchDetails();
  }, [favorites]);

  // Sorts favorite Pokémon names based on the selected sort option
  const handleSort = (a: string, b: string) => {
    // Name Ascending: "bulbasaur" before "charizard"
    if (sortOrder === 'asc') {
      return a.localeCompare(b);
    }

    // Name Descending: "charizard" before "bulbasaur"
    if (sortOrder === 'desc') {
      return b.localeCompare(a);
    }

    // Most Recent: keep the current order
    return 0;
  };

  // Converts favorites map into a sorted array of Pokémon names
  // Example favorites:
  // {
  //   pikachu: true,
  //   charizard: true
  // }
  //
  // Example sortedFavorites:
  // ["charizard", "pikachu"]
  const sortedFavorites = Object.keys(favorites).sort(handleSort);

  const createPlaceholderPokemon = (name: string): EnrichedPokemon => ({
    name,
    url: `${POKEMON_URL}/${name}`,
    id: 0,
    generation: 0,
    spriteUrl: '',
    types: [],
  });

  return (
    <PageShell>
      <Box
        sx={{
          maxWidth: 1400,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          pt: { xs: 11, md: 12 },
          pb: 6,
          color: '#111827',
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
            ></Box>

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
                Your saved Pokémon collection. Open a card to view details or remove it from your
                list.
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
                    onChange={(e: SelectChangeEvent<SortOrder>) =>
                      setSortOrder(e.target.value as SortOrder)
                    }
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
                    {isAuthenticated ? 'No favorites saved yet' : 'Login to view your collection'}
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
                {sortedFavorites.map((name) => {
                  const pokemon = pokemonDetails[name] || createPlaceholderPokemon(name);
                  return (
                    <PokemonCard
                      key={name}
                      pokemon={pokemon}
                      onRemoveClick={removeFavorite}
                      to={`/pokemon/${name}`}
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/** Authentication popup shown when state of boolean is true due to doing user specific action while not logged in **/}
      {showAuthPopup && (
        <Authpopup onClose={() => setShowAuthPopup(false)} onSuccess={fetchFavorites} />
      )}
    </PageShell>
  );
}

export default Favorites;
