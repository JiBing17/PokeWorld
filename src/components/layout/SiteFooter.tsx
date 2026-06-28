import React from 'react';
import {
  Box,
  Container,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const TMDB_LOGO = `${process.env.PUBLIC_URL ?? ''}/tmdb-logo.svg`;

const footerLinkSx = {
  color: '#374151',
  fontWeight: 600,
  fontSize: '0.875rem',
  textDecoration: 'none',
  '&:hover': {
    color: '#C22E28',
    textDecoration: 'underline',
  },
};

const sectionTitleSx = {
  fontWeight: 800,
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#9CA3AF',
  mb: 0.75,
};

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        bgcolor: '#FFFFFF',
        borderTop: '1px solid #E5E7EB',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 2.5 }, px: 2 }}>
        <Grid container spacing={{ xs: 2, md: 2.5 }}>
          <Grid item xs={12} md={5}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                color: '#C22E28',
                letterSpacing: '0.5px',
                mb: 0.5,
              }}
            >
              PokéWorld
            </Typography>
            <Typography variant="body2" sx={{ color: '#4B5563', lineHeight: 1.6, maxWidth: 420 }}>
              An unofficial fan project for exploring Pokémon, TCG cards, and movies. Not
              affiliated with Nintendo, Game Freak, Creatures Inc., or The Pokémon Company.
            </Typography>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <Typography sx={sectionTitleSx}>Explore</Typography>
            <Stack spacing={0.5}>
              <Link component={RouterLink} to="/contact" sx={footerLinkSx}>
                Contact
              </Link>
              <Link component={RouterLink} to="/privacy" sx={footerLinkSx}>
                Privacy Policy
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={6} sm={8} md={5}>
            <Typography sx={sectionTitleSx}>Data Sources</Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ color: '#4B5563', lineHeight: 1.55 }}>
                Pokémon data from{' '}
                <Link
                  href="https://pokeapi.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={footerLinkSx}
                >
                  PokéAPI
                </Link>
              </Typography>
              <Typography variant="body2" sx={{ color: '#4B5563', lineHeight: 1.55 }}>
                TCG data from the{' '}
                <Link
                  href="https://pokemontcg.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={footerLinkSx}
                >
                  Pokémon TCG API
                </Link>
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: '#F6F8FC',
            border: '1px solid #E5E7EB',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.25}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Box
              component="a"
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'inline-flex',
                flexShrink: 0,
                lineHeight: 0,
                p: 0.5,
                borderRadius: 1,
                bgcolor: '#FFFFFF',
                border: '1px solid #E5E7EB',
              }}
            >
              <Box
                component="img"
                src={TMDB_LOGO}
                alt="TMDB"
                sx={{ height: 18, width: 'auto', display: 'block' }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#6B7280', lineHeight: 1.65 }}>
              This product uses TMDB and the TMDB APIs but is not endorsed, certified, or
              otherwise approved by TMDB.
            </Typography>
          </Stack>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: '#E5E7EB' }} />

        <Typography
          variant="caption"
          sx={{ color: '#9CA3AF', display: 'block', textAlign: { xs: 'center', sm: 'left' } }}
        >
          © {year} PokéWorld · Fan-made project
        </Typography>
      </Container>
    </Box>
  );
}
