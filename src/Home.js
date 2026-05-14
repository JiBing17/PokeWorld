import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  IconButton,
  Chip,
  Button,
  CircularProgress,
  Box,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Authpopup from './Authpopup';
import { useAuth } from './AuthContext';
import { fetchUserFavorites, toggleUserFavorite } from './utils/favoritesApi';
import PokemonCard from './PokemonCard';

// API constants
const BASE_URL = 'http://localhost:5000/api';
const POKEMON_URL = `${BASE_URL}/pokemon`;
const PLACEHOLDER =
  'https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif';

// Helpers
const getIdFromUrl = (url) => url.split('/').filter(Boolean).pop();
const getSpriteUrl = (url) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${getIdFromUrl(
    url
  )}.png`;
const getGeneration = (pokedexId) => {
  const id = Number(pokedexId);
  if (id >= 1 && id <= 151) return 1;
  if (id >= 152 && id <= 251) return 2;
  if (id >= 252 && id <= 386) return 3;
  if (id >= 387 && id <= 493) return 4;
  if (id >= 494 && id <= 649) return 5;
  if (id >= 650 && id <= 721) return 6;
  if (id >= 722 && id <= 809) return 7;
  if (id >= 810 && id <= 898) return 8;
  if (id >= 899 && id <= 1010) return 9;
  return 0;
};

// Generation options and their first Pokédex IDs
const ALL_GEN_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const FIRST_ID_BY_GEN = {
  1: 1,
  2: 152,
  3: 252,
  4: 387,
  5: 494,
  6: 650,
  7: 722,
  8: 810,
  9: 899,
};

export default function Home() {
  const navigate = useNavigate();
  const [allPokemonList, setAllPokemonList] = useState([]); // name + url for all ~1118
  const [pokemonData, setPokemonData] = useState([]); // paginated results for current page
  const [enrichedPagePokemon, setEnrichedPagePokemon] = useState([]); // enriched for current page
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [favorites, setFavorites] = useState({});
  const [selectedGen, setSelectedGen] = useState('all'); // 'all', 1–9, or 'fav'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const { isAuthenticated } = useAuth();
  const [enrichedSearchResults, setEnrichedSearchResults] = useState([]);

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

  // 1) Fetch all Pokémon names+URLs once, for universal search
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await axios.get(`${POKEMON_URL}?limit=2000`);
        setAllPokemonList(res.data.results);
      } catch (err) {
        console.error('Error fetching full Pokémon list:', err);
      }
    };
    fetchAll();
  }, []);

  // 2) Fetch paginated Pokémon (48 per page)
  useEffect(() => {
    const fetchPage = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${POKEMON_URL}?page=${currentPage}&limit=48`);
        const results = res.data.results;
        setPokemonData(results);
        setTotalPages(Math.ceil(res.data.count / 48));
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPage();
  }, [currentPage]);

  // 3) Enrich current page Pokémon with id, generation, spriteUrl, and types
  useEffect(() => {
    const enrichPagePokemon = async () => {
      const enriched = await Promise.all(
        pokemonData.map(async (p) => {
          const id = getIdFromUrl(p.url);
          const gen = getGeneration(id);

          try {
            const response = await axios.get(`${POKEMON_URL}/${p.name}`);

            return {
              name: p.name,
              url: p.url,
              id: Number(id),
              generation: gen,
              spriteUrl: getSpriteUrl(p.url),
              types: response.data.types,
            };
          } catch (error) {
            console.error('Failed to fetch type for:', p.name, error);

            return {
              name: p.name,
              url: p.url,
              id: Number(id),
              generation: gen,
              spriteUrl: getSpriteUrl(p.url),
              types: [],
            };
          }
        })
      );

      setEnrichedPagePokemon(enriched);
    };

    if (pokemonData.length > 0) {
      enrichPagePokemon();
    }
  }, [pokemonData]);

  // 4) Build enrichedSearchResults when searchQuery changes
  useEffect(() => {
    const enrichSearchResults = async () => {
      if (searchQuery.trim() === '') {
        setEnrichedSearchResults([]);
        return;
      }

      const lower = searchQuery.toLowerCase();

      const matches = allPokemonList
        .filter((p) => p.name.toLowerCase().includes(lower))
        .slice(0, 60);

      const enriched = await Promise.all(
        matches.map(async (p) => {
          const id = getIdFromUrl(p.url);
          const gen = getGeneration(id);

          try {
            const response = await axios.get(`${POKEMON_URL}/${p.name}`);

            return {
              name: p.name,
              url: p.url,
              id: Number(id),
              generation: gen,
              spriteUrl: getSpriteUrl(p.url),
              types: response.data.types,
            };
          } catch (error) {
            console.error('Failed to fetch type for:', p.name, error);

            return {
              name: p.name,
              url: p.url,
              id: Number(id),
              generation: gen,
              spriteUrl: getSpriteUrl(p.url),
              types: [],
            };
          }
        })
      );

      setEnrichedSearchResults(enriched);
    };

    enrichSearchResults();
  }, [searchQuery, allPokemonList]);

  // 5) Decide which list to display:
  //    - If searchQuery non-empty: use enrichedSearchResults
  //    - Else: take enrichedPagePokemon and apply selectedGen/favorites filter
  const dataToDisplay = useMemo(() => {
    if (searchQuery.trim() !== '') {
      let list = [...enrichedSearchResults];

      if (selectedGen !== 'all') {
        list = list.filter((p) => p.generation === Number(selectedGen));
      }

      return list;
    }

    let list = [...enrichedPagePokemon];

    if (selectedGen !== 'all') {
      list = list.filter((p) => p.generation === Number(selectedGen));
    }

    return list;
  }, [
    searchQuery,
    enrichedSearchResults,
    enrichedPagePokemon,
    selectedGen,
  ]);

  const toggleFavorite = async (name) => {
    const token = localStorage.getItem('token');

    if (!token) {
      setShowAuthPopup(true);
      return;
    }

    try {
      const updatedFavorites = await toggleUserFavorite(name, favorites);
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  };

  // 6) Handle generation click: jump to page if not searching
  const handleGenClick = (gen) => {
    if (searchQuery.trim() !== '') {
      setSelectedGen(gen);
    } else {
      if (gen === 'all') {
        setSelectedGen(gen);
      } else {
        const firstId = FIRST_ID_BY_GEN[gen];
        const targetPage = Math.ceil(firstId / 48);
        setSelectedGen(gen);
        setCurrentPage(targetPage);
      }
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Error: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* AppBar with title and search */}
      <Header/>
      <Box sx={{ p: 2, bgcolor: 'background.paper', mt:10}}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search Pokémon"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Generation & Filter Chips */}
      <Box sx={{ p: 2, overflowX: 'auto', bgcolor: 'background.paper'}}>
        <Stack direction="row" spacing={1}>
          <Chip
            label="All"
            clickable
            color={selectedGen === 'all' ? 'primary' : 'default'}
            onClick={() => handleGenClick('all')}
          />

          {ALL_GEN_OPTIONS.map((gen) => (
            <Chip
              key={gen}
              label={`Gen ${gen}`}
              clickable
              color={selectedGen === gen ? 'primary' : 'default'}
              onClick={() => handleGenClick(gen)}
            />
          ))}
        </Stack>
      </Box>

      {/* Display loading, empty, or grid */}
      <Box sx={{ p: 2, position: 'relative' }}>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : dataToDisplay.length === 0 ? (
          <Typography variant="h6" align="center" color="text.secondary">
            No Pokémon match your criteria.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {dataToDisplay.map((p) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={p.name}>
                <PokemonCard
                  pokemon={p}
                  isFavorite={favorites[p.name]}
                  onFavoriteClick={toggleFavorite}
                  to={`/pokemon/${p.name}`}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Floating Pagination Arrows (hidden during search) */}
        {!searchQuery.trim() && (
          <>
            {/* Left Arrow */}
            <IconButton
              onClick={() => {
                setCurrentPage((prev) => Math.max(prev - 1, 1));
                setSearchQuery('');
              }}
              disabled={currentPage === 1}
              sx={{
                position: 'fixed',
                top: '50%',
                left: 8,
                transform: 'translateY(-50%)',
                backgroundColor: '#C22E28',
                color: 'white',
                '&:hover': { backgroundColor: '#B22222' },
                '&:disabled': {
                  backgroundColor: 'rgba(194,46,40,0.5)',
                },
                zIndex: 1000,
              }}
            >
              <NavigateBefore />
            </IconButton>

            {/* Right Arrow */}
            <IconButton
              onClick={() => {
                setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                setSearchQuery('');
              }}
              disabled={currentPage === totalPages}
              sx={{
                position: 'fixed',
                top: '50%',
                right: 8,
                transform: 'translateY(-50%)',
                backgroundColor: '#C22E28',
                color: 'white',
                '&:hover': { backgroundColor: '#B22222' },
                '&:disabled': {
                  backgroundColor: 'rgba(194,46,40,0.5)',
                },
                zIndex: 1000,
              }}
            >
              <NavigateNext />
            </IconButton>
          </>
        )}
      </Box>

      {/* Page Indicator (hidden during search) */}
      {!searchQuery.trim() && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'background.paper',
            px: 2,
            py: 1,
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          <Typography variant="body2">
            Page {currentPage} / {totalPages}
          </Typography>
        </Box>
      )}
      {showAuthPopup && (
        <Authpopup
          onClose={() => setShowAuthPopup(false)}
          onSuccess={fetchFavorites}
        />
      )}
    </Box>
  );
}
