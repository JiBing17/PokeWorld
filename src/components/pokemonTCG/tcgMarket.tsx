import React, { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Container,
} from '@mui/material';
import TcgSearchBar from './TcgSearchBar';
import TcgMarketCard, { type TcgCard } from './tcgMarketCard';
import TcgCardDetailDialog from './TcgCardDetailDialog';
import TcgPageHero, { TcgGridPanel } from './TcgPageHero';
import TcgStatusPanel from './TcgStatusPanel';
import TcgPagination from './TcgPagination';
import PageShell from '../layout/PageShell';
import { getErrorMessage } from '../../utils/errorUtils';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useTcgSets } from '../../hooks/useTcgSets';
import { useTcgMarketCards } from '../../hooks/useTcgMarketCards';
import { POKE_RED, HEADER_HEIGHT } from './tcgTheme';
import { TCG_TYPE_OPTIONS } from './tcgTypes';

export default function TcgMarket() {
  const { sets: setsList } = useTcgSets();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 300);
  const [selectedSet, setSelectedSet] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showingExpensive, setShowingExpensive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCard, setModalCard] = useState<TcgCard | null>(null);

  useEffect(() => {
    if (selectedSet === 'all' && showingExpensive) {
      setShowingExpensive(false);
    }
  }, [selectedSet, showingExpensive]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedSet, selectedType, showingExpensive]);

  const { displayedCards, isLoading, error, totalPages } = useTcgMarketCards({
    debouncedQuery,
    selectedSet,
    selectedType,
    currentPage,
    showingExpensive,
  });

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

  const showPagination = !isLoading && !error && displayedCards.length > 0;

  return (
    <PageShell>
      <TcgPageHero
        title="TCG Market"
        subtitle="Browse Pokémon TCG cards, filter by set, and click a card for collector details."
        chipLabel={`${selectedSetName} · ${displayedCards.length} cards`}
      />

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
        <TcgSearchBar
          placeholder="Search cards by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Set</InputLabel>
          <Select
            value={selectedSet}
            label="Set"
            onChange={(e) => setSelectedSet(e.target.value)}
            sx={{
              borderRadius: 999,
              bgcolor: '#FFFFFF',
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: POKE_RED },
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

        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Type</InputLabel>
          <Select
            value={selectedType}
            label="Type"
            onChange={(e) => setSelectedType(e.target.value)}
            sx={{
              borderRadius: 999,
              bgcolor: '#FFFFFF',
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: POKE_RED },
            }}
          >
            <MenuItem value="all">All Types</MenuItem>
            {TCG_TYPE_OPTIONS.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Chip
          label="Top Valued"
          clickable={selectedSet !== 'all'}
          onClick={() => {
            if (selectedSet !== 'all') setShowingExpensive((prev) => !prev);
          }}
          disabled={selectedSet === 'all'}
          sx={{
            height: 36,
            borderRadius: 999,
            fontWeight: 800,
            bgcolor: showingExpensive ? POKE_RED : '#F3F4F6',
            color: showingExpensive ? '#FFFFFF' : '#374151',
            '&:hover': { bgcolor: showingExpensive ? '#B22222' : '#E5E7EB' },
          }}
        />
      </Paper>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
        <TcgStatusPanel
          loading={isLoading}
          loadingMessage="Loading cards..."
          error={error ? `Error loading cards: ${getErrorMessage(error)}` : undefined}
          empty={!isLoading && !error && displayedCards.length === 0 ? 'No cards match your filters.' : undefined}
        >
          <TcgGridPanel
            title={selectedSetName}
            subtitle={`${displayedCards.length} cards on this page${showingExpensive ? ' · sorted by value' : ''}`}
            pageLabel={`Page ${currentPage} of ${totalPages}`}
          >
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              {displayedCards.map((card) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={card.id}>
                  <TcgMarketCard card={card} onClick={openModal} />
                </Grid>
              ))}
            </Grid>
          </TcgGridPanel>
        </TcgStatusPanel>
      </Container>

      {showPagination && (
        <TcgPagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <TcgCardDetailDialog open={modalOpen} card={modalCard} onClose={closeModal} />
    </PageShell>
  );
}
