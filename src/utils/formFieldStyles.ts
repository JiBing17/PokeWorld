const POKE_RED = '#C22E28';

export function pokeTextFieldSx(bgColor = '#F8FAFC') {
  return {
    '& .MuiOutlinedInput-root': {
      bgcolor: bgColor,
      borderRadius: 3,
      '& fieldset': { borderColor: '#E5E7EB' },
      '&:hover fieldset': { borderColor: POKE_RED },
      '&.Mui-focused fieldset': { borderColor: POKE_RED },
    },
    '& .MuiInputLabel-root': {
      color: '#6B7280',
      '&.Mui-focused': { color: POKE_RED },
    },
    '& .MuiInputBase-input': {
      color: '#111827',
      '&::placeholder': { color: '#9CA3AF', opacity: 1 },
    },
    '& input:-webkit-autofill, & textarea:-webkit-autofill': {
      WebkitBoxShadow: `0 0 0 100px ${bgColor} inset`,
      WebkitTextFillColor: '#111827',
      caretColor: '#111827',
    },
  };
}
