// SetDetailsDrawer.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Drawer,
  Stack,
  Typography,
  IconButton,
  CircularProgress,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Chip,
  Divider,
  Tooltip,
  Skeleton,
  useTheme,
  alpha,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const API_BASE = 'https://api.pokemontcg.io/v2';
const PAGE_SIZE = 24;

// —— brand colors
const POKE_RED = '#C22E28';
const darken = (hex, amt = 0.14) => {
  // quick darken: blend with black
  const to = (c) => Math.max(0, Math.min(255, Math.round(c * (1 - amt))));
  const [r,g,b] = hex.replace('#','').match(/.{1,2}/g).map((x)=>parseInt(x,16));
  return `rgb(${to(r)}, ${to(g)}, ${to(b)})`;
};

export default function SetDetailsDrawer({ open, onClose, setId }) {
  const theme = useTheme();

  const [setInfo, setSetInfo] = useState(null);
  const [loadingSet, setLoadingSet] = useState(false);
  const [setErr, setSetErr] = useState(null);

  const [cards, setCards] = useState([]);
  const [cardsErr, setCardsErr] = useState(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const axiosCfg = useMemo(() => ({}), []);

  useEffect(() => setPage(1), [setId]);

  useEffect(() => {
    if (!open || !setId) return;
    let cancelled = false;
    setLoadingSet(true);
    setSetErr(null);

    axios
      .get(`${API_BASE}/sets/${setId}`, axiosCfg)
      .then((res) => !cancelled && setSetInfo(res.data?.data ?? null))
      .catch((err) => !cancelled && setSetErr(err))
      .finally(() => !cancelled && setLoadingSet(false));

    return () => { cancelled = true; };
  }, [open, setId, axiosCfg]);

  useEffect(() => {
    if (!open || !setId) return;
    let cancelled = false;
    setLoadingCards(true);
    setCardsErr(null);

    const params = new URLSearchParams({
      q: `set.id:${setId}`,
      orderBy: 'number',
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });

    axios
      .get(`${API_BASE}/cards?${params.toString()}`, axiosCfg)
      .then((res) => {
        if (cancelled) return;
        const payload = res.data;
        setCards(payload?.data ?? []);
        setTotalCount(payload?.totalCount ?? payload?.total ?? 0);
      })
      .catch((err) => !cancelled && setCardsErr(err))
      .finally(() => !cancelled && setLoadingCards(false));

    return () => { cancelled = true; };
  }, [open, setId, page, axiosCfg]);

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / PAGE_SIZE));

  const surface = theme.palette.mode === 'dark'
    ? alpha('#0d0d0d', 0.95)
    : '#fff';

  const cardSurface = theme.palette.mode === 'dark'
    ? alpha('#151515', 0.9)
    : '#fafafa';

  const redSoft = alpha(POKE_RED, 0.12);
  const redSofter = alpha(POKE_RED, 0.08);
  const redLine = alpha(POKE_RED, 0.35);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', md: 980 },
          bgcolor: surface,
          backgroundImage: 'none',
          borderLeft: `4px solid ${POKE_RED}`,
        },
      }}
    >
      {/* sticky red header bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          px: { xs: 2, md: 3 },
          py: 1.5,
          bgcolor: POKE_RED,
          color: '#fff',
          borderBottom: `1px solid ${alpha('#000',0.15)}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            {/* logos */}
            {loadingSet ? (
              <Skeleton variant="rounded" width={120} height={36} sx={{ bgcolor: alpha('#fff',0.2) }} />
            ) : setInfo?.images?.logo ? (
              <CardMedia
                component="img"
                src={setInfo.images.logo}
                alt={`${setInfo.name} logo`}
                sx={{ height: 36, width: 140, objectFit: 'contain', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.25))' }}
              />
            ) : null}
            {loadingSet ? (
              <Skeleton variant="circular" width={26} height={26} sx={{ bgcolor: alpha('#fff',0.2) }} />
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
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {setInfo?.series && (
                  <Chip
                    label={setInfo.series}
                    size="small"
                    sx={{
                      color: '#fff',
                      bgcolor: alpha('#000', 0.15),
                      border: `1px solid ${alpha('#000',0.2)}`,
                      fontWeight: 700,
                    }}
                  />
                )}
                {setInfo?.releaseDate && (
                  <Chip
                    label={`Released ${setInfo.releaseDate}`}
                    size="small"
                    sx={{
                      color: '#fff',
                      bgcolor: alpha('#000', 0.15),
                      border: `1px solid ${alpha('#000',0.2)}`,
                    }}
                  />
                )}
                {setInfo?.ptcgoCode && (
                  <Chip
                    label={`PTCGO ${setInfo.ptcgoCode}`}
                    size="small"
                    sx={{
                      color: '#fff',
                      bgcolor: alpha('#000', 0.15),
                      border: `1px solid ${alpha('#000',0.2)}`,
                    }}
                  />
                )}
                {setInfo?.total != null && (
                  <Chip
                    label={`Total ${setInfo.total}${setInfo.printedTotal != null ? ` / ${setInfo.printedTotal} printed` : ''}`}
                    size="small"
                    sx={{
                      color: '#fff',
                      bgcolor: alpha('#000', 0.15),
                      border: `1px solid ${alpha('#000',0.2)}`,
                    }}
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

      {/* content */}
      <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
        {setErr && (
          <Card sx={{ mb: 2, p: 2, bgcolor: redSofter, border: `1px solid ${redLine}` }}>
            <Typography color="error" sx={{ mb: 1, fontWeight: 700 }}>
              Couldn’t load set: {String(setErr?.message || 'Unknown error')}
            </Typography>
            <Button size="small" variant="outlined" sx={{
              borderColor: POKE_RED, color: POKE_RED, '&:hover': { borderColor: darken(POKE_RED), background: alpha(POKE_RED, .06) }
            }} onClick={() => window.location.reload()}>
              Try again
            </Button>
          </Card>
        )}

        <Divider sx={{ mb: 2, borderColor: redLine }} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {`Cards${totalCount ? ` (${totalCount})` : ''}`}
          </Typography>
          {loadingCards && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} sx={{ color: POKE_RED }} />
              <Typography variant="body2" color="text.secondary">Loading…</Typography>
            </Stack>
          )}
        </Stack>

        {cardsErr ? (
          <Card sx={{ p: 2, bgcolor: redSofter, border: `1px solid ${redLine}` }}>
            <Typography color="error" sx={{ mb: 1, fontWeight: 700 }}>
              Couldn’t load cards: {String(cardsErr?.message || 'Unknown error')}
            </Typography>
            <Button size="small" variant="outlined" sx={{
              borderColor: POKE_RED, color: POKE_RED, '&:hover': { borderColor: darken(POKE_RED), background: alpha(POKE_RED, .06) }
            }} onClick={() => setPage((p)=>p)}>
              Retry
            </Button>
          </Card>
        ) : loadingCards ? (
          <Grid container spacing={2}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={`sk-${i}`}>
                <Card elevation={0} sx={{ p: 1.5, borderRadius: 3, bgcolor: cardSurface, border: `1px dashed ${alpha(POKE_RED, 0.35)}` }}>
                  <Skeleton variant="rounded" height={240} sx={{ borderRadius: 2, mb: 1.5 }} />
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="40%" />
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : cards.length === 0 ? (
          <Typography color="text.secondary">No cards found in this set.</Typography>
        ) : (
          <Grid container spacing={2}>
            {cards.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    bgcolor: cardSurface,
                    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: `0 8px 22px ${alpha('#000', 0.18)}`,
                      borderColor: POKE_RED,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() =>
                      window.open(
                        c.tcgplayer?.url ||
                          c.cardmarket?.url ||
                          `https://api.pokemontcg.io/v2/cards/${c.id}`,
                        '_blank'
                      )
                    }
                    sx={{ height: '100%' }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: 240,
                        bgcolor: alpha(POKE_RED, 0.04),
                        borderBottom: `1px solid ${alpha(POKE_RED, 0.25)}`,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* subtle red shine */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: -120,
                          width: 90,
                          height: '100%',
                          transform: 'skewX(-20deg)',
                          background: `linear-gradient(90deg, transparent, ${alpha(POKE_RED, 0.18)}, transparent)`,
                          transition: 'left 0.55s ease',
                          pointerEvents: 'none',
                          '.MuiCardActionArea-root:hover &': { left: '120%' },
                        }}
                      />
                      <CardMedia
                        component="img"
                        src={c.images?.small}
                        alt={c.name}
                        loading="lazy"
                        sx={{ maxHeight: 240, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.25))' }}
                        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                      />
                    </Box>
                    <CardContent sx={{ py: 1.25, px: 1.5 }}>
                      <Tooltip title={c.name}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800 }}>
                          {c.name}
                        </Typography>
                      </Tooltip>
                      <Typography variant="body2" color="text.secondary">
                        #{c.number}{c.rarity ? ` • ${c.rarity}` : ''}
                      </Typography>
                      {Array.isArray(c.types) && c.types.length > 0 && (
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                          {c.types.map((t) => (
                            <Chip
                              key={t}
                              label={t}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: redSofter,
                                border: `1px solid ${redLine}`,
                              }}
                            />
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* pagination */}
        {totalCount > PAGE_SIZE && (
          <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ my: 3 }}>
            <IconButton
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              sx={{
                borderRadius: 999,
                bgcolor: redSoft,
                color: darken(POKE_RED, 0.25),
                '&:hover': { bgcolor: alpha(POKE_RED, 0.2) },
                '&.Mui-disabled': { opacity: 0.4 },
              }}
            >
              <NavigateBeforeIcon />
            </IconButton>

            <Chip
              label={`Page ${page} of ${totalPages}`}
              sx={{
                fontWeight: 900,
                bgcolor: redSofter,
                border: `1px solid ${redLine}`,
                color: darken(POKE_RED, 0.35),
              }}
            />

            <IconButton
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              sx={{
                borderRadius: 999,
                bgcolor: redSoft,
                color: darken(POKE_RED, 0.25),
                '&:hover': { bgcolor: alpha(POKE_RED, 0.2) },
                '&.Mui-disabled': { opacity: 0.4 },
              }}
            >
              <NavigateNextIcon />
            </IconButton>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
