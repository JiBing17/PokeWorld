import React from 'react';
import { TextField } from '@mui/material';

// Reusable search bar component
function SearchBar({
  value,
  onChange,
  label = 'Search...',
  placeholder = '',
  sx = {},
}) {
  return (
    <TextField
      variant="outlined"
      fullWidth
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      sx={{
        mb: 4,
        '& .MuiOutlinedInput-root': {
          borderRadius: '40px',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',

          '& fieldset': {
            borderColor: '#E5E7EB',
          },

          '&:hover fieldset': {
            borderColor: '#C22E28',
          },

          '&.Mui-focused fieldset': {
            borderColor: '#C22E28',
          },
        },
        '& .MuiOutlinedInput-input': {
          padding: '12px 20px',
        },
        '& .MuiInputLabel-root': {
          color: '#6B7280',
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: '#C22E28',
        },
        ...sx,
      }}
    />
  );
}

export default SearchBar;