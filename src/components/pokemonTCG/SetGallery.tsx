import React, { useState } from 'react';
import { Container, Grid, alpha } from '@mui/material';
import SetDetailsDrawer from './SetDetailsDrawer';
import TcgSetCard from './TcgSetCard';
import TcgSearchBar from './TcgSearchBar';
import TcgPageHero from './TcgPageHero';
import TcgStatusPanel from './TcgStatusPanel';
import TcgPagination from './TcgPagination';
import PageShell from '../layout/PageShell';
import { useTcgSets } from '../../hooks/useTcgSets';
import { getErrorMessage } from '../../utils/errorUtils';
import { POKE_RED } from './tcgTheme';
import { TCG_SETS_PAGE_SIZE } from './tcgTypes';

export default function SetGallery() {
  const { sets, loading, error } = useTcgSets();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);

  const filteredSets = sets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const paginatedSets =
    search.trim() === ''
      ? filteredSets.slice((page - 1) * TCG_SETS_PAGE_SIZE, page * TCG_SETS_PAGE_SIZE)
      : filteredSets;

  const totalPages = Math.ceil(filteredSets.length / TCG_SETS_PAGE_SIZE);
  const showPagination = search.trim() === '' && totalPages > 1;

  return (
    <PageShell>
      <TcgPageHero
        title="TCG Sets"
        subtitle="Browse every Pokémon TCG expansion, search by name, and explore cards in each set."
        chipLabel={`${filteredSets.length} sets`}
      />

      <Container
        maxWidth="xl"
        sx={{
          py: { xs: 3, md: 5 },
          px: { xs: 2, md: 3 },
          backgroundImage: `radial-gradient(${alpha(POKE_RED, 0.06)} 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      >
        <TcgSearchBar
          fullWidth
          placeholder="Search TCG sets..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <TcgStatusPanel
          loading={loading}
          loadingMessage="Loading sets..."
          error={error ? `Error loading sets: ${getErrorMessage(error)}` : undefined}
          empty={!loading && !error && paginatedSets.length === 0 ? 'No sets match your search.' : undefined}
        >
          <Grid container spacing={4}>
            {paginatedSets.map((set) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={set.id}>
                <TcgSetCard
                  set={set}
                  onViewDetails={() => {
                    setActiveSetId(set.id);
                    setDetailsOpen(true);
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </TcgStatusPanel>
      </Container>

      {showPagination && (
        <TcgPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <SetDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        setId={activeSetId}
      />
    </PageShell>
  );
}
