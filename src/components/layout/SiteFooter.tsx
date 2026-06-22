import React from 'react';
import { Box, Container, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const TMDB_LOGO = `${process.env.PUBLIC_URL ?? ''}/tmdb-logo.svg`;

export default function SiteFooter() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 4,
        px: 2,
        bgcolor: '#FFFFFF',
        borderTop: '1px solid #E5E7EB',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={2.5}>
          <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.75 }}>
            PokéWorld is an unofficial fan project and is not affiliated with Nintendo, Game
            Freak, Creatures Inc., or The Pokémon Company.
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <Box
              component="a"
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'inline-flex', lineHeight: 0 }}
            >
              <Box
                component="img"
                src={TMDB_LOGO}
                alt="TMDB"
                sx={{ height: 20, width: 'auto' }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#6B7280', maxWidth: 520, lineHeight: 1.6 }}>
              This product uses TMDB and the TMDB APIs but is not endorsed, certified, or
              otherwise approved by TMDB.
            </Typography>
          </Stack>

          <Typography variant="caption" sx={{ color: '#6B7280', lineHeight: 1.7 }}>
            Pokémon data from{' '}
            <Link href="https://pokeapi.co" target="_blank" rel="noopener noreferrer">
              PokéAPI
            </Link>
            . TCG data from the{' '}
            <Link href="https://pokemontcg.io" target="_blank" rel="noopener noreferrer">
              Pokémon TCG API
            </Link>
            .
          </Typography>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Link component={RouterLink} to="/contact" variant="caption" sx={{ fontWeight: 700 }}>
              Contact
            </Link>
            <Link component={RouterLink} to="/privacy" variant="caption" sx={{ fontWeight: 700 }}>
              Privacy Policy
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
