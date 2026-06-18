// ========================== POKEAPI RELATED CONSTANTS ========================= // 

// Base URL for the backend API server
export const BASE_URL = 'http://localhost:5000/api';

// Pokémon endpoint built from the base API URL
export const POKEMON_URL = `${BASE_URL}/pokemon`;

// Image shown while a Pokémon sprite or image is still loading
export const PLACEHOLDER_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif';

// Number of Pokémon displayed per page
export const PAGE_SIZE = 48;

// Maximum number of Pokémon shown in search results
export const SEARCH_RESULT_LIMIT = 60;

// List of available Pokémon generations for filter chips
export const ALL_GEN_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// First Pokédex ID for each generation
// Used to jump to the correct page when a generation is selected
export const FIRST_ID_BY_GEN = {
  1: 1,    // Generation 1 
  2: 152,  // Generation 2 
  3: 252,  // Generation 3 
  4: 387,  // Generation 4
  5: 494,  // Generation 5 
  6: 650,  // Generation 6 
  7: 722,  // Generation 7 
  8: 810,  // Generation 8 
  9: 899,  // Generation 9 
};

// Color mapping for each Pokémon type
// Used to style type badges/cards consistently across the app
export const typeColors = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};


// ========================== MOVIES RELATED CONSTANTS ========================= // 

export const PLACEHOLDER ='https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif';

export const truncateDescription = (text) => {
    if (!text) {
      return "No description found.";
    }

    const words = text.split(" ");

    if (words.length > 50) {
      return words.slice(0, 50).join(" ") + "...";
    }

    return text;
  };

// TMDB API key stored in the frontend environment variables
export const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

// Base URL for TMDB movie API requests
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Base URL for TMDB poster images
export const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Base URL for TMDB backdrop images
export const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';