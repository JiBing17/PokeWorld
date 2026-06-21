import type { TcgCard } from './tcgTypes';

export const getMarketPrice = (card: TcgCard): number | null =>
  card.tcgplayer?.prices?.holofoil?.market ??
  card.tcgplayer?.prices?.normal?.market ??
  card.tcgplayer?.prices?.reverseHolofoil?.market ??
  null;

export const getPriceBreakdown = (
  card: TcgCard,
): Array<{ label: string; value: number }> => {
  const prices = card.tcgplayer?.prices;
  if (!prices) return [];

  const entries: Array<{ label: string; value: number }> = [];
  if (prices.normal?.market != null) {
    entries.push({ label: 'Normal', value: prices.normal.market });
  }
  if (prices.holofoil?.market != null) {
    entries.push({ label: 'Holofoil', value: prices.holofoil.market });
  }
  if (prices.reverseHolofoil?.market != null) {
    entries.push({ label: 'Reverse Holo', value: prices.reverseHolofoil.market });
  }
  return entries;
};
