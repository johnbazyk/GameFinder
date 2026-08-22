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
import { GAMES, standaloneGames } from "./catalog";
import { explainMatch } from "./explain";
import { passesHardConstraints, traitScore } from "./vibes";

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

function rankScore(game: Game, ctx: WizardContext, owned: boolean): number {
  let score = owned ? 18 : 0;
  if (ctx.players != null && ctx.players < 13 && game.players.best.includes(ctx.players)) score += 8;
  score += game.bggRating;
  if (ctx.exactTraits && Object.keys(ctx.exactTraits).length) {
    const dist = exactDistance(game, ctx.exactTraits);
    score += Math.max(0, 40 - dist * 18);
    return score;
  }
  if (ctx.vibes.length) {
    const scores = ctx.vibes.map((v) => traitScore(game, v));
    const hits3 = scores.filter((s) => s >= 3).length;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    score += hits3 * 12 + avg * 6;
  }
  return score;
}

function toScored(game: Game, ctx: WizardContext, owned: boolean): ScoredGame {
  const matchLabel = labelFor(game, ctx, owned);
  const { why, topDims } = explainMatch(game, ctx, matchLabel);
  return {
    ...game,
    score: rankScore(game, ctx, owned),
    matchLabel,
    owned,
    why,
    topDims,
  };
}

export function runWizard(
  ctx: WizardContext,
  user: UserSignals,
  excludeIds: string[] = [],
): WizardResult {
  const ownedSet = new Set(user.owned);
  const excluded = new Set(excludeIds);
  const catalog = standaloneGames().filter((g) => passesHardConstraints(g, ctx));

  const ownedEligible = catalog
    .filter((g) => ownedSet.has(g.bggId))
    .map((g) => toScored(g, ctx, true))
    .sort((a, b) => b.score - a.score);

  const ownedFresh = ownedEligible.filter((g) => !excluded.has(g.bggId));
  const ownedTop = ownedFresh.slice(0, 3);

  const unownedEligible = catalog
    .filter((g) => !ownedSet.has(g.bggId))
    .map((g) => toScored(g, ctx, false))
    .sort((a, b) => b.score - a.score);
  const unownedTop = unownedEligible.slice(0, 3);

  return {
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

export function applyFeedbackDelta(
  weights: VibeWeights,
  game: Game,
  delta: number,
): VibeWeights {
  const ranked = DIMENSIONS.map((d) => ({ d, v: game.rubric[d] })).sort(
    (a, b) => b.v - a.v,
  );
  const next = { ...weights };
  for (const { d } of ranked.slice(0, 3)) {
    next[d] = Math.min(1.5, Math.max(0.5, next[d] + delta));
  }
  return next;
}

export function getGame(bggId: string): Game | undefined {
  return GAMES.find((g) => g.bggId === bggId);
}

export function similarGames(game: Game, limit = 4): Game[] {
  return GAMES.filter((g) => g.bggId !== game.bggId)
    .map((g) => {
      let overlap = g.mechanics.filter((m) => game.mechanics.includes(m)).length;
      overlap += g.vibes.filter((v) => game.vibes.includes(v)).length;
      return { g, s: overlap + g.bggRating / 10 };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.g);
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
  const pool = ownedIds
    .map(getGame)
    .filter((g): g is Game => g != null && g.bggId !== avoidId);
  if (!pool.length) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}
