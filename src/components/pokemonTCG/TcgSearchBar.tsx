import React from 'react';
import { TextField, InputAdornment, SxProps, Theme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { POKE_RED } from './tcgTheme';

interface TcgSearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

export default function TcgSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  fullWidth = false,
  sx,
}: TcgSearchBarProps) {
  return (
    <TextField
      variant="outlined"
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      fullWidth={fullWidth}
      sx={{
        flexGrow: fullWidth ? undefined : 1,
        minWidth: fullWidth ? undefined : { xs: 0, sm: 240 },
        ...(fullWidth && { mb: 4 }),
        '& .MuiOutlinedInput-root': {
          borderRadius: 999,
          bgcolor: '#FFFFFF',
          ...(fullWidth && { boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }),
          '& fieldset': { borderColor: '#E5E7EB' },
          '&:hover fieldset': { borderColor: POKE_RED },
          '&.Mui-focused fieldset': {
            borderColor: POKE_RED,
            borderWidth: fullWidth ? 2 : 1,
          },
        },
        '& .MuiInputBase-input': { py: fullWidth ? 1.35 : 1.15 },
        ...sx,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon
              sx={{ color: fullWidth ? POKE_RED : '#6B7280', opacity: fullWidth ? 0.85 : 1 }}
            />
          </InputAdornment>
        ),
      }}
    />
  );
}
