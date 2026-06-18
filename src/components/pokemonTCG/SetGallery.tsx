// SetGallery.jsx
import React, { useEffect, useState } from 'react';
import axios, { isAxiosError } from 'axios';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CardMedia,
  CircularProgress,
  Button,
  Container,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Header from '../Header';
import SetDetailsDrawer from './SetDetailsDrawer';

const SETS_ENDPOINT = 'https://api.pokemontcg.io/v2/sets';
const SETS_PER_PAGE = 16;

// brand red
const POKE_RED = '#C22E28';

interface TcgSetImages {
  logo?: string;
}

interface TcgSet {
  id: string;
  name: string;
  series?: string;
  releaseDate?: string;
  total?: number;
  printedTotal?: number;
  ptcgoCode?: string;
  images?: TcgSetImages;
}

const darken = (hex: string, amt = 0.14): string => {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const [r, g, b] = hex.replace('#', '').match(/.{1,2}/g)!.map((x) => parseInt(x, 16));
  return `rgb(${clamp(r * (1 - amt))}, ${clamp(g * (1 - amt))}, ${clamp(b * (1 - amt))})`;
};

export default function SetGallery() {
  const theme = useTheme();

  const [sets, setSets] = useState<TcgSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await axios.get<{ data: TcgSet[] }>(SETS_ENDPOINT);
        const sorted = res.data.data.sort((a, b) =>
          (b.releaseDate || '').localeCompare(a.releaseDate || '')
        );
        setSets(sorted);
      } catch (err) {
        if (isAxiosError(err)) {
          setError(err);
        } else {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSets();
  }, []);

  const filteredSets = sets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedSets =
    search.trim() === ''
      ? filteredSets.slice((page - 1) * SETS_PER_PAGE, page * SETS_PER_PAGE)
      : filteredSets;

  const totalPages = Math.ceil(filteredSets.length / SETS_PER_PAGE);

  if (loading) {
    return (
      <Box mt={10} textAlign="center">
        <CircularProgress sx={{ color: POKE_RED }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={10} textAlign="center">
        <Typography color="error">Error loading sets.</Typography>
      </Box>
    );
  }

  return (
    <>
      <Header />

      <Container
        sx={{
          mt: 12,
          pb: 6,
          // subtle background pattern with red tint
          backgroundImage: `radial-gradient(${alpha(POKE_RED, 0.06)} 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
          borderRadius: 2,
        }}
      >
        {/* Search Field */}
        <TextField
          variant="outlined"
          fullWidth
          placeholder="Search TCG sets..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: alpha(POKE_RED, 0.8) }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 4,
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: alpha(POKE_RED, 0.35) },
              '&:hover fieldset': { borderColor: POKE_RED },
              '&.Mui-focused fieldset': { borderColor: POKE_RED, borderWidth: 2 },
            },
          }}
        />

        {/* Sets Grid */}
        <Grid container spacing={4}>
          {paginatedSets.map((set) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={set.id}>
              <Card
                elevation={0}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: theme.palette.mode === 'dark' ? '#151515' : '#fff',
                  border: `1px solid ${alpha(POKE_RED, 0.25)}`,
                  transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: POKE_RED,
                    boxShadow: `0 10px 26px ${alpha('#000', 0.2)}`,
                  },
                }}
              >
                {set.images?.logo && (
                  <Box
                    sx={{
                      bgcolor: alpha(POKE_RED, 0.06),
                      p: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      borderBottom: `1px solid ${alpha(POKE_RED, 0.25)}`,
                    }}
                  >
                    <CardMedia
                      component="img"
                      src={set.images.logo}
                      alt={set.name}
                      sx={{ height: 64, objectFit: 'contain', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.25))' }}
                      loading="lazy"
                    />
                  </Box>
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 900, textAlign: 'center' }}
                  >
                    {set.name}
                  </Typography>

                  <Stack spacing={1} alignItems="center">
                    <Chip
                      label={set.series}
                      size="small"
                      sx={{
                        bgcolor: alpha(POKE_RED, 0.12),
                        border: `1px solid ${alpha(POKE_RED, 0.3)}`,
                        color: darken(POKE_RED, 0.35),
                        fontWeight: 700,
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Released: {set.releaseDate || 'N/A'}
                    </Typography>
                  </Stack>

                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Cards:&nbsp;
                      <Typography component="span" variant="body2" sx={{ fontWeight: 800 }}>
                        {set.total}
                      </Typography>
                    </Typography>
                    {set.printedTotal != null && (
                      <Typography variant="body2" color="text.secondary">
                        Printed Total:&nbsp;
                        <Typography component="span" variant="body2" sx={{ fontWeight: 800 }}>
                          {set.printedTotal}
                        </Typography>
                      </Typography>
                    )}
                  </Box>

                  {set.ptcgoCode && (
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Code:&nbsp;
                        <Typography component="span" variant="body2" sx={{ fontWeight: 800 }}>
                          {set.ptcgoCode}
                        </Typography>
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => { setActiveSetId(set.id); setDetailsOpen(true); }}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 800,
                      bgcolor: POKE_RED,
                      '&:hover': { bgcolor: darken(POKE_RED, 0.1) },
                      boxShadow: 'none',
                    }}
                  >
                    View Set Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Pagination Arrows (fixed middle left & right) */}
      {search.trim() === '' && totalPages > 1 && (
        <>
          <IconButton
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            sx={{
              position: 'fixed',
              top: '50%',
              left: 8,
              transform: 'translateY(-50%)',
              bgcolor: alpha(POKE_RED, 0.9),
              color: '#fff',
              '&:hover': { bgcolor: POKE_RED },
              '&.Mui-disabled': { bgcolor: alpha(POKE_RED, 0.35) },
              zIndex: 1000,
            }}
          >
            <NavigateBeforeIcon />
          </IconButton>

          <IconButton
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            sx={{
              position: 'fixed',
              top: '50%',
              right: 8,
              transform: 'translateY(-50%)',
              bgcolor: alpha(POKE_RED, 0.9),
              color: '#fff',
              '&:hover': { bgcolor: POKE_RED },
              '&.Mui-disabled': { bgcolor: alpha(POKE_RED, 0.35) },
              zIndex: 1000,
            }}
          >
            <NavigateNextIcon />
          </IconButton>
        </>
      )}

      {/* always mount the drawer so it works while searching too */}
      <SetDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        setId={activeSetId}
      />
    </>
  );
}
