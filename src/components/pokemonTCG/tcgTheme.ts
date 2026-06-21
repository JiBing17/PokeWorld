export const POKE_RED = '#C22E28';
export const POKE_YELLOW = '#FFCC00';
export const POKE_BLUE = '#2A75BB';
export const POKE_BG = '#F6F8FC';
export const HEADER_HEIGHT = 64;

export function darken(hex: string, amt = 0.14): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const [r, g, b] = hex.replace('#', '').match(/.{1,2}/g)!.map((x) => parseInt(x, 16));
  return `rgb(${clamp(r * (1 - amt))}, ${clamp(g * (1 - amt))}, ${clamp(b * (1 - amt))})`;
}
