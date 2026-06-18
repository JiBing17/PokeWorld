import React, { ReactNode } from 'react';
import { Box } from '@mui/material';
import Header from '../Header';

interface PageShellProps {
  children: ReactNode;
}

export default function PageShell({ children }: PageShellProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F6F8FC' }}>
      <Header />
      {children}
    </Box>
  );
}
