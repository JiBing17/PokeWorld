import axios from 'axios';
import { TMDB_API_KEY, TMDB_BASE_URL } from './constants';

// Fetches TMDB genres and turns them into an id-to-name map
export const fetchMovieGenres = async () => {
  // Example request:
  // /genre/movie/list?api_key=...&language=en-US
  const res = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
    params: { api_key: TMDB_API_KEY, language: 'en-US' },
  });

  // Example res.data.genres:
  // [
  //   { id: 12, name: "Adventure" },
  //   { id: 16, name: "Animation" },
  //   { id: 10751, name: "Family" }
  // ]

  const genreMap = {};

  // Example genreMap:
  // {
  //   12: "Adventure",
  //   16: "Animation",
  //   10751: "Family"
  // }
  res.data.genres.forEach((genre) => {
    genreMap[genre.id] = genre.name;
  });

  return genreMap;
};

// Keeps only movies that are actually related to Pokémon
export const filterPokemonMovies = (movies) => {
  // Example movies input:
  // [
  //   { title: "Pokémon: The First Movie", overview: "..." },
  //   { title: "Some Other Movie", overview: "..." }
  // ]

  return movies.filter((movie) => {
    // Safely lowercase title/overview so search is case-insensitive
    const title = movie.title?.toLowerCase() || '';
    const overview = movie.overview?.toLowerCase() || '';

    // Keep movie if either the title or overview mentions Pokémon/Pokemon
    return (
      title.includes('pokémon') ||
      title.includes('pokemon') ||
      overview.includes('pokémon') ||
      overview.includes('pokemon')
    );
  });

  // Example output:
  // [
  //   { title: "Pokémon: The First Movie", overview: "..." }
  // ]
};

// Searches TMDB for Pokémon movies across all result pages
export const fetchPokemonMovies = async () => {
  // Fetch page 1 first so we know how many total pages TMDB found
  // Example request:
  // /search/movie?query=Pokémon&page=1
  const first = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
    params: {
      api_key: TMDB_API_KEY,
      query: 'Pokémon',
      include_adult: false,
      page: 1,
    },
  });

  // Example first.data:
  // {
  //   total_pages: 3,
  //   results: [
  //     { id: 10991, title: "Pokémon: The First Movie", overview: "..." }
  //   ]
  // }
  const pages = first.data.total_pages;

  // Start the full movie list with page 1 results
  let allMovies = [...first.data.results];

  const calls = [];

  // Create requests for page 2 through the last page
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

  // Fetch remaining pages at the same time
  const responses = await Promise.all(calls);

  // Add each page's results into the full movie list
  responses.forEach((response) => {
    allMovies.push(...response.data.results);
  });

  // Keep only movies whose title/overview actually mentions Pokémon/Pokemon
  return filterPokemonMovies(allMovies);
};

// Fetches each movie's runtime and stores it by TMDB movie id
export const fetchMovieDurations = async (movies) => {
  // Example movies input:
  // [
  //   { id: 10991, title: "Pokémon: The First Movie" },
  //   { id: 11836, title: "Pokémon 3: The Movie" }
  // ]

  const durations = {};

  // Fetch runtime details for all movies at the same time
  await Promise.all(
    movies.map(async (movie) => {
      try {
        // Example request:
        // /movie/10991?api_key=...
        const detailRes = await axios.get(`${TMDB_BASE_URL}/movie/${movie.id}`, {
          params: { api_key: TMDB_API_KEY },
        });

        // Example detailRes.data.runtime:
        // 96

        // Example durations:
        // {
        //   10991: 96
        // }
        durations[movie.id] = detailRes.data.runtime;
      } catch (error) {
        // Ignore one failed runtime request so the other movies can still load
      }
    })
  );

  // Example output:
  // {
  //   10991: 96,
  //   11836: 74
  // }
  return durations;
};

// Fetches cast members for one TMDB movie
export const fetchMovieCast = async (movieId) => {
  // Example request:
  // /movie/10991/credits?api_key=...&language=en-US

  const res = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}/credits`, {
    params: {
      api_key: TMDB_API_KEY,
      language: 'en-US',
    },
  });

  // Example output:
  // [
  //   { name: "Ikue Otani", character: "Pikachu", profile_path: "..." }
  // ]

  return res.data.cast || [];
};