import {
  catalogHardEligible,
  catalogRecommendationScore,
  type CatalogRecommendationRecord,
} from "./catalog-foundation";
import {
  assertPublishedCatalogSnapshot,
  hasVerifiedFact,
  toCatalogVibeScores,
  type PublishedArtworkDecision,
  type PublishedCatalogRecord,
  type PublishedCatalogSnapshot,
  type PublishedLegacyAlias,
} from "./catalog-published-view";
import { AGE_BANDS, VIBE_META } from "./vibes";
import { MAX_PLAYER_COUNT } from "./types";
import type { VibeId, WizardContext } from "./types";

export type CatalogViewArtwork =
  | {
      status: "selected";
      authenticity: Extract<PublishedArtworkDecision, { status: "selected" }>["authenticity"];
      reference: string;
      attribution: { required: boolean; text: string | null };
    }
  | {
      status: "fallback";
      placeholder: "original-gamefinder-placeholder";
      reason: Extract<PublishedArtworkDecision, { status: "fallback" }>["reason"];
      authenticity: "not-an-authentic-game-cover";
    };

export type CatalogViewEntry = {
  gamefinderId: string;
  title: string;
  edition: string | null;
  relationship: PublishedCatalogRecord["relationships"];
  players: { minimum: number | null; maximum: number | null };
  publisherMinimumAge: number | null;
  maximumListedPlaytimeMinutes: number | null;
  adultContent: boolean | null;
  vibeScores: Record<VibeId, number | null>;
  ownership: "owned" | "unowned";
  score: number | null;
  matchExplanation: string[];
  artwork: CatalogViewArtwork;
  legacyCompatibility:
    | { status: "verified-alias"; namespace: PublishedLegacyAlias["namespace"]; key: string }
    | { status: "no-verified-alias" };
  eligible: boolean;
  rejectionReasons: string[];
};

export type CatalogFindResult = {
  entries: CatalogViewEntry[];
  rejectedEntries: CatalogViewEntry[];
  ownedTop: CatalogViewEntry[];
  unownedTop: CatalogViewEntry[];
  excludedGamefinderIds: string[];
  exhaustedOwned: boolean;
  exhaustedUnowned: boolean;
};

export type CatalogDiscoverResult = {
  query: string;
  entries: CatalogViewEntry[];
  rejectedEntries: CatalogViewEntry[];
  eligibleCount: number;
};

export type LegacyCatalogResolution =
  | {
      status: "resolved";
      namespace: PublishedLegacyAlias["namespace"];
      legacyKey: string;
      gamefinderId: string;
    }
  | {
      status: "ambiguous" | "unverified" | "orphaned";
      namespace: PublishedLegacyAlias["namespace"];
      legacyKey: string;
      candidateGamefinderIds: string[];
    };

export type ReadOnlyCatalogViewAdapter = {
  find(
    context: WizardContext,
    ownedGamefinderIds?: readonly string[],
    excludedGamefinderIds?: readonly string[],
  ): CatalogFindResult;
  discover(
    context: WizardContext,
    query?: string,
    ownedGamefinderIds?: readonly string[],
  ): CatalogDiscoverResult;
  resolveLegacyReference(
    key: string,
    namespace?: PublishedLegacyAlias["namespace"],
  ): LegacyCatalogResolution;
  customGame: {
    id: string;
    ownerScope: "owner-only";
    resolvedAsGlobalGame: false;
  };
};

function requestedVibes(context: WizardContext): VibeId[] {
  return [
    ...new Set([
      ...context.vibes,
      ...Object.keys(context.exactTraits ?? {}).filter(
        (vibe): vibe is VibeId => VIBE_META[vibe as VibeId] !== undefined,
      ),
    ]),
  ];
}

function compareEntries(left: CatalogViewEntry, right: CatalogViewEntry): number {
  return (
    (right.score ?? 0) - (left.score ?? 0) ||
    left.title.localeCompare(right.title) ||
    left.gamefinderId.localeCompare(right.gamefinderId)
  );
}

function resolveAlias(
  aliases: readonly PublishedLegacyAlias[],
  key: string,
  namespace?: PublishedLegacyAlias["namespace"],
): LegacyCatalogResolution {
  const proposals = aliases.filter(
    (alias) => alias.key === key && (namespace === undefined || alias.namespace === namespace),
  );
  const resolvedNamespace = namespace ?? proposals[0]?.namespace ?? "legacy-internal";
  if (
    namespace === undefined &&
    new Set(proposals.map((proposal) => proposal.namespace)).size > 1
  ) {
    return {
      status: "ambiguous",
      namespace: resolvedNamespace,
      legacyKey: key,
      candidateGamefinderIds: [
        ...new Set(
          proposals.flatMap((alias) => (alias.gamefinderId === null ? [] : [alias.gamefinderId])),
        ),
      ].sort(),
    };
  }
  const candidateGamefinderIds = [
    ...new Set(
      proposals.flatMap((alias) => (alias.gamefinderId === null ? [] : [alias.gamefinderId])),
    ),
  ].sort();
  if (candidateGamefinderIds.length > 1) {
    return {
      status: "ambiguous",
      namespace: resolvedNamespace,
      legacyKey: key,
      candidateGamefinderIds,
    };
  }
  if (proposals.length === 0 || proposals.every((proposal) => proposal.status === "orphaned")) {
    return {
      status: "orphaned",
      namespace: resolvedNamespace,
      legacyKey: key,
      candidateGamefinderIds: [],
    };
  }
  if (
    proposals.some((proposal) => proposal.status !== "verified" || proposal.gamefinderId === null)
  ) {
    return {
      status: "unverified",
      namespace: resolvedNamespace,
      legacyKey: key,
      candidateGamefinderIds,
    };
  }
  return {
    status: "resolved",
    namespace: proposals[0].namespace,
    legacyKey: key,
    gamefinderId: candidateGamefinderIds[0],
  };
}

function catalogRecord(record: PublishedCatalogRecord): CatalogRecommendationRecord {
  const players = hasVerifiedFact(record.facts.players) ? record.facts.players.value : null;
  const age = hasVerifiedFact(record.facts.publisherMinimumAge)
    ? record.facts.publisherMinimumAge.value
    : null;
  const playtime = hasVerifiedFact(record.facts.maximumListedPlaytimeMinutes)
    ? record.facts.maximumListedPlaytimeMinutes.value
    : null;
  const adultContent = hasVerifiedFact(record.facts.adultContent)
    ? record.facts.adultContent.value
    : null;
  return {
    id: record.gamefinderId,
    title: record.displayMetadata.title,
    edition: record.displayMetadata.edition,
    relationships: record.relationships,
    players: {
      minimum: players?.minimum ?? null,
      maximum: players?.maximum ?? null,
      best: players?.best ?? [],
    },
    publisherMinimumAge: age,
    maximumListedPlaytimeMinutes: playtime,
    adultContent,
    bggRating: null,
    vibeScores: toCatalogVibeScores(record.vibeScores),
  };
}

function entryFor(
  record: PublishedCatalogRecord,
  context: WizardContext,
  owned: ReadonlySet<string>,
  aliases: readonly PublishedLegacyAlias[],
): CatalogViewEntry {
  const reasons = new Set<string>();
  const isOwned = owned.has(record.gamefinderId);
  const vibes = requestedVibes(context);
  if (!hasVerifiedFact(record.facts.players)) reasons.add("unverified-players");
  if (!hasVerifiedFact(record.facts.publisherMinimumAge)) {
    reasons.add("unverified-publisherMinimumAge");
  }
  if (!hasVerifiedFact(record.facts.maximumListedPlaytimeMinutes)) {
    reasons.add("unverified-maximumListedPlaytimeMinutes");
  }
  if (context.ageBand !== "adults" && !hasVerifiedFact(record.facts.adultContent)) {
    reasons.add("adult-content-unknown-or-present");
  }
  if (
    vibes.some(
      (vibe) =>
        typeof record.vibeScores[vibe] !== "number" || !Number.isFinite(record.vibeScores[vibe]),
    )
  ) {
    reasons.add("requested-vibe-score-missing");
  }
  if (record.relationships.some((relationship) => relationship.relation === "expansion")) {
    reasons.add("expansion-not-standalone");
  }

  const game = catalogRecord(record);
  if (!catalogHardEligible(game, context)) {
    if (
      context.players !== null &&
      (game.players.minimum === null ||
        game.players.maximum === null ||
        (context.players >= MAX_PLAYER_COUNT
          ? game.players.maximum < MAX_PLAYER_COUNT || game.players.minimum > MAX_PLAYER_COUNT
          : context.players < game.players.minimum || context.players > game.players.maximum))
    ) {
      reasons.add("player-count");
    }
    const ageBand = AGE_BANDS.find((band) => band.id === context.ageBand);
    if (
      context.ageBand &&
      context.ageBand !== "adults" &&
      (game.publisherMinimumAge === null || game.publisherMinimumAge > (ageBand?.youngestAge ?? -1))
    ) {
      reasons.add("publisher-minimum-age");
    }
    if (
      context.timeOver60 &&
      (game.maximumListedPlaytimeMinutes === null || game.maximumListedPlaytimeMinutes <= 60)
    ) {
      reasons.add("maximum-listed-playtime");
    } else if (
      !context.timeOver60 &&
      context.maxTimeMin !== null &&
      (game.maximumListedPlaytimeMinutes === null ||
        game.maximumListedPlaytimeMinutes > context.maxTimeMin)
    ) {
      reasons.add("maximum-listed-playtime");
    }
    if (context.ageBand && context.ageBand !== "adults" && game.adultContent !== false) {
      reasons.add("adult-content");
    }
    if (reasons.size === 0) reasons.add("catalog-hard-filter");
  }
  const eligible = reasons.size === 0;
  const score = eligible ? catalogRecommendationScore(game, context, isOwned) : null;
  const matchExplanation = eligible
    ? [
        `Fits ${game.players.minimum}–${game.players.maximum} players.`,
        `Publisher minimum age ${game.publisherMinimumAge}+; maximum listed time ${game.maximumListedPlaytimeMinutes} minutes.`,
        ...vibes.map(
          (vibe) => `${VIBE_META[vibe].label}: ${record.vibeScores[vibe]?.toFixed(1)}/5`,
        ),
        `GameFinder catalog score; ${isOwned ? "owned" : "unowned"} status.`,
      ]
    : [...reasons].sort().map((reason) => `Not recommended: ${reason}.`);
  const aliasesForRecord = aliases.filter(
    (alias) =>
      alias.gamefinderId === record.gamefinderId &&
      alias.status === "verified" &&
      resolveAlias(aliases, alias.key, alias.namespace).status === "resolved",
  );
  const verifiedAliasKeys = [
    ...new Set(aliasesForRecord.map((alias) => `${alias.namespace}\0${alias.key}`)),
  ];
  const uniqueAlias = verifiedAliasKeys[0]?.split("\0");
  const artwork: CatalogViewArtwork =
    record.artwork.status === "selected"
      ? {
          status: "selected",
          authenticity: record.artwork.authenticity,
          reference: record.artwork.reference,
          attribution: { ...record.artwork.attribution },
        }
      : { ...record.artwork };
  return {
    gamefinderId: record.gamefinderId,
    title: record.displayMetadata.title,
    edition: record.displayMetadata.edition,
    relationship: record.relationships.map((relationship) => ({ ...relationship })),
    players: { minimum: game.players.minimum, maximum: game.players.maximum },
    publisherMinimumAge: game.publisherMinimumAge,
    maximumListedPlaytimeMinutes: game.maximumListedPlaytimeMinutes,
    adultContent: game.adultContent,
    vibeScores: { ...record.vibeScores },
    ownership: isOwned ? "owned" : "unowned",
    score,
    matchExplanation,
    artwork,
    legacyCompatibility:
      uniqueAlias && verifiedAliasKeys.length === 1
        ? {
            status: "verified-alias",
            namespace: uniqueAlias[0] as PublishedLegacyAlias["namespace"],
            key: uniqueAlias[1],
          }
        : { status: "no-verified-alias" },
    eligible,
    rejectionReasons: [...reasons].sort(),
  };
}

export function createReadOnlyCatalogViewAdapter(
  source: PublishedCatalogSnapshot,
  now = "2026-01-15T12:00:00.000Z",
): ReadOnlyCatalogViewAdapter {
  if (!Number.isFinite(Date.parse(now))) {
    throw new Error("A valid fixed timestamp is required for catalog artwork evaluation.");
  }
  assertPublishedCatalogSnapshot(source, now);
  const snapshot = structuredClone(source);
  const recordById = new Map(snapshot.records.map((record) => [record.gamefinderId, record]));

  function entriesFor(context: WizardContext, ownedIds: readonly string[]): CatalogViewEntry[] {
    const owned = new Set(ownedIds);
    return snapshot.records
      .map((record) => entryFor(record, context, owned, snapshot.legacyAliases))
      .sort(compareEntries);
  }

  return Object.freeze({
    find(context, ownedGamefinderIds = [], excludedGamefinderIds = []) {
      const excluded = new Set(excludedGamefinderIds);
      const allEntries = entriesFor(context, ownedGamefinderIds);
      const eligible = allEntries.filter((entry) => entry.eligible);
      const fresh = eligible.filter((entry) => !excluded.has(entry.gamefinderId));
      const ownedEligible = eligible.filter((entry) => entry.ownership === "owned");
      const unownedEligible = eligible.filter((entry) => entry.ownership === "unowned");
      return {
        entries: allEntries,
        rejectedEntries: allEntries.filter((entry) => !entry.eligible),
        ownedTop: fresh.filter((entry) => entry.ownership === "owned").slice(0, 3),
        unownedTop: fresh.filter((entry) => entry.ownership === "unowned").slice(0, 3),
        excludedGamefinderIds: [...excluded].sort(),
        exhaustedOwned:
          ownedEligible.length > 0 && !fresh.some((entry) => entry.ownership === "owned"),
        exhaustedUnowned:
          unownedEligible.length > 0 && !fresh.some((entry) => entry.ownership === "unowned"),
      };
    },
    discover(context, query = "", ownedGamefinderIds = []) {
      const normalizedQuery = query.trim().toLocaleLowerCase();
      const allEntries = entriesFor(context, ownedGamefinderIds);
      const matching = normalizedQuery
        ? allEntries.filter((entry) => {
            const record = recordById.get(entry.gamefinderId);
            return (
              entry.title.toLocaleLowerCase().includes(normalizedQuery) ||
              record?.displayMetadata.alternateTitles.some((title) =>
                title.toLocaleLowerCase().includes(normalizedQuery),
              ) === true
            );
          })
        : allEntries;
      const entries = matching.filter((entry) => entry.eligible);
      return {
        query,
        entries,
        rejectedEntries: matching.filter((entry) => !entry.eligible),
        eligibleCount: entries.length,
      };
    },
    resolveLegacyReference(key, namespace) {
      return resolveAlias(snapshot.legacyAliases, key, namespace);
    },
    customGame: Object.freeze({
      id: snapshot.customGame.id,
      ownerScope: "owner-only" as const,
      resolvedAsGlobalGame: false as const,
    }),
  });
}
