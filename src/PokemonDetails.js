import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Box,
  LinearProgress,
  Typography,
  IconButton,
  CircularProgress,
  Paper,
  Stack,
  Divider,
} from "@mui/material";
import Header from "./Header";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import Authpopup from "./Authpopup";
import { useAuth } from "./AuthContext";
import { fetchUserFavorites, toggleUserFavorite } from "./utils/favoritesApi";
import { typeColors } from "./utils/constants";

const BASE_URL = "http://localhost:5000/api";
const POKEMON_URL = BASE_URL + "/pokemon";

function PokemonDetails() {
  const { pokemonName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

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
      console.error("Failed to fetch favorites:", error);
      setFavorites({});
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchPokemonDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${POKEMON_URL}/${pokemonName}`);
        setPokemonDetails(response.data);

        const speciesUrl = response.data.species.url;
        const speciesResponse = await axios.get(speciesUrl);

        const evolutionChainUrl = speciesResponse.data.evolution_chain.url;
        const evolutionChainResponse = await axios.get(evolutionChainUrl);
        setEvolutionChain(parseEvolutionChain(evolutionChainResponse.data));

        const moveDetailsPromises = response.data.moves.map((move) =>
          axios.get(move.move.url)
        );

        const movesDetailsResponses = await Promise.all(moveDetailsPromises);

        const movesDetails = movesDetailsResponses.map((response) => ({
          name: response.data.name.replace("-", " "),
          type: response.data.type.name,
          power: response.data.power,
          accuracy: response.data.accuracy,
          pp: response.data.pp,
          description: response.data.effect_entries.find(
            (entry) => entry.language.name === "en"
          )?.effect,
        }));

        setMoves(movesDetails);

        const flavorTextEntries = speciesResponse.data.flavor_text_entries.filter(
          (entry) => entry.language.name === "en"
        );

        if (flavorTextEntries.length > 0) {
          const cleanDescription = flavorTextEntries[0].flavor_text.replace(
            /\f/g,
            " "
          );
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
    navigate("/", { state: { page: location.state?.fromPage || 1 } });
  };

  const toggleFavorite = async (name) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setShowAuthPopup(true);
      return;
    }

    try {
      const updatedFavorites = await toggleUserFavorite(name, favorites);
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error("Failed to update favorite:", error);
    }
  };

  const showMoreMoves = () => {
    setDisplayedMoves((prev) => prev + 9);
  };

  const getColorForValue = (value) => {
    if (value === null) return "#9e9e9e";
    if (value < 50) return "#ef5350";
    if (value <= 75) return "#fbc02d";
    return "#43a047";
  };

  const truncateDescription = (text) => {
    if (!text) {
      return "No description found.";
    }

    const words = text.split(" ");

    if (words.length > 50) {
      return words.slice(0, 50).join(" ") + "...";
    }

    return text;
  };

  if (loading) {
    return (
      <Box>
        <Header />
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pt: 10,
          }}
        >
          <Stack alignItems="center" spacing={2}>
            <CircularProgress sx={{ color: "#C22E28" }} />
            <Typography color="text.secondary">Loading Pokémon details...</Typography>
          </Stack>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Header />
        <Box sx={{ pt: 12, px: 3, textAlign: "center" }}>
          <Typography variant="h6" color="error">
            Error: {error.message}
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mt: 2, color: "#C22E28" }}
          >
            Back to Home
          </Button>
        </Box>
      </Box>
    );
  }

  if (!pokemonDetails) {
    return (
      <Box>
        <Header />
        <Box sx={{ pt: 12, px: 3, textAlign: "center" }}>
          <Typography variant="h6">Pokémon details not found.</Typography>
        </Box>
      </Box>
    );
  }

  const { name, sprites, stats, types, id, height, weight } = pokemonDetails;
  const primaryType = types[0].type.name;
  const primaryColor = typeColors[primaryType] || "#C22E28";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7fb" }}>
      <Header />

      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          px: { xs: 2, md: 4 },
          pt: { xs: 11, md: 12 },
          pb: 6,
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{
            mb: 3,
            color: "#C22E28",
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          Back
        </Button>

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 5,
                boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
                overflow: "hidden",
                position: "relative",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, #ffffff 120%)`,
                  minHeight: 260,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  p: 3,
                }}
              >
                <Typography
                  sx={{
                    position: "absolute",
                    top: 20,
                    right: 24,
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "1.5rem",
                    fontWeight: 900,
                  }}
                >
                  #{String(id).padStart(3, "0")}
                </Typography>

                <IconButton
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(name);
                  }}
                  sx={{
                    position: "absolute",
                    top: 18,
                    left: 18,
                    bgcolor: "rgba(255,255,255,0.95)",
                    color: "#C22E28",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    "&:hover": {
                      bgcolor: "white",
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  {favorites[name] ? <Favorite /> : <FavoriteBorder />}
                </IconButton>

                {sprites && (
                  <CardMedia
                    component="img"
                    image={sprites.other["official-artwork"].front_default}
                    alt={`Image of ${name}`}
                    sx={{
                      width: "85%",
                      maxWidth: 330,
                      objectFit: "contain",
                      filter: "drop-shadow(0 20px 22px rgba(0,0,0,0.25))",
                    }}
                  />
                )}
              </Box>

              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h4"
                  sx={{
                    textTransform: "capitalize",
                    fontWeight: 900,
                    mb: 1,
                  }}
                >
                  {name}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap" }}>
                  {types.map((type) => (
                    <Chip
                      key={type.type.name}
                      label={type.type.name}
                      sx={{
                        bgcolor: typeColors[type.type.name],
                        color: "white",
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    />
                  ))}
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: "#f7f7f7",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Height
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {height / 10} m
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: "#f7f7f7",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Weight
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {weight / 10} kg
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Stack spacing={3} sx={{ height: "100%" }}>
              <Card
                sx={{
                  borderRadius: 5,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                    About
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.secondary",
                      lineHeight: 1.8,
                      mb: 3,
                    }}
                  >
                    {truncateDescription(about)}
                  </Typography>

                  <Divider sx={{ mb: 3 }} />

                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
                    Base Stats
                  </Typography>

                  <Grid container spacing={2}>
                    {stats.map((stat) => (
                      <Grid item xs={12} sm={6} key={stat.stat.name}>
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 0.75,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                textTransform: "capitalize",
                                color: "text.secondary",
                              }}
                            >
                              {stat.stat.name.replace("-", " ")}
                            </Typography>

                            <Typography variant="body2" fontWeight={800}>
                              {stat.base_stat}
                            </Typography>
                          </Box>

                          <LinearProgress
                            variant="determinate"
                            value={(stat.base_stat / 255) * 100}
                            sx={{
                              height: 9,
                              borderRadius: 10,
                              bgcolor: "rgba(0,0,0,0.08)",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: primaryColor,
                                borderRadius: 10,
                              },
                            }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              <Card
                sx={{
                  borderRadius: 5,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
                    Evolutions
                  </Typography>

                  <Grid container spacing={2}>
                    {evolutionChain.map((stage) => (
                      <Grid item xs={12} sm={4} key={stage.name}>
                        <Card
                          component={Link}
                          to={`/pokemon/${stage.name}`}
                          sx={{
                            display: "block",
                            textDecoration: "none",
                            color: "inherit",
                            borderRadius: 4,
                            boxShadow: "none",
                            border: "1px solid rgba(0,0,0,0.08)",
                            bgcolor: "#fafafa",
                            transition: "0.2s ease",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: "0 12px 25px rgba(0,0,0,0.1)",
                            },
                          }}
                        >
                          <CardMedia
                            component="img"
                            image={stage.sprite}
                            alt={`Sprite of ${stage.name}`}
                            sx={{
                              height: 130,
                              objectFit: "contain",
                              p: 1.5,
                            }}
                          />

                          <CardContent sx={{ pt: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                textAlign: "center",
                                fontWeight: 900,
                                textTransform: "capitalize",
                              }}
                            >
                              {stage.name}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <Card
          sx={{
            mt: 3,
            borderRadius: 5,
            boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
              Moves
            </Typography>

            <Grid container spacing={2}>
              {moves.slice(0, displayedMoves).map((move, index) => (
                <Grid item xs={12} sm={6} md={4} key={`${move.name}-${index}`}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 4,
                      boxShadow: "none",
                      border: "1px solid rgba(0,0,0,0.08)",
                      transition: "0.2s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 25px rgba(0,0,0,0.1)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          textTransform: "capitalize",
                          fontWeight: 900,
                          mb: 1,
                        }}
                      >
                        {move.name}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ flexWrap: "wrap", rowGap: 1, mb: 2 }}
                      >
                        <Chip
                          label={move.type}
                          size="small"
                          sx={{
                            bgcolor: typeColors[move.type],
                            color: "white",
                            fontWeight: 700,
                            textTransform: "capitalize",
                          }}
                        />

                        <Chip
                          label={`Power: ${move.power || "N/A"}`}
                          size="small"
                          sx={{
                            bgcolor: getColorForValue(move.power),
                            color: "white",
                            fontWeight: 700,
                          }}
                        />

                        <Chip
                          label={`Accuracy: ${move.accuracy || "N/A"}`}
                          size="small"
                          sx={{
                            bgcolor: getColorForValue(move.accuracy),
                            color: "white",
                            fontWeight: 700,
                          }}
                        />

                        <Chip
                          label={`PP: ${move.pp}`}
                          size="small"
                          sx={{
                            bgcolor: "#C22E28",
                            color: "white",
                            fontWeight: 700,
                          }}
                        />
                      </Stack>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          lineHeight: 1.6,
                        }}
                      >
                        {truncateDescription(move.description)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              {moves.length > displayedMoves && (
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Button
                      onClick={showMoreMoves}
                      variant="contained"
                      sx={{
                        bgcolor: "#C22E28",
                        color: "white",
                        px: 4,
                        py: 1,
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: 800,
                        "&:hover": { bgcolor: "#B22222" },
                      }}
                    >
                      Show More Moves
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {showAuthPopup && (
        <Authpopup
          onClose={() => setShowAuthPopup(false)}
          onSuccess={fetchFavorites}
        />
      )}
    </Box>
  );
}

export default PokemonDetails;