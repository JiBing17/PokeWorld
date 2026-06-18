import React from 'react';
import {
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Rating,
} from '@mui/material';
import { PLACEHOLDER, TMDB_POSTER_BASE_URL } from '../../utils/constants';
import type { MovieCardProps } from '../../types';

function MovieCard({ movie, onClick }: MovieCardProps) {
  return (
    <Card
      onClick={onClick}
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        cursor: 'pointer',
        bgcolor: 'white',
        transition: '0.25s ease',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 18px 42px rgba(15, 23, 42, 0.14)',
        },
        '&:hover img': {
          transform: 'scale(1.05)',
        },
      }}
    >
      <CardActionArea sx={{ height: '100%' }}>
        <Box sx={{ overflow: 'hidden' }}>
          <CardMedia
            component="img"
            image={
              movie.poster_path
                ? `${TMDB_POSTER_BASE_URL}${movie.poster_path}`
                : PLACEHOLDER
            }
            alt={movie.title}
            sx={{
              height: { xs: 250, md: 300 },
              objectFit: 'cover',
              transition: '0.25s ease',
              bgcolor: '#F3F4F6',
            }}
          />
        </Box>

        <CardContent
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: '#111827',
              lineHeight: 1.25,
              mb: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {movie.title}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Rating
              name={`rating-${movie.id}`}
              value={(movie.vote_average || 0) / 2}
              precision={0.5}
              readOnly
              size="small"
            />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 0.5 }}
            >
              {Number(movie.vote_average || 0).toFixed(1)}
            </Typography>
          </Box>

          <Chip
            label={movie.release_date || 'N/A'}
            size="small"
            sx={{
              alignSelf: 'flex-start',
              mb: 1,
              bgcolor: '#C22E28',
              color: '#fff',
              fontWeight: 600,
            }}
          />

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {movie.overview
              ? movie.overview.length > 120
                ? `${movie.overview.slice(0, 120)}…`
                : movie.overview
              : 'No overview available.'}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default MovieCard;
