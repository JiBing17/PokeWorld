// utils/pokemonDetailsUtils.js
import axios from "axios";
import type {
  EvolutionChainNode,
  EvolutionStage,
  FlavorTextEntry,
  MoveDetail,
  PokemonMoveRef,
} from "../types";

interface EvolutionChainResponse {
  chain: EvolutionChainNode;
}

// Gets the first English Pokédex description and cleans weird line breaks
export const getEnglishDescription = (flavorTextEntries: FlavorTextEntry[]): string => {
  // Example flavorTextEntries input:
  // [
  //   {
  //     flavor_text: "When several of these POKéMON gather,\ftheir electricity could build.",
  //     language: { name: "en" }
  //   },
  //   {
  //     flavor_text: "Japanese description...",
  //     language: { name: "ja" }
  //   }
  // ]

  // Find the first English description
  const englishEntry = flavorTextEntries.find(
    (entry) => entry.language.name === "en"
  );

  // Example output:
  // "When several of these POKéMON gather, their electricity could build."
  //
  // The /\f/g removes PokeAPI's form-feed line break characters
  return englishEntry?.flavor_text.replace(/\f/g, " ") || "";
};

// Fetches full data for each move and keeps only the fields the UI needs
export const getMoveDetails = async (moves: PokemonMoveRef[]): Promise<MoveDetail[]> => {
  // Example moves input:
  // [
  //   { move: { name: "quick-attack", url: "https://pokeapi.co/api/v2/move/98/" } },
  //   { move: { name: "thunder-shock", url: "https://pokeapi.co/api/v2/move/84/" } }
  // ]

  // Create one request for each move detail URL
  const moveDetailsPromises = moves.map((move) =>
    axios.get<{
      name: string;
      type: { name: string };
      power: number | null;
      accuracy: number | null;
      pp: number;
      effect_entries: { language: { name: string }; effect: string }[];
    }>(move.move.url)
  );

  // Wait for all move detail requests to finish
  const movesDetailsResponses = await Promise.all(moveDetailsPromises);

  // Example simplified output:
  // [
  //   {
  //     name: "quick attack",
  //     type: "normal",
  //     power: 40,
  //     accuracy: 100,
  //     pp: 30,
  //     description: "..."
  //   }
  // ]
  return movesDetailsResponses.map((response) => ({
    name: response.data.name.replace("-", " "),
    type: response.data.type.name,
    power: response.data.power,
    accuracy: response.data.accuracy,
    pp: response.data.pp,
    description: response.data.effect_entries.find(
      (entry) => entry.language.name === "en"
    )?.effect,
  }));
};

// Converts PokeAPI's nested evolution chain into a simple array
export const parseEvolutionChain = (chain: EvolutionChainResponse): EvolutionStage[] => {
  // Example chain input shape:
  // {
  //   chain: {
  //     species: { name: "pichu", url: "https://pokeapi.co/api/v2/pokemon-species/172/" },
  //     evolves_to: [
  //       {
  //         species: { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon-species/25/" },
  //         evolves_to: [
  //           {
  //             species: { name: "raichu", url: "https://pokeapi.co/api/v2/pokemon-species/26/" },
  //             evolves_to: []
  //           }
  //         ]
  //       }
  //     ]
  //   }
  // }

  const stages: EvolutionStage[] = [];

  // Start at the first Pokémon in the evolution chain
  let currentStage: EvolutionChainNode | undefined = chain.chain;

  while (currentStage) {
    // Example pushed item:
    // {
    //   name: "pikachu",
    //   sprite: ".../25.png"
    // }

    // species.url contains the Pokémon ID at index 6 after splitting by "/"
    // Example: "https://pokeapi.co/api/v2/pokemon-species/25/".split("/")[6] gives "25"
    stages.push({
      name: currentStage.species.name,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentStage.species.url.split("/")[6]}.png`,
    });

    // Move to the next evolution stage
    // This follows only the first evolution path
    currentStage = currentStage.evolves_to[0];
  }

  // Example output:
  // [
  //   { name: "pichu", sprite: ".../172.png" },
  //   { name: "pikachu", sprite: ".../25.png" },
  //   { name: "raichu", sprite: ".../26.png" }
  // ]
  return stages;
};
