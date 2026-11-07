import { VIBE_IDS, type VibeId } from "./types";
import type { CatalogRelationship } from "./catalog-foundation";

export type PublishedFact<T> =
  { status: "verified"; value: T } | { status: "unverified" | "disputed" | "missing"; value: null };

export type PublishedEditionScope = {
  edition: string | null;
  printing: string | null;
  language: string | null;
  market: string | null;
};

export type PublishedCatalogRelationship = {
  relation: CatalogRelationship["relation"];
  status: "verified" | "unresolved";
  targetGamefinderId: string | null;
  targetTitle: string;
};

export type PublishedArtworkDecision =
  | {
      status: "selected";
      authenticity: "synthetic-test-artwork-not-commercial" | "published-artwork";
      gamefinderId: string;
      scope: PublishedEditionScope;
      sourceId: string;
      reference: string;
      humanReviewed: true;
      reviewedAt: string;
      commercialDisplay: "allowed";
      permissionReference: string;
      attribution: { required: boolean; text: string | null };
      expiresAt: string | null;
      revokedAt: null;
      cachingPermitted: boolean;
      transformationPermitted: boolean;
    }
  | {
      status: "fallback";
      placeholder: "original-gamefinder-placeholder";
      reason:
        | "missing"
        | "rights-unresolved"
        | "approval-pending"
        | "approval-rejected"
        | "image-unavailable"
        | "edition-mismatch"
        | "identity-mismatch"
        | "catalog-entry-not-published";
      authenticity: "not-an-authentic-game-cover";
    };

export type PublishedCatalogRecord = {
  gamefinderId: string;
  identityStatus: "verified";
  publicationId: string;
  revision: string;
  sourceIdentity: { namespace: string; recordId: string };
  displayMetadata: {
    status: "approved";
    title: string;
    alternateTitles: string[];
    publisher: string | null;
    yearPublished: number | null;
    edition: string | null;
    printing: string | null;
    language: string | null;
    market: string | null;
    categories: string[];
    mechanics: string[];
  };
  metadataPermissions: {
    display: "allowed";
    permissionReference: string;
    expiresAt: string | null;
    revokedAt: null;
  };
  relationships: PublishedCatalogRelationship[];
  facts: {
    players: PublishedFact<{
      minimum: number;
      maximum: number;
      best: number[];
    }>;
    publisherMinimumAge: PublishedFact<number>;
    maximumListedPlaytimeMinutes: PublishedFact<number>;
    adultContent: PublishedFact<boolean>;
  };
  vibeScores: Record<VibeId, number | null>;
  artwork: PublishedArtworkDecision;
};

export type PublishedLegacyAlias = {
  namespace: "synthetic-legacy" | "legacy-bgg" | "legacy-internal" | "legacy-user";
  key: string;
  gamefinderId: string | null;
  status: "verified" | "disputed" | "unverified" | "orphaned";
};

export type PublishedCatalogSnapshot = {
  source: {
    sourceId: string;
    namespace: string;
    publicationId: string;
    revision: string;
    publishedAt: string;
  };
  records: PublishedCatalogRecord[];
  knownIdentityIds: string[];
  legacyAliases: PublishedLegacyAlias[];
  customGame: {
    id: string;
    ownerScope: "owner-only";
    resolvedAsGlobalGame: false;
  };
};

export const GAMEFINDER_ID_PATTERN =
  /^gf:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/i;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateFact(value: unknown, validVerifiedValue: (fact: unknown) => boolean): boolean {
  if (!isObject(value)) return false;
  if (value.status === "verified") return validVerifiedValue(value.value);
  return (
    ["unverified", "disputed", "missing"].includes(String(value.status)) && value.value === null
  );
}

function validateScope(value: unknown): value is PublishedEditionScope {
  return (
    isObject(value) &&
    ["edition", "printing", "language", "market"].every((field) => isText(value[field]))
  );
}

function validateArtwork(value: unknown, record: PublishedCatalogRecord, now: string): boolean {
  if (!isObject(value)) return false;
  if (value.status === "fallback") {
    return (
      value.placeholder === "original-gamefinder-placeholder" &&
      value.authenticity === "not-an-authentic-game-cover" &&
      [
        "missing",
        "rights-unresolved",
        "approval-pending",
        "approval-rejected",
        "image-unavailable",
        "edition-mismatch",
        "identity-mismatch",
        "catalog-entry-not-published",
      ].includes(String(value.reason))
    );
  }
  if (value.status !== "selected" || !validateScope(value.scope)) return false;
  const metadata = record.displayMetadata;
  const scope = value.scope as PublishedEditionScope;
  const evaluatedAt = Date.parse(now);
  const reviewedAt = Date.parse(String(value.reviewedAt));
  const expiresAt = value.expiresAt === null ? null : Date.parse(String(value.expiresAt));
  return (
    ["synthetic-test-artwork-not-commercial", "published-artwork"].includes(
      String(value.authenticity),
    ) &&
    value.gamefinderId === record.gamefinderId &&
    scope.edition === metadata.edition &&
    scope.printing === metadata.printing &&
    scope.language === metadata.language &&
    scope.market === metadata.market &&
    isText(value.sourceId) &&
    isText(value.reference) &&
    value.humanReviewed === true &&
    Number.isFinite(reviewedAt) &&
    reviewedAt <= evaluatedAt &&
    value.commercialDisplay === "allowed" &&
    isText(value.permissionReference) &&
    isObject(value.attribution) &&
    typeof value.attribution.required === "boolean" &&
    (value.attribution.required
      ? isText(value.attribution.text)
      : value.attribution.text === null) &&
    (value.expiresAt === null ||
      (expiresAt !== null && Number.isFinite(expiresAt) && expiresAt > evaluatedAt)) &&
    value.revokedAt === null &&
    typeof value.cachingPermitted === "boolean" &&
    typeof value.transformationPermitted === "boolean"
  );
}

export function assertPublishedCatalogSnapshot(
  source: unknown,
  now = new Date().toISOString(),
): asserts source is PublishedCatalogSnapshot {
  if (
    !Number.isFinite(Date.parse(now)) ||
    !isObject(source) ||
    !isObject(source.source) ||
    !isText(source.source.sourceId) ||
    !isText(source.source.namespace) ||
    !isText(source.source.publicationId) ||
    !isText(source.source.revision) ||
    !isText(source.source.publishedAt) ||
    !Number.isFinite(Date.parse(source.source.publishedAt)) ||
    Date.parse(source.source.publishedAt) > Date.parse(now) ||
    !Array.isArray(source.records) ||
    !Array.isArray(source.knownIdentityIds) ||
    !Array.isArray(source.legacyAliases) ||
    !isObject(source.customGame) ||
    !isText(source.customGame.id) ||
    source.customGame.ownerScope !== "owner-only" ||
    source.customGame.resolvedAsGlobalGame !== false
  ) {
    throw new Error("Published catalog snapshot has an invalid source or structure.");
  }

  const knownIds = source.knownIdentityIds as unknown[];
  if (
    knownIds.some((id) => !isText(id) || !GAMEFINDER_ID_PATTERN.test(id)) ||
    new Set(knownIds).size !== knownIds.length
  ) {
    throw new Error("Published catalog snapshot contains invalid or duplicate known identities.");
  }

  const records = source.records as unknown[];
  const seenRecordIds = new Set<string>();
  for (const value of records) {
    if (isObject(value) && typeof value.gamefinderId === "string") {
      if (seenRecordIds.has(value.gamefinderId)) {
        throw new Error("Published catalog snapshot has duplicate permanent identities.");
      }
      seenRecordIds.add(value.gamefinderId);
    }
  }
  const publishedIds = new Set<string>();
  for (const value of records) {
    if (!isObject(value) || !isObject(value.displayMetadata) || !isObject(value.facts)) {
      throw new Error("Published catalog snapshot contains a malformed record.");
    }
    const record = value as unknown as PublishedCatalogRecord;
    const metadata = record.displayMetadata;
    const facts = record.facts;
    if (
      !GAMEFINDER_ID_PATTERN.test(record.gamefinderId) ||
      record.identityStatus !== "verified" ||
      record.publicationId !== source.source.publicationId ||
      record.revision !== source.source.revision ||
      !isObject(record.sourceIdentity) ||
      record.sourceIdentity.namespace !== source.source.namespace ||
      !isText(record.sourceIdentity.recordId) ||
      metadata.status !== "approved" ||
      !isText(metadata.title) ||
      !Array.isArray(metadata.alternateTitles) ||
      metadata.alternateTitles.some((title) => !isText(title)) ||
      (metadata.publisher !== null && !isText(metadata.publisher)) ||
      (metadata.yearPublished !== null &&
        (!Number.isInteger(metadata.yearPublished) || metadata.yearPublished < 0)) ||
      (metadata.edition !== null && !isText(metadata.edition)) ||
      (metadata.printing !== null && !isText(metadata.printing)) ||
      (metadata.language !== null && !isText(metadata.language)) ||
      (metadata.market !== null && !isText(metadata.market)) ||
      !Array.isArray(metadata.categories) ||
      metadata.categories.some((category) => !isText(category)) ||
      !Array.isArray(metadata.mechanics) ||
      metadata.mechanics.some((mechanic) => !isText(mechanic)) ||
      !isObject(record.metadataPermissions) ||
      record.metadataPermissions.display !== "allowed" ||
      !isText(record.metadataPermissions.permissionReference) ||
      (record.metadataPermissions.expiresAt !== null &&
        (!Number.isFinite(Date.parse(record.metadataPermissions.expiresAt)) ||
          Date.parse(record.metadataPermissions.expiresAt) <= Date.parse(now))) ||
      record.metadataPermissions.revokedAt !== null ||
      !Array.isArray(record.relationships) ||
      record.relationships.some(
        (relationship) =>
          !isObject(relationship) ||
          !["base-game", "edition", "expansion"].includes(String(relationship.relation)) ||
          !["verified", "unresolved"].includes(String(relationship.status)) ||
          (relationship.targetGamefinderId !== null &&
            (typeof relationship.targetGamefinderId !== "string" ||
              !GAMEFINDER_ID_PATTERN.test(relationship.targetGamefinderId))) ||
          (relationship.status === "verified" && relationship.targetGamefinderId === null) ||
          (relationship.status === "unresolved" && relationship.targetGamefinderId !== null) ||
          !isText(relationship.targetTitle),
      ) ||
      !validateFact(
        facts.players,
        (players) =>
          isObject(players) &&
          Number.isInteger(players.minimum) &&
          Number.isInteger(players.maximum) &&
          (players.minimum as number) > 0 &&
          (players.maximum as number) >= (players.minimum as number) &&
          Array.isArray(players.best) &&
          players.best.every(
            (count) =>
              Number.isInteger(count) &&
              (count as number) >= (players.minimum as number) &&
              (count as number) <= (players.maximum as number),
          ),
      ) ||
      !validateFact(
        facts.publisherMinimumAge,
        (age) => Number.isInteger(age) && (age as number) >= 0,
      ) ||
      !validateFact(
        facts.maximumListedPlaytimeMinutes,
        (minutes) => Number.isInteger(minutes) && (minutes as number) > 0,
      ) ||
      !validateFact(facts.adultContent, (adultContent) => typeof adultContent === "boolean") ||
      !isObject(record.vibeScores) ||
      Object.keys(record.vibeScores).length !== VIBE_IDS.length ||
      VIBE_IDS.some(
        (vibe) =>
          !(vibe in record.vibeScores) ||
          (record.vibeScores[vibe] !== null &&
            (typeof record.vibeScores[vibe] !== "number" ||
              !Number.isFinite(record.vibeScores[vibe]) ||
              record.vibeScores[vibe]! < 0 ||
              record.vibeScores[vibe]! > 5)),
      ) ||
      !validateArtwork(record.artwork, record, now)
    ) {
      throw new Error(
        "Published catalog record has invalid identity, facts, metadata, or artwork.",
      );
    }
    if (publishedIds.has(record.gamefinderId)) {
      throw new Error("Published catalog snapshot has duplicate permanent identities.");
    }
    if (!knownIds.includes(record.gamefinderId)) {
      throw new Error("Published record identity is absent from the source identity set.");
    }
    publishedIds.add(record.gamefinderId);
  }

  for (const value of records) {
    const record = value as PublishedCatalogRecord;
    if (
      record.relationships.some(
        (relationship) =>
          relationship.status === "verified" &&
          (relationship.targetGamefinderId === record.gamefinderId ||
            !publishedIds.has(relationship.targetGamefinderId!)),
      )
    ) {
      throw new Error(
        "Published catalog contains a self-referential or unresolved identity relationship.",
      );
    }
  }

  const aliasKeys = source.legacyAliases as unknown[];
  for (const value of aliasKeys) {
    if (
      !isObject(value) ||
      !isText(value.key) ||
      !["synthetic-legacy", "legacy-bgg", "legacy-internal", "legacy-user"].includes(
        String(value.namespace),
      ) ||
      !["verified", "disputed", "unverified", "orphaned"].includes(String(value.status)) ||
      (value.gamefinderId !== null &&
        (typeof value.gamefinderId !== "string" ||
          !GAMEFINDER_ID_PATTERN.test(value.gamefinderId) ||
          !knownIds.includes(value.gamefinderId))) ||
      (value.status === "orphaned" && value.gamefinderId !== null) ||
      (value.status !== "orphaned" && value.gamefinderId === null) ||
      (value.status === "verified" && !publishedIds.has(value.gamefinderId as string))
    ) {
      throw new Error("Published catalog contains an invalid legacy alias.");
    }
  }

  if (
    source.legacyAliases.some(
      (alias) =>
        !isObject(alias) ||
        (alias.status === "verified" && !publishedIds.has(alias.gamefinderId as string)),
    )
  ) {
    throw new Error("Verified legacy aliases must resolve to published records.");
  }
}

export function hasVerifiedFact<T>(
  fact: PublishedFact<T>,
): fact is { status: "verified"; value: T } {
  return fact.status === "verified";
}

export function toCatalogVibeScores(
  scores: Record<VibeId, number | null>,
): Partial<Record<VibeId, number>> {
  return Object.fromEntries(
    VIBE_IDS.flatMap((vibe) => (typeof scores[vibe] === "number" ? [[vibe, scores[vibe]]] : [])),
  ) as Partial<Record<VibeId, number>>;
}
