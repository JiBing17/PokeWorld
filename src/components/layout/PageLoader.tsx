import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import PageShell from './PageShell';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export default function PageLoader({ message = 'Loading...', fullScreen = true }: PageLoaderProps) {
  return (
    <PageShell>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
        gap={2}
        sx={{
          minHeight: fullScreen ? '100vh' : 300,
          pt: fullScreen ? 0 : 4,
          color: 'text.secondary',
        }}
      >
        <CircularProgress sx={{ color: '#C22E28' }} />
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          {message}
        </Typography>
      </Box>
    </PageShell>
  );
}
