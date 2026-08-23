export const DIMENSIONS = [
  "luck",
  "strategy",
  "skill",
  "social",
  "complexity",
  "replayability",
  "resourceMgmt",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

export const VIBE_IDS = [
  "luck",
  "strategy",
  "dexterity",
  "family",
  "party",
  "board",
] as const;

export type VibeId = (typeof VIBE_IDS)[number];

export type Rubric = Record<Dimension, number>;
export type VibeWeights = Record<Dimension, number>;
export type TargetRange = [number, number];

export type AgeBand = "under6" | "6-7" | "8-10" | "11-13" | "14-17" | "adults";

export type MatchLabel = "excellent" | "strong" | "good" | "closest";

export type Game = {
  bggId: string;
  name: string;
  yearPublished: number;
  players: { min: number; max: number; best: number[] };
  playtime: { min: number; max: number; avg: number };
  age: { publisher: number; community: number };
  rubric: Rubric;
  vibes: VibeId[];
  bggRating: number;
  mechanics: string[];
  categories: string[];
  description: string;
  designer: string;
  expansions?: { bggId: string; name: string }[];
  adultContent?: boolean;
};

export type WizardContext = {
  players: number | null;
  ageBand: AgeBand | null;
  maxTimeMin: number | null;
  timeOver60: boolean;
  vibes: VibeId[];
  exactTraits: Partial<Record<VibeId, number>> | null;
};

export type ScoredGame = Game & {
  score: number;
  matchLabel: MatchLabel;
  owned: boolean;
  why: string;
  topDims: Dimension[];
};

export type WizardResult = {
  ownedTop: ScoredGame[];
  unownedTop: ScoredGame[];
  ownedList: ScoredGame[];
  unownedList: ScoredGame[];
  appliedFilters: WizardContext;
  ownedCount: number;
  unownedCount: number;
  exhaustedVault: boolean;
};

export type PlayLog = {
  id: string;
  bggId: string;
  players: number;
  durationMin: number;
  enjoyed: boolean;
  at: number;
};

export type TablePlayer = {
  id: string;
  name: string;
  color: string;
  createdAt: number;
};

export type PlayerScore = {
  playerId: string;
  values: Record<string, number>;
  team?: string;
  place?: number;
  won?: boolean;
};

export type ScoreSession = {
  id: string;
  bggId: string;
  at: number;
  playerIds: string[];
  scores: PlayerScore[];
  shared: Record<string, number>;
  coopWon?: boolean;
  winningTeam?: string;
  draw?: boolean;
  notes?: string;
  groupId?: string;
};

export type FeedbackType = "thumbs_up" | "thumbs_down";

export const FREE_VAULT_LIMIT = 50;
export const PREMIUM_PRICE = "$3.99/month";
export const PREMIUM_YEARLY = "$29.99/year";
export const PREMIUM_LIFE = "$29 once";

export const PLAYER_COLORS = [
  "#e8642b",
  "#4a6b4d",
  "#7fa8c9",
  "#a63d57",
  "#c9a227",
  "#2a6f6f",
  "#6b4a8f",
  "#8b5a2b",
];
