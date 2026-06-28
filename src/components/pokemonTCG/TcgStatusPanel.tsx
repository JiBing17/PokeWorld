import React, { ReactNode } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { POKE_RED } from './tcgTheme';

interface TcgStatusPanelProps {
  loading?: boolean;
  loadingMessage?: string;
  error?: ReactNode;
  empty?: ReactNode;
  children?: ReactNode;
  minHeight?: number;
}

export default function TcgStatusPanel({
  loading,
  loadingMessage = 'Loading...',
  error,
  empty,
  children,
  minHeight = 360,
}: TcgStatusPanelProps) {
  if (loading) {
    return (
      <Box
        sx={{
          minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: POKE_RED }} />
        <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
          {loadingMessage}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        {typeof error === 'string' ? <Typography color="error">{error}</Typography> : error}
      </Box>
    );
  }

  if (empty) {
    return (
      <Paper
        elevation={0}
        sx={{
          minHeight: Math.min(minHeight, 280),
          borderRadius: 4,
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 3,
        }}
      >
        {typeof empty === 'string' ? (
          <Typography variant="h6" color="text.secondary">
            {empty}
          </Typography>
        ) : (
          empty
        )}
      </Paper>
    );
  }

  return <>{children}</>;
}
