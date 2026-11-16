import type { Game, WizardContext } from "./types";
import { DESIGN_CATALOG } from "./ratings/design-catalog";
import {
  APPLICATION_RATING_MODE,
  matchesRatings,
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
  const targets = selectedTargets(ctx);
  const names = Object.keys(targets ?? {}).map((key) =>
    key === "board" ? "Spatial Play" : key[0].toUpperCase() + key.slice(1),
  );
  return names.length
    ? `Fits your player, age and time selections, plus your ${names.join(" and ")} preferences.`
    : "Fits your player, age and time selections.";
}
