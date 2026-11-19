import type { Game, ScoredGame, VibeId, WizardContext } from "./types";
import { DESIGN_CATALOG } from "./ratings/design-catalog";
import {
  APPLICATION_RATING_MODE,
  matchesRatings,
  matchesTarget,
  resolveRating,
  seededOrder,
  selectedTargets,
  type RatingKey,
  type RatingMode,
  type RatingContext,
} from "./rating-policy";
export function ratingMode(ctx?: WizardContext): RatingMode {
  // Old saved searches must not silently restore legacy formula ratings.
  return ctx?.ratingMode === "reviewed" ? "reviewed" : APPLICATION_RATING_MODE;
}
export function ratingRecord(game: Game) {
  return DESIGN_CATALOG.find((r) => r.legacyId === game.bggId && r.expectedTitle === game.name);
}
export function ratingScope(game: Game, ctx: WizardContext): RatingContext {
  const record = ratingRecord(game);
  return {
    players: ctx.players,
    ageBand: ctx.ageBand,
    edition: ctx.ratingEdition ?? record?.edition ?? "",
    mode: ctx.ratingPlayMode ?? "Standard",
  };
}
export function gameRating(game: Game, key: RatingKey, ctx: WizardContext) {
  return resolveRating(ratingRecord(game), key, ratingScope(game, ctx), ratingMode(ctx));
}
export function gameMatchesRatings(game: Game, ctx: WizardContext) {
  return (
    ratingMode(ctx) === "legacy" ||
    matchesRatings(ratingRecord(game), ctx, ratingScope(game, ctx), ratingMode(ctx))
  );
}
export function compareRatedGames(a: Game, b: Game, ctx: WizardContext) {
  // Best-count provenance is not reviewed; use seeded variety until it is.
  const seed = ctx.ratingSeed ?? "rating-beta-session";
  return seededOrder(a.bggId, seed) - seededOrder(b.bggId, seed) || a.bggId.localeCompare(b.bggId);
}
export function ratingExplanation(game: Game, ctx: WizardContext): string {
  const record = ratingRecord(game);
  const targets = selectedTargets(ctx);
  if (!record?.matchReasons || !targets) return "";
  const scope = ratingScope(game, ctx);
  const mode = ratingMode(ctx);
  let firstAvailable = "";
  let selectedMechanic = "";
  for (const [key, reason] of Object.entries(record.matchReasons)) {
    const vibe = key as VibeId;
    const rating = resolveRating(record, vibe, scope, mode);
    if (rating.value === null || !reason) continue;
    firstAvailable ||= reason;
    const target = targets[vibe];
    if (!target) continue;
    if (matchesTarget(rating.value, target)) return reason;
    // Even on a closest match, describe the actual mechanic without claiming a full fit.
    selectedMechanic ||= reason;
  }
  return selectedMechanic || firstAvailable;
}

// Saved Find results can contain older copy. Resolve it from the original search on display.
export function displayedMatchReason(game: ScoredGame): string {
  return game.ratingContext ? ratingExplanation(game, game.ratingContext) : game.why;
}
