import {
  catalogHardEligible,
  catalogRecommendationScore,
  type CatalogGameRecord,
} from "./catalog-foundation";
import { validateStagedCandidate } from "./catalog-ingestion";
import { selectApprovedArtwork } from "./catalog-artwork";
import { AGE_BANDS, VIBE_META } from "./vibes";
import { MAX_PLAYER_COUNT } from "./types";
import type { VibeId, WizardContext } from "./types";
import type { SyntheticCatalogPublicationSnapshot } from "./catalog-recommendation-prototype";

type SnapshotRecord = SyntheticCatalogPublicationSnapshot["records"][number];
type LegacyAlias = SyntheticCatalogPublicationSnapshot["legacyAliases"][number];

export type CatalogViewEntry = {
  gamefinderId: string;
  title: string;
  edition: string | null;
  relationship: CatalogGameRecord["relationships"];
  players: { minimum: number | null; maximum: number | null };
  publisherMinimumAge: number | null;
  maximumListedPlaytimeMinutes: number | null;
  adultContent: boolean | null;
  vibeScores: Partial<Record<VibeId, number>>;
  ownership: "owned" | "unowned";
  score: number | null;
  matchExplanation: string[];
  artwork:
    | {
        status: "selected";
        authenticity: "synthetic-test-artwork-not-commercial";
        reference: string;
        cachingPermitted: boolean;
        transformationPermitted: boolean;
      }
    | {
        status: "fallback";
        placeholder: "original-gamefinder-placeholder";
        reason: string;
      };
  legacyCompatibility:
    | { status: "verified-alias"; namespace: "synthetic-legacy"; key: string }
    | { status: "no-verified-alias"; namespace: "synthetic-legacy" };
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
      namespace: "synthetic-legacy";
      legacyKey: string;
      gamefinderId: string;
    }
  | {
      status: "ambiguous" | "unverified" | "orphaned";
      namespace: "synthetic-legacy";
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
  resolveLegacyReference(key: string): LegacyCatalogResolution;
  customGame: {
    id: string;
    ownerScope: "synthetic-owner-only";
    resolvedAsGlobalGame: false;
  };
};

const GAMEFINDER_ID = /^gf:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUIRED_FACTS = [
  "title",
  "playersMinimum",
  "playersMaximum",
  "publisherMinimumAge",
  "publishedPlaytime",
] as const;
const REVIEWER = "synthetic-human-reviewer";
const OWNER = "synthetic-catalog-owner";

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertSnapshot(source: unknown): asserts source is SyntheticCatalogPublicationSnapshot {
  if (
    !isObject(source) ||
    source.boundary !== "synthetic-fixture-publication-v1" ||
    source.simulationOnly !== true ||
    !Array.isArray(source.identityIds) ||
    !Array.isArray(source.records) ||
    !Array.isArray(source.legacyAliases) ||
    !isObject(source.customGame) ||
    typeof source.customGame.id !== "string" ||
    source.customGame.ownerScope !== "synthetic-owner-only"
  ) {
    throw new Error("Catalog adapter requires the synthetic validated-publication boundary.");
  }

  const rows = source.records as unknown[];
  for (const value of rows) {
    if (!isObject(value) || !isObject(value.record) || !isObject(value.candidate)) {
      throw new Error("Synthetic publication snapshot contains a malformed record.");
    }
    const row = value as unknown as SnapshotRecord;
    const candidate = row.candidate;
    const identity = candidate.identityReview;
    if (
      candidate.provider !== "synthetic" ||
      !candidate.providerRecordReference.startsWith("synthetic-fixture://") ||
      identity.status !== "verified" ||
      !identity.gamefinderId ||
      !GAMEFINDER_ID.test(identity.gamefinderId) ||
      row.record.id !== identity.gamefinderId ||
      row.record.externalIds.length !== 0 ||
      row.record.bggRating !== null ||
      row.record.origin !== "mock" ||
      row.record.sources.some(
        (fact) => fact.provider !== "synthetic" || fact.sourceClass !== "mock",
      ) ||
      candidate.metadataRights.licenseReference?.startsWith("synthetic-fixture-") !== true ||
      candidate.review.humanReview.reviewerId !== REVIEWER ||
      candidate.review.ownerApproval.reviewerId !== OWNER
    ) {
      throw new Error("Synthetic publication record failed its identity or provenance checks.");
    }
    for (const factName of REQUIRED_FACTS) {
      const fact = candidate.facts[factName];
      if (
        fact.reviewed.status !== "verified" ||
        fact.reviewed.value === null ||
        fact.reviewed.reviewerId !== REVIEWER ||
        fact.reviewed.approverId !== OWNER ||
        !fact.reviewed.evidence.some(
          (evidence) =>
            evidence.provider === "synthetic" &&
            evidence.fieldName === factName &&
            evidence.reference?.startsWith("synthetic-fixture:") === true,
        )
      ) {
        throw new Error(`Synthetic publication fact is not verified: ${factName}.`);
      }
    }
    if (
      row.adultContentReview.status !== "verified" ||
      row.adultContentReview.simulation !== "test-data-only" ||
      typeof row.adultContentReview.value !== "boolean" ||
      row.adultContentReview.reviewerId !== REVIEWER ||
      row.adultContentReview.approverId !== OWNER ||
      row.record.adultContent !== row.adultContentReview.value ||
      row.artworkScope.edition.status !== "known" ||
      row.artworkScope.printing.status !== "known" ||
      row.artworkScope.language.status !== "known" ||
      row.artworkScope.market.status !== "known" ||
      !Array.isArray(row.artwork)
    ) {
      throw new Error("Synthetic publication record has incomplete review or edition scope.");
    }
    const validation = validateStagedCandidate(
      candidate,
      rows.map((item) => {
        if (!isObject(item) || !isObject(item.candidate)) {
          throw new Error("Synthetic publication snapshot contains a malformed candidate.");
        }
        return (item as unknown as SnapshotRecord).candidate;
      }),
    );
    if (validation.status !== "metadata-validated") {
      throw new Error(
        `Synthetic publication candidate is not valid: ${validation.reasons.join(", ")}.`,
      );
    }
    if (
      Object.values(row.record.vibeScores).some(
        (score) => typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 5,
      )
    ) {
      throw new Error("Synthetic publication contains an invalid GameFinder Vibe score.");
    }
  }
}

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

function resolveAlias(aliases: readonly LegacyAlias[], key: string): LegacyCatalogResolution {
  const proposals = aliases.filter((alias) => alias.key === key);
  const candidateGamefinderIds = [...new Set(proposals.map((alias) => alias.gamefinderId))].sort();
  if (candidateGamefinderIds.length > 1) {
    return {
      status: "ambiguous",
      namespace: "synthetic-legacy",
      legacyKey: key,
      candidateGamefinderIds,
    };
  }
  if (proposals.length === 0) {
    return {
      status: "orphaned",
      namespace: "synthetic-legacy",
      legacyKey: key,
      candidateGamefinderIds: [],
    };
  }
  if (proposals.some((proposal) => proposal.status !== "verified")) {
    return {
      status: "unverified",
      namespace: "synthetic-legacy",
      legacyKey: key,
      candidateGamefinderIds,
    };
  }
  return {
    status: "resolved",
    namespace: "synthetic-legacy",
    legacyKey: key,
    gamefinderId: candidateGamefinderIds[0],
  };
}

function validateLegacyAliases(
  aliases: readonly LegacyAlias[],
  identityIds: ReadonlySet<string>,
  publishedIds: ReadonlySet<string>,
) {
  if (
    aliases.some(
      (alias) =>
        !alias.key.trim() ||
        !GAMEFINDER_ID.test(alias.gamefinderId) ||
        !identityIds.has(alias.gamefinderId) ||
        (alias.status === "verified" && !publishedIds.has(alias.gamefinderId)) ||
        !["verified", "disputed", "unverified"].includes(alias.status),
    )
  ) {
    throw new Error("Synthetic legacy aliases must reference published fixture identities.");
  }
}

function artworkView(row: SnapshotRecord, now: string): CatalogViewEntry["artwork"] {
  const selection = selectApprovedArtwork(
    { stagingId: row.candidate.stagingId, gamefinderId: row.record.id },
    row.artworkScope,
    row.artwork,
    now,
  );
  return selection.status === "selected"
    ? {
        status: "selected",
        authenticity: "synthetic-test-artwork-not-commercial",
        reference: selection.artwork.source.originalImageReference ?? "",
        cachingPermitted: selection.cachingPermitted,
        transformationPermitted: selection.transformationPermitted,
      }
    : {
        status: "fallback",
        placeholder: "original-gamefinder-placeholder",
        reason: selection.status,
      };
}

function toEntry(
  row: SnapshotRecord,
  context: WizardContext,
  owned: ReadonlySet<string>,
  now: string,
  aliases: readonly LegacyAlias[],
): CatalogViewEntry {
  const reasons = new Set<string>();
  const record = row.record;
  const isOwned = owned.has(record.id);
  const vibes = requestedVibes(context);
  for (const field of REQUIRED_FACTS) {
    if (row.candidate.facts[field].reviewed.status !== "verified") {
      reasons.add(`unverified-${field}`);
    }
  }
  if (record.adultContent !== false && context.ageBand !== "adults") {
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
  if (!catalogHardEligible(record, context)) {
    if (
      context.players !== null &&
      (record.players.minimum === null ||
        record.players.maximum === null ||
        (context.players >= MAX_PLAYER_COUNT
          ? record.players.maximum < MAX_PLAYER_COUNT || record.players.minimum > MAX_PLAYER_COUNT
          : context.players < record.players.minimum || context.players > record.players.maximum))
    ) {
      reasons.add("player-count");
    }
    const ageBand = AGE_BANDS.find((band) => band.id === context.ageBand);
    if (
      context.ageBand &&
      context.ageBand !== "adults" &&
      (record.publisherMinimumAge === null ||
        record.publisherMinimumAge > (ageBand?.youngestAge ?? -1))
    ) {
      reasons.add("publisher-minimum-age");
    }
    if (
      context.timeOver60 &&
      (record.maximumListedPlaytimeMinutes === null || record.maximumListedPlaytimeMinutes <= 60)
    ) {
      reasons.add("maximum-listed-playtime");
    } else if (
      !context.timeOver60 &&
      context.maxTimeMin !== null &&
      (record.maximumListedPlaytimeMinutes === null ||
        record.maximumListedPlaytimeMinutes > context.maxTimeMin)
    ) {
      reasons.add("maximum-listed-playtime");
    }
    if (context.ageBand && context.ageBand !== "adults" && record.adultContent !== false) {
      reasons.add("adult-content");
    }
    if (reasons.size === 0) reasons.add("catalog-hard-filter");
  }
  const eligible = reasons.size === 0;
  const score = eligible ? catalogRecommendationScore(record, context, isOwned) : null;
  const matchExplanation = eligible
    ? [
        `Fits ${record.players.minimum}–${record.players.maximum} players.`,
        `Publisher minimum age ${record.publisherMinimumAge}+; maximum listed time ${record.maximumListedPlaytimeMinutes} minutes.`,
        ...vibes.map(
          (vibe) => `${VIBE_META[vibe].label}: ${record.vibeScores[vibe]?.toFixed(1)}/5`,
        ),
        `GameFinder catalog score; ${isOwned ? "owned" : "unowned"} status.`,
      ]
    : [...reasons].sort().map((reason) => `Not recommended: ${reason}.`);
  const resolvedAliases = aliases.filter(
    (alias) =>
      alias.gamefinderId === record.id && resolveAlias(aliases, alias.key).status === "resolved",
  );
  const uniqueVerifiedAliasKeys = [...new Set(resolvedAliases.map((alias) => alias.key))];
  return {
    gamefinderId: record.id,
    title: record.title,
    edition: record.edition,
    relationship: record.relationships.map((relationship) => ({ ...relationship })),
    players: { ...record.players },
    publisherMinimumAge: record.publisherMinimumAge,
    maximumListedPlaytimeMinutes: record.maximumListedPlaytimeMinutes,
    adultContent: record.adultContent,
    vibeScores: { ...record.vibeScores },
    ownership: isOwned ? "owned" : "unowned",
    score,
    matchExplanation,
    artwork: artworkView(row, now),
    legacyCompatibility:
      uniqueVerifiedAliasKeys.length === 1
        ? {
            status: "verified-alias",
            namespace: "synthetic-legacy",
            key: uniqueVerifiedAliasKeys[0],
          }
        : { status: "no-verified-alias", namespace: "synthetic-legacy" },
    eligible,
    rejectionReasons: [...reasons].sort(),
  };
}

export function createReadOnlyCatalogViewAdapter(
  source: SyntheticCatalogPublicationSnapshot,
  now = "2026-01-15T12:00:00.000Z",
): ReadOnlyCatalogViewAdapter {
  assertSnapshot(source);
  if (!Number.isFinite(Date.parse(now))) {
    throw new Error("A valid fixed timestamp is required for catalog artwork evaluation.");
  }
  const snapshot = structuredClone(source);
  const identities = new Set(snapshot.identityIds);
  const publishedIds = new Set(snapshot.records.map(({ record }) => record.id));
  if (
    identities.size !== snapshot.identityIds.length ||
    snapshot.records.some(({ record }) => !identities.has(record.id))
  ) {
    throw new Error("Synthetic publication snapshot has duplicate or undeclared identities.");
  }
  validateLegacyAliases(snapshot.legacyAliases, identities, publishedIds);

  function entriesFor(context: WizardContext, ownedIds: readonly string[]): CatalogViewEntry[] {
    const owned = new Set(ownedIds);
    return snapshot.records
      .map((row) => toEntry(row, context, owned, now, snapshot.legacyAliases))
      .sort(compareEntries);
  }

  return Object.freeze({
    find(context, ownedGamefinderIds = [], excludedGamefinderIds = []) {
      const excluded = new Set(excludedGamefinderIds);
      const allEntries = entriesFor(context, ownedGamefinderIds);
      const allEligible = allEntries.filter((entry) => entry.eligible);
      const fresh = allEligible.filter((entry) => !excluded.has(entry.gamefinderId));
      const ownedEligible = allEligible.filter((entry) => entry.ownership === "owned");
      const unownedEligible = allEligible.filter((entry) => entry.ownership === "unowned");
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
            const row = snapshot.records.find((item) => item.record.id === entry.gamefinderId);
            return (
              entry.title.toLocaleLowerCase().includes(normalizedQuery) ||
              row?.record.alternateTitles.some((title) =>
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
    resolveLegacyReference(key) {
      return resolveAlias(snapshot.legacyAliases, key);
    },
    customGame: Object.freeze({
      id: snapshot.customGame.id,
      ownerScope: "synthetic-owner-only" as const,
      resolvedAsGlobalGame: false as const,
    }),
  });
}
