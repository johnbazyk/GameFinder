import type {
  AgeBand,
  Game,
  VibeId,
  VibeWeights,
  WizardContext,
} from "./types";

export const VIBE_META: Record<
  VibeId,
  {
    label: string;
    tagline: string;
    icon: "dices" | "brain" | "hand" | "home" | "party" | "layout";
  }
> = {
  luck: { label: "Luck", tagline: "Dice, draws, surprises", icon: "dices" },
  strategy: { label: "Strategy", tagline: "Plans and timing", icon: "brain" },
  dexterity: { label: "Dexterity", tagline: "Hands, reflexes, stacking", icon: "hand" },
  family: { label: "Family", tagline: "Works across ages", icon: "home" },
  party: { label: "Party", tagline: "Loud, social, groups", icon: "party" },
  board: { label: "Board-Based", tagline: "A board, map, or tiles", icon: "layout" },
};

export const AGE_BANDS: { id: AgeBand; label: string; maxAge: number }[] = [
  { id: "under6", label: "Under 6", maxAge: 5 },
  { id: "6-7", label: "6–7", maxAge: 7 },
  { id: "8-10", label: "8–10", maxAge: 10 },
  { id: "11-13", label: "11–13", maxAge: 13 },
  { id: "14-17", label: "14–17", maxAge: 17 },
  { id: "adults", label: "Adults Only", maxAge: 99 },
];

const ALL_ONES: VibeWeights = {
  luck: 1,
  strategy: 1,
  skill: 1,
  social: 1,
  complexity: 1,
  replayability: 1,
  resourceMgmt: 1,
};

export const DEFAULT_USER_WEIGHTS: VibeWeights = { ...ALL_ONES };

const ADULT_IDS = new Set([
  "188834", // Secret Hitler
  "286096", // Tainted Grail
  "37111", // Battlestar Galactica
  "156129", // Deception: Murder in Hong Kong
]);

export function hasAdultContent(game: Game): boolean {
  return Boolean(game.adultContent) || ADULT_IDS.has(game.bggId) || game.age.publisher >= 17;
}

function clamp5(n: number): number {
  return Math.max(0, Math.min(5, Math.round(n * 10) / 10));
}

function hay(game: Game): string {
  return `${game.name} ${game.mechanics.join(" ")} ${game.categories.join(" ")}`;
}

export function traitScore(game: Game, vibe: VibeId): number {
  switch (vibe) {
    case "luck":
      return clamp5(game.rubric.luck / 20);
    case "strategy":
      return clamp5(game.rubric.strategy / 20);
    case "dexterity": {
      const physical = /dexterity|stack|flick|real.?time|physical|balancing|action \/ dexterity|coordination/i.test(
        hay(game),
      );
      if (physical) return clamp5(Math.max(3.6, game.rubric.skill / 18));
      return clamp5(game.rubric.skill / 40);
    }
    case "family": {
      let s = (100 - game.rubric.complexity) / 22;
      if (game.age.publisher <= 10) s += 0.8;
      if (game.rubric.social >= 45) s += 0.5;
      if (game.playtime.avg > 90) s -= 0.8;
      return clamp5(s);
    }
    case "party":
      return clamp5(game.rubric.social / 20);
    case "board": {
      const boardish =
        /tile placement|grid|route|area majority|modular board|network|territory|map addition|worker placement/i.test(
          hay(game),
        );
      const cardParty = /party game|word game|bluffing/i.test(hay(game)) && !boardish;
      if (boardish) return clamp5(4.3);
      if (cardParty) return clamp5(1.4);
      return clamp5(2.6);
    }
  }
}

export function autoVibeTags(game: Game): VibeId[] {
  return (["luck", "strategy", "dexterity", "family", "party", "board"] as VibeId[]).filter(
    (v) => traitScore(game, v) >= 3,
  );
}

export function listedPlaytime(game: Game): number {
  return game.playtime.avg;
}

export function passesHardConstraints(game: Game, ctx: WizardContext): boolean {
  if (ctx.players != null) {
    if (ctx.players >= 13) {
      if (game.players.max < 13 || game.players.min > 13) return false;
    } else if (game.players.min > ctx.players || game.players.max < ctx.players) {
      return false;
    }
  }
  if (ctx.ageBand) {
    const band = AGE_BANDS.find((b) => b.id === ctx.ageBand);
    const listedAge = game.age.publisher || game.age.community;
    if (band && listedAge > band.maxAge) return false;
    if (ctx.ageBand !== "adults" && hasAdultContent(game)) return false;
  }
  if (ctx.timeOver60) {
    if (listedPlaytime(game) <= 60) return false;
  } else if (ctx.maxTimeMin != null) {
    if (listedPlaytime(game) > ctx.maxTimeMin) return false;
  }
  return true;
}
