import React from 'react';
import { Link } from 'react-router-dom';
import {
    Card,
    CardMedia,
    CardContent,
    Typography,
    IconButton,
    Chip,
    Box,
} from '@mui/material';
import {
    Favorite,
    FavoriteBorder,
    Close,
    ArrowForward,
} from '@mui/icons-material';
import { typeColors, PLACEHOLDER } from '../../utils/constants';
import type { PokemonCardProps } from '../../types';


function PokemonCard({
    pokemon, // Pokémon object shown in the card
    isFavorite = false, // whether this Pokémon is currently favorited
    onFavoriteClick, // optional function for clicking the heart button
    onRemoveClick, // optional function for removing from favorites page
    to, // route/path to open this Pokémon's details page
}: PokemonCardProps) {

    // get the passed down pokemon's information
    const name = pokemon.name;
    const id = pokemon.id;
    const generation = pokemon.generation;
    const image =
        pokemon.spriteUrl ||
        pokemon?.sprites?.other?.['official-artwork']?.front_default || PLACEHOLDER;
    const primaryType = pokemon?.types?.[0]?.type?.name;
    const cardColor = typeColors[primaryType as keyof typeof typeColors] || '#C22E28';

    return (
        <Card
            sx={{
                borderRadius: 5,
                bgcolor: 'white',
                color: '#111827',
                border: '1px solid #E5E7EB',
                boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
                overflow: 'hidden',
                position: 'relative',
                transition: '0.25s ease',
                '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: 'rgba(194,46,40,0.35)',
                    boxShadow: '0 28px 70px rgba(194,46,40,0.18)',
                },
                '&:hover .pokemon-image': {
                    transform: 'scale(1.08) rotate(-2deg)',
                },
            }}
        >
            {onRemoveClick && (
                <IconButton
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveClick(name);
                    }}
                    sx={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        zIndex: 2,
                        bgcolor: 'rgba(255,255,255,0.92)',
                        color: '#6B7280',
                        border: '1px solid #E5E7EB',
                        backdropFilter: 'blur(8px)',
                        '&:hover': {
                            bgcolor: '#FEF2F2',
                            color: '#C22E28',
                            borderColor: '#FECACA',
                        },
                    }}
                    size="small"
                >
                    <Close fontSize="small" />
                </IconButton>
            )}

            {onFavoriteClick && (
                <IconButton
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onFavoriteClick(name);
                    }}
                    sx={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        zIndex: 2,
                        bgcolor: 'rgba(255,255,255,0.92)',
                        color: isFavorite ? '#C22E28' : '#6B7280',
                        border: '1px solid #E5E7EB',
                        backdropFilter: 'blur(8px)',
                        '&:hover': {
                            bgcolor: '#FEF2F2',
                            color: '#C22E28',
                            borderColor: '#FECACA',
                        },
                    }}
                    size="small"
                >
                    {isFavorite ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                </IconButton>
            )}

            <Box
                component={Link}
                to={to}
                sx={{
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                }}
            >
                <Box
                    sx={{
                        height: 220,
                        background: `linear-gradient(135deg, ${cardColor}, ${cardColor}CC)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {id && (
                        <Typography
                            sx={{
                                position: 'absolute',
                                top: 16,
                                left: 18,
                                fontSize: '0.8rem',
                                fontWeight: 900,
                                color: 'rgba(255,255,255,0.85)',
                                letterSpacing: 1,
                            }}
                        >
                            #{String(id).padStart(3, '0')}
                        </Typography>
                    )}

                    <Box
                        sx={{
                            position: 'absolute',
                            width: 190,
                            height: 190,
                            borderRadius: '50%',
                            border: '28px solid rgba(255,255,255,0.13)',
                        }}
                    />

                    <CardMedia
                        className="pokemon-image"
                        component="img"
                        image={image || PLACEHOLDER}
                        alt={`Image of ${name}`}
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = PLACEHOLDER;
                        }}
                        sx={{
                            height: 175,
                            objectFit: 'contain',
                            zIndex: 1,
                            transition: '0.25s ease',
                            filter: 'drop-shadow(0 22px 22px rgba(0,0,0,0.28))',
                        }}
                    />
                </Box>

                <CardContent sx={{ p: 2.5 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            textTransform: 'capitalize',
                            fontWeight: 900,
                            mb: 0.5,
                        }}
                    >
                        {name}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: 'text.secondary',
                            mb: 2,
                        }}
                    >
                        {primaryType ? `${primaryType} type` : 'Pokémon'}
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Chip
                            label={generation ? `Generation ${generation}` : 'View details'}
                            size="small"
                            sx={{
                                bgcolor: primaryType ? `${cardColor}20` : '#FEF2F2',
                                color: primaryType ? cardColor : '#C22E28',
                                border: primaryType
                                    ? `1px solid ${cardColor}55`
                                    : '1px solid #FECACA',
                                fontWeight: 700,
                                textTransform: 'capitalize',
                            }}
                        />

                        <ArrowForward
                            sx={{
                                color: '#C22E28',
                                fontSize: 20,
                            }}
                        />
                    </Box>
                </CardContent>
            </Box>
        </Card>
    );
}

export default PokemonCard;
