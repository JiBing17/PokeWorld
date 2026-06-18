import React from 'react';
import { Card, CardContent, CardMedia, Typography } from '@mui/material';
import { PLACEHOLDER, TMDB_POSTER_BASE_URL } from '../../utils/constants';
import type { TmdbCastMember } from '../../types';

interface CastCardProps {
  member: TmdbCastMember;
}

export default function CastCard({ member }: CastCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        flex: {
          xs: '0 0 250px',
          sm: '0 0 260px',
          md: '0 0 270px',
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        bgcolor: 'white',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
      }}
    >
      <CardMedia
        component="img"
        image={
          member.profile_path
            ? `${TMDB_POSTER_BASE_URL}${member.profile_path}`
            : PLACEHOLDER
        }
        alt={member.name}
        sx={{
          height: { xs: 250, md: 300 },
          objectFit: 'cover',
          bgcolor: '#F3F4F6',
        }}
      />

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
          {member.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {member.character || 'Unknown role'}
        </Typography>
      </CardContent>
    </Card>
  );
}
