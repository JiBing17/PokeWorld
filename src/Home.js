import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Typography,
  Grid,
  IconButton,
  Chip,
  CircularProgress,
  Box,
  Stack,
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import Header from './components/Header';
import Authpopup from './components/Authpopup';
import SearchBar from './components/SearchBar';
import { useAuth } from './AuthContext';
import { fetchUserFavorites, toggleUserFavorite } from './utils/favoritesApi';
import PokemonCard from './components/pokeAPI/PokemonCard';
import { enrichPokemonList } from './utils/pokemonUtils';
import {
  POKEMON_URL,
  PAGE_SIZE,
  SEARCH_RESULT_LIMIT,
  ALL_GEN_OPTIONS,
  FIRST_ID_BY_GEN,
} from './utils/constants';

export default function Home() {
  const [allPokemonList, setAllPokemonList] = useState([]); // name + url for all ~1118
  const [pokemonData, setPokemonData] = useState([]); // paginated results for current page
  const [enrichedPagePokemon, setEnrichedPagePokemon] = useState([]); // enriched for current page
  const [isLoading, setIsLoading] = useState(false);
  const [isPageEnriching, setIsPageEnriching] = useState(false);
  const [isSearchEnriching, setIsSearchEnriching] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [favorites, setFavorites] = useState({});
  const [selectedGen, setSelectedGen] = useState('all'); // 'all' or 1–9
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const { isAuthenticated } = useAuth();
  const [enrichedSearchResults, setEnrichedSearchResults] = useState([]);

  const enrichedPokemonCache = useRef({});

  const enrichWithCache = async (pokemonList) => {
    const missingPokemon = pokemonList.filter(
      (pokemon) => !enrichedPokemonCache.current[pokemon.name]
    );

    if (missingPokemon.length > 0) {
      const enriched = await enrichPokemonList(missingPokemon);

      enriched.forEach((pokemon) => {
        enrichedPokemonCache.current[pokemon.name] = pokemon;
      });
    }

    return pokemonList
      .map((pokemon) => enrichedPokemonCache.current[pokemon.name])
      .filter(Boolean);
  };

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
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
        const res = await axios.get(`${POKEMON_URL}?page=${currentPage}&limit=${PAGE_SIZE}`);
        const results = res.data.results;

        setPokemonData(results);
        setTotalPages(Math.ceil(res.data.count / PAGE_SIZE));
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
    let isCancelled = false;

    const enrichPagePokemon = async () => {
      if (pokemonData.length === 0) {
        setEnrichedPagePokemon([]);
        return;
      }

      setIsPageEnriching(true);

      try {
        const enriched = await enrichWithCache(pokemonData);

        if (!isCancelled) {
          setEnrichedPagePokemon(enriched);
        }
      } catch (err) {
        console.error('Error enriching page Pokémon:', err);

        if (!isCancelled) {
          setEnrichedPagePokemon([]);
        }
      } finally {
        if (!isCancelled) {
          setIsPageEnriching(false);
        }
      }
    };

    enrichPagePokemon();

    return () => {
      isCancelled = true;
    };
  }, [pokemonData]);

  // 4) Build enrichedSearchResults when searchQuery changes
  useEffect(() => {
    let isCancelled = false;

    const enrichSearchResults = async () => {
      if (debouncedSearchQuery.trim() === '') {
        setEnrichedSearchResults([]);
        setIsSearchEnriching(false);
        return;
      }

      setIsSearchEnriching(true);

      try {
        const lower = debouncedSearchQuery.toLowerCase();

        const matches = allPokemonList
          .filter((p) => p.name.toLowerCase().includes(lower))
          .slice(0, SEARCH_RESULT_LIMIT);

        const enriched = await enrichWithCache(matches);

        if (!isCancelled) {
          setEnrichedSearchResults(enriched);
        }
      } catch (err) {
        console.error('Error enriching search results:', err);

        if (!isCancelled) {
          setEnrichedSearchResults([]);
        }
      } finally {
        if (!isCancelled) {
          setIsSearchEnriching(false);
        }
      }
    };

    enrichSearchResults();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearchQuery, allPokemonList]);

  // 5) Decide which list to display:
  //    - If searchQuery non-empty: use enrichedSearchResults
  //    - Else: take enrichedPagePokemon and apply selectedGen/favorites filter
  const dataToDisplay = useMemo(() => {
    if (debouncedSearchQuery.trim() !== '') {
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
    debouncedSearchQuery,
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
        const targetPage = Math.ceil(firstId / PAGE_SIZE);

        setSelectedGen(gen);
        setCurrentPage(targetPage);
      }
    }
  };

  const getChipSx = (isSelected) => ({
    px: 0.75,
    height: 36,
    borderRadius: '999px',
    fontWeight: 800,
    border: isSelected ? '1px solid #C22E28' : '1px solid #E5E7EB',
    bgcolor: isSelected ? '#C22E28' : '#FFFFFF',
    color: isSelected ? '#FFFFFF' : '#374151',
    boxShadow: isSelected
      ? '0 8px 18px rgba(194, 46, 40, 0.22)'
      : '0 4px 12px rgba(15, 23, 42, 0.06)',
    '& .MuiChip-label': {
      px: 1.25,
    },
    '&:hover': {
      bgcolor: isSelected ? '#B22222' : '#FFF1F2',
      borderColor: '#C22E28',
      color: isSelected ? '#FFFFFF' : '#C22E28',
    },
  });

  const isTypingSearch = searchQuery.trim() !== debouncedSearchQuery.trim();
  const isSearching = searchQuery.trim() !== '' && (isTypingSearch || isSearchEnriching);
  const isPageBusy = isLoading || isPageEnriching;
  const shouldShowLoading = isSearching || (isPageBusy && dataToDisplay.length === 0);

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
    <Box sx={{ minHeight: '100vh', bgcolor: '#F6F8FC' }}>
      {/* AppBar with title and search */}
      <Header />

      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: 12,
          pb: 2,
          bgcolor: '#F6F8FC',
        }}
      >
        <SearchBar
          label="Search Pokémon"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 0 }}
        />
      </Box>

      {/* Generation & Filter Chips */}
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pb: 2,
          overflowX: 'auto',
          bgcolor: '#F6F8FC',
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          sx={{
            minWidth: 'max-content',
            py: 0.5,
          }}
        >
          <Chip
            label="All Pokémon"
            clickable
            onClick={() => handleGenClick('all')}
            sx={getChipSx(selectedGen === 'all')}
          />

          {ALL_GEN_OPTIONS.map((gen) => (
            <Chip
              key={gen}
              label={`Generation ${gen}`}
              clickable
              onClick={() => handleGenClick(gen)}
              sx={getChipSx(selectedGen === gen)}
            />
          ))}
        </Stack>
      </Box>

      {/* Display loading, empty, or grid */}
      <Box sx={{ p: { xs: 2, md: 3 }, position: 'relative' }}>
        {shouldShowLoading ? (
          <Box
            sx={{
              minHeight: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              color: 'text.secondary',
            }}
          >
            <CircularProgress sx={{ color: '#C22E28' }} />

            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {searchQuery.trim()
                ? 'Searching Pokédex...'
                : 'Loading Pokémon...'}
            </Typography>
          </Box>
        ) : dataToDisplay.length === 0 ? (
          <Box
            sx={{
              minHeight: 260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No Pokémon match your criteria.
            </Typography>
          </Box>
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