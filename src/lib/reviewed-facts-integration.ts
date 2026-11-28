import type { Game, WizardContext } from "./types";
import {
  isReviewedFactRecord,
  legacyReviewIdentityCandidates,
  resolveReviewedFact,
  type ReviewedFactRecord,
  type ReviewedField,
  type ReviewedFactValue,
  type ReviewIdentityReference,
  type ReviewScope,
} from "./reviewed-facts";
import { CATALOG_EXTERNAL_ID_CONFLICTS, GAMES } from "./catalog";

export type TrustedReviewedFactEntry = {
  fact: ReviewedFactRecord;
  targetIdentity: ReviewIdentityReference;
  targetScope: ReviewScope;
};

export type RecommendationCatalogAdapter = (
  games: readonly Game[],
  context: WizardContext,
) => readonly Game[];

function isTrustedReviewedFactEntry(value: unknown): value is TrustedReviewedFactEntry {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const entry = value as Record<string, unknown>;
  if (
    !isReviewedFactRecord(entry.fact) ||
    typeof entry.targetIdentity !== "object" ||
    entry.targetIdentity === null ||
    Array.isArray(entry.targetIdentity) ||
    typeof entry.targetScope !== "object" ||
    entry.targetScope === null ||
    Array.isArray(entry.targetScope)
  ) {
    return false;
  }
  const identity = entry.targetIdentity as Record<string, unknown>;
  const scope = entry.targetScope as Record<string, unknown>;
  return (
    identity.kind === "legacy-bgg" &&
    typeof identity.key === "string" &&
    typeof identity.expectedTitle === "string" &&
    typeof scope.product === "string" &&
    typeof scope.edition === "string" &&
    typeof scope.market === "string" &&
    entry.fact.identity.kind === identity.kind &&
    entry.fact.identity.key === identity.key &&
    entry.fact.identity.expectedTitle === identity.expectedTitle
  );
}

const APPLICATION_REVIEWED_FACTS_ENABLED = false;
const APPLICATION_REVIEWED_FACTS: readonly TrustedReviewedFactEntry[] = Object.freeze([]);

function currentValue(game: Game, field: ReviewedField): ReviewedFactValue {
  switch (field) {
    case "publisherMinimumAge":
      return game.age.publisher;
    case "players.minimum":
      return game.players.min;
    case "players.maximum":
      return game.players.max;
    case "maximumListedPlaytimeMinutes":
      return game.playtime.max;
    case "adultContent":
      return game.adultContent ?? null;
  }
}

function withFactValue(game: Game, field: ReviewedField, value: ReviewedFactValue): Game | null {
  switch (field) {
    case "publisherMinimumAge":
      return typeof value === "number" ? { ...game, age: { ...game.age, publisher: value } } : null;
    case "players.minimum":
      return typeof value === "number"
        ? { ...game, players: { ...game.players, min: value } }
        : null;
    case "players.maximum":
      return typeof value === "number"
        ? { ...game, players: { ...game.players, max: value } }
        : null;
    case "maximumListedPlaytimeMinutes":
      return typeof value === "number"
        ? { ...game, playtime: { ...game.playtime, max: value } }
        : null;
    case "adultContent":
      return typeof value === "boolean" ? { ...game, adultContent: value } : null;
  }
}

function factMatchesGame(entry: TrustedReviewedFactEntry, game: Game): boolean {
  return (
    entry.targetIdentity.kind === "legacy-bgg" &&
    entry.targetIdentity.key === game.bggId &&
    entry.targetIdentity.expectedTitle === game.name &&
    entry.fact.identity.kind === "legacy-bgg" &&
    entry.fact.identity.key === game.bggId &&
    entry.fact.identity.expectedTitle === game.name
  );
}

export function applyReviewedFactsRegistry(
  games: readonly Game[],
  entries: readonly unknown[],
): Game[] {
  const identityCandidates = legacyReviewIdentityCandidates(GAMES, CATALOG_EXTERNAL_ID_CONFLICTS);
  const originals = new Map(games.map((game) => [game.bggId, game]));
  const byGame = new Map<string, Game>();
  const validEntries = entries.filter(isTrustedReviewedFactEntry);

  for (const entry of validEntries) {
    const candidates = games.filter((game) => factMatchesGame(entry, game));
    if (candidates.length !== 1) continue;
    const candidate = candidates[0];
    const factIdentityCandidate = identityCandidates.filter(
      (identity) =>
        identity.kind === entry.targetIdentity.kind &&
        identity.key === entry.targetIdentity.key &&
        identity.expectedTitle === entry.targetIdentity.expectedTitle,
    );
    const relatedClaims = validEntries
      .filter(
        (other) =>
          other !== entry &&
          other.fact?.identity?.kind === entry.fact.identity.kind &&
          other.fact?.identity?.key === entry.fact.identity.key &&
          other.fact?.scope?.product === entry.fact.scope.product &&
          other.fact?.scope?.edition === entry.fact.scope.edition &&
          other.fact?.scope?.market === entry.fact.scope.market &&
          other.fact?.field === entry.fact.field,
      )
      .map((other) => other.fact);
    const resolution = resolveReviewedFact({
      fact: entry.fact,
      targetIdentity: entry.targetIdentity,
      targetScope: entry.targetScope,
      identityCandidates: factIdentityCandidate,
      legacyValue: currentValue(candidate, entry.fact.field),
      relatedClaims,
    });
    if (resolution.status !== "ready-for-publication") continue;
    const original = originals.get(candidate.bggId) ?? candidate;
    const base = byGame.get(candidate.bggId) ?? original;
    const merged = withFactValue(base, entry.fact.field, resolution.effectiveValue);
    if (merged) byGame.set(candidate.bggId, merged);
  }

  return games.map((game) => byGame.get(game.bggId) ?? game);
}

export const applicationReviewedFactsAdapter: RecommendationCatalogAdapter = (games) => {
  if (!APPLICATION_REVIEWED_FACTS_ENABLED || APPLICATION_REVIEWED_FACTS.length === 0) {
    return games;
  }
  return applyReviewedFactsRegistry(games, APPLICATION_REVIEWED_FACTS);
};

export function applicationReviewedFactsRegistrySize(): number {
  return APPLICATION_REVIEWED_FACTS.length;
}

export function applicationReviewedFactsEnabled(): boolean {
  return APPLICATION_REVIEWED_FACTS_ENABLED;
}
