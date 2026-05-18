import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CardMedia,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';

const POKE_RED = '#C22E28';

function TcgSetCard({ set, onViewDetails }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        bgcolor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        transition: '0.2s ease',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 16px 36px rgba(15, 23, 42, 0.12)',
        },
      }}
    >
      <Box
        sx={{
          height: 120,
          bgcolor: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        {set.images?.logo ? (
          <CardMedia
            component="img"
            src={set.images.logo}
            alt={set.name}
            loading="lazy"
            sx={{
              maxHeight: 78,
              width: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <Typography sx={{ fontWeight: 800, color: '#9CA3AF' }}>
            No Logo
          </Typography>
        )}
      </Box>

      <CardContent
        sx={{
          flexGrow: 1,
          p: 2.25,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            color: '#111827',
            lineHeight: 1.25,
            mb: 1.25,
            minHeight: 56,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {set.name}
        </Typography>

        <Chip
          label={set.series || 'Unknown Series'}
          size="small"
          sx={{
            alignSelf: 'flex-start',
            mb: 2,
            bgcolor: '#F3F4F6',
            color: '#374151',
            fontWeight: 700,
          }}
        />

        <Stack spacing={1.25} sx={{ mt: 'auto' }}>
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
              Cards:{' '}
              <Box component="span" sx={{ fontWeight: 800, color: '#111827' }}>
                {set.total ?? 'N/A'}
              </Box>
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      <Box sx={{ p: 2.25, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onViewDetails}
          sx={{
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: 2,
            bgcolor: POKE_RED,
            boxShadow: 'none',
            py: 1.05,
            '&:hover': {
              bgcolor: '#B22222',
              boxShadow: 'none',
            },
          }}
        >
          View Details
        </Button>
      </Box>
    </Card>
  );
}

export default TcgSetCard;