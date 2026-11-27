import { RECOMMENDATION_LIMIT, recommendationGroup } from "./recommendation-limits";
import {
  compareGameCharacteristics,
  compareSimilarity,
  SIMILARITY_CONTEXT,
} from "./game-similarity";
import {
  gameRating,
  ratingMode,
  gameMatchesRatings,
  compareRatedGames,
  ratingExplanation,
} from "./application-ratings";
import { selectedTargets, type RatingKey } from "./rating-policy";
import type {
  Game,
  MatchLabel,
  PlayLog,
  ScoredGame,
  VibeId,
  VibeWeights,
  WizardContext,
  WizardResult,
} from "./types";
import { DIMENSIONS } from "./types";
import {
  GAMES,
  searchGames,
  standaloneGames,
  isStandaloneGame,
  CATALOG_EXTERNAL_ID_CONFLICTS,
} from "./catalog";
import { explainMatch } from "./explain";
import { scoreLegacyGameWithCatalogFoundation } from "./catalog-legacy-bridge";
import { passesHardConstraints, traitScore } from "./vibes";
import {
  applicationReviewedFactsAdapter,
  type RecommendationCatalogAdapter,
} from "./reviewed-facts-integration";

export type UserSignals = {
  owned: string[];
  wishlist: string[];
  plays: PlayLog[];
  vibeWeights: VibeWeights;
};

function labelFor(game: Game, ctx: WizardContext, owned: boolean): MatchLabel {
  const vibes = ctx.vibes;
  if (ctx.exactTraits && Object.keys(ctx.exactTraits).length) {
    const dist = exactDistance(game, ctx.exactTraits);
    if (dist <= 0.15) return "excellent";
    if (dist <= 0.6) return "strong";
    if (dist <= 1.2) return "good";
    return "closest";
  }
  if (!vibes.length) {
    if (owned && ctx.players != null && game.players.best.includes(ctx.players)) return "strong";
    if (owned) return "good";
    return "good";
  }
  const scores = vibes.map((v) => traitScore(game, v));
  const allHigh = scores.every((s) => s >= 3.5);
  const allOk = scores.every((s) => s >= 3);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (allHigh) return "excellent";
  if (allOk) return "strong";
  if (avg >= 2.5) return "good";
  return "closest";
}

function exactDistance(game: Game, exact: Partial<Record<VibeId, number>>): number {
  const entries = Object.entries(exact) as [VibeId, number][];
  if (!entries.length) return 99;
  const sum = entries.reduce((acc, [v, target]) => acc + Math.abs(traitScore(game, v) - target), 0);
  return sum / entries.length;
}

export function vibePreferenceScore(game: Game, vibes: VibeId[]): number {
  if (!vibes.length) return 0;
  const scores = vibes.map((v) => traitScore(game, v));
  const hits3 = scores.filter((s) => s >= 3).length;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return hits3 * 12 + avg * 6;
}

export function recommendationScore(game: Game, ctx: WizardContext, owned = false): number {
  if (ratingMode(ctx) !== "legacy") return 0; // Descriptive ratings are not a summed ranking score.
  return scoreLegacyGameWithCatalogFoundation(game, ctx, owned);
}

function toScored(game: Game, ctx: WizardContext, owned: boolean): ScoredGame {
  if (ratingMode(ctx) !== "legacy")
    return {
      ...game,
      score: 0,
      matchLabel: gameMatchesRatings(game, ctx) ? "good" : "closest",
      owned,
      why: ratingExplanation(game, ctx),
      topDims: [],
      ratingContext: { ...ctx, ratingMode: ratingMode(ctx) },
    };
  const matchLabel = labelFor(game, ctx, owned);
  const { why, topDims } = explainMatch(game, ctx, matchLabel);
  return {
    ...game,
    score: recommendationScore(game, ctx, owned),
    matchLabel,
    owned,
    why,
    topDims,
  };
}

function uniqueStandaloneCandidates(games: readonly Game[]): Game[] {
  const counts = new Map<string, number>();
  for (const game of games) counts.set(game.bggId, (counts.get(game.bggId) ?? 0) + 1);
  return games.filter((game) => isStandaloneGame(game) && counts.get(game.bggId) === 1);
}

export function eligibleGames(
  ctx: WizardContext,
  games: readonly Game[] = standaloneGames(),
  catalogAdapter: RecommendationCatalogAdapter = applicationReviewedFactsAdapter,
): Game[] {
  return uniqueStandaloneCandidates(catalogAdapter(games, ctx)).filter(
    (game) => passesHardConstraints(game, ctx) && gameMatchesRatings(game, ctx),
  );
}

export function discoverGames(
  ctx: WizardContext,
  query = "",
  catalogAdapter: RecommendationCatalogAdapter = applicationReviewedFactsAdapter,
  games: readonly Game[] = searchGames(query),
): Game[] {
  return eligibleGames(ctx, games, catalogAdapter).sort((a, b) =>
    ratingMode(ctx) === "legacy"
      ? recommendationScore(b, ctx) - recommendationScore(a, ctx)
      : compareRatedGames(a, b, ctx),
  );
}

/** Alternatives relax only ordinary Vibe preferences, never hard limits or exact targets. */
export function discoverAlternatives(
  ctx: WizardContext,
  query = "",
  limit = RECOMMENDATION_LIMIT,
): Game[] {
  if (!ctx.vibes.length || discoverGames(ctx, query).length) return [];
  return recommendationGroup(discoverGames({ ...ctx, vibes: [] }, query), limit);
}

export function runWizard(
  ctx: WizardContext,
  user: UserSignals,
  excludeIds: string[] = [],
  catalogAdapter: RecommendationCatalogAdapter = applicationReviewedFactsAdapter,
  games: readonly Game[] = standaloneGames(),
): WizardResult {
  const ownedSet = new Set(user.owned);
  const excluded = new Set(excludeIds);
  const adapted = uniqueStandaloneCandidates(catalogAdapter(games, ctx));
  const hardEligible = adapted.filter((game) => passesHardConstraints(game, ctx));
  const targets = selectedTargets(ctx);
  const advanced = { ...ctx, vibes: [] };
  const softVibes = [...new Set(ctx.vibes)].filter(
    (vibe) => ctx.ratingTargets?.[vibe] === undefined && ctx.exactTraits?.[vibe] === undefined,
  );
  const distance = new Map<string, number>();
  const catalog = hardEligible.filter((game) => {
    if (!targets || !gameMatchesRatings(game, advanced)) return false;
    let gap = 0;
    for (const vibe of softVibes) {
      const value = gameRating(game, vibe, ctx).value;
      if (value === null && ratingMode(ctx) === "reviewed") return false;
      // Unknown preferences sort after any fully assessed alternative.
      gap += value === null ? 1 + 2 * softVibes.length : Math.max(0, 3 - value);
    }
    distance.set(game.bggId, gap);
    return true;
  });
  function compareFindGames(a: ScoredGame, b: ScoredGame) {
    return distance.get(a.bggId)! - distance.get(b.bggId)! || compareRatedGames(a, b, ctx);
  }
  const coverage = {
    owned: { hardExcluded: 0, missingRatings: 0, ratingMismatch: 0 },
    unowned: { hardExcluded: 0, missingRatings: 0, ratingMismatch: 0 },
  };
  const hardIds = new Set(hardEligible.map((game) => game.bggId));
  const eligibleIds = new Set(catalog.map((game) => game.bggId));
  const keys = Object.keys(targets ?? {}) as RatingKey[];
  for (const game of games) {
    const group = ownedSet.has(game.bggId) ? coverage.owned : coverage.unowned;
    if (!hardIds.has(game.bggId)) group.hardExcluded++;
    else if (!eligibleIds.has(game.bggId)) {
      if (
        ratingMode(ctx) !== "legacy" &&
        keys.some((key) => gameRating(game, key, ctx).value === null)
      )
        group.missingRatings++;
      else group.ratingMismatch++;
    }
  }

  const ownedEligible = catalog
    .filter((g) => ownedSet.has(g.bggId))
    .map((g) => toScored(g, ctx, true))
    .sort(compareFindGames);

  const ownedFresh = ownedEligible.filter((g) => !excluded.has(g.bggId));
  const ownedTop = recommendationGroup(ownedFresh);

  const unownedEligible = catalog
    .filter((g) => !ownedSet.has(g.bggId))
    .map((g) => toScored(g, ctx, false))
    .sort(compareFindGames);
  const unownedTop = recommendationGroup(unownedEligible.filter((g) => !excluded.has(g.bggId)));

  return {
    coverage,
    ownedTop,
    unownedTop,
    ownedList: ownedEligible,
    unownedList: unownedEligible,
    appliedFilters: ctx,
    ownedCount: ownedEligible.length,
    unownedCount: unownedEligible.length,
    exhaustedVault: ownedEligible.length > 0 && ownedFresh.length === 0,
  };
}

export function applyFeedbackDelta(weights: VibeWeights, game: Game, delta: number): VibeWeights {
  const ranked = DIMENSIONS.map((d) => ({ d, v: game.rubric[d] })).sort((a, b) => b.v - a.v);
  const next = { ...weights };
  for (const { d } of ranked.slice(0, 3)) {
    next[d] = Math.min(1.5, Math.max(0.5, next[d] + delta));
  }
  return next;
}

export function getGame(bggId: string): Game | undefined {
  return GAMES.find((g) => g.bggId === bggId);
}

export function similarGames(
  game: Game,
  limit = RECOMMENDATION_LIMIT,
  ctx: WizardContext = SIMILARITY_CONTEXT,
  games: readonly Game[] = standaloneGames(),
): Game[] {
  const conflicts = new Set(CATALOG_EXTERNAL_ID_CONFLICTS.map((entry) => entry.externalId));
  if (!isStandaloneGame(game) || conflicts.has(game.bggId)) return [];
  const candidates = uniqueStandaloneCandidates(applicationReviewedFactsAdapter(games, ctx)).filter(
    (g) => !conflicts.has(g.bggId),
  );
  const ranked = candidates
    .flatMap((g) => {
      if (g.bggId === game.bggId) return [];
      const comparison = compareGameCharacteristics(game, g, ctx);
      return comparison ? [{ g, comparison }] : [];
    })
    .sort(
      (a, b) =>
        compareSimilarity(a.comparison, b.comparison) ||
        a.g.name.localeCompare(b.g.name) ||
        a.g.bggId.localeCompare(b.g.bggId),
    );
  return recommendationGroup(ranked, limit).map((entry) => entry.g);
}

export function formatPlaytime(game: Game): string {
  if (game.playtime.min === game.playtime.max) return `${game.playtime.min} min`;
  return `${game.playtime.min}–${game.playtime.max} min`;
}

export function formatPlayers(game: Game): string {
  if (game.players.min === game.players.max) return `${game.players.min}`;
  return `${game.players.min}–${game.players.max}`;
}

export function formatAge(game: Game): string {
  return `${game.age.publisher}+`;
}

export function pickSurprise(ownedIds: string[], avoidId?: string): Game | undefined {
  const pool = [...new Set(ownedIds)]
    .map(getGame)
    .filter((g): g is Game => g != null && isStandaloneGame(g));
  if (!pool.length) return undefined;
  const alternatives = pool.filter((g) => g.bggId !== avoidId);
  const selectable = alternatives.length ? alternatives : pool;
  return selectable[Math.floor(Math.random() * selectable.length)];
}

/** Returns the highest-ranked owned game that satisfies the selected constraints. */
export function pickTonight(
  ctx: WizardContext,
  user: UserSignals,
  avoidId?: string,
): Game | undefined {
  const result = runWizard(ctx, user, avoidId ? [avoidId] : []);
  return result.ownedTop[0];
}
