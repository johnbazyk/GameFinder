import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { loadProposedIdentityLedger } from "./catalog-identity-ledger.mjs";

export const IDENTITY_REVIEW_DECISIONS = [
  "confirmed-identity-candidate",
  "external-id-disputed-or-incorrect",
  "distinct-edition",
  "distinct-game",
  "potential-duplicate-needs-evidence",
  "insufficient-evidence",
  "orphaned-historical-reference",
  "requires-reference-specific-human-decision",
];

export const IDENTITY_ASSERTIONS = [
  "game-existence",
  "source-record-to-game-identity",
  "external-id-to-game-identity",
  "edition-distinction",
  "base-expansion-relationship",
];

export const IDENTITY_EVIDENCE_CLASSIFICATIONS = [
  "publisher-authorized",
  "independent-publication",
  "licensed-provider",
  "archival-record",
  "synthetic-fixture",
];

export const IDENTITY_EVIDENCE_QUALITY = [
  "independently-corroborating",
  "incomplete",
  "disputed",
  "unusable",
];

const REPORT_SCHEMA_VERSION = 1;
const PREFIX_COLLISION_PAIRS = [
  ["31260", "31260-revised"],
  ["233078", "233078-short"],
  ["266810", "266810-architects"],
  ["266192", "266192-asia"],
  ["199792", "199792-bellfaire"],
  ["13", "13-junior"],
  ["21790", "21790-pitch"],
].map((pair) => new Set(pair));
const ledger = loadProposedIdentityLedger();
const unresolvedRecords = ledger.authoredRecords.filter(
  (record) => record.proposedIdentityId === null,
);

function stableId(prefix, components) {
  const digest = createHash("sha256").update(components.join("\u001f")).digest("hex").slice(0, 20);
  return `${prefix}:${digest}`;
}

function conflictingRecords(record) {
  return ledger.authoredRecords
    .filter(
      (candidate) =>
        candidate.sourceRecordId !== record.sourceRecordId &&
        (candidate.legacyAlias.value === record.legacyAlias.value ||
          PREFIX_COLLISION_PAIRS.some(
            (pair) => pair.has(candidate.legacyAlias.value) && pair.has(record.legacyAlias.value),
          )),
    )
    .map((candidate) => ({
      sourceRecordId: candidate.sourceRecordId,
      titleSnapshot: candidate.titleSnapshot,
      legacyKey: candidate.legacyAlias.value,
      reservedPermanentId: candidate.reservedPermanentId,
      proposalStatus: candidate.identityProposalStatus,
      relationship: "shared-legacy-key-or-review-reason",
    }));
}

function evidenceNeededForRecord(record) {
  const requirements = [
    "An independently checkable source tying this exact authored source record to the game; a title match alone is insufficient.",
    "Separate corroboration tying each claimed external identifier to the identified game; numeric format or shared legacy key is not evidence.",
    "Publisher, publication year, edition, printing, language, and market details when they distinguish this record from related games or editions.",
  ];
  if (record.reviewReasons.includes("duplicate-legacy-key")) {
    requirements.push(
      "Independent evidence for both records sharing the key; adjudicate the external-ID claim separately from any legacy user reference.",
    );
  }
  if (record.reviewReasons.includes("possible-suffixed-key-collision")) {
    requirements.push(
      "Evidence explaining the exact suffixed key's namespace and confirming both the numeric and suffixed records independently.",
    );
  }
  if (record.reviewReasons.includes("legacy-provider-identity-unverified")) {
    requirements.push(
      "A source independent of the legacy numeric claim that identifies this game's exact edition and any matching provider record.",
    );
  }
  return requirements;
}

function recommendedActions(record) {
  if (record.reviewReasons.includes("duplicate-legacy-key")) {
    return [
      "Review The Resistance and Sleeping Queens independently against separate authorized identity sources.",
      "Record an external-ID decision for each source record; do not map any Vault, score, or play reference from this decision.",
      "Leave each reference using 41114 unresolved until a reference-specific decision is authorized.",
    ];
  }
  if (record.reviewReasons.includes("possible-suffixed-key-collision")) {
    return [
      "Inspect the exact source provenance for the numeric and suffixed keys without inferring identity from their string relationship.",
      "Confirm title, publisher, year, edition, and external-ID association using independent evidence.",
      "For editions or expansions, record a distinct relationship decision only after each endpoint is independently identified.",
    ];
  }
  return [
    "Obtain independent evidence for the source record's exact game and edition.",
    "Verify the claimed numeric provider identifier separately; do not infer identity from its syntax.",
  ];
}

function identityReviewCases() {
  return unresolvedRecords.map((record) => ({
    caseId: `identity:${record.sourceRecordId}`,
    caseType: "authored-source-identity",
    sourceRecordId: record.sourceRecordId,
    titleSnapshot: record.titleSnapshot,
    exactLegacyKey: { namespace: record.legacyAlias.namespace, value: record.legacyAlias.value },
    reservedPermanentId: record.reservedPermanentId,
    permanentIdStatus: "reserved-only-not-a-canonical-mapping",
    currentIdentityReviewStatus: record.identityReviewStatus,
    reason: [...record.reviewReasons],
    relatedSourceRecords: conflictingRecords(record),
    evidenceRequired: evidenceNeededForRecord(record),
    evidenceAvailability: {
      status: "none",
      availableEvidenceReferences: [],
      note: "The 05E1 local proposal snapshot contains no identity evidence. No external sources were fetched.",
    },
    recommendedHumanReviewAction: recommendedActions(record),
    permittedProposedDecisions: [
      "confirmed-identity-candidate",
      "external-id-disputed-or-incorrect",
      "distinct-edition",
      "distinct-game",
      "potential-duplicate-needs-evidence",
      "insufficient-evidence",
      "requires-reference-specific-human-decision",
    ],
  }));
}

function historicalReferenceCases() {
  return ledger.historicalAliasReviewQueue.map((entry) => ({
    caseId: stableId("historical", [entry.namespace, entry.value]),
    caseType: "historical-orphan-reference",
    sourceRecordId: null,
    titleSnapshot: entry.titleSnapshot,
    exactLegacyKey: { namespace: entry.namespace, value: entry.value },
    reservedPermanentId: null,
    permanentIdStatus: "no-identity-assigned",
    currentIdentityReviewStatus: entry.status,
    reason: [entry.reason],
    relatedSourceRecords: [],
    evidenceRequired: [
      "A historical source identifying the record represented by this exact key, not merely a title or a current catalog row with a similar name.",
      "A separate reference-specific review for each affected user-data surface; identity evidence alone must not migrate historical references.",
    ],
    evidenceAvailability: {
      status: "none",
      availableEvidenceReferences: [],
      note: "No evidence was supplied; the orphan remains preserved and unmapped.",
    },
    recommendedHumanReviewAction: [
      "Keep 318184 orphaned unless independently sourced historical documentation establishes what it represented.",
      "If a user reference is later considered, decide it per reference under a separately authorized process.",
    ],
    permittedProposedDecisions: [
      "orphaned-historical-reference",
      "insufficient-evidence",
      "requires-reference-specific-human-decision",
    ],
  }));
}

function relationshipCases() {
  return ledger.authoredRecords.flatMap((record) =>
    record.relationships
      .filter((relationship) => relationship.status === "unresolved")
      .map((relationship, index) => ({
        caseId: stableId("relationship", [
          record.sourceRecordId,
          String(index),
          relationship.relation,
          relationship.externalReference?.provider ?? "",
          relationship.externalReference?.value ?? "",
        ]),
        caseType: "catalog-relationship",
        sourceRecordId: record.sourceRecordId,
        titleSnapshot: record.titleSnapshot,
        exactLegacyKey: {
          namespace: record.legacyAlias.namespace,
          value: record.legacyAlias.value,
        },
        reservedPermanentId: record.proposedIdentityId === null ? record.reservedPermanentId : null,
        sourcePermanentIdProposal:
          record.proposedIdentityId === null ? null : record.proposedIdentityId,
        permanentIdStatus:
          record.proposedIdentityId === null
            ? "reserved-only-not-a-canonical-mapping"
            : "proposal-only-not-a-canonical-mapping",
        currentIdentityReviewStatus: "relationship-unresolved",
        reason: [
          `${relationship.relation} target ${relationship.titleSnapshot} is stored only as an unverified external reference.`,
        ],
        relatedSourceRecords: [],
        relationship: {
          relation: relationship.relation,
          targetIdentityId: null,
          targetTitleSnapshot: relationship.titleSnapshot,
          externalReference: relationship.externalReference,
          status: "unresolved",
        },
        evidenceRequired: [
          "Independent evidence identifying the source game and the target game/edition as separate records.",
          "Evidence supporting this specific base-game/expansion/edition relationship; a numeric external ID alone cannot establish either endpoint or the relationship.",
        ],
        evidenceAvailability: {
          status: "none",
          availableEvidenceReferences: [],
          note: "Only the legacy title and external-ID claim are present; no relation has been verified.",
        },
        recommendedHumanReviewAction: [
          "Verify the source and target identities independently before evaluating their relationship.",
          "Leave targetIdentityId null until a separately reviewed relationship decision exists.",
        ],
        permittedProposedDecisions: [
          "distinct-edition",
          "distinct-game",
          "potential-duplicate-needs-evidence",
          "insufficient-evidence",
        ],
      })),
  );
}

export function generateIdentityReviewQueue() {
  const cases = [
    ...identityReviewCases(),
    ...historicalReferenceCases(),
    ...relationshipCases(),
  ].sort((left, right) => (left.caseId < right.caseId ? -1 : left.caseId > right.caseId ? 1 : 0));
  const ids = cases.map((entry) => entry.caseId);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Identity review queue generated duplicate case IDs.");
  }
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    reportKind: "proposal-only-identity-review-queue",
    sourceLedger: {
      schemaVersion: ledger.schemaVersion,
      inventoryCommit: ledger.source.inventoryCommit,
      activation: ledger.activation,
      contentSha256: createHash("sha256").update(JSON.stringify(ledger)).digest("hex"),
    },
    summary: {
      authoredRecordsReviewed: ledger.authoredRecords.length,
      unresolvedAuthoredRecords: unresolvedRecords.length,
      historicalOrphanReferences: ledger.historicalAliasReviewQueue.length,
      unresolvedRelationships: relationshipCases().length,
      reviewCases: cases.length,
      evidenceReferencesAvailable: 0,
      writesPerformed: 0,
      networkRequests: 0,
      realApprovalsRecorded: 0,
    },
    cases,
  };
}

const optionalText = (value) =>
  value === null || (typeof value === "string" && value.trim().length > 0);

function validClaimedExternalIdentifier(identifier) {
  return (
    identifier &&
    optionalText(identifier.provider) &&
    optionalText(identifier.value) &&
    (identifier.provider === null) === (identifier.value === null)
  );
}

export function validateIdentityEvidence(evidence) {
  if (
    !evidence ||
    evidence.simulation !== true ||
    evidence.source?.classification !== "synthetic-fixture" ||
    typeof evidence.evidenceReferenceId !== "string" ||
    !evidence.evidenceReferenceId.trim() ||
    typeof evidence.source.name !== "string" ||
    !evidence.source.name.trim() ||
    !(
      evidence.sourceRecordId === null ||
      (typeof evidence.sourceRecordId === "string" && evidence.sourceRecordId.trim())
    ) ||
    !optionalText(evidence.source.publisherOrRightsHolder) ||
    !optionalText(evidence.source.urlOrDocumentReference) ||
    !IDENTITY_EVIDENCE_CLASSIFICATIONS.includes(evidence.source.classification) ||
    !Number.isFinite(Date.parse(evidence.recordedAt)) ||
    !evidence.relevantGame ||
    typeof evidence.relevantGame.title !== "string" ||
    !evidence.relevantGame.title.trim() ||
    !optionalText(evidence.relevantGame.publisher) ||
    !(
      evidence.relevantGame.publicationYear === null ||
      (Number.isInteger(evidence.relevantGame.publicationYear) &&
        evidence.relevantGame.publicationYear >= 0 &&
        evidence.relevantGame.publicationYear <= 9999)
    ) ||
    !optionalText(evidence.relevantGame.edition) ||
    !optionalText(evidence.relevantGame.printing) ||
    !optionalText(evidence.relevantGame.language) ||
    !optionalText(evidence.relevantGame.regionalMarket) ||
    !validClaimedExternalIdentifier(evidence.claimedExternalIdentifier) ||
    !Array.isArray(evidence.supportedAssertions) ||
    !evidence.supportedAssertions.length ||
    evidence.supportedAssertions.some((assertion) => !IDENTITY_ASSERTIONS.includes(assertion)) ||
    !IDENTITY_EVIDENCE_QUALITY.includes(evidence.quality) ||
    evidence.humanReview?.status !== "simulation-only" ||
    typeof evidence.humanReview.rationale !== "string" ||
    !evidence.humanReview.rationale.trim()
  ) {
    throw new Error("Synthetic identity evidence is incomplete or not explicitly simulation-only.");
  }
  return true;
}

function evidenceSupports(evidence, sourceRecordId, assertion, externalId) {
  return evidence.some(
    (item) =>
      item.sourceRecordId === sourceRecordId &&
      item.supportedAssertions.includes(assertion) &&
      item.quality === "independently-corroborating" &&
      (!externalId ||
        (item.claimedExternalIdentifier?.provider === externalId.provider &&
          item.claimedExternalIdentifier?.value === externalId.value)),
  );
}

export function simulateIdentityAdjudication(reviewCase, evidence, decision) {
  const eligibleSourceRecords = new Map(
    [
      [reviewCase?.sourceRecordId, reviewCase?.titleSnapshot],
      ...(reviewCase?.relatedSourceRecords ?? []).map((record) => [
        record.sourceRecordId,
        record.titleSnapshot,
      ]),
    ].filter(([sourceRecordId]) => typeof sourceRecordId === "string"),
  );
  if (
    !reviewCase ||
    typeof reviewCase.caseId !== "string" ||
    !Array.isArray(evidence) ||
    (!evidence.length &&
      !["orphaned-historical-reference", "requires-reference-specific-human-decision"].includes(
        decision?.type,
      )) ||
    !decision ||
    decision.simulation !== true ||
    !IDENTITY_REVIEW_DECISIONS.includes(decision.type) ||
    typeof decision.rationale !== "string" ||
    !decision.rationale.trim() ||
    !Array.isArray(decision.sourceRecordIds) ||
    decision.sourceRecordIds.some((sourceRecordId) => !eligibleSourceRecords.has(sourceRecordId)) ||
    evidence.some((item) => validateIdentityEvidence(item) !== true) ||
    new Set(evidence.map((item) => item.evidenceReferenceId)).size !== evidence.length ||
    evidence.some(
      (item) =>
        item.sourceRecordId !== null && !decision.sourceRecordIds.includes(item.sourceRecordId),
    ) ||
    (evidence.some((item) => item.sourceRecordId === null) &&
      decision.type !== "orphaned-historical-reference" &&
      decision.type !== "requires-reference-specific-human-decision")
  ) {
    throw new Error(
      "Adjudication decision or evidence is invalid; only explicit synthetic simulations are allowed.",
    );
  }

  const evidenceRefs = evidence.map((item) => item.evidenceReferenceId);
  const returnSimulation = (status, reason, proposedIdentityLinks = []) => ({
    simulation: true,
    status,
    decision: decision.type,
    caseId: reviewCase.caseId,
    sourceRecordIds: [...decision.sourceRecordIds],
    evidenceReferences: evidenceRefs,
    reviewedEvidence: evidence.map((item) => structuredClone(item)),
    proposedIdentityLinks,
    proposedReferenceMappings: [],
    rationale: decision.rationale,
    reason,
    ledgerWrites: 0,
    userReferenceWrites: 0,
    realApproval: false,
  });
  const distinctSources = [...new Set(decision.sourceRecordIds)];
  if (distinctSources.length !== decision.sourceRecordIds.length) {
    throw new Error("A source record cannot be adjudicated more than once in one decision.");
  }

  if (decision.type === "orphaned-historical-reference") {
    if (reviewCase.caseType !== "historical-orphan-reference" || distinctSources.length !== 0) {
      throw new Error("Orphan decisions apply only to historical reference cases.");
    }
    return returnSimulation("unresolved", "Historical references remain preserved and unmapped.");
  }
  if (decision.type === "requires-reference-specific-human-decision") {
    if (distinctSources.length !== 0) {
      throw new Error(
        "Reference-specific decisions cannot be inferred from a game identity decision.",
      );
    }
    return returnSimulation(
      "requires-reference-specific-human-decision",
      "Identity adjudication cannot authorize a user-reference mapping.",
    );
  }
  if (
    decision.type === "insufficient-evidence" ||
    decision.type === "potential-duplicate-needs-evidence"
  ) {
    return returnSimulation(
      "unresolved",
      "Evidence is insufficient to confirm, merge, or map identities.",
    );
  }

  if (decision.type === "confirmed-identity-candidate") {
    if (distinctSources.length !== 1) {
      throw new Error(
        "A confirmed identity candidate decision must name exactly one source record.",
      );
    }
    if (
      !evidenceSupports(evidence, distinctSources[0], "source-record-to-game-identity") ||
      evidence.some(
        (item) =>
          item.quality === "disputed" ||
          item.quality === "unusable" ||
          (item.sourceRecordId === distinctSources[0] &&
            item.supportedAssertions.includes("source-record-to-game-identity") &&
            item.relevantGame.title !== eligibleSourceRecords.get(distinctSources[0])),
      )
    ) {
      return returnSimulation(
        "rejected",
        "No independent, non-contradictory source-record identity evidence.",
      );
    }
    return returnSimulation(
      "simulated-candidate-only",
      "Synthetic evidence supports this source record only; no ledger identity is verified or activated.",
      [{ sourceRecordId: distinctSources[0], reservedIdUsedAsMapping: false }],
    );
  }

  if (decision.type === "external-id-disputed-or-incorrect") {
    const claimedLegacyExternalId =
      reviewCase.exactLegacyKey?.namespace === "legacy-bgg"
        ? reviewCase.exactLegacyKey.value
        : null;
    if (
      distinctSources.length !== 1 ||
      !claimedLegacyExternalId ||
      !evidence.some(
        (item) =>
          item.sourceRecordId === distinctSources[0] &&
          item.claimedExternalIdentifier?.provider === "bgg" &&
          item.claimedExternalIdentifier?.value === claimedLegacyExternalId &&
          item.supportedAssertions.includes("external-id-to-game-identity") &&
          item.quality === "disputed" &&
          item.relevantGame.title === eligibleSourceRecords.get(distinctSources[0]),
      )
    ) {
      return returnSimulation(
        "rejected",
        "External-ID disagreement requires evidence explicitly addressing that ID-to-game assertion.",
      );
    }
    return returnSimulation(
      "simulated-external-id-review-only",
      "The external-ID claim is disputed in this synthetic case; no game identity or reference is reassigned.",
    );
  }

  if (decision.type === "distinct-edition" || decision.type === "distinct-game") {
    const assertion =
      decision.type === "distinct-edition"
        ? "edition-distinction"
        : "source-record-to-game-identity";
    if (
      distinctSources.length !== 2 ||
      distinctSources.some(
        (sourceRecordId) => !evidenceSupports(evidence, sourceRecordId, assertion),
      ) ||
      evidence.some(
        (item) =>
          item.quality === "disputed" ||
          item.quality === "unusable" ||
          (item.supportedAssertions.includes(assertion) &&
            item.relevantGame.title !== eligibleSourceRecords.get(item.sourceRecordId)) ||
          (decision.type === "distinct-edition" &&
            item.supportedAssertions.includes(assertion) &&
            !item.relevantGame.edition),
      )
    ) {
      return returnSimulation(
        "rejected",
        "A distinct-game or distinct-edition decision requires independent evidence for each source record.",
      );
    }
    return returnSimulation(
      "simulated-separate-candidates",
      "Both records remain separate in this simulation; neither titles nor external IDs cause a merge.",
      distinctSources.map((sourceRecordId) => ({ sourceRecordId, reservedIdUsedAsMapping: false })),
    );
  }

  return returnSimulation(
    "rejected",
    "Decision type is not supported by this synthetic adjudicator.",
  );
}

const thisFile = fileURLToPath(import.meta.url);
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === pathToFileURL(thisFile).href
) {
  const report = generateIdentityReviewQueue();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
