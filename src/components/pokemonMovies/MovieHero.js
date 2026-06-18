import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  OpenInNew,
} from '@mui/icons-material';
import placeHolder from '../../static/placeholder.jpg';
import { TMDB_BACKDROP_BASE_URL, TMDB_POSTER_BASE_URL } from '../../utils/constants';

function MovieHero({
  movie, // movie object shown in the hero section
  genres = {}, // genre id-to-name map, example: { 12: "Adventure", 16: "Animation" }
  runtime, // optional movie runtime text, example: "96 min"
  label = 'Featured Movie', // small label shown above the title when no back button is shown
  showBackButton = false, // true when this hero is used on the movie details page
  onBack, // optional function for the Back to Movies button
  onPrimaryClick, // optional function for the main action button
  primaryButtonText = 'View Details', // text shown inside the main action button
  primaryButtonIcon, // optional custom icon for the main action button
}) {

  // If no movie is provided, return null
  if (!movie) return null;

  // Choose the best available image for the hero background
  const heroImage = movie.backdrop_path
    ? `${TMDB_BACKDROP_BASE_URL}${movie.backdrop_path}` // Prefer wide backdrop image
    : movie.poster_path
    ? `${TMDB_POSTER_BASE_URL}${movie.poster_path}` // Fallback to poster image
    : placeHolder; // Final fallback if TMDB has no image

  // Get the release year from the full release date
  // Example: "1998-07-18" becomes "1998"
  const releaseYear = movie.release_date
    ? movie.release_date.split('-')[0]
    : 'N/A';

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: 4, md: 5 },
        minHeight: { xs: 520, md: 540 },
        border: '1px solid #E5E7EB',
        boxShadow: '0 24px 70px rgba(15, 23, 42, 0.16)',
        bgcolor: '#111827',
      }}
    >
      <Box
        component="img"
        src={heroImage}
        alt={movie.title}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(17,24,39,0.94) 0%, rgba(17,24,39,0.74) 45%, rgba(17,24,39,0.14) 100%)',
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: { xs: 520, md: 540 },
          display: 'flex',
          alignItems: 'center',
          p: { xs: 3, md: 5 },
          pt: { xs: 4, md: 2 },
          pb: { xs: 5, md: 8 },
          color: 'white',
        }}
      >
        <Box sx={{ maxWidth: 680 }}>
          {showBackButton && (
            <Button
              startIcon={<ArrowBack />}
              onClick={onBack}
              sx={{
                color: 'rgba(255,255,255,0.86)',
                textTransform: 'none',
                fontWeight: 800,
                mb: 3,
                px: 0,
                '&:hover': {
                  bgcolor: 'transparent',
                  color: 'white',
                },
              }}
            >
              Back to Movies
            </Button>
          )}

          {!showBackButton && (
            <Typography
              variant="overline"
              sx={{
                color: '#FFCC00',
                fontWeight: 900,
                letterSpacing: 1.5,
              }}
            >
              {label}
            </Typography>
          )}

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{ mb: 2, mt: showBackButton ? 0 : 1 }}
          >
            <Chip
              label={`⭐ ${Number(movie.vote_average || 0).toFixed(1)}`}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.22)',
                fontWeight: 800,
              }}
            />

            {runtime && (
              <Chip
                label={runtime}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.22)',
                  fontWeight: 800,
                }}
              />
            )}

            <Chip
              label={releaseYear}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.22)',
                fontWeight: 800,
              }}
            />
          </Stack>

          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 950,
              lineHeight: 1,
              fontSize: { xs: '2.3rem', md: '4.2rem' },
              mb: 2,
            }}
          >
            {movie.title}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{ mb: 3 }}
          >
            {movie.genre_ids?.slice(0, 4).map((gId) => (
              <Chip
                key={gId}
                label={genres?.[gId] || 'Unknown'}
                size="small"
                sx={{
                  bgcolor: '#C22E28',
                  color: 'white',
                  fontWeight: 800,
                }}
              />
            ))}
          </Stack>

          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.86)',
              lineHeight: 1.8,
              maxWidth: 640,
              mb: 3,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {movie.overview || 'No overview available for this movie.'}
          </Typography>

          {onPrimaryClick && (
            <Button
              variant="contained"
              endIcon={primaryButtonIcon || <OpenInNew />}
              onClick={onPrimaryClick}
              sx={{
                bgcolor: '#C22E28',
                color: 'white',
                px: 3,
                py: 1.2,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 900,
                boxShadow: '0 12px 28px rgba(194,46,40,0.35)',
                '&:hover': {
                  bgcolor: '#B22222',
                },
              }}
            >
              {primaryButtonText}
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

export default MovieHero;