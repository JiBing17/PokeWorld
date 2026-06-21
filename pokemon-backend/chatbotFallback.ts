const QUICK_PROMPT_REPLIES: Record<string, string> = {
  'what is pokeworld':
    "I'm Bob, your PokéWorld guide! This is an unofficial Pokémon fan site where you can browse every Pokémon by generation, save favorites to your account, explore Pokémon movies, check TCG card market prices, and browse expansion sets. Use the red header icons to jump around — I'm always here in the chat if you get lost!",
  'how do favorites work':
    "Tap the heart on any Pokémon card on Home or a detail page to save it — you'll need to log in first (account icon in the header; username/password or Google both work). Your favorites live on the Favorites page (heart icon), where you can sort them and remove any you don't want.",
  'what can i do on tcg market':
    'Head to TCG Market via the trading icon in the header (/trading). Search cards by name, filter by set or type, and click any card for rarity, set info, and TCGplayer prices. Pro tip: pick a specific set first, then hit "Top Valued" to see the priciest cards in that expansion!',
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getQuickPromptReply(message: string): string | null {
  return QUICK_PROMPT_REPLIES[normalize(message)] ?? null;
}
