import axios from 'axios';
import { TMDB_API_KEY, TMDB_BASE_URL } from './constants';

// Fetches TMDB movie genres and converts them into an id-to-name map
export const fetchMovieGenres = async () => {
  const res = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
    params: { api_key: TMDB_API_KEY, language: 'en-US' },
  });

  const genreMap = {};

  res.data.genres.forEach((genre) => {
    genreMap[genre.id] = genre.name;
  });

  return genreMap;
};

// Keeps only movies whose title or overview mentions Pokémon/Pokemon
export const filterPokemonMovies = (movies) => {
  return movies.filter((movie) => {
    const title = movie.title?.toLowerCase() || '';
    const overview = movie.overview?.toLowerCase() || '';

    return (
      title.includes('pokémon') ||
      title.includes('pokemon') ||
      overview.includes('pokémon') ||
      overview.includes('pokemon')
    );
  });
};

// Searches TMDB for Pokémon movies across all result pages
export const fetchPokemonMovies = async () => {
  const first = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
    params: {
      api_key: TMDB_API_KEY,
      query: 'Pokémon',
      include_adult: false,
      page: 1,
    },
  });

  const pages = first.data.total_pages;
  let allMovies = [...first.data.results];

  const calls = [];

  for (let page = 2; page <= pages; page++) {
    calls.push(
      axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query: 'Pokémon',
          include_adult: false,
          page,
        },
      })
    );
  }

  const responses = await Promise.all(calls);

  responses.forEach((response) => {
    allMovies.push(...response.data.results);
  });

  return filterPokemonMovies(allMovies);
};

// Fetches runtime for each movie and stores it by movie id
export const fetchMovieDurations = async (movies) => {
  const durations = {};

  await Promise.all(
    movies.map(async (movie) => {
      try {
        const detailRes = await axios.get(`${TMDB_BASE_URL}/movie/${movie.id}`, {
          params: { api_key: TMDB_API_KEY },
        });

        durations[movie.id] = detailRes.data.runtime;
      } catch (error) {
        // Ignore individual movie runtime errors
      }
    })
  );

  return durations;
};