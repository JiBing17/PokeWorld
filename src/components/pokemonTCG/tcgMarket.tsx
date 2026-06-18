import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios, { isAxiosError } from 'axios';
import {
  Box,
  Paper,
  IconButton,
  Grid,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Container,
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import TcgMarketSearchBar from './tcgMarketSearchBar';
import TcgMarketCard, { getMarketPrice, type TcgCard } from './tcgMarketCard';
import TcgCardDetailDialog from './TcgCardDetailDialog';
import PageShell from '../layout/PageShell';
import { getErrorMessage } from '../../utils/errorUtils';

// PokéTCG API endpoints
const POKETCG_BASE = 'https://api.pokemontcg.io/v2';
const CARDS_ENDPOINT = `${POKETCG_BASE}/cards`;
const SETS_ENDPOINT = `${POKETCG_BASE}/sets`;

const POKE_RED = '#C22E28';

interface TcgSetOption {
  id: string;
  name: string;
}

// Static list of Pokémon types
const TYPE_OPTIONS = [
  'Colorless',
  'Darkness',
  'Dragon',
  'Fairy',
  'Fighting',
  'Fire',
  'Grass',
  'Lightning',
  'Metal',
  'Psychic',
  'Water',
] as const;

export default function TcgMarket() {
  const [setsList, setSetsList] = useState<TcgSetOption[]>([]); // All sets for dropdown
  const [cards, setCards] = useState<TcgCard[]>([]); // Current-page cards
  const [expensiveCards, setExpensiveCards] = useState<TcgCard[]>([]); // All matching cards sorted by price
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [searchQuery, setSearchQuery] = useState(''); // Name search
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState('all'); // Set filter
  const [selectedType, setSelectedType] = useState('all'); // Type filter

  const [currentPage, setCurrentPage] = useState(1); // Pagination
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 48;

  const [showingExpensive, setShowingExpensive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCard, setModalCard] = useState<TcgCard | null>(null);

  // HEIGHT of the fixed Header (adjust if your Header is a different size)
  const HEADER_HEIGHT = 64;

  // Debounce search so API isn’t called on every keystroke
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Fetch all sets on mount
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await axios.get<{ data: TcgSetOption[] }>(SETS_ENDPOINT);
        setSetsList(res.data.data);
      } catch (err) {
        console.error(
          'Error fetching sets:',
          isAxiosError(err) ? err.message : err
        );
      }
    };

    fetchSets();
  }, []);

  // If set is reset to 'all', disable expensive feature
  useEffect(() => {
    if (selectedSet === 'all' && showingExpensive) {
      setShowingExpensive(false);
    }
  }, [selectedSet, showingExpensive]);

  // Reset to page 1 whenever filters or toggle change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedSet, selectedType, showingExpensive]);

  // Helper: Build Lucene query string with wildcards
  const buildQuery = () => {
    const filters: string[] = [];

    if (debouncedQuery !== '') {
      const q = debouncedQuery.replace(/"/g, '');
      filters.push(`name:*${q}*`);
    }

    if (selectedSet !== 'all') {
      filters.push(`set.id:${selectedSet}`);
    }

    if (selectedType !== 'all') {
      filters.push(`types:${selectedType}`);
    }

    return filters.join(' ');
  };

  // Fetch either current-page cards or ALL matching cards for expensive view
  useEffect(() => {
    const fetchCurrentPage = async () => {
      setIsLoading(true);
      setError(null);

      const qParam = buildQuery();

      try {
        const res = await axios.get<{ data: TcgCard[]; totalCount?: number }>(CARDS_ENDPOINT, {
          params: {
            q: qParam,
            page: currentPage,
            pageSize: PAGE_SIZE,
          },
        });

        setCards(res.data.data || []);

        const totalCount = res.data.totalCount || 0;
        setTotalPages(Math.max(1, Math.ceil(totalCount / PAGE_SIZE)));
      } catch (err) {
        setError(isAxiosError(err) ? err : err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAllAndSort = async () => {
      setIsLoading(true);
      setError(null);

      const qParam = buildQuery();

      let all: TcgCard[] = [];
      let page = 1;

      try {
        while (true) {
          const res = await axios.get<{ data: TcgCard[]; totalCount?: number }>(CARDS_ENDPOINT, {
            params: {
              q: qParam,
              page,
              pageSize: 250,
            },
          });

          const data = res.data.data || [];
          all = all.concat(data);

          const totalCount = res.data.totalCount || 0;
          const fetched = page * 250;

          if (fetched >= totalCount) break;

          page += 1;
        }

        // Sort by highest market price
        const sorted = all
          .filter((card) => getMarketPrice(card))
          .sort((a, b) => (getMarketPrice(b) ?? 0) - (getMarketPrice(a) ?? 0));

        setExpensiveCards(sorted);
        setTotalPages(Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)));
      } catch (err) {
        setError(isAxiosError(err) ? err : err);
      } finally {
        setIsLoading(false);
      }
    };

    if (showingExpensive) {
      fetchAllAndSort();
    } else {
      setExpensiveCards([]);
      fetchCurrentPage();
    }
  }, [
    debouncedQuery,
    selectedSet,
    selectedType,
    currentPage,
    showingExpensive,
  ]);

  // Determine which set of cards to display (sorted or paginated)
  const displayedCards = useMemo(() => {
    if (showingExpensive) {
      const start = (currentPage - 1) * PAGE_SIZE;
      return expensiveCards.slice(start, start + PAGE_SIZE);
    }

    return cards;
  }, [cards, expensiveCards, showingExpensive, currentPage]);

  const selectedSetName =
    selectedSet === 'all'
      ? 'All Sets'
      : setsList.find((set) => set.id === selectedSet)?.name ?? 'Selected Set';

  const openModal = (card: TcgCard) => {
    setModalCard(card);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalCard(null);
  };

  return (
    <PageShell>
      {/* ====== HERO ====== */}
      <Box
        sx={{
          pt: { xs: 10, md: 11 },
          pb: 3,
          px: { xs: 2, md: 4 },
          background: 'linear-gradient(135deg, #C22E28 0%, #E85D4A 45%, #FFCC00 100%)',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              color: 'white',
              mb: 0.75,
              fontSize: { xs: '1.85rem', md: '2.5rem' },
              textShadow: '0 2px 12px rgba(0,0,0,0.12)',
            }}
          >
            TCG Market
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.92)', maxWidth: 560, lineHeight: 1.7 }}>
            Browse Pokémon TCG cards, filter by set or type, and click a card for full details.
          </Typography>
          <Chip
            label={`${selectedSetName} · ${displayedCards.length} cards`}
            sx={{
              mt: 2,
              bgcolor: 'rgba(255,255,255,0.22)',
              color: 'white',
              fontWeight: 800,
              backdropFilter: 'blur(4px)',
            }}
          />
        </Container>
      </Box>

      {/* ====== FILTER BAR (sticky) ====== */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: HEADER_HEIGHT,
          zIndex: 100,
          p: 2,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        {/* Search Bar */}
        <TcgMarketSearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Set Selector */}
        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Set</InputLabel>

          <Select
            value={selectedSet}
            label="Set"
            onChange={(e) => setSelectedSet(e.target.value)}
            sx={{
              borderRadius: 999,
              bgcolor: '#FFFFFF',
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: POKE_RED,
              },
            }}
          >
            <MenuItem value="all">All Sets</MenuItem>

            {setsList.map((set) => (
              <MenuItem key={set.id} value={set.id}>
                {set.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Type Selector */}
        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Type</InputLabel>

          <Select
            value={selectedType}
            label="Type"
            onChange={(e) => setSelectedType(e.target.value)}
            sx={{
              borderRadius: 999,
              bgcolor: '#FFFFFF',
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: POKE_RED,
              },
            }}
          >
            <MenuItem value="all">All Types</MenuItem>

            {TYPE_OPTIONS.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Most Expensive Toggle (disabled when Set = All) */}
        <Chip
          label="Top Valued"
          clickable={selectedSet !== 'all'}
          onClick={() => {
            if (selectedSet !== 'all') {
              setShowingExpensive((prev) => !prev);
            }
          }}
          disabled={selectedSet === 'all'}
          sx={{
            height: 36,
            borderRadius: 999,
            fontWeight: 800,
            bgcolor: showingExpensive ? POKE_RED : '#F3F4F6',
            color: showingExpensive ? '#FFFFFF' : '#374151',
            '&:hover': {
              bgcolor: showingExpensive ? '#B22222' : '#E5E7EB',
            },
          }}
        />
      </Paper>

      {/* ====== CARD GRID ====== */}
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
        {isLoading ? (
          <Box
            sx={{
              minHeight: 360,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <CircularProgress sx={{ color: POKE_RED }} />
            <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
              Loading cards...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography color="error">
              Error loading cards: {getErrorMessage(error)}
            </Typography>
          </Box>
        ) : displayedCards.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              minHeight: 280,
              borderRadius: 4,
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 3,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No cards match your filters.
            </Typography>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 5,
              border: '1px solid #E5E7EB',
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: { xs: 2, md: 3 },
                py: 2,
                bgcolor: '#FFFFFF',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#111827' }}>
                  {selectedSetName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {displayedCards.length} cards on this page
                  {showingExpensive ? ' · sorted by value' : ''}
                </Typography>
              </Box>
              <Chip
                label={`Page ${currentPage} of ${totalPages}`}
                sx={{
                  bgcolor: '#FFF1F2',
                  color: POKE_RED,
                  fontWeight: 800,
                  border: '1px solid #FECACA',
                }}
              />
            </Box>

            <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F6F8FC' }}>
              <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                {displayedCards.map((card) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={card.id}>
                    <TcgMarketCard card={card} onClick={openModal} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        )}
      </Container>

      {/* ====== PAGINATION (middle-left & middle-right) ====== */}
      {!isLoading && !error && displayedCards.length > 0 && (
        <>
          <IconButton
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            sx={{
              position: 'fixed',
              top: '50%',
              left: 16,
              transform: 'translateY(-50%)',
              backgroundColor: POKE_RED,
              color: 'white',
              '&:hover': { backgroundColor: '#B22222' },
              '&:disabled': {
                backgroundColor: 'rgba(194,46,40,0.5)',
                color: 'white',
              },
              zIndex: 1000,
            }}
          >
            <NavigateBefore />
          </IconButton>

          <IconButton
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            sx={{
              position: 'fixed',
              top: '50%',
              right: 16,
              transform: 'translateY(-50%)',
              backgroundColor: POKE_RED,
              color: 'white',
              '&:hover': { backgroundColor: '#B22222' },
              '&:disabled': {
                backgroundColor: 'rgba(194,46,40,0.5)',
                color: 'white',
              },
              zIndex: 1000,
            }}
          >
            <NavigateNext />
          </IconButton>
        </>
      )}

      {/* ====== PAGE INDICATOR ====== */}
      {!isLoading && !error && displayedCards.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: '#FFFFFF',
            px: 3,
            py: 1,
            borderRadius: 999,
            border: '1px solid #E5E7EB',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Page {currentPage} / {totalPages}
          </Typography>
        </Box>
      )}

      <TcgCardDetailDialog
        open={modalOpen}
        card={modalCard}
        onClose={closeModal}
      />
    </PageShell>
  );
}
