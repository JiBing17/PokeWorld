import React, { ReactNode } from 'react';
import { Box, Container, Typography, Chip } from '@mui/material';

interface TcgPageHeroProps {
  title: string;
  subtitle: string;
  chipLabel?: string;
}

export default function TcgPageHero({ title, subtitle, chipLabel }: TcgPageHeroProps) {
  return (
    <Box
      sx={{
        pt: { xs: 10, md: 11 },
        pb: 3,
        px: { xs: 2, md: 4 },
        background: 'linear-gradient(135deg, #C22E28 0%, #E85D4A 45%, #FFCC00 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          sx={{
            fontWeight: 900,
            color: 'white',
            mb: 0.75,
            fontSize: { xs: '1.85rem', md: '2.5rem' },
            textShadow: '0 2px 12px rgba(0,0,0,0.12)',
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.92)', maxWidth: 560, lineHeight: 1.7 }}>
          {subtitle}
        </Typography>
        {chipLabel && (
          <Chip
            label={chipLabel}
            sx={{
              mt: 2,
              bgcolor: 'rgba(255,255,255,0.22)',
              color: 'white',
              fontWeight: 800,
              backdropFilter: 'blur(4px)',
            }}
          />
        )}
      </Container>
    </Box>
  );
}

interface TcgGridPanelProps {
  title: string;
  subtitle: string;
  pageLabel?: string;
  children: ReactNode;
}

export function TcgGridPanel({ title, subtitle, pageLabel, children }: TcgGridPanelProps) {
  return (
    <Box
      sx={{
        borderRadius: 5,
        border: '1px solid #E5E7EB',
        boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
        overflow: 'hidden',
        bgcolor: '#FFFFFF',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 2,
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#111827' }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        {pageLabel && (
          <Chip
            label={pageLabel}
            sx={{
              bgcolor: '#FFF1F2',
              color: '#C22E28',
              fontWeight: 800,
              border: '1px solid #FECACA',
            }}
          />
        )}
      </Box>
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F6F8FC' }}>{children}</Box>
    </Box>
  );
}
