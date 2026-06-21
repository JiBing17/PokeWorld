import React from 'react';
import { Box, IconButton, Typography, Chip, Stack, alpha } from '@mui/material';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';
import { POKE_RED, darken } from './tcgTheme';

interface TcgPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  variant?: 'fixed' | 'inline';
  showIndicator?: boolean;
}

export default function TcgPagination({
  page,
  totalPages,
  onPageChange,
  variant = 'fixed',
  showIndicator = true,
}: TcgPaginationProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  if (variant === 'inline') {
    return (
      <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ my: 3 }}>
        <IconButton
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={prevDisabled}
          sx={{
            borderRadius: 999,
            bgcolor: alpha(POKE_RED, 0.12),
            color: darken(POKE_RED, 0.25),
            '&:hover': { bgcolor: alpha(POKE_RED, 0.2) },
            '&.Mui-disabled': { opacity: 0.4 },
          }}
        >
          <NavigateBefore />
        </IconButton>

        <Chip
          label={`Page ${page} of ${totalPages}`}
          sx={{
            fontWeight: 900,
            bgcolor: alpha(POKE_RED, 0.08),
            border: `1px solid ${alpha(POKE_RED, 0.35)}`,
            color: darken(POKE_RED, 0.35),
          }}
        />

        <IconButton
          onClick={() => onPageChange(page + 1)}
          disabled={nextDisabled}
          sx={{
            borderRadius: 999,
            bgcolor: alpha(POKE_RED, 0.12),
            color: darken(POKE_RED, 0.25),
            '&:hover': { bgcolor: alpha(POKE_RED, 0.2) },
            '&.Mui-disabled': { opacity: 0.4 },
          }}
        >
          <NavigateNext />
        </IconButton>
      </Stack>
    );
  }

  return (
    <>
      <IconButton
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={prevDisabled}
        sx={{
          position: 'fixed',
          top: '50%',
          left: 16,
          transform: 'translateY(-50%)',
          backgroundColor: POKE_RED,
          color: 'white',
          '&:hover': { backgroundColor: '#B22222' },
          '&:disabled': {
            backgroundColor: 'rgba(194,46,40,0.5)',
            color: 'white',
          },
          zIndex: 1000,
        }}
      >
        <NavigateBefore />
      </IconButton>

      <IconButton
        onClick={() => onPageChange(Math.min(page + 1, totalPages))}
        disabled={nextDisabled}
        sx={{
          position: 'fixed',
          top: '50%',
          right: 16,
          transform: 'translateY(-50%)',
          backgroundColor: POKE_RED,
          color: 'white',
          '&:hover': { backgroundColor: '#B22222' },
          '&:disabled': {
            backgroundColor: 'rgba(194,46,40,0.5)',
            color: 'white',
          },
          zIndex: 1000,
        }}
      >
        <NavigateNext />
      </IconButton>

      {showIndicator && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: '#FFFFFF',
            px: 3,
            py: 1,
            borderRadius: 999,
            border: '1px solid #E5E7EB',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
            zIndex: 1000,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Page {page} / {totalPages}
          </Typography>
        </Box>
      )}
    </>
  );
}
