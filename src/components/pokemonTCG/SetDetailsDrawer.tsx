import React, { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  Box,
  Drawer,
  Stack,
  Typography,
  IconButton,
  Grid,
  CardMedia,
  Chip,
  Divider,
  Skeleton,
  useTheme,
  alpha,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TcgMarketCard, { type TcgCard } from './tcgMarketCard';
import TcgCardDetailDialog from './TcgCardDetailDialog';
import TcgPagination from './TcgPagination';
import TcgStatusPanel from './TcgStatusPanel';
import { fetchSetById, fetchSetCardsPage } from './tcgApi';
import { getErrorMessage } from '../../utils/errorUtils';
import { isAbortError } from '../../utils/retryUtils';
import { POKE_RED, darken } from './tcgTheme';
import { TCG_SET_DRAWER_PAGE_SIZE } from './tcgTypes';
import type { TcgSet } from './tcgTypes';

interface SetDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  setId: string | null;
}

export default function SetDetailsDrawer({ open, onClose, setId }: SetDetailsDrawerProps) {
  const theme = useTheme();

  const [setInfo, setSetInfo] = useState<TcgSet | null>(null);
  const [loadingSet, setLoadingSet] = useState(false);
  const [setErr, setSetErr] = useState<unknown>(null);

  const [cards, setCards] = useState<TcgCard[]>([]);
  const [cardsErr, setCardsErr] = useState<unknown>(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalCard, setModalCard] = useState<TcgCard | null>(null);

  useEffect(() => setPage(1), [setId]);

  useEffect(() => {
    if (!open || !setId) return;
    const controller = new AbortController();
    setLoadingSet(true);
    setSetErr(null);

    fetchSetById(setId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSetInfo(data);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        if (!controller.signal.aborted) setSetErr(isAxiosError(err) ? err : err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSet(false);
      });

    return () => controller.abort();
  }, [open, setId]);

  useEffect(() => {
    if (!open || !setId) return;
    const controller = new AbortController();
    setLoadingCards(true);
    setCardsErr(null);

    fetchSetCardsPage(setId, page, TCG_SET_DRAWER_PAGE_SIZE, controller.signal)
      .then(({ data, totalCount: count }) => {
        if (controller.signal.aborted) return;
        setCards(data);
        setTotalCount(count ?? 0);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        if (!controller.signal.aborted) setCardsErr(isAxiosError(err) ? err : err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCards(false);
      });

    return () => controller.abort();
  }, [open, setId, page]);

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / TCG_SET_DRAWER_PAGE_SIZE));
  const redLine = alpha(POKE_RED, 0.35);
  const redSofter = alpha(POKE_RED, 0.08);

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', md: 980 },
            maxWidth: '100vw',
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.mode === 'dark' ? alpha('#0d0d0d', 0.95) : '#fff',
            backgroundImage: 'none',
            borderLeft: `4px solid ${POKE_RED}`,
          },
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            px: { xs: 2, md: 3 },
            py: 1.5,
            bgcolor: POKE_RED,
            color: '#fff',
            borderBottom: `1px solid ${alpha('#000', 0.15)}`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
              {loadingSet ? (
                <Skeleton variant="rounded" width={120} height={36} sx={{ bgcolor: alpha('#fff', 0.2) }} />
              ) : setInfo?.images?.logo ? (
                <CardMedia
                  component="img"
                  src={setInfo.images.logo}
                  alt={`${setInfo.name} logo`}
                  sx={{ height: 36, width: 140, objectFit: 'contain', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.25))' }}
                />
              ) : null}
              {loadingSet ? (
                <Skeleton variant="circular" width={26} height={26} sx={{ bgcolor: alpha('#fff', 0.2) }} />
              ) : setInfo?.images?.symbol ? (
                <CardMedia
                  component="img"
                  src={setInfo.images.symbol}
                  alt={`${setInfo.name} symbol`}
                  sx={{ height: 24, width: 24, objectFit: 'contain' }}
                />
              ) : null}

              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }} noWrap>
                  {setInfo?.name || (setId ? `Set: ${setId}` : 'Set Details')}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {setInfo?.series && (
                    <Chip label={setInfo.series} size="small" sx={headerChipSx} />
                  )}
                  {setInfo?.releaseDate && (
                    <Chip label={`Released ${setInfo.releaseDate}`} size="small" sx={headerChipSx} />
                  )}
                  {setInfo?.ptcgoCode && (
                    <Chip label={`PTCGO ${setInfo.ptcgoCode}`} size="small" sx={headerChipSx} />
                  )}
                  {setInfo?.total != null && (
                    <Chip
                      label={`Total ${setInfo.total}${setInfo.printedTotal != null ? ` / ${setInfo.printedTotal} printed` : ''}`}
                      size="small"
                      sx={headerChipSx}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>

            <IconButton
              onClick={onClose}
              sx={{
                color: '#fff',
                bgcolor: alpha('#000', 0.18),
                '&:hover': { bgcolor: alpha('#000', 0.28) },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 3 },
            pb: { xs: 4, md: 3 },
          }}
        >
          {setErr != null && (
            <Box sx={{ mb: 2, p: 2, borderRadius: 3, bgcolor: redSofter, border: `1px solid ${redLine}` }}>
              <Typography color="error" sx={{ mb: 1, fontWeight: 700 }}>
                Couldn&apos;t load set: {getErrorMessage(setErr)}
              </Typography>
              <Button size="small" variant="outlined" sx={retryButtonSx} onClick={() => window.location.reload()}>
                Try again
              </Button>
            </Box>
          )}

          <Divider sx={{ mb: 2, borderColor: redLine }} />

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {`Cards${totalCount ? ` (${totalCount})` : ''}`}
            </Typography>
          </Stack>

          <TcgStatusPanel
            loading={loadingCards}
            loadingMessage="Loading cards..."
            error={cardsErr ? `Couldn't load cards: ${getErrorMessage(cardsErr)}` : undefined}
            empty={!loadingCards && !cardsErr && cards.length === 0 ? 'No cards found in this set.' : undefined}
            minHeight={240}
          >
            <Grid container spacing={2}>
              {cards.map((card) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={card.id}>
                  <TcgMarketCard
                    card={card}
                    onClick={(c) => {
                      setModalCard(c);
                      setModalOpen(true);
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </TcgStatusPanel>

          {totalCount > TCG_SET_DRAWER_PAGE_SIZE && (
            <TcgPagination
              variant="inline"
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showIndicator={false}
            />
          )}
        </Box>
      </Drawer>

      <TcgCardDetailDialog
        open={modalOpen}
        card={modalCard}
        onClose={() => {
          setModalOpen(false);
          setModalCard(null);
        }}
      />
    </>
  );
}

const headerChipSx = {
  color: '#fff',
  bgcolor: alpha('#000', 0.15),
  border: `1px solid ${alpha('#000', 0.2)}`,
  fontWeight: 700,
};

const retryButtonSx = {
  borderColor: POKE_RED,
  color: POKE_RED,
  '&:hover': { borderColor: darken(POKE_RED), background: alpha(POKE_RED, 0.06) },
};
