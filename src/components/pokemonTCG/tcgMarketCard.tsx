import React from 'react';
import { Box, Card, CardMedia, CardContent, Typography, Chip, Stack, alpha } from '@mui/material';
import { POKE_RED, POKE_YELLOW, POKE_BLUE } from './tcgTheme';
import { getMarketPrice } from './tcgPriceUtils';
import type { TcgCard } from './tcgTypes';

export type { TcgCard } from './tcgTypes';
export { getMarketPrice, getPriceBreakdown } from './tcgPriceUtils';

interface TcgMarketCardProps {
  card: TcgCard;
  onClick: (card: TcgCard) => void;
}

function TcgMarketCard({ card, onClick }: TcgMarketCardProps) {
  const price = getMarketPrice(card);

  return (
    <Card
      elevation={0}
      onClick={() => onClick(card)}
      sx={{
        cursor: 'pointer',
        borderRadius: 3.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 6px 20px rgba(15, 23, 42, 0.05)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          borderColor: alpha(POKE_RED, 0.4),
          boxShadow: `0 20px 44px ${alpha(POKE_RED, 0.14)}`,
          '& .card-art': {
            transform: 'scale(1.03)',
          },
        },
      }}
    >
      <Box
        sx={{
          height: 4,
          background: `linear-gradient(90deg, ${POKE_RED} 0%, ${POKE_YELLOW} 50%, ${POKE_BLUE} 100%)`,
        }}
      />

      <Box
        sx={{
          p: 1.75,
          pb: 1.25,
          background: `linear-gradient(180deg, ${alpha(POKE_YELLOW, 0.08)} 0%, #FAFBFC 100%)`,
          position: 'relative',
        }}
      >
        {price !== null && (
          <Chip
            label={`$${price.toFixed(2)}`}
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 1,
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 900,
              bgcolor: POKE_YELLOW,
              color: '#7C2D12',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
        )}

        <Box
          sx={{
            borderRadius: 2.5,
            p: 1.25,
            bgcolor: '#FFFFFF',
            border: `1px solid ${alpha(POKE_RED, 0.08)}`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          <CardMedia
            className="card-art"
            component="img"
            src={card.images.small}
            alt={card.name}
            loading="lazy"
            sx={{
              width: '100%',
              aspectRatio: '0.72',
              objectFit: 'contain',
              filter: 'drop-shadow(0 10px 16px rgba(15, 23, 42, 0.14))',
              transition: 'transform 0.2s ease',
            }}
          />
        </Box>
      </Box>

      <CardContent
        sx={{
          px: 1.75,
          pt: 1.5,
          pb: '16px !important',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 900,
            color: '#111827',
            lineHeight: 1.25,
            mb: 0.4,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {card.name}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1.25,
            fontWeight: 600,
          }}
        >
          {card.set?.name}
        </Typography>

        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 'auto' }}>
          {card.rarity && (
            <Chip
              label={card.rarity}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: '#FFF1F2',
                color: POKE_RED,
              }}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default TcgMarketCard;
