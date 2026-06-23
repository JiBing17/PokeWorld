import React from 'react';
import { Box, Chip, Stack } from '@mui/material';
import { ALL_GEN_OPTIONS } from '../../utils/constants';

type SelectedGen = 'all' | number;

interface GenerationFilterProps {
  selectedGen: SelectedGen;
  onGenClick: (gen: SelectedGen) => void;
}

const getChipSx = (isSelected: boolean) => ({
  px: 0.75,
  height: { xs: 40, md: 36 },
  borderRadius: '999px',
  fontWeight: 800,
  border: isSelected ? '1px solid #C22E28' : '1px solid #E5E7EB',
  bgcolor: isSelected ? '#C22E28' : '#FFFFFF',
  color: isSelected ? '#FFFFFF' : '#374151',
  boxShadow: isSelected
    ? '0 8px 18px rgba(194, 46, 40, 0.22)'
    : '0 4px 12px rgba(15, 23, 42, 0.06)',
  '& .MuiChip-label': {
    px: 1.25,
  },
  '&:hover': {
    bgcolor: isSelected ? '#B22222' : '#FFF1F2',
    borderColor: '#C22E28',
    color: isSelected ? '#FFFFFF' : '#C22E28',
  },
});

export default function GenerationFilter({
  selectedGen,
  onGenClick,
}: GenerationFilterProps) {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        pb: 2,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        bgcolor: '#F6F8FC',
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          minWidth: 'max-content',
          py: 0.5,
        }}
      >
        <Chip
          label="All Pokémon"
          clickable
          onClick={() => onGenClick('all')}
          sx={getChipSx(selectedGen === 'all')}
        />

        {ALL_GEN_OPTIONS.map((gen) => (
          <Chip
            key={gen}
            label={`Generation ${gen}`}
            clickable
            onClick={() => onGenClick(gen)}
            sx={getChipSx(selectedGen === gen)}
          />
        ))}
      </Stack>
    </Box>
  );
}
