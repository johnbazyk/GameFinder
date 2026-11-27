import { gameRating, ratingMode } from "./application-ratings";
import { DIMENSIONS, VIBE_IDS, type Game, type WizardContext } from "./types";
import { validRating, type RatingKey } from "./rating-policy";

/** Relative descriptive similarity, not quality, popularity or a new game rating.
 * All seven dimensions count equally. Shared luck/strategy are not counted twice.
 * Missing assessments are never zero-filled or replaced by legacy percentages.
 */
export const SIMILARITY_CONTEXT: WizardContext = {
  players: null,
  ageBand: null,
  maxTimeMin: null,
  timeOver60: false,
  vibes: [],
  exactTraits: null,
};
const VIBE_TIE_KEYS = VIBE_IDS.filter((key) => key !== "luck" && key !== "strategy");
type RatingReader = (game: Game, key: RatingKey, ctx: WizardContext) => number | null;
const read: RatingReader = (game, key, ctx) => gameRating(game, key, ctx).value;
function vector(
  game: Game,
  keys: readonly RatingKey[],
  ctx: WizardContext,
  reader: RatingReader,
): number[] | null {
  const values = keys.map((key) => reader(game, key, ctx));
  return values.every(validRating) ? (values as number[]) : null;
}
function distance(a: number[], b: number[]) {
  return a.reduce((sum, v, i) => sum + Math.abs(v - b[i]), 0) / a.length;
}
function normalizedSet(values: readonly string[]) {
  return new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean));
}
export function mechanicOverlap(a: Game, b: Game): number {
  const left = normalizedSet(a.mechanics),
    right = normalizedSet(b.mechanics);
  const union = new Set([...left, ...right]);
  return union.size ? [...left].filter((v) => right.has(v)).length / union.size : 0;
}
function playerOverlap(a: Game, b: Game): number {
  const lo = Math.max(a.players.min, b.players.min),
    hi = Math.min(a.players.max, b.players.max);
  const union = Math.max(a.players.max, b.players.max) - Math.min(a.players.min, b.players.min) + 1;
  return union > 0 ? Math.max(0, hi - lo + 1) / union : 0;
}
export type SimilarityComparison = {
  dimensions: number;
  vibes: number | null;
  mechanics: number;
  players: number;
  age: number;
  time: number;
};
export function compareGameCharacteristics(
  a: Game,
  b: Game,
  ctx: WizardContext = SIMILARITY_CONTEXT,
  reader: RatingReader = read,
): SimilarityComparison | null {
  const baseline = { ...SIMILARITY_CONTEXT, ratingMode: ratingMode(ctx) };
  const av = vector(a, DIMENSIONS, baseline, reader),
    bv = vector(b, DIMENSIONS, baseline, reader);
  if (!av || !bv) return null;
  const at = vector(a, VIBE_TIE_KEYS, baseline, reader),
    bt = vector(b, VIBE_TIE_KEYS, baseline, reader);
  return {
    dimensions: distance(av, bv),
    vibes: at && bt ? distance(at, bt) : null,
    mechanics: mechanicOverlap(a, b),
    players: playerOverlap(a, b),
    age: Math.abs(a.age.publisher - b.age.publisher),
    time: Math.abs(a.playtime.max - b.playtime.max),
  };
}
export function compareSimilarity(a: SimilarityComparison, b: SimilarityComparison): number {
  return (
    a.dimensions - b.dimensions ||
    (a.vibes ?? Infinity) - (b.vibes ?? Infinity) ||
    b.mechanics - a.mechanics ||
    b.players - a.players ||
    a.age - b.age ||
    a.time - b.time
  );
}
