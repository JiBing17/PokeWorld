import React, { ReactNode, useEffect, useRef } from 'react';
import { Box, IconButton } from '@mui/material';
import { ArrowBackIosNew, ArrowForward } from '@mui/icons-material';

interface HorizontalScrollRowProps {
  children: ReactNode;
  resetKey?: string | number;
  scrollAmount?: number;
}

export default function HorizontalScrollRow({
  children,
  resetKey,
  scrollAmount = 750,
}: HorizontalScrollRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [resetKey]);

  const handleScroll = (amount: number) => {
    scrollContainerRef.current?.scrollBy({
      left: amount,
      behavior: 'smooth',
    });
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        ref={scrollContainerRef}
        sx={{
          display: 'flex',
          gap: 3,
          overflowX: 'auto',
          overflowY: 'hidden',
          pb: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        {children}
      </Box>

      <IconButton
        onClick={() => handleScroll(-scrollAmount)}
        sx={{
          position: 'absolute',
          top: '50%',
          left: { xs: 8, md: 18 },
          transform: 'translateY(-50%)',
          bgcolor: 'white',
          color: '#111827',
          border: '1px solid #E5E7EB',
          boxShadow: '0 12px 28px rgba(15,23,42,0.16)',
          '&:hover': {
            bgcolor: '#F9FAFB',
          },
        }}
      >
        <ArrowBackIosNew fontSize="small" />
      </IconButton>

      <IconButton
        onClick={() => handleScroll(scrollAmount)}
        sx={{
          position: 'absolute',
          top: '50%',
          right: { xs: 8, md: 18 },
          transform: 'translateY(-50%)',
          bgcolor: 'white',
          color: '#111827',
          border: '1px solid #E5E7EB',
          boxShadow: '0 12px 28px rgba(15,23,42,0.16)',
          '&:hover': {
            bgcolor: '#F9FAFB',
          },
        }}
      >
        <ArrowForward fontSize="small" />
      </IconButton>
    </Box>
  );
}
