import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';

export type PokemonTypeName = string;

export interface PokemonTypeSlot {
  type: { name: PokemonTypeName };
}

export interface PokemonListItem {
  name: string;
  url: string;
}

export interface EnrichedPokemon extends PokemonListItem {
  id: number;
  generation: number;
  spriteUrl: string;
  types: PokemonTypeSlot[];
  sprites?: {
    other?: {
      'official-artwork'?: { front_default?: string };
    };
  };
}

export type FavoritesMap = Record<string, boolean>;

export interface TmdbMovie {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  popularity?: number;
  genre_ids?: number[];
}

export type GenreMap = Record<number, string>;
export type DurationMap = Record<number, number>;

export interface TmdbCastMember {
  id: number;
  cast_id?: number;
  name: string;
  character?: string;
  profile_path?: string | null;
}

export interface MovieNavigationState {
  movie: TmdbMovie;
  genres?: GenreMap;
  durations?: DurationMap;
}

export interface FlavorTextEntry {
  flavor_text: string;
  language: { name: string };
}

export interface EvolutionChainNode {
  species: { name: string; url: string };
  evolves_to: EvolutionChainNode[];
}

export interface EvolutionStage {
  name: string;
  sprite: string;
}

export interface MoveDetail {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  description?: string;
}

export interface PokemonMoveRef {
  move: { name: string; url: string };
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface AuthPopupProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  sx?: SxProps<Theme>;
}

export interface PokemonCardProps {
  pokemon: EnrichedPokemon;
  isFavorite?: boolean;
  onFavoriteClick?: (name: string) => void;
  onRemoveClick?: (name: string) => void;
  to: string;
}

export interface MovieCardProps {
  movie: TmdbMovie;
  onClick?: () => void;
}

export interface MovieHeroProps {
  movie: TmdbMovie;
  genres?: GenreMap;
  runtime?: string;
  label?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onPrimaryClick?: () => void;
  primaryButtonText?: string;
  primaryButtonIcon?: ReactNode;
}

export interface AuthProviderProps {
  children: ReactNode;
}
