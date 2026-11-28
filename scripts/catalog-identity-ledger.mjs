import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { collectCurrentCatalogAudit } from "./catalog-audit.mjs";

const LEDGER_PATH = fileURLToPath(
  new URL("../docs/catalog-audit/proposed-identity-registry.json", import.meta.url),
);
const PERMANENT_ID_PATTERN =
  /^gf:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function fingerprint(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function recordReviewReasons(row) {
  const reasons = [];
  if (row.duplicateExternalId) reasons.push("duplicate-legacy-key");
  if (
    row.identifierCollisionFindings.some((finding) =>
      finding.includes("Potential numeric-prefix collision"),
    )
  ) {
    reasons.push("possible-suffixed-key-collision");
  }
  if (row.title === "Rhino Hero" && row.bggId === "209418") {
    reasons.push("legacy-provider-identity-unverified");
  }
  return reasons;
}

function aliasStatus(reviewReasons) {
  return reviewReasons.length ? "disputed" : "unverified";
}

export function buildProposedIdentityLedger(
  audit,
  { allocateUuid = randomUUID, generatedAt = new Date().toISOString() } = {},
) {
  const authoredRecords = audit.rows.map((row) => {
    const reviewReasons = recordReviewReasons(row);
    const reservedPermanentId = `gf:${allocateUuid()}`;
    const sourceRecordId = allocateUuid();
    const proposedIdentityId = reviewReasons.length ? null : reservedPermanentId;
    return {
      sourceRecordId,
      sourceNamespace: "gamefinder-authored",
      sourceRecordKey: row.internalId,
      sourceFingerprint: fingerprint(row.game),
      titleSnapshot: row.title,
      legacyAlias: {
        namespace: "legacy-bgg",
        value: row.bggId,
        status: aliasStatus(reviewReasons),
      },
      legacyInternalAlias: {
        namespace: "legacy-internal",
        value: row.internalId,
        status: aliasStatus(reviewReasons),
      },
      externalIdentifier: {
        provider: "bgg",
        value: row.bggId,
        status: aliasStatus(reviewReasons),
      },
      runtimeVisible: row.visible,
      reservedPermanentId,
      proposedIdentityId,
      identityProposalStatus: proposedIdentityId ? "proposed" : "unresolved",
      identityReviewStatus: reviewReasons.length ? "disputed" : "pending",
      reviewReasons,
      relationships: (row.game.expansions ?? []).map((expansion) => ({
        relation: "expansion",
        targetIdentityId: null,
        status: "unresolved",
        externalReference: { provider: "bgg", value: expansion.bggId },
        titleSnapshot: expansion.name,
      })),
      evidence: [],
      revisionHistory: [
        {
          revision: 1,
          recordedAt: generatedAt,
          changeRef: "05E1-initial-proposal",
        },
      ],
    };
  });

  const proposedIdentities = authoredRecords
    .filter((record) => record.proposedIdentityId !== null)
    .map((record) => ({
      id: record.proposedIdentityId,
      title: record.titleSnapshot,
      edition: {
        name: null,
        printing: null,
        language: null,
        regionalMarket: null,
        status: "missing",
        evidenceRef: null,
      },
      status: "proposed",
      sourceRecord: {
        sourceNamespace: record.sourceNamespace,
        sourceRecordId: record.sourceRecordId,
        recordKey: record.sourceRecordKey,
        fingerprint: record.sourceFingerprint,
      },
      legacyAliases: [record.legacyAlias, record.legacyInternalAlias],
      externalIds: [record.externalIdentifier],
      relationships: record.relationships,
      evidence: record.evidence,
      conflictStatus: "none",
      createdAt: generatedAt,
      revisionHistory: record.revisionHistory,
    }));

  return {
    schemaVersion: 1,
    activation: "proposal-only",
    generatedAt,
    source: {
      path: "src/lib/catalog.ts",
      sourceCollection: "AUTHORED_GAMES",
      inventoryCommit: "76e5efb94dd18a577f9f6a83e929670d43018e9d",
    },
    authoredRecords,
    proposedIdentities,
    historicalAliasReviewQueue: [
      {
        namespace: "legacy-bgg",
        value: "318184",
        titleSnapshot: "Wonderland's War (pre-transformation source key)",
        status: "orphaned",
        canonicalIdentityId: null,
        reason:
          "The current authored row is transformed to The Guild of Merchant Explorers / 367041; 318184 also appears in historical scorecard references. No mapping is supported.",
      },
    ],
  };
}

export function validateProposedIdentityLedger(ledger, audit) {
  if (
    ledger.schemaVersion !== 1 ||
    ledger.activation !== "proposal-only" ||
    ledger.authoredRecords.length !== audit.rows.length
  ) {
    throw new Error("Proposed identity ledger has an invalid schema or authored-record count.");
  }

  const sourceRecordsByKey = new Map(
    ledger.authoredRecords.map((record) => [record.sourceRecordKey, record]),
  );
  if (sourceRecordsByKey.size !== ledger.authoredRecords.length) {
    throw new Error("Proposed identity ledger has duplicate authored source-record keys.");
  }
  const sourceRecordIds = new Set();
  const reservedPermanentIds = new Set();
  let visibleCount = 0;
  for (const row of audit.rows) {
    const record = sourceRecordsByKey.get(row.internalId);
    if (
      !record ||
      record.titleSnapshot !== row.title ||
      record.legacyAlias.value !== row.bggId ||
      record.runtimeVisible !== row.visible ||
      record.sourceFingerprint !== fingerprint(row.game)
    ) {
      throw new Error(
        `Source identity mismatch; explicit identity review required for authored record: ${row.internalId}`,
      );
    }
    if (!UUID_PATTERN.test(record.sourceRecordId) || sourceRecordIds.has(record.sourceRecordId)) {
      throw new Error(`Invalid or duplicate source-record identity: ${record.sourceRecordId}`);
    }
    if (
      !PERMANENT_ID_PATTERN.test(record.reservedPermanentId) ||
      reservedPermanentIds.has(record.reservedPermanentId)
    ) {
      throw new Error(
        `Invalid or duplicate reserved permanent identity: ${record.reservedPermanentId}`,
      );
    }
    sourceRecordIds.add(record.sourceRecordId);
    reservedPermanentIds.add(record.reservedPermanentId);
    const expectedReasons = recordReviewReasons(row);
    if (JSON.stringify(record.reviewReasons) !== JSON.stringify(expectedReasons)) {
      throw new Error(`Identity review classification changed for source record ${row.internalId}`);
    }
    const expectedAliasStatus = expectedReasons.length ? "disputed" : "unverified";
    if (
      record.identityReviewStatus !== (expectedReasons.length ? "disputed" : "pending") ||
      record.identityProposalStatus !== (expectedReasons.length ? "unresolved" : "proposed") ||
      record.legacyAlias.namespace !== "legacy-bgg" ||
      record.legacyAlias.status !== expectedAliasStatus ||
      record.legacyInternalAlias.namespace !== "legacy-internal" ||
      record.legacyInternalAlias.status !== expectedAliasStatus ||
      record.externalIdentifier.provider !== "bgg" ||
      record.externalIdentifier.value !== row.bggId ||
      record.externalIdentifier.status !== expectedAliasStatus ||
      record.evidence.length !== 0
    ) {
      throw new Error(`Source record has altered identity trust status: ${row.internalId}`);
    }
    if (
      record.proposedIdentityId !== (expectedReasons.length ? null : record.reservedPermanentId)
    ) {
      throw new Error(`Unsafe permanent identity proposal for source record ${row.internalId}`);
    }
    if (row.visible) visibleCount += 1;
  }

  const expectedIdentities = ledger.authoredRecords.filter(
    (record) => record.proposedIdentityId !== null,
  );
  if (ledger.proposedIdentities.length !== expectedIdentities.length) {
    throw new Error("Proposed identity count does not match the reviewed authored-record queue.");
  }
  const identityIds = new Set();
  for (const identity of ledger.proposedIdentities) {
    if (!PERMANENT_ID_PATTERN.test(identity.id) || identityIds.has(identity.id)) {
      throw new Error(`Invalid or duplicate proposed permanent identity: ${identity.id}`);
    }
    identityIds.add(identity.id);
    const source = sourceRecordsByKey.get(identity.sourceRecord.recordKey);
    if (
      !source ||
      source.sourceRecordId !== identity.sourceRecord.sourceRecordId ||
      source.titleSnapshot !== identity.title ||
      source.proposedIdentityId !== identity.id ||
      JSON.stringify(identity.legacyAliases) !==
        JSON.stringify([source.legacyAlias, source.legacyInternalAlias]) ||
      JSON.stringify(identity.externalIds) !== JSON.stringify([source.externalIdentifier]) ||
      JSON.stringify(identity.relationships) !== JSON.stringify(source.relationships) ||
      identity.edition?.status !== "missing" ||
      identity.edition.name !== null ||
      identity.edition.printing !== null ||
      identity.edition.language !== null ||
      identity.edition.regionalMarket !== null ||
      identity.status !== "proposed" ||
      identity.evidence.length !== 0 ||
      identity.legacyAliases.some((alias) => alias.status === "verified") ||
      identity.externalIds.some((externalId) => externalId.status === "verified")
    ) {
      throw new Error(`Proposed identity is detached or improperly verified: ${identity.id}`);
    }
  }

  return {
    authoredRecords: ledger.authoredRecords.length,
    runtimeVisibleRecords: visibleCount,
    standaloneRecommendationPoolRecords: audit.rows.filter(
      (row) =>
        row.visible &&
        /^\d+$/.test(row.bggId) &&
        !row.game.categories.some((category) => /expansion/i.test(category)),
    ).length,
    uniqueSourceRecordIds: sourceRecordIds.size,
    reservedPermanentIds: reservedPermanentIds.size,
    proposedIdentityRecords: ledger.proposedIdentities.length,
    unresolvedSourceRecords: ledger.authoredRecords.length - ledger.proposedIdentities.length,
    verifiedIdentities: ledger.proposedIdentities.filter(
      (identity) => identity.status === "verified",
    ).length,
    duplicateLegacyKeyRecords: ledger.authoredRecords.filter((record) =>
      record.reviewReasons.includes("duplicate-legacy-key"),
    ).length,
    possibleSuffixedKeyCollisionRecords: ledger.authoredRecords.filter((record) =>
      record.reviewReasons.includes("possible-suffixed-key-collision"),
    ).length,
    historicalAliasReviewQueue: ledger.historicalAliasReviewQueue.length,
    writesPerformed: 0,
    networkRequests: 0,
  };
}

export function classifyProposedLegacyAlias(ledger, namespace, value) {
  const allowedNamespaces = new Set(["legacy-bgg", "legacy-internal", "legacy-user"]);
  if (
    typeof namespace !== "string" ||
    !allowedNamespaces.has(namespace) ||
    typeof value !== "string" ||
    !value.trim()
  ) {
    return {
      classification: "invalid",
      candidateSourceRecordIds: [],
      proposedPermanentIdCandidates: [],
    };
  }
  const candidates = ledger.authoredRecords.filter((record) =>
    [record.legacyAlias, record.legacyInternalAlias].some(
      (alias) => alias.namespace === namespace && alias.value === value,
    ),
  );
  const candidateSourceRecordIds = candidates.map((record) => record.sourceRecordId);
  const proposedPermanentIdCandidates = candidates
    .map((record) => record.proposedIdentityId)
    .filter(Boolean);
  if (!candidates.length) {
    return {
      classification: "orphaned",
      candidateSourceRecordIds,
      proposedPermanentIdCandidates,
    };
  }
  if (candidates.length > 1) {
    return {
      classification: "ambiguous",
      candidateSourceRecordIds,
      proposedPermanentIdCandidates,
    };
  }
  return {
    classification: "requires-identity-review",
    candidateSourceRecordIds,
    proposedPermanentIdCandidates,
  };
}

export function loadProposedIdentityLedger() {
  return JSON.parse(readFileSync(LEDGER_PATH, "utf8"));
}

async function initializeLedger() {
  if (existsSync(LEDGER_PATH)) {
    throw new Error("Refusing to overwrite the saved identity ledger or regenerate its IDs.");
  }
  const audit = await collectCurrentCatalogAudit();
  const ledger = buildProposedIdentityLedger(audit);
  validateProposedIdentityLedger(ledger, audit);
  writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`, { flag: "wx" });
  console.log(`Created proposal-only identity ledger at ${LEDGER_PATH}`);
}

async function inspectLedger() {
  const audit = await collectCurrentCatalogAudit();
  const summary = validateProposedIdentityLedger(loadProposedIdentityLedger(), audit);
  console.log(JSON.stringify(summary, null, 2));
}

const thisFile = fileURLToPath(import.meta.url);
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === pathToFileURL(thisFile).href
) {
  const action = process.argv[2];
  if (action === "--initialize") {
    initializeLedger().catch((error) => {
      console.error("[catalog-identity-ledger] Initialization failed.", error);
      process.exitCode = 1;
    });
  } else {
    inspectLedger().catch((error) => {
      console.error("[catalog-identity-ledger] Validation failed.", error);
      process.exitCode = 1;
    });
  }
}
