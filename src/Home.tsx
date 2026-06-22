import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Typography,
  Grid,
  IconButton,
  CircularProgress,
  Box,
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import Authpopup from './components/Authpopup';
import SearchBar from './components/SearchBar';
import PageShell from './components/layout/PageShell';
import GenerationFilter from './components/pokeAPI/GenerationFilter';
import PokemonCard from './components/pokeAPI/PokemonCard';
import { enrichPokemonList } from './utils/pokemonUtils';
import { getErrorMessage } from './utils/errorUtils';
import { apiClient } from './utils/apiClient';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useFavorites } from './hooks/useFavorites';
import {
  PAGE_SIZE,
  SEARCH_RESULT_LIMIT,
  FIRST_ID_BY_GEN,
} from './utils/constants';
import type { EnrichedPokemon, PokemonListItem } from './types';

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
  const [selectedGen, setSelectedGen] = useState<SelectedGen>('all'); // selected generation filter, either 'all' or 1–9
  const [searchQuery, setSearchQuery] = useState(''); // instant search input value as the user types
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 350); // delayed search value used after typing pauses
  const [enrichedSearchResults, setEnrichedSearchResults] = useState<EnrichedPokemon[]>([]); // search results with id, generation, spriteUrl, and types
  const {
    favorites,
    showAuthPopup,
    setShowAuthPopup,
    fetchFavorites,
    toggleFavorite,
  } = useFavorites();

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
        const res = await apiClient.get<{ results: PokemonListItem[] }>('/pokemon?limit=2000');

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
        const res = await apiClient.get<{ results: PokemonListItem[]; count: number }>(
          `/pokemon?page=${currentPage}&limit=${PAGE_SIZE}`
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

  // True when the user typed something but debounce has not updated yet
  const isTypingSearch = searchQuery.trim() !== debouncedSearchQuery.trim();

  // True when a search is active or search results are being prepared
  const isSearching =
    searchQuery.trim() !== '' && (isTypingSearch || isSearchEnriching);

  // True when the normal page data is loading or being enriched
  const isPageBusy = isLoading || isPageEnriching;

  // Show the spinner during search, or when page data is loading and nothing is displayed yet
  const shouldShowLoading = isSearching || (isPageBusy && dataToDisplay.length === 0);

  if (error) {
    return (
      <PageShell>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Error: {getErrorMessage(error)}
          </Typography>
        </Box>
      </PageShell>
    );
  }

  return (
    <PageShell>

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
      <GenerationFilter selectedGen={selectedGen} onGenClick={handleGenClick} />

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
    </PageShell>
  );
}
