export const POKE_RED = '#C22E28';
export const POKE_YELLOW = '#FFCC00';
export const POKE_BLUE = '#2A75BB';
export const POKE_BG = '#F6F8FC';

export const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Colorless: { bg: '#F3F4F6', text: '#374151' },
  Darkness: { bg: '#EDE9FE', text: '#5B21B6' },
  Dragon: { bg: '#EDE9FE', text: '#6F35FC' },
  Fairy: { bg: '#FCE7F3', text: '#BE185D' },
  Fighting: { bg: '#FEE2E2', text: '#B91C1C' },
  Fire: { bg: '#FFEDD5', text: '#C2410C' },
  Grass: { bg: '#DCFCE7', text: '#15803D' },
  Lightning: { bg: '#FEF9C3', text: '#A16207' },
  Metal: { bg: '#E5E7EB', text: '#374151' },
  Psychic: { bg: '#FCE7F3', text: '#DB2777' },
  Water: { bg: '#DBEAFE', text: '#1D4ED8' },
};

export function getTypeChipColors(type: string) {
  return TYPE_COLORS[type] ?? { bg: '#FFF1F2', text: POKE_RED };
}
