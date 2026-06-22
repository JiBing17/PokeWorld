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
import Header from "../Header";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import Authpopup from "../Authpopup";
import { typeColors, POKEMON_URL, truncateDescription } from "../../utils/constants";
import { getErrorMessage } from "../../utils/errorUtils";
import { apiClient } from "../../utils/apiClient";
import { useFavorites } from "../../hooks/useFavorites";
import {
  getEnglishDescription,
  getMoveDetails,
  INITIAL_MOVE_BATCH,
  MOVE_LOAD_MORE_BATCH,
  parseEvolutionChain,
} from "../../utils/pokemonDetailsUtils";
import type {
  EvolutionStage,
  MoveDetail,
  PokemonMoveRef,
  PokemonTypeSlot,
} from "../../types";

interface PokemonStat {
  base_stat: number;
  stat: { name: string };
}

interface PokemonDetailsData {
  name: string;
  id: number;
  height: number;
  weight: number;
  sprites: {
    other?: {
      "official-artwork"?: { front_default?: string };
    };
  };
  stats: PokemonStat[];
  types: PokemonTypeSlot[];
  moves: PokemonMoveRef[];
  species: { url: string };
}

interface HomeLocationState {
  fromPage?: number;
}

function PokemonDetails() {
  const { pokemonName } = useParams<{ pokemonName: string }>(); // Gets the Pokémon name from the URL, example: /pokemon/pikachu
  const navigate = useNavigate(); // Lets this page navigate to another route
  const location = useLocation(); // Reads route state, like which page the user came from

  const [pokemonDetails, setPokemonDetails] = useState<PokemonDetailsData | null>(null); // full Pokémon data for the details page
  const [loading, setLoading] = useState(true); // true while Pokémon details are loading
  const [error, setError] = useState<unknown>(null); // stores fetch errors so the UI can show an error message

  const [evolutionChain, setEvolutionChain] = useState<EvolutionStage[]>([]); // simplified evolution list, example: [{ name: "pichu", sprite: "..." }]
  const [moves, setMoves] = useState<MoveDetail[]>([]); // simplified move list used in the Moves section
  const [displayedMoves, setDisplayedMoves] = useState(9); // number of moves currently shown
  const [movesLoadedCount, setMovesLoadedCount] = useState(0);
  const [loadingMoreMoves, setLoadingMoreMoves] = useState(false);
  const [allMoveRefs, setAllMoveRefs] = useState<PokemonMoveRef[]>([]);
  const [about, setAbout] = useState(""); // English Pokédex description text
  const {
    favorites,
    showAuthPopup,
    setShowAuthPopup,
    fetchFavorites,
    toggleFavorite,
  } = useFavorites();

  // Fetches all data needed for the Pokémon details page
  useEffect(() => {
    const fetchPokemonDetails = async () => {
      if (!pokemonName) {
        setError(new Error('Pokémon name is required'));
        setLoading(false);
        return;
      }

      try {
        // Start loading and clear old errors before fetching a new Pokémon
        setLoading(true);
        setError(null);

        // Example request:
        // /api/pokemon/pikachu
        const response = await apiClient.get<PokemonDetailsData>(`/pokemon/${pokemonName}`);

        // Example response.data has full Pokémon data:
        // {
        //   name: "pikachu",
        //   id: 25,
        //   sprites: {...},
        //   stats: [...],
        //   types: [...],
        //   moves: [...],
        //   species: { url: "https://pokeapi.co/api/v2/pokemon-species/25/" }
        // }
        setPokemonDetails(response.data);
        setAllMoveRefs(response.data.moves);

        // Fetch species data using the species URL from the Pokémon response
        const speciesResponse = await axios.get<{
          flavor_text_entries: Parameters<typeof getEnglishDescription>[0];
          evolution_chain: { url: string };
        }>(response.data.species.url);

        // Example speciesResponse.data includes:
        // {
        //   flavor_text_entries: [...],
        //   evolution_chain: {
        //     url: "https://pokeapi.co/api/v2/evolution-chain/10/"
        //   }
        // }

        // Fetch evolution chain data using the URL from the species response
        const evolutionChainResponse = await axios.get(
          speciesResponse.data.evolution_chain.url
        );

        // Example parseEvolutionChain output:
        // [
        //   { name: "pichu", sprite: ".../172.png" },
        //   { name: "pikachu", sprite: ".../25.png" },
        //   { name: "raichu", sprite: ".../26.png" }
        // ]
        setEvolutionChain(parseEvolutionChain(evolutionChainResponse.data));

        // Fetch each move's detail URL and keep only fields needed by the UI
        // Example output:
        // [
        //   { name: "quick attack", type: "normal", power: 40, accuracy: 100, pp: 30, description: "..." },
        //   { name: "thunder shock", type: "electric", power: 40, accuracy: 100, pp: 30, description: "..." }
        // ]
        const movesDetails = await getMoveDetails(response.data.moves, {
          limit: INITIAL_MOVE_BATCH,
        });
        setMoves(movesDetails);
        setMovesLoadedCount(movesDetails.length);

        // Gets the first English Pokédex description and cleans weird line breaks
        // Example output:
        // "When several of these Pokémon gather, their electricity could build and cause lightning storms."
        const description = getEnglishDescription(
          speciesResponse.data.flavor_text_entries
        );

        setAbout(description);
      } catch (error) {
        // Store error so the UI can show an error message
        setError(error);
      } finally {
        // Stop loading after success or failure
        setLoading(false);
      }
    };

    fetchPokemonDetails();
  }, [pokemonName]);

  // Function used to go navigate back to home page 
  const handleBack = () => {
    const state = location.state as HomeLocationState | null;
    navigate("/", { state: { page: state?.fromPage || 1 } });
  };

  // Update state to show 9 more moves on a certain button click
  const showMoreMoves = async () => {
    const nextDisplay = displayedMoves + MOVE_LOAD_MORE_BATCH;
    setDisplayedMoves(nextDisplay);

    if (
      allMoveRefs.length > 0 &&
      movesLoadedCount < nextDisplay &&
      movesLoadedCount < allMoveRefs.length
    ) {
      setLoadingMoreMoves(true);
      try {
        const more = await getMoveDetails(allMoveRefs, {
          offset: movesLoadedCount,
          limit: MOVE_LOAD_MORE_BATCH,
        });
        setMoves((prev) => [...prev, ...more]);
        setMovesLoadedCount((prev) => prev + more.length);
      } finally {
        setLoadingMoreMoves(false);
      }
    }
  };

  // Determines chip color based on move power or accuracy value
  const getColorForValue = (value: number | null) => {
    if (value === null) return "#9e9e9e";
    if (value < 50) return "#ef5350";
    if (value <= 75) return "#fbc02d";
    return "#43a047";
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
            Error: {getErrorMessage(error)}
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

  // Not found UI
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

  // Parse info from the Pokémon details
  const { name, sprites, stats, types, id, height, weight } = pokemonDetails;
  const primaryType = types[0].type.name;
  const primaryColor = typeColors[primaryType as keyof typeof typeColors] || "#C22E28";

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
                    image={sprites.other?.["official-artwork"]?.front_default}
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
                        bgcolor: typeColors[type.type.name as keyof typeof typeColors],
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
                            bgcolor: typeColors[move.type as keyof typeof typeColors],
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
