import React from 'react';
import {
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const POKE_RED = '#C22E28';

interface TcgMarketSearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function TcgMarketSearchBar({ value, onChange }: TcgMarketSearchBarProps) {
  return (
    <TextField
      sx={{
        flexGrow: 1,
        minWidth: 240,
        '& .MuiOutlinedInput-root': {
          borderRadius: 999,
          bgcolor: '#FFFFFF',

          '& fieldset': {
            borderColor: '#E5E7EB',
          },

          '&:hover fieldset': {
            borderColor: POKE_RED,
          },

          '&.Mui-focused fieldset': {
            borderColor: POKE_RED,
          },
        },
        '& .MuiInputBase-input': {
          py: 1.15,
        },
      }}
      variant="outlined"
      size="small"
      placeholder="Search cards by name"
      value={value}
      onChange={onChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: '#6B7280' }} />
          </InputAdornment>
        ),
      }}
    />
  );
}

export default TcgMarketSearchBar;
