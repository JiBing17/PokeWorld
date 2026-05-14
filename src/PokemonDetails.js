import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Grid, Card, CardContent, CardMedia, Chip, Button, Box, LinearProgress, Typography } from "@mui/material";
import Header from "./Header";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import Authpopup from './Authpopup';
import { useAuth } from './AuthContext';
import { fetchUserFavorites, toggleUserFavorite } from './utils/favoritesApi';

// API URL for the backend
const BASE_URL = "http://localhost:5000/api";
const POKEMON_URL = BASE_URL + "/pokemon";

function PokemonDetails() {
  const { pokemonName } = useParams(); // Access URL parameters using useParams
  const navigate = useNavigate();
  const location = useLocation();

  // State variables to store relevant data
  const [pokemonDetails, setPokemonDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [moves, setMoves] = useState([]);
  const [displayedMoves, setDisplayedMoves] = useState(9);
  const [about, setAbout] = useState(""); 
  const [favorites, setFavorites] = useState({});
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchFavorites = async () => {
    try {
      const favoriteMap = await fetchUserFavorites();
      setFavorites(favoriteMap);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setFavorites({});
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [isAuthenticated]);

  // Fetch Pokemon details from the backend
  useEffect(() => {
    const fetchPokemonDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${POKEMON_URL}/${pokemonName}`);
        setPokemonDetails(response.data);

        // Fetch Pokémon species and evolution data
        const speciesUrl = response.data.species.url;
        const speciesResponse = await axios.get(speciesUrl);
        const evolutionChainUrl = speciesResponse.data.evolution_chain.url;
        const evolutionChainResponse = await axios.get(evolutionChainUrl);
        setEvolutionChain(parseEvolutionChain(evolutionChainResponse.data));

        // Map each move URL to an Axios GET request to fetch detailed data for each move.
        const moveDetailsPromises = response.data.moves.map(move => axios.get(move.move.url));
        const movesDetailsResponses = await Promise.all(moveDetailsPromises); // Use Promise.all to wait for all Axios requests to complete

        // Loop over each response to extract and structure the necessary move details
        const movesDetails = movesDetailsResponses.map(response => ({
          name: response.data.name.replace("-", " "), // Format move name from - to " "
          type: response.data.type.name, // Type of move
          power: response.data.power, // Power of move
          accuracy: response.data.accuracy, // Accuracy of move
          pp: response.data.pp, // Power points of move
          description: response.data.effect_entries.find(entry => entry.language.name === "en")?.effect // Description of move
        }));
        setMoves(movesDetails); // Display up to 9 moves for now

        // Fetch Pokémon description from species data
        const speciesDescription = await axios.get(speciesUrl);
        const flavorTextEntries = speciesDescription.data.flavor_text_entries.filter(entry => entry.language.name === "en");
        if (flavorTextEntries.length > 0) {
          const cleanDescription = flavorTextEntries[0].flavor_text.replace(/\f/g, " ");
          setAbout(cleanDescription);
        }

        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    fetchPokemonDetails();
  }, [pokemonName]);

  // Function to parse evolution chain data
  const parseEvolutionChain = (chain) => {
    const stages = [];
    let currentStage = chain.chain;
    while (currentStage) {
      stages.push({
        name: currentStage.species.name,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentStage.species.url.split("/")[6]}.png`,
      });
      currentStage = currentStage.evolves_to[0];
    }
    return stages;
  };

  const handleBack = () => {
    // Navigate back to Home with the last known page state (default : 1)
    navigate('/', { state: { page: location.state?.fromPage|| 1 } });
  };
  
  const toggleFavorite = async (name) => {
    const token = localStorage.getItem('token');

    if (!token) {
      setShowAuthPopup(true);
      return;
    }

    try {
      const updatedFavorites = await toggleUserFavorite(name, favorites);
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  };
    
  const showMoreMoves = () => {
    setDisplayedMoves(prev => prev + 9); // Increment the number of displayed moves by 9
  };

  // Error rendering 
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!pokemonDetails) return <div>Pokemon details not found.</div>;

  const { name, sprites, stats, types, id } = pokemonDetails; // Destructure PokemonDetails state

  // Static types for their corresponding colors
  const typeColors = {
    normal: '#c0c0c0',
    fire: '#EE8130',
    water: '#6390F0',
    electric: '#F7D02C',
    grass: '#7AC74C',
    ice: '#96D9D6',
    fighting: '#C22E28',
    poison: '#A33EA1',
    ground: '#E2BF65',
    flying: '#A98FF3',
    psychic: '#F95587',
    bug: '#A6B91A',
    rock: '#B6A136',
    ghost: '#735797',
    dragon: '#6F35FC',
    dark: '#705746',
    steel: '#B7B7CE',
    fairy: '#D685AD',
  };
 
  // Color mapping function based on value ranges
  const getColorForValue = (value) => {
    if (value === null) return '#cccccc'; // Default color for N/A values
    if (value < 50) return '#f44336'; // Red color for values under 50
    if (value <= 75) return '#ffeb3b'; // Yellow color for values between 50 and 75
    return '#4caf50'; // Green color for values above 75
  };

  // Helper function to truncate text to 100 words with an ellipsis
  const truncateDescription = (text) => {
    if (!text) {
      return "No Description Found..." // Default text if no description is found
    }
    const words = text.split(' '); // Split text into an array of words
    if (words.length > 50) {
      return words.slice(0, 50).join(' ') + '...'; // Join the first 100 words with a space and add ellipsis
    }
    return text; // Return original text if it's 100 words or less
  };

  return (
    <div>
      <Header />

      
      <div className="container mx-auto px-4 pt-20">
        {/* Button used to return to previous pagination page */}
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2, color: "#C22E28"}}>
          Back
        </Button>
        
        <Box sx={{display: "flex", justifyContent: "center", alignItems: "center"}}>
          <div className="flex justify-center">
            {/* Display Pokemon's Name and Picture */}
            <Card sx={{ width: 400, borderRadius: 4, boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)", position: "relative"}}>
              {/* Favorite Heart Button */}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite(name);
                }}
                sx={{ position: 'absolute', top: 8, left: 8, color: "#C22E28"}}
              >
                {favorites[name] ? <Favorite color="error" /> : <FavoriteBorder />}
              </Button>
              <CardContent>
                {/* Display Pokemon's Name */}
                <Typography variant="h5" component="div" gutterBottom style={{ textAlign: 'center' }}>
                  {name.toUpperCase()}
                </Typography>
                {/* Display Pokemon's ID */}
                <Typography variant="body2" color="text.secondary" sx={{ position: "absolute", top: 0, right: 0, marginTop: '10px', marginRight: '10px' }}>
                  #{id}
                </Typography>
                {/* Display Pokemon's Types */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
                  {types.map((type, index) => (
                    <Chip
                      key={index}
                      label={type.type.name}
                      sx={{ backgroundColor: typeColors[type.type.name], color: "white", marginRight: "5px", marginLeft: "5px", paddingRight: "10px", paddingLeft: "10px" }}
                    />
                  ))}
                </div>
                {/* Display Pokemon's Image */}
                {sprites && (
                  <CardMedia
                    component="img"
                    height="300"
                    image={sprites.other['official-artwork'].front_default}
                    alt={`Image of ${name}`}
                    style={{ imageRendering: 'pixelated' }}
                  />
                )}
                <div className="mt-6 text-center">
                  {/* Display Pokemon stats with visual bars */}
                  <Grid container spacing={2}>
                    {stats.map((stat, index) => (
                      <Grid item xs={6} key={index}>
                        <Typography variant="body2" color="text.secondary">{stat.stat.name}</Typography>
                        <LinearProgress variant="determinate" value={(stat.base_stat / 255) * 100} sx={{ height: 10, borderRadius: 5, backgroundColor: '#ddd', '& .MuiLinearProgress-bar': { backgroundColor: typeColors[types[0].type.name] } }} />
                      </Grid>
                    ))}
                  </Grid>
                </div>
              </CardContent>
            </Card>
          </div>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: 4, borderColor: typeColors[types[0].type.name], borderRadius: 4, marginLeft: "2rem", padding: "2rem" }}>
            {/* Display Pokemon's About Section */}
            {about && (
              <Box sx={{ padding: 2, marginTop: 2, alignContent: "center", display: "flex", flexDirection: "column", alignItems: "center"}}>
                <Typography variant="h6" component="div" sx={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: 2 }}>About</Typography>
                <Typography variant="body1">{truncateDescription(about)}</Typography>
              </Box>
            )}

            {/* Display Pokemon's Evolutions */}
            <div className="mt-2">
              <Box sx={{ padding: 2 }}>
                <Typography variant="h6" sx={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>Evolutions</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
                  {evolutionChain.map((stage, index) => (
                    <Card key={index} sx={{ width: 160, boxShadow: "0px 4px 8px rgba(0,0,0,0.25)", borderRadius: 4, transition: "transform 0.3s ease-in-out", "&:hover": { transform: "scale(1.05)" }, mx: 3 }}>
                      <Link to={`/pokemon/${stage.name}`} style={{ textDecoration: 'none' }}>
                        <CardMedia
                          component="img"
                          image={stage.sprite}
                          alt={`Sprite of ${stage.name}`}
                          sx={{ height: 160, objectFit: 'contain', padding: 1 }}
                        />
                        <CardContent sx={{ padding: 1 }}>
                          <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                            {stage.name.toUpperCase()}
                          </Typography>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </Box>
              </Box>
            </div>
          </Box>
        </Box>

        
      
        <div className="mt-8">
          {/* Display Pokemon's Moves */}
          <Box sx={{ border: 4, borderColor: typeColors[types[0].type.name] , borderRadius: 4, padding: 2, mt: 4 }}>
            <Typography variant="h6" sx={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: 2, textAlign: "center" }}>Moves</Typography>
            <Grid container spacing={2} sx={{ px: 2, py: 2 }}>
              {moves.slice(0, displayedMoves).map((move, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{
                    height: '100%',
                    boxShadow: "0px 3px 3px rgba(0,0,0,0.6)",
                    border: 5,
                    borderColor: typeColors[move.type], 
                    borderRadius: "1rem",
                    transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: "0px 5px 15px rgba(0,0,0,.9)"
                    }
                  }}>
                    <CardContent>
                      {/* Move name displayed in uppercase */}
                      <Typography  variant="h6" component="div">{move.name.toUpperCase()}</Typography>
                      {/* Display move type */}
                      <Chip label={`Type: ${move.type}`} sx={{ backgroundColor: typeColors[move.type], color: "white", m: 0.5 }} />
                      {/* Display move power, showing 'N/A' if power is null */}
                      <Chip label={`Power: ${move.power || 'N/A'}`} sx={{ backgroundColor: getColorForValue(move.power), color: "white", m: 0.5 }} />
                      {/* Display move accuracy, showing 'N/A' if accuracy is null */}
                      <Chip label={`Accuracy: ${move.accuracy || 'N/A'}`} sx={{ backgroundColor: getColorForValue(move.accuracy), color: "white", m: 0.5 }} />
                      {/* Display move PP */}
                      <Chip label={`PP: ${move.pp}`} sx={{ backgroundColor: "#C22E28", color: "white", m: 0.5 }} />
                      {/* Display a short description of the move's effects */}
                      <Typography  variant="body2">{truncateDescription(move.description)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {/* Conditionally rendered button to show more moves */}
              {moves.length > displayedMoves && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <Button onClick={showMoreMoves} variant="contained" sx={{ backgroundColor: '#C22E28', color: 'white', '&:hover': { backgroundColor: '#B22222' }}}>
                      Show More
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </div>
      </div>
      {showAuthPopup && (
        <Authpopup
          onClose={() => setShowAuthPopup(false)}
          onSuccess={fetchFavorites}
        />
      )}
    </div>
  );
  
  
}

export default PokemonDetails;