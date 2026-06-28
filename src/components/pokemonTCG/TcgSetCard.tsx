import React from 'react';
import { Box, Card, CardContent, Typography, CardMedia, Button, Chip, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { POKE_RED, darken } from './tcgTheme';
import type { TcgSet } from './tcgTypes';

interface TcgSetCardProps {
  set: TcgSet;
  onViewDetails: () => void;
}

function TcgSetCard({ set, onViewDetails }: TcgSetCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        bgcolor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        transition: '0.22s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.14)',
          borderColor: alpha(POKE_RED, 0.45),
        },
        '&:hover img': {
          transform: 'scale(1.04)',
        },
      }}
    >
      <Box
        sx={{
          height: 118,
          bgcolor: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(194,46,40,0.08), rgba(61,125,202,0.08))',
          }}
        />

        {set.images?.logo ? (
          <CardMedia
            component="img"
            src={set.images.logo}
            alt={set.name}
            loading="lazy"
            sx={{
              maxHeight: 76,
              width: '100%',
              objectFit: 'contain',
              position: 'relative',
              transition: '0.22s ease',
              filter: 'drop-shadow(0 6px 10px rgba(15, 23, 42, 0.18))',
            }}
          />
        ) : (
          <Typography sx={{ position: 'relative', fontWeight: 900, color: '#9CA3AF' }}>
            No Logo
          </Typography>
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2.25, display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            color: '#111827',
            lineHeight: 1.25,
            textAlign: 'center',
            mb: 1.5,
            minHeight: 56,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {set.name}
        </Typography>

        <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
          <Chip
            label={set.series || 'Unknown Series'}
            size="small"
            sx={{
              bgcolor: '#FFF1F2',
              color: darken(POKE_RED, 0.25),
              border: `1px solid ${alpha(POKE_RED, 0.18)}`,
              fontWeight: 800,
              maxWidth: '100%',
            }}
          />
        </Stack>

        <Stack spacing={1.2} sx={{ mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthOutlinedIcon sx={{ fontSize: 19, color: '#6B7280' }} />
            <Typography variant="body2" color="text.secondary">
              Released:{' '}
              <Box component="span" sx={{ fontWeight: 800, color: '#111827' }}>
                {set.releaseDate || 'N/A'}
              </Box>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StyleOutlinedIcon sx={{ fontSize: 19, color: '#6B7280' }} />
            <Typography variant="body2" color="text.secondary">
              Total Cards:{' '}
              <Box component="span" sx={{ fontWeight: 800, color: '#111827' }}>
                {set.total ?? 'N/A'}
              </Box>
            </Typography>
          </Box>

          {set.printedTotal != null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StyleOutlinedIcon sx={{ fontSize: 19, color: '#6B7280' }} />
              <Typography variant="body2" color="text.secondary">
                Printed:{' '}
                <Box component="span" sx={{ fontWeight: 800, color: '#111827' }}>
                  {set.printedTotal}
                </Box>
              </Typography>
            </Box>
          )}

          {set.ptcgoCode && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ConfirmationNumberOutlinedIcon sx={{ fontSize: 19, color: '#6B7280' }} />
              <Typography variant="body2" color="text.secondary">
                Code:{' '}
                <Box component="span" sx={{ fontWeight: 800, color: '#111827' }}>
                  {set.ptcgoCode}
                </Box>
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>

      <Box sx={{ p: 2.25, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onViewDetails}
          sx={{
            textTransform: 'none',
            fontWeight: 900,
            borderRadius: 2,
            bgcolor: POKE_RED,
            py: 1.1,
            boxShadow: '0 10px 24px rgba(194, 46, 40, 0.22)',
            '&:hover': {
              bgcolor: darken(POKE_RED, 0.1),
              boxShadow: '0 12px 28px rgba(194, 46, 40, 0.28)',
            },
          }}
        >
          View Set Details
        </Button>
      </Box>
    </Card>
  );
}

export default TcgSetCard;
