import React from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Chip,
  Stack,
  Button,
  Grid,
  Paper,
  Divider,
  alpha,
} from '@mui/material';
import { Close, OpenInNew } from '@mui/icons-material';
import { getMarketPrice, getPriceBreakdown } from './tcgPriceUtils';
import type { TcgCard } from './tcgTypes';
import { POKE_RED, POKE_YELLOW, POKE_BLUE, POKE_BG } from './tcgTheme';

interface TcgCardDetailDialogProps {
  open: boolean;
  card: TcgCard | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 2,
        py: 1.25,
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', fontWeight: 700, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 800, textAlign: 'right', lineHeight: 1.4 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function TcgCardDetailDialog({
  open,
  card,
  onClose,
}: TcgCardDetailDialogProps) {
  if (!card) return null;

  const marketPrice = getMarketPrice(card);
  const priceBreakdown = getPriceBreakdown(card);
  const tcgUrl = card.tcgplayer?.url;

  const detailRows: Array<{ label: string; value: string }> = [];
  if (card.set?.name) detailRows.push({ label: 'Set', value: card.set.name });
  if (card.set?.series) detailRows.push({ label: 'Series', value: card.set.series });
  if (card.rarity) detailRows.push({ label: 'Rarity', value: card.rarity });
  if (card.supertype) detailRows.push({ label: 'Card Type', value: card.supertype });
  if (card.subtypes?.length) {
    detailRows.push({ label: 'Subtype', value: card.subtypes.join(', ') });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: POKE_BG,
          maxHeight: '92vh',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.25,
          pr: 7,
          background: `linear-gradient(135deg, ${POKE_RED} 0%, #E85D4A 55%, ${POKE_YELLOW} 100%)`,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.15)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
          }}
        >
          <Close />
        </IconButton>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 900,
            color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.15)',
            lineHeight: 1.25,
          }}
        >
          {card.name}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
          {card.rarity && (
            <Chip
              label={card.rarity}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.22)',
                color: 'white',
                fontWeight: 800,
                backdropFilter: 'blur(4px)',
              }}
            />
          )}
          {marketPrice !== null && (
            <Chip
              label={`Market $${marketPrice.toFixed(2)}`}
              size="small"
              sx={{
                bgcolor: POKE_YELLOW,
                color: '#7C2D12',
                fontWeight: 900,
              }}
            />
          )}
        </Stack>
      </Box>

      <DialogContent sx={{ p: { xs: 2, md: 3 }, overflow: 'visible' }}>
        <Grid container spacing={3}>
          {/* Card art */}
          <Grid item xs={12} sm={5}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                bgcolor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  borderRadius: 3,
                  p: 2,
                  background: `linear-gradient(160deg, ${alpha(POKE_YELLOW, 0.12)} 0%, ${alpha(POKE_BLUE, 0.08)} 100%)`,
                  border: `1px solid ${alpha(POKE_RED, 0.12)}`,
                  mb: 2,
                }}
              >
                <Box
                  component="img"
                  src={card.images.large}
                  alt={card.name}
                  sx={{
                    width: '100%',
                    maxWidth: 260,
                    aspectRatio: '0.72',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 16px 28px rgba(15, 23, 42, 0.22))',
                    mx: 'auto',
                    display: 'block',
                  }}
                />
              </Box>

              {tcgUrl && (
                <Button
                  href={tcgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  endIcon={<OpenInNew fontSize="small" />}
                  fullWidth
                  sx={{
                    borderColor: POKE_BLUE,
                    color: POKE_BLUE,
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: 999,
                    '&:hover': {
                      borderColor: POKE_BLUE,
                      bgcolor: alpha(POKE_BLUE, 0.06),
                    },
                  }}
                >
                  View on TCGplayer
                </Button>
              )}
            </Paper>
          </Grid>

          {/* Collector details */}
          <Grid item xs={12} sm={7}>
            <Stack spacing={2.5}>
              {detailRows.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 900,
                      color: POKE_RED,
                      mb: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      fontSize: '0.75rem',
                    }}
                  >
                    Card Details
                  </Typography>

                  <Divider sx={{ mb: 0.5 }} />

                  {detailRows.map((row, idx) => (
                    <React.Fragment key={row.label}>
                      <DetailRow label={row.label} value={row.value} />
                      {idx < detailRows.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Paper>
              )}

              {priceBreakdown.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 900,
                      color: POKE_RED,
                      mb: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      fontSize: '0.75rem',
                    }}
                  >
                    Market Prices
                  </Typography>

                  <Divider sx={{ mb: 0.5 }} />

                  {priceBreakdown.map((entry, idx) => (
                    <React.Fragment key={entry.label}>
                      <DetailRow
                        label={entry.label}
                        value={`$${entry.value.toFixed(2)}`}
                      />
                      {idx < priceBreakdown.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Paper>
              )}
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
