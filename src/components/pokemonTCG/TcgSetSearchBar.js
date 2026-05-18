import React from 'react';
import {
  TextField,
  InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';

const POKE_RED = '#C22E28';

function TcgSetSearchBar({ value, onChange }) {
  return (
    <TextField
      variant="outlined"
      fullWidth
      placeholder="Search TCG sets..."
      value={value}
      onChange={onChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: alpha(POKE_RED, 0.85) }} />
          </InputAdornment>
        ),
      }}
      sx={{
        mb: 4,
        '& .MuiOutlinedInput-root': {
          borderRadius: '999px',
          bgcolor: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',

          '& fieldset': {
            borderColor: '#E5E7EB',
          },

          '&:hover fieldset': {
            borderColor: POKE_RED,
          },

          '&.Mui-focused fieldset': {
            borderColor: POKE_RED,
            borderWidth: 2,
          },
        },

        '& .MuiOutlinedInput-input': {
          py: 1.35,
          px: 1,
        },

        '& input::placeholder': {
          color: '#6B7280',
          opacity: 1,
        },
      }}
    />
  );
}

export default TcgSetSearchBar;