export interface TcgSetImages {
  logo?: string;
  symbol?: string;
}

export interface TcgSet {
  id: string;
  name: string;
  series?: string;
  releaseDate?: string;
  total?: number;
  printedTotal?: number;
  ptcgoCode?: string;
  images?: TcgSetImages;
}

export interface TcgCardSet {
  name: string;
  series?: string;
}

export interface TcgCardImages {
  small: string;
  large: string;
}

export interface TcgPlayerPriceEntry {
  market?: number;
}

export interface TcgCard {
  id: string;
  name: string;
  number?: string;
  images: TcgCardImages;
  set?: TcgCardSet;
  rarity?: string;
  supertype?: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  flavorText?: string;
  attacks?: Array<{
    name: string;
    damage?: string;
    text?: string;
    cost: string[];
  }>;
  abilities?: Array<{
    name: string;
    text?: string;
  }>;
  weaknesses?: Array<{ type: string; value: string }>;
  resistances?: Array<{ type: string; value: string }>;
  retreatCost?: string[];
  tcgplayer?: {
    prices?: {
      holofoil?: TcgPlayerPriceEntry;
      normal?: TcgPlayerPriceEntry;
      reverseHolofoil?: TcgPlayerPriceEntry;
    };
    url?: string;
  };
  cardmarket?: {
    url?: string;
  };
}

export interface TcgCardsResponse {
  data: TcgCard[];
  totalCount?: number;
  total?: number;
}

export interface TcgCardQueryFilters {
  nameQuery?: string;
  setId?: string;
  type?: string;
}

export const TCG_TYPE_OPTIONS = [
  'Colorless',
  'Darkness',
  'Dragon',
  'Fairy',
  'Fighting',
  'Fire',
  'Grass',
  'Lightning',
  'Metal',
  'Psychic',
  'Water',
] as const;

export const TCG_MARKET_PAGE_SIZE = 48;
export const TCG_SETS_PAGE_SIZE = 16;
export const TCG_SET_DRAWER_PAGE_SIZE = 24;
