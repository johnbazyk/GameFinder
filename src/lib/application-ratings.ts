import type { Game, WizardContext, VibeId } from "./types";
import { RATING_PILOT } from "./rating-pilot";
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
  return ctx?.ratingMode ?? APPLICATION_RATING_MODE;
}
export function ratingRecord(game: Game) {
  return RATING_PILOT.find((r) => r.legacyId === game.bggId && r.expectedTitle === game.name);
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
  const values = Object.keys(targets ?? {}).map((key) => {
    const r = gameRating(game, key as VibeId, ctx);
    const name = key === "board" ? "Spatial Play" : key[0].toUpperCase() + key.slice(1);
    return `${name} ${r.value ?? "not assessed"}/5 (${r.label.toLowerCase()})`;
  });
  const record = ratingRecord(game);
  return values.length
    ? `Meets your selected filters: ${values.join("; ")}. Assessed for ${record?.edition}, ${ctx.players} players${ctx.ageBand ? `; age context ${ctx.ageBand}` : ""}.`
    : "Matches your player, age and time selections. No vibe rating was required.";
}
