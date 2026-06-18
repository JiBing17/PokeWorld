import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios, { isAxiosError } from 'axios';
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
import type { EnrichedPokemon, FavoritesMap, PokemonListItem } from './types';

type SelectedGen = 'all' | number;

export default function Home() {
  const [allPokemonList, setAllPokemonList] = useState<PokemonListItem[]>([]); // full Pokémon list with name + url, used for search
  const [pokemonData, setPokemonData] = useState<PokemonListItem[]>([]); // basic Pokémon list for the current page
  const [enrichedPagePokemon, setEnrichedPagePokemon] = useState<EnrichedPokemon[]>([]); // current page Pokémon with id, generation, spriteUrl, and types
  const [isLoading, setIsLoading] = useState(false); // true while fetching the basic current page Pokémon
  const [isPageEnriching, setIsPageEnriching] = useState(false); // true while adding extra details to current page Pokémon
  const [isSearchEnriching, setIsSearchEnriching] = useState(false); // true while adding extra details to search results
  const [error, setError] = useState<unknown>(null); // stores fetch errors so the UI can show an error message
  const [currentPage, setCurrentPage] = useState(1); // current pagination page number
  const [totalPages, setTotalPages] = useState(1); // total number of pages based on Pokémon count
  const [favorites, setFavorites] = useState<FavoritesMap>({}); // favorite map, example: { pikachu: true, charizard: true }
  const [selectedGen, setSelectedGen] = useState<SelectedGen>('all'); // selected generation filter, either 'all' or 1–9
  const [searchQuery, setSearchQuery] = useState(''); // instant search input value as the user types
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(''); // delayed search value used after typing pauses
  const [showAuthPopup, setShowAuthPopup] = useState(false); // controls whether the login/signup popup is shown
  const { isAuthenticated } = useAuth(); // tracks login state from auth context
  const [enrichedSearchResults, setEnrichedSearchResults] = useState<EnrichedPokemon[]>([]); // search results with id, generation, spriteUrl, and types

  // Stores already-enriched Pokémon by ( name -> obj ). caching doesnt affect UI so use useRef to prevent rerenders
  const enrichedPokemonCache = useRef<Record<string, EnrichedPokemon>>({});

  const enrichWithCache = async (pokemonList: PokemonListItem[]): Promise<EnrichedPokemon[]> => {
    // Example input:
    // [
    //   { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
    //   { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' }
    // ]

    // Only keep Pokémon that are not already cached
    const missingPokemon = pokemonList.filter(
      (pokemon) => !enrichedPokemonCache.current[pokemon.name]
    );

    if (missingPokemon.length > 0) {
      // Enrich only the Pokémon we have not loaded before
      const enriched = await enrichPokemonList(missingPokemon);

      // Example cached item:
      // enrichedPokemonCache.current['ivysaur'] = {
      //   name: 'ivysaur',
      //   id: 2,
      //   generation: 1,
      //   spriteUrl: '...',
      //   types: [...]
      // }

      // Save each enriched Pokémon in the cache by name
      enriched.forEach((pokemon) => {
        enrichedPokemonCache.current[pokemon.name] = pokemon;
      });
    }

    // Example output:
    // [
    //   { name: 'bulbasaur', id: 1, generation: 1, spriteUrl: '...', types: [...] },
    //   { name: 'ivysaur', id: 2, generation: 1, spriteUrl: '...', types: [...] }
    // ]

    // Return enriched Pokémon in the same order as the input list
    return pokemonList
      .map((pokemon) => enrichedPokemonCache.current[pokemon.name])
      .filter(Boolean);
  };

  // Fetches favorites and stores them in state
  const fetchFavorites = async () => {
    try {
      // Example favoriteMap:
      // {
      //   pikachu: true,
      //   charizard: true
      // }
      const favoriteMap = await fetchUserFavorites();

      // Updates the favorites state used by Pokémon cards
      setFavorites(favoriteMap);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);

      // If fetching fails, reset favorites to an empty object
      setFavorites({});
    }
  };

  useEffect(() => { // Fetches user's favorite Pokémon when authentication state changes
    fetchFavorites();
  }, [isAuthenticated]);

  // Waits until the user stops typing before running the search
  useEffect(() => {
    // Example:
    // User types "char"
    // After 350ms, debouncedSearchQuery becomes "char"
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);

    // Clears the old timer if the user types again before 350ms
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetches the full Pokémon list once when the page first loads
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Example response:
        // [
        //   { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
        //   { name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon/2/" }
        // ]

        // Gets up to 2000 Pokémon so search can check the full list
        const res = await axios.get<{ results: PokemonListItem[] }>(`${POKEMON_URL}?limit=2000`);

        // Stores the list for universal search
        setAllPokemonList(res.data.results);
      } catch (err) {
        console.error('Error fetching full Pokémon list:', err);
      }
    };

    fetchAll();
  }, []);

  // Fetches one page of Pokémon whenever currentPage changes
  useEffect(() => {
    const fetchPage = async () => {
      // Start loading and clear any previous error
      setIsLoading(true);
      setError(null);

      try {
        // Example request:
        // /pokemon?page=2&limit=48
        //
        // Backend uses:
        // page = 2
        // limit = 48
        // offset = (page - 1) * limit = 48
        const res = await axios.get<{ results: PokemonListItem[]; count: number }>(
          `${POKEMON_URL}?page=${currentPage}&limit=${PAGE_SIZE}`
        );

        // Example res.data.results: - list of pokemons for current page
        // [
        //   { name: "venonat", url: "https://pokeapi.co/api/v2/pokemon/48/" },
        //   { name: "venomoth", url: "https://pokeapi.co/api/v2/pokemon/49/" }
        // ]
        const results = res.data.results;

        // Store the Pokémon for the current page
        setPokemonData(results);

        // Calculate how many pages exist based on the total count
        setTotalPages(Math.ceil(res.data.count / PAGE_SIZE));
      } catch (err) {
        // Save error so the UI can show the error screen
        setError(err);
      } finally {
        // Stop loading after success or failure
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [currentPage]);

  // Enriches the current page Pokémon whenever pokemonData changes
  useEffect(() => {
    // Prevents old async requests from updating state after pokemonData changes - multiple useEffects and newestest one finishes first before the old one, keep new one
    let isCancelled = false;

    const enrichPagePokemon = async () => {
      // If the current page has no Pokémon, clear the enriched list
      if (pokemonData.length === 0) {
        setEnrichedPagePokemon([]);
        return;
      }

      // Show loading state while adding id, generation, spriteUrl, and types
      setIsPageEnriching(true);

      try {
        // Example input:
        // [
        //   { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" }
        // ]
        const enriched = await enrichWithCache(pokemonData);

        // Example output:
        // [
        //   { name: "bulbasaur", id: 1, generation: 1, spriteUrl: ".../1.png", types: [...] }
        // ]

        // Only update state if this request is still the latest one
        if (!isCancelled) {
          setEnrichedPagePokemon(enriched);
        }
      } catch (err) {
        console.error('Error enriching page Pokémon:', err);

        // Clear enriched data if enrichment fails
        if (!isCancelled) {
          setEnrichedPagePokemon([]);
        }
      } finally {
        // Stop loading only if this request is still active
        if (!isCancelled) {
          setIsPageEnriching(false);
        }
      }
    };

    enrichPagePokemon();

    // Marks this request as outdated if pokemonData changes or component unmounts
    return () => {
      isCancelled = true;
    };
  }, [pokemonData]);

  // Builds enriched search results whenever the debounced search text changes
  useEffect(() => {
    // Prevents an old search from updating state after a newer search starts - multiple useEffects and newestest one finishes first before the old one, keep new one
    let isCancelled = false;

    const enrichSearchResults = async () => {
      // If the search is empty, clear results and stop search loading
      if (debouncedSearchQuery.trim() === '') {
        setEnrichedSearchResults([]);
        setIsSearchEnriching(false);
        return;
      }

      // Show loading while search results are being enriched
      setIsSearchEnriching(true);

      try {
        // Example search:
        // debouncedSearchQuery = "char"
        const lower = debouncedSearchQuery.toLowerCase();

        // Example allPokemonList:
        // [
        //   { name: "charmander", url: "https://pokeapi.co/api/v2/pokemon/4/" },
        //   { name: "charmeleon", url: "https://pokeapi.co/api/v2/pokemon/5/" },
        //   { name: "squirtle", url: "https://pokeapi.co/api/v2/pokemon/7/" }
        // ]

        // Find names that include the search text, then limit the result count
        const matches = allPokemonList
          .filter((p) => p.name.toLowerCase().includes(lower))
          .slice(0, SEARCH_RESULT_LIMIT);

        // Example matches for "char":
        // [
        //   { name: "charmander", url: "https://pokeapi.co/api/v2/pokemon/4/" },
        //   { name: "charmeleon", url: "https://pokeapi.co/api/v2/pokemon/5/" }
        // ]

        // Enrich matches with id, generation, spriteUrl, and types
        // Also saves missing enriched Pokémon into the cache
        const enriched = await enrichWithCache(matches);

        // Example enriched:
        // [
        //   { name: "charmander", id: 4, generation: 1, spriteUrl: ".../4.png", types: [...] },
        //   { name: "charmeleon", id: 5, generation: 1, spriteUrl: ".../5.png", types: [...] }
        // ]

        // Only save results if this is still the latest search
        if (!isCancelled) {
          setEnrichedSearchResults(enriched);
        }
      } catch (err) {
        console.error('Error enriching search results:', err);

        // Clear search results if enrichment fails
        if (!isCancelled) {
          setEnrichedSearchResults([]);
        }
      } finally {
        // Stop loading only if this search is still active
        if (!isCancelled) {
          setIsSearchEnriching(false);
        }
      }
    };

    enrichSearchResults();

    // Marks this search as outdated if the text/list changes or component unmounts
    return () => {
      isCancelled = true;
    };
  }, [debouncedSearchQuery, allPokemonList]);

  // Chooses which Pokémon list should be shown on the page
  const dataToDisplay = useMemo(() => {
    // useMemo recalculates this list only when search/page/filter data changes

    // If the user is searching, show search results instead of page results
    if (debouncedSearchQuery.trim() !== '') {
      // Example enrichedSearchResults:
      // [
      //   {
      //     name: "charmander",
      //     url: "https://pokeapi.co/api/v2/pokemon/4/",
      //     id: 4,
      //     generation: 1,
      //     spriteUrl: ".../4.png",
      //     types: [...]
      //   },
      //   {
      //     name: "charizard",
      //     url: "https://pokeapi.co/api/v2/pokemon/6/",
      //     id: 6,
      //     generation: 1,
      //     spriteUrl: ".../6.png",
      //     types: [...]
      //   }
      // ]
      let list = [...enrichedSearchResults];

      // If a generation is selected, only keep Pokémon from that generation
      if (selectedGen !== 'all') {
        list = list.filter((p) => p.generation === Number(selectedGen));
      }

      return list;
    }

    // If not searching, show the enriched Pokémon from the current page
    // Example enrichedPagePokemon:
    // [
    //   {
    //     name: "bulbasaur",
    //     url: "https://pokeapi.co/api/v2/pokemon/1/",
    //     id: 1,
    //     generation: 1,
    //     spriteUrl: ".../1.png",
    //     types: [...]
    //   },
    //   {
    //     name: "ivysaur",
    //     url: "https://pokeapi.co/api/v2/pokemon/2/",
    //     id: 2,
    //     generation: 1,
    //     spriteUrl: ".../2.png",
    //     types: [...]
    //   }
    // ]
    let list = [...enrichedPagePokemon];

    // If a generation is selected, only keep Pokémon from that generation
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

  // Toggles a Pokémon as favorite when the user clicks the favorite button
  const toggleFavorite = async (name: string) => {
    // Check if the user is logged in
    const token = localStorage.getItem('token');

    // If there is no token, show the login/signup popup
    if (!token) {
      setShowAuthPopup(true);
      return;
    }

    try {
      // Example before:
      // favorites = {
      //   pikachu: true
      // }
      //
      // toggleFavorite("pikachu") removes it
      // toggleFavorite("charizard") adds it

      const updatedFavorites = await toggleUserFavorite(name, favorites);

      // Example after adding charizard:
      // {
      //   pikachu: true,
      //   charizard: true
      // }

      // Update state so the heart icon changes in the UI
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  };

  // Handles generation filter clicks
  const handleGenClick = (gen: SelectedGen) => {
    // If searching, only filter the current search results by generation
    if (searchQuery.trim() !== '') {
      setSelectedGen(gen);
    } else {
      // If "All Pokémon" is selected, remove the generation filter
      if (gen === 'all') {
        setSelectedGen(gen);
      } else {
        // Example:
        // gen = 3
        // FIRST_ID_BY_GEN[3] = 252
        // PAGE_SIZE = 48
        // targetPage = Math.ceil(252 / 48) = 6

        // Find the first Pokémon ID for the selected generation
        const firstId = FIRST_ID_BY_GEN[gen];

        // Jump to the page where that generation starts
        const targetPage = Math.ceil(firstId / PAGE_SIZE);

        // Update the selected generation and page
        setSelectedGen(gen);
        setCurrentPage(targetPage);
      }
    }
  };

  // Returns chip styles based on whether the generation is selected
  const getChipSx = (isSelected: boolean) => ({
    px: 0.75,
    height: 36,
    borderRadius: '999px',
    fontWeight: 800,

    // Selected chips are red; unselected chips are white
    border: isSelected ? '1px solid #C22E28' : '1px solid #E5E7EB',
    bgcolor: isSelected ? '#C22E28' : '#FFFFFF',
    color: isSelected ? '#FFFFFF' : '#374151',

    // Gives selected and unselected chips different shadow strength
    boxShadow: isSelected
      ? '0 8px 18px rgba(194, 46, 40, 0.22)'
      : '0 4px 12px rgba(15, 23, 42, 0.06)',

    // Adds spacing inside the chip label
    '& .MuiChip-label': {
      px: 1.25,
    },

    // Hover color changes depending on selected state
    '&:hover': {
      bgcolor: isSelected ? '#B22222' : '#FFF1F2',
      borderColor: '#C22E28',
      color: isSelected ? '#FFFFFF' : '#C22E28',
    },
  });

  // True when the user typed something but debounce has not updated yet
  const isTypingSearch = searchQuery.trim() !== debouncedSearchQuery.trim();

  // True when a search is active or search results are being prepared
  const isSearching =
    searchQuery.trim() !== '' && (isTypingSearch || isSearchEnriching);

  // True when the normal page data is loading or being enriched
  const isPageBusy = isLoading || isPageEnriching;

  // Show the spinner during search, or when page data is loading and nothing is displayed yet
  const shouldShowLoading = isSearching || (isPageBusy && dataToDisplay.length === 0);

  const errorMessage = isAxiosError(error)
    ? error.message
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred';

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Error: {errorMessage}
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
