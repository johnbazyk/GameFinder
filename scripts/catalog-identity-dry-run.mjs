import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { collectCurrentCatalogAudit } from "./catalog-audit.mjs";

const IDENTITY_ID_PATTERN =
  /^(?:gf:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|gfc_[a-zA-Z0-9-]{8,80})$/;
const REFERENCE_KINDS = new Set([
  "vault",
  "play-history",
  "score-session",
  "group-play",
  "recently-played",
  "recommendation",
]);
const IDENTIFIER_PROVIDERS = new Set(["bgg", "gamefinder", "user", "mock"]);
const LEGACY_KEY_NAMESPACES = new Set(["legacy-bgg", "legacy-internal", "legacy-user"]);
const ALIAS_STATUSES = new Set(["verified", "unverified", "disputed"]);

function assertUnique(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function identityKey(namespace, value) {
  return `${namespace}:${value}`;
}

export function simulateIdentityMigration(identities, references, explicitResolutions = {}) {
  assertUnique(
    identities.map((identity) => identity.id),
    "permanent catalog ID",
  );
  assertUnique(
    references.map((reference) => reference.id),
    "reference ID",
  );

  for (const identity of identities) {
    if (!IDENTITY_ID_PATTERN.test(identity.id)) {
      throw new Error(`Invalid permanent catalog ID: ${identity.id}`);
    }
    if (!Array.isArray(identity.legacyAliases) || !Array.isArray(identity.externalIds)) {
      throw new Error(`Identity ${identity.id} has invalid identifier collections.`);
    }
    for (const alias of identity.legacyAliases) {
      if (
        !alias ||
        !LEGACY_KEY_NAMESPACES.has(alias.namespace) ||
        !alias.value?.trim() ||
        !ALIAS_STATUSES.has(alias.status) ||
        (alias.status === "verified" &&
          (typeof alias.evidenceRef !== "string" || !alias.evidenceRef.trim()))
      ) {
        throw new Error(`Identity ${identity.id} has an invalid legacy alias.`);
      }
    }
    for (const external of identity.externalIds) {
      if (
        !external ||
        !IDENTIFIER_PROVIDERS.has(external.provider) ||
        !external.value?.trim() ||
        !["verified", "unverified", "disputed"].includes(external.status) ||
        (external.status === "verified" &&
          (typeof external.evidenceRef !== "string" || !external.evidenceRef.trim()))
      ) {
        throw new Error(`Identity ${identity.id} has an invalid external identifier.`);
      }
      if (
        external.provider === "bgg" &&
        external.status === "verified" &&
        !/^\d+$/.test(external.value)
      ) {
        throw new Error(`Verified BGG IDs must be numeric: ${external.value}`);
      }
    }
    const relationships = identity.relationships ?? [];
    if (!Array.isArray(relationships)) {
      throw new Error(`Identity ${identity.id} has invalid relationships.`);
    }
    for (const relationship of relationships) {
      if (
        !relationship ||
        !["base-game", "expansion", "edition"].includes(relationship.relation) ||
        (relationship.catalogGameId != null &&
          (!IDENTITY_ID_PATTERN.test(relationship.catalogGameId) ||
            !identities.some((candidate) => candidate.id === relationship.catalogGameId)))
      ) {
        throw new Error(`Identity ${identity.id} has an invalid catalog relationship.`);
      }
    }
  }

  const aliases = new Map();
  for (const identity of identities) {
    for (const alias of identity.legacyAliases) {
      const key = identityKey(alias.namespace, alias.value);
      const candidates = aliases.get(key) ?? [];
      candidates.push({ catalogGameId: identity.id, status: alias.status });
      aliases.set(key, candidates);
    }
  }

  const plan = references.map((reference) => {
    if (
      !reference ||
      typeof reference.id !== "string" ||
      !reference.id.trim() ||
      !REFERENCE_KINDS.has(reference.kind) ||
      !reference.legacyKey ||
      !LEGACY_KEY_NAMESPACES.has(reference.legacyKey.namespace) ||
      typeof reference.legacyKey.value !== "string" ||
      !reference.legacyKey.value.trim()
    ) {
      return {
        referenceId: reference?.id ?? "",
        kind: reference?.kind ?? "unknown",
        legacyKey: reference?.legacyKey ?? null,
        status: "invalid-reference",
        candidateCatalogGameIds: [],
        proposedCatalogGameId: null,
      };
    }

    const key = identityKey(reference.legacyKey.namespace, reference.legacyKey.value);
    const candidates = aliases.get(key) ?? [];
    const candidateCatalogGameIds = candidates.map((candidate) => candidate.catalogGameId);
    const explicit = explicitResolutions[reference.id];
    if (explicit) {
      if (
        typeof explicit.decisionId !== "string" ||
        !explicit.decisionId.trim() ||
        !candidateCatalogGameIds.includes(explicit.catalogGameId)
      ) {
        throw new Error(`Explicit resolution for ${reference.id} is not a recorded candidate.`);
      }
      return {
        referenceId: reference.id,
        kind: reference.kind,
        legacyKey: reference.legacyKey,
        status: "explicitly-resolved-in-simulation",
        candidateCatalogGameIds,
        proposedCatalogGameId: explicit.catalogGameId,
        decisionId: explicit.decisionId,
      };
    }

    const uniqueCandidates = new Set(candidateCatalogGameIds);
    const status =
      uniqueCandidates.size > 1
        ? "ambiguous"
        : uniqueCandidates.size === 0
          ? "orphan"
          : candidates.every((candidate) => candidate.status === "verified")
            ? "safe-candidate"
            : "needs-identity-review";

    return {
      referenceId: reference.id,
      kind: reference.kind,
      legacyKey: reference.legacyKey,
      status,
      candidateCatalogGameIds,
      proposedCatalogGameId: status === "safe-candidate" ? candidates[0].catalogGameId : null,
    };
  });

  const countsByStatus = Object.fromEntries(
    [...new Set(plan.map((entry) => entry.status))].map((status) => [
      status,
      plan.filter((entry) => entry.status === status).length,
    ]),
  );
  const countsByKind = Object.fromEntries(
    [...REFERENCE_KINDS].map((kind) => [kind, plan.filter((entry) => entry.kind === kind).length]),
  );

  return {
    plan,
    summary: {
      referenceCount: plan.length,
      countsByStatus,
      countsByKind,
      proposedAutomaticMappings: plan.filter((entry) => entry.status === "safe-candidate").length,
      unresolvedCount: plan.filter(
        (entry) => !["safe-candidate", "explicitly-resolved-in-simulation"].includes(entry.status),
      ).length,
      unresolvedRelationshipCount: identities.reduce(
        (count, identity) =>
          count +
          (identity.relationships ?? []).filter(
            (relationship) => relationship.catalogGameId == null,
          ).length,
        0,
      ),
      writesPerformed: 0,
    },
  };
}

export async function collectIdentityDryRun() {
  const audit = await collectCurrentCatalogAudit();
  const identities = audit.rows.map((row) => ({
    currentInternalId: row.internalId,
    title: row.title,
    legacyBggKey: row.bggId,
    visible: row.visible,
    legacyAliasStatus: "unverified",
    identityIssues: row.identifierCollisionFindings,
  }));
  const knownLegacyIds = new Set(identities.map((identity) => identity.legacyBggKey));
  const syntheticReferences = [
    {
      id: "fixture-vault-1",
      kind: "vault",
      legacyKey: { namespace: "legacy-bgg", value: "999001" },
    },
    {
      id: "fixture-history-1",
      kind: "play-history",
      legacyKey: { namespace: "legacy-bgg", value: "41114" },
    },
    {
      id: "fixture-score-1",
      kind: "score-session",
      legacyKey: { namespace: "legacy-bgg", value: "31260-revised" },
    },
    {
      id: "fixture-group-play-1",
      kind: "group-play",
      legacyKey: { namespace: "legacy-bgg", value: "missing-id" },
    },
    {
      id: "fixture-recommendation-1",
      kind: "recommendation",
      legacyKey: { namespace: "legacy-bgg", value: "318184" },
    },
  ];
  const syntheticIdentities = [
    {
      id: "gf:00000000-0000-4000-8000-000000000001",
      legacyAliases: [
        {
          namespace: "legacy-bgg",
          value: "999001",
          status: "verified",
          evidenceRef: "synthetic-authoritative-source",
        },
      ],
      externalIds: [
        {
          provider: "bgg",
          value: "999001",
          status: "verified",
          evidenceRef: "synthetic-authoritative-source",
        },
      ],
    },
    {
      id: "gf:00000000-0000-4000-8000-000000000002",
      legacyAliases: [{ namespace: "legacy-bgg", value: "41114", status: "unverified" }],
      externalIds: [{ provider: "bgg", value: "41114", status: "disputed" }],
    },
    {
      id: "gf:00000000-0000-4000-8000-000000000003",
      legacyAliases: [{ namespace: "legacy-bgg", value: "41114", status: "unverified" }],
      externalIds: [{ provider: "bgg", value: "41114", status: "disputed" }],
    },
    {
      id: "gf:00000000-0000-4000-8000-000000000004",
      legacyAliases: [{ namespace: "legacy-bgg", value: "31260-revised", status: "unverified" }],
      externalIds: [{ provider: "bgg", value: "31260-revised", status: "disputed" }],
    },
  ];
  const simulation = simulateIdentityMigration(syntheticIdentities, syntheticReferences);
  const knownLegacyKeys = [
    ...new Set(
      identities
        .filter((identity) => identity.legacyBggKey)
        .map((identity) => identity.legacyBggKey),
    ),
  ];

  return {
    catalogInventory: {
      authoredRecords: audit.summary.authoredRecords,
      visibleRecords: audit.summary.visibleRecords,
      uniqueCurrentInternalIds: audit.summary.uniqueInternalIds,
      uniqueLegacyBggKeys: knownLegacyKeys.length,
      exactDuplicateBggGroups: audit.summary.duplicateBggGroups,
      possibleNumericPrefixPairs: audit.summary.potentialAliasCollisions,
      affectedPrefixCollisionRecords: audit.summary.potentialAliasCollisionRecords,
      records: identities,
      guildTransformation: {
        sourcePlaceholderKey: "318184",
        currentRecord: identities.find((identity) => identity.legacyBggKey === "367041") ?? null,
        currentCatalogRowsForSourceKey: identities.filter(
          (identity) => identity.legacyBggKey === "318184",
        ).length,
        historicalScorecardKey: "318184",
        disposition: "orphaned historical key; do not map without explicit evidence",
      },
    },
    referenceSurfaces: [
      {
        surface: "Local persisted store (gamefinder-v2)",
        references: [
          "owned[]",
          "wishlist[]",
          "plays[].bggId",
          "scoreSessions[].bggId",
          "shownIds[]",
          "lastResults[].bggId",
          "pendingPlayPrompt.bggId",
          "lastSurpriseId",
          "recPool.ids[]",
        ],
      },
      { surface: "Cloud Vault", references: ["vault_games.bgg_id", "owned[]", "wishlist[]"] },
      { surface: "Group play history", references: ["group_plays.bgg_id", "GroupPlayRow.bggId"] },
      {
        surface: "Routes and lookups",
        references: ["game/$id route", "getGame(bggId)", "scorecard lookup"],
      },
      {
        surface: "Catalog relationships",
        references: [
          "Game.expansions[].bggId",
          "CatalogRelationship.catalogGameId?",
          "CatalogRelationship.externalIds[]",
        ],
      },
      {
        surface: "Custom catalog records",
        references: ["CatalogGameRecord.id (gfc_ UUID)", "externalIds[]", "relationships[]"],
      },
      {
        surface: "Not a catalog game reference",
        references: ["game_sessions.game_type (mini-game type)"],
      },
    ],
    syntheticDryRun: {
      disclaimer: "Synthetic fixture references only; no local or cloud user data was read.",
      summary: simulation.summary,
      plan: simulation.plan,
    },
    writesPerformed: 0,
    networkRequests: 0,
    sourceKeysNotPresentInCurrentCatalog: ["318184"],
    knownLegacyIds: knownLegacyIds.length,
  };
}

const thisFile = new URL(import.meta.url);
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === thisFile.href) {
  collectIdentityDryRun().then(
    (result) => console.log(JSON.stringify(result, null, 2)),
    (error) => {
      console.error("[catalog-identity-dry-run] Failed to inspect catalog identities.", error);
      process.exitCode = 1;
    },
  );
}
