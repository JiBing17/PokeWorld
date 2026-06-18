import React from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Stack,
} from '@mui/material';

export interface TcgCardSet {
  name: string;
  series?: string;
}

export interface TcgCardImages {
  small: string;
  large: string;
}

export interface TcgPlayerPriceEntry {
  market?: number;
}

export interface TcgCard {
  id: string;
  name: string;
  images: TcgCardImages;
  set?: TcgCardSet;
  rarity?: string;
  supertype?: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  flavorText?: string;
  attacks?: Array<{
    name: string;
    damage?: string;
    text?: string;
    cost: string[];
  }>;
  abilities?: Array<{
    name: string;
    text?: string;
  }>;
  weaknesses?: Array<{ type: string; value: string }>;
  resistances?: Array<{ type: string; value: string }>;
  retreatCost?: string[];
  tcgplayer?: {
    prices?: {
      holofoil?: TcgPlayerPriceEntry;
      normal?: TcgPlayerPriceEntry;
      reverseHolofoil?: TcgPlayerPriceEntry;
    };
    url?: string;
  };
  cardmarket?: {
    url?: string;
  };
}

interface TcgMarketCardProps {
  card: TcgCard;
  onClick: (card: TcgCard) => void;
}

export const getMarketPrice = (card: TcgCard): number | null =>
  card.tcgplayer?.prices?.holofoil?.market ||
  card.tcgplayer?.prices?.normal?.market ||
  card.tcgplayer?.prices?.reverseHolofoil?.market ||
  null;

function TcgMarketCard({ card, onClick }: TcgMarketCardProps) {
  const price = getMarketPrice(card);

  return (
    <Card
      elevation={0}
      onClick={() => onClick(card)}
      sx={{
        cursor: 'pointer',
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        transition: '0.2s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 16px 34px rgba(15, 23, 42, 0.12)',
        },
      }}
    >
      <Box
        sx={{
          bgcolor: '#F9FAFB',
          p: 1.5,
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <CardMedia
          component="img"
          src={card.images.small}
          alt={card.name}
          loading="lazy"
          sx={{
            width: '100%',
            aspectRatio: '0.7',
            objectFit: 'contain',
          }}
        />
      </Box>

      <CardContent
        sx={{
          p: 1.75,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 900,
            color: '#111827',
            lineHeight: 1.25,
            mb: 0.75,
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
            mb: 1,
          }}
        >
          {card.set?.name}
        </Typography>

        <Stack
          direction="row"
          spacing={0.75}
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 'auto' }}
        >
          {card.rarity && (
            <Chip
              label={card.rarity}
              size="small"
              sx={{
                bgcolor: '#F3F4F6',
                color: '#374151',
                fontWeight: 700,
                fontSize: '0.7rem',
              }}
            />
          )}

          {price !== null && (
            <Chip
              label={`$${price.toFixed(2)}`}
              size="small"
              sx={{
                bgcolor: '#ECFDF5',
                color: '#047857',
                fontWeight: 800,
                fontSize: '0.7rem',
              }}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default TcgMarketCard;
