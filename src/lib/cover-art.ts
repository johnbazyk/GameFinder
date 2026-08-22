import type { Game } from "./types";

export const COVER_FILES = [
  "dice",
  "trains",
  "birds",
  "tiles",
  "cards",
  "farm",
  "coop",
  "stack",
  "ocean",
  "fox",
  "spy",
  "candy",
  "race",
  "dragon",
] as const;

export type CoverKey = (typeof COVER_FILES)[number];

const BY_ID: Record<string, CoverKey> = {
  "412804": "dice",
  "9209": "trains",
  "266192": "birds",
  "230802": "tiles",
  "822": "tiles",
  "13": "farm",
  "178900": "spy",
  "30549": "coop",
  "148228": "cards",
  "50": "stack",
  "2655": "candy",
  "196526": "race",
  "410201": "dragon",
};

const RULES: { key: CoverKey; test: (hay: string) => boolean }[] = [
  { key: "trains", test: (h) => /ticket to ride|train/.test(h) },
  { key: "birds", test: (h) => /wingspan|bird|avian/.test(h) },
  { key: "dragon", test: (h) => /wyrm|dragon|dune|spirit island|root |rising sun/.test(h) },
  { key: "race", test: (h) => /heat|race|formula|kart/.test(h) },
  { key: "ocean", test: (h) => /sea salt|ocean|island|atlantis|crew|forbidden|survive/.test(h) },
  { key: "spy", test: (h) => /codenames|resistance|secret hitler|coup|deception|spy/.test(h) },
  { key: "stack", test: (h) => /jenga|rhino|ice cool|pitchcar|crokinole|dexterity|block/.test(h) },
  { key: "candy", test: (h) => /candy|life|sorry|trouble|outfox|children/.test(h) },
  { key: "dice", test: (h) => /dice|yahtzee|can't stop|quacks|king of tokyo|bank|left right/.test(h) },
  { key: "tiles", test: (h) => /azul|carcassonne|qwirkle|blokus|kingdomino|patchwork|sagrada|mosaic|tile/.test(h) },
  { key: "farm", test: (h) => /catan|agricola|everdell|ark nova|cascadia|harmonies|farm|animal/.test(h) },
  { key: "coop", test: (h) => /pandemic|forbidden|sky team|the crew|gloomhaven|spirit|coop/.test(h) },
  { key: "cards", test: (h) => /uno|skip-bo|phase 10|exploding|love letter|hanabi|scout|card game/.test(h) },
];

export function coverKeyFor(game: Pick<Game, "bggId" | "name" | "categories" | "mechanics" | "vibes">): CoverKey {
  const hit = BY_ID[game.bggId];
  if (hit) return hit;
  const hay = `${game.name} ${game.categories.join(" ")} ${game.mechanics.join(" ")} ${game.vibes.join(" ")}`.toLowerCase();
  for (const rule of RULES) {
    if (rule.test(hay)) return rule.key;
  }
  if (game.vibes.includes("party")) return "cards";
  if (game.vibes.includes("dexterity")) return "stack";
  if (game.vibes.includes("family")) return "fox";
  if (game.vibes.includes("board")) return "farm";
  if (game.vibes.includes("luck")) return "dice";
  return "fox";
}

export function coverSrc(game: Pick<Game, "bggId" | "name" | "categories" | "mechanics" | "vibes">) {
  return `/covers/${coverKeyFor(game)}.jpg`;
}
