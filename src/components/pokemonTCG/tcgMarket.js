import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  IconButton,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Container,
} from '@mui/material';
import {
  Close,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import Header from '../Header';
import TcgMarketSearchBar from './tcgMarketSearchBar';
import TcgMarketCard, { getMarketPrice } from './tcgMarketCard';

// PokéTCG API endpoints
const POKETCG_BASE = 'https://api.pokemontcg.io/v2';
const CARDS_ENDPOINT = `${POKETCG_BASE}/cards`;
const SETS_ENDPOINT = `${POKETCG_BASE}/sets`;

const POKE_RED = '#C22E28';

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
];

export default function TcgMarket() {
  const [setsList, setSetsList] = useState([]); // All sets for dropdown
  const [cards, setCards] = useState([]); // Current-page cards
  const [expensiveCards, setExpensiveCards] = useState([]); // All matching cards sorted by price
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState(''); // Name search
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState('all'); // Set filter
  const [selectedType, setSelectedType] = useState('all'); // Type filter

  const [currentPage, setCurrentPage] = useState(1); // Pagination
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 48;

  const [showingExpensive, setShowingExpensive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCard, setModalCard] = useState(null);

  // HEIGHT of the fixed Header (adjust if your Header is a different size)
  const HEADER_HEIGHT = 64;

  // Debounce search so API isn’t called on every keystroke
  const debounceTimer = useRef(null);

  useEffect(() => {
    clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  // Fetch all sets on mount
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await axios.get(SETS_ENDPOINT);
        setSetsList(res.data.data);
      } catch (err) {
        console.error('Error fetching sets:', err);
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
    const filters = [];

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
        const res = await axios.get(CARDS_ENDPOINT, {
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
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAllAndSort = async () => {
      setIsLoading(true);
      setError(null);

      const qParam = buildQuery();

      let all = [];
      let page = 1;

      try {
        while (true) {
          const res = await axios.get(CARDS_ENDPOINT, {
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
          .sort((a, b) => getMarketPrice(b) - getMarketPrice(a));

        setExpensiveCards(sorted);
        setTotalPages(Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)));
      } catch (err) {
        setError(err);
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

  const openModal = (card) => {
    setModalCard(card);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalCard(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F6F8FC' }}>
      {/* ====== HEADER ====== */}
      <Header />

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
      <Container maxWidth="lg" sx={{ py: 6 }}>
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
            <Typography color="error">Error loading cards.</Typography>
          </Box>
        ) : displayedCards.length === 0 ? (
          <Box
            sx={{
              minHeight: 260,
              bgcolor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 4,
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
          </Box>
        ) : (
          <Grid container spacing={3}>
            {displayedCards.map((card) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={card.id}>
                <TcgMarketCard card={card} onClick={openModal} />
              </Grid>
            ))}
          </Grid>
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

      {/* ====== CARD DETAIL DIALOG ====== */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            position: 'relative',
            textAlign: 'center',
            bgcolor: POKE_RED,
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: 'bold',
          }}
        >
          {modalCard?.name}

          <IconButton
            aria-label="close"
            onClick={closeModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {modalCard && (
            <Box>
              {/* Large Card Image */}
              <Box
                component="img"
                src={modalCard.images.large}
                alt={modalCard.name}
                sx={{
                  width: '260px',
                  height: '370px',
                  objectFit: 'contain',
                  mb: 3,
                  mx: 'auto',
                  display: 'block',
                  boxShadow: 4,
                  borderRadius: 2,
                }}
              />

              {/* Basic Info */}
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Set:</strong> {modalCard.set.name} ({modalCard.set.series})
              </Typography>

              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Supertype:</strong> {modalCard.supertype}
              </Typography>

              {modalCard.subtypes?.length > 0 && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Subtype:</strong> {modalCard.subtypes.join(', ')}
                </Typography>
              )}

              {modalCard.hp && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>HP:</strong> {modalCard.hp}
                </Typography>
              )}

              {modalCard.types?.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  {modalCard.types.map((type) => (
                    <Chip
                      key={type}
                      label={type}
                      sx={{
                        bgcolor: '#FFF1F2',
                        color: POKE_RED,
                        fontWeight: 800,
                      }}
                    />
                  ))}
                </Box>
              )}

              {modalCard.rarity && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Rarity:</strong> {modalCard.rarity}
                </Typography>
              )}

              {modalCard.flavorText && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: 'italic', mb: 2 }}
                >
                  “{modalCard.flavorText}”
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Attacks Section */}
              {modalCard.attacks?.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Attacks
                  </Typography>

                  {modalCard.attacks.map((atk, idx) => (
                    <Box key={idx} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        {atk.name}{' '}

                        {atk.damage && (
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            — {atk.damage}
                          </Typography>
                        )}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        {atk.text}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        Cost: {atk.cost.join(', ')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Abilities Section */}
              {modalCard.abilities?.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Abilities
                  </Typography>

                  {modalCard.abilities.map((ab, idx) => (
                    <Box key={idx} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">{ab.name}</Typography>

                      <Typography variant="body2" color="text.secondary">
                        {ab.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Weaknesses / Resistances */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                  mt: 3,
                  flexWrap: 'wrap',
                }}
              >
                {modalCard.weaknesses && (
                  <Typography variant="body2">
                    <strong>Weaknesses:</strong>{' '}
                    {modalCard.weaknesses
                      .map((w) => `${w.type} ×${w.value}`)
                      .join(', ')}
                  </Typography>
                )}

                {modalCard.resistances && (
                  <Typography variant="body2">
                    <strong>Resistances:</strong>{' '}
                    {modalCard.resistances
                      .map((r) => `${r.type} ×${r.value}`)
                      .join(', ')}
                  </Typography>
                )}
              </Box>

              {/* Retreat Cost */}
              {modalCard.retreatCost?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Retreat Cost:</strong>{' '}
                    {modalCard.retreatCost.join(', ')}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', p: 2 }}>
          <Button
            onClick={closeModal}
            variant="contained"
            sx={{
              bgcolor: POKE_RED,
              textTransform: 'none',
              fontWeight: 800,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#B22222',
                boxShadow: 'none',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}