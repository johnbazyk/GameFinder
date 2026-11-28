import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { loadProposedIdentityLedger } from "./catalog-identity-ledger.mjs";
import {
  generateIdentityReviewQueue,
  simulateIdentityAdjudication,
  validateIdentityEvidence,
} from "./catalog-identity-review.mjs";

const reportPath = fileURLToPath(
  new URL("../docs/catalog-audit/identity-review-queue.json", import.meta.url),
);

function evidence({
  evidenceReferenceId,
  sourceRecordId,
  title,
  assertions,
  quality = "independently-corroborating",
  externalIdentifier = { provider: null, value: null },
  edition = null,
}) {
  return {
    simulation: true,
    evidenceReferenceId,
    sourceRecordId,
    source: {
      name: "Fictional Publisher Archive",
      publisherOrRightsHolder: "Fictional Publisher",
      urlOrDocumentReference: `fixture://archive/${evidenceReferenceId}`,
      classification: "synthetic-fixture",
    },
    recordedAt: "2026-11-04T00:00:00.000Z",
    relevantGame: {
      title,
      publisher: "Fictional Publisher",
      publicationYear: 2020,
      edition,
      printing: null,
      language: "en",
      regionalMarket: "US",
    },
    claimedExternalIdentifier: externalIdentifier,
    supportedAssertions: assertions,
    quality,
    humanReview: {
      status: "simulation-only",
      rationale: "Invented fixture for testing; not a real source review or approval.",
    },
  };
}

function decision(type, sourceRecordIds, rationale = "Synthetic test decision only.") {
  return { simulation: true, type, sourceRecordIds, rationale };
}

test("review report is deterministic, complete, and read-only", () => {
  const before = readFileSync(
    fileURLToPath(
      new URL("../docs/catalog-audit/proposed-identity-registry.json", import.meta.url),
    ),
    "utf8",
  );
  const first = generateIdentityReviewQueue();
  const second = generateIdentityReviewQueue();
  const saved = JSON.parse(readFileSync(reportPath, "utf8"));

  assert.deepEqual(first, second);
  assert.deepEqual(saved, first);
  assert.equal(first.summary.authoredRecordsReviewed, 143);
  assert.equal(first.summary.unresolvedAuthoredRecords, 17);
  assert.equal(first.summary.historicalOrphanReferences, 1);
  assert.equal(first.summary.unresolvedRelationships, 2);
  assert.equal(first.summary.reviewCases, 20);
  assert.equal(first.summary.writesPerformed, 0);
  assert.equal(first.summary.networkRequests, 0);
  assert.equal(first.summary.realApprovalsRecorded, 0);
  assert.equal(new Set(first.cases.map((entry) => entry.caseId)).size, 20);
  const sourceCaseIds = first.cases
    .filter((entry) => entry.caseType === "authored-source-identity")
    .map((entry) => entry.sourceRecordId);
  assert.equal(new Set(sourceCaseIds).size, 17);
  assert.equal(
    readFileSync(
      fileURLToPath(
        new URL("../docs/catalog-audit/proposed-identity-registry.json", import.meta.url),
      ),
      "utf8",
    ),
    before,
  );
});

test("queue keeps duplicate, suffix, Rhino Hero, orphan, and relationship cases unresolved", () => {
  const { cases } = generateIdentityReviewQueue();
  const records = loadProposedIdentityLedger().authoredRecords;
  const resistance = records.find((record) => record.titleSnapshot === "The Resistance");
  const sleepingQueens = records.find((record) => record.titleSnapshot === "Sleeping Queens");
  const resistanceCase = cases.find((entry) => entry.sourceRecordId === resistance.sourceRecordId);
  const sleepingCase = cases.find(
    (entry) => entry.sourceRecordId === sleepingQueens.sourceRecordId,
  );
  const suffixCases = cases.filter(
    (entry) =>
      entry.caseType === "authored-source-identity" &&
      entry.reason.includes("possible-suffixed-key-collision"),
  );
  const rhino = cases.find(
    (entry) =>
      entry.caseType === "authored-source-identity" && entry.titleSnapshot === "Rhino Hero",
  );
  const historical = cases.find((entry) => entry.caseType === "historical-orphan-reference");
  const relationships = cases.filter((entry) => entry.caseType === "catalog-relationship");

  assert.equal(resistanceCase.exactLegacyKey.value, "41114");
  assert.equal(sleepingCase.exactLegacyKey.value, "41114");
  assert.equal(resistanceCase.reservedPermanentId, resistance.reservedPermanentId);
  assert.equal(resistanceCase.permanentIdStatus, "reserved-only-not-a-canonical-mapping");
  assert.ok(
    resistanceCase.relatedSourceRecords.some(
      (entry) => entry.sourceRecordId === sleepingQueens.sourceRecordId,
    ),
  );
  assert.ok(
    sleepingCase.relatedSourceRecords.some(
      (entry) => entry.sourceRecordId === resistance.sourceRecordId,
    ),
  );
  assert.equal(suffixCases.length, 14);
  const expectedSuffixPairs = [
    ["31260", "31260-revised"],
    ["233078", "233078-short"],
    ["266810", "266810-architects"],
    ["266192", "266192-asia"],
    ["199792", "199792-bellfaire"],
    ["13", "13-junior"],
    ["21790", "21790-pitch"],
  ];
  for (const [numericKey, suffixedKey] of expectedSuffixPairs) {
    const numericCase = suffixCases.find((entry) => entry.exactLegacyKey.value === numericKey);
    const suffixedCase = suffixCases.find((entry) => entry.exactLegacyKey.value === suffixedKey);
    assert.ok(numericCase, `missing review case for ${numericKey}`);
    assert.ok(suffixedCase, `missing review case for ${suffixedKey}`);
    assert.ok(
      numericCase.relatedSourceRecords.some(
        (relatedRecord) => relatedRecord.sourceRecordId === suffixedCase.sourceRecordId,
      ),
    );
    assert.ok(
      suffixedCase.relatedSourceRecords.some(
        (relatedRecord) => relatedRecord.sourceRecordId === numericCase.sourceRecordId,
      ),
    );
  }
  assert.equal(rhino.exactLegacyKey.value, "209418");
  assert.equal(rhino.currentIdentityReviewStatus, "disputed");
  assert.equal(historical.exactLegacyKey.value, "318184");
  assert.equal(historical.reservedPermanentId, null);
  assert.equal(historical.currentIdentityReviewStatus, "orphaned");
  assert.equal(relationships.length, 2);
  assert.ok(relationships.every((entry) => entry.relationship.targetIdentityId === null));
  assert.ok(relationships.every((entry) => entry.evidenceAvailability.status === "none"));
});

test("synthetic independent evidence can simulate one source candidate without approving it", () => {
  const reviewCase = generateIdentityReviewQueue().cases.find(
    (entry) =>
      entry.titleSnapshot === "Rhino Hero" && entry.caseType === "authored-source-identity",
  );
  const fixture = evidence({
    evidenceReferenceId: "fixture-rhino-identity-1",
    sourceRecordId: reviewCase.sourceRecordId,
    title: reviewCase.titleSnapshot,
    assertions: ["source-record-to-game-identity"],
  });
  const result = simulateIdentityAdjudication(
    reviewCase,
    [fixture],
    decision("confirmed-identity-candidate", [reviewCase.sourceRecordId]),
  );

  assert.equal(result.status, "simulated-candidate-only");
  assert.equal(result.simulation, true);
  assert.equal(result.realApproval, false);
  assert.equal(result.rationale, "Synthetic test decision only.");
  assert.equal(result.reviewedEvidence[0].humanReview.status, "simulation-only");
  assert.equal(result.reviewedEvidence[0].source.classification, "synthetic-fixture");
  assert.equal(result.proposedIdentityLinks[0].reservedIdUsedAsMapping, false);
  assert.deepEqual(result.proposedReferenceMappings, []);
  assert.equal(result.ledgerWrites, 0);
  assert.equal(result.userReferenceWrites, 0);
});

test("game existence, title match, or numeric syntax alone cannot confirm an identity", () => {
  const reviewCase = generateIdentityReviewQueue().cases.find(
    (entry) =>
      entry.titleSnapshot === "Rhino Hero" && entry.caseType === "authored-source-identity",
  );
  const titleAndNumericOnly = evidence({
    evidenceReferenceId: "fixture-rhino-existence-only",
    sourceRecordId: reviewCase.sourceRecordId,
    title: reviewCase.titleSnapshot,
    assertions: ["game-existence"],
    externalIdentifier: { provider: "bgg", value: "209418" },
  });
  const noIdentityClaim = simulateIdentityAdjudication(
    reviewCase,
    [titleAndNumericOnly],
    decision("confirmed-identity-candidate", [reviewCase.sourceRecordId]),
  );
  assert.equal(noIdentityClaim.status, "rejected");
  assert.equal(noIdentityClaim.proposedIdentityLinks.length, 0);

  const numericOnly = evidence({
    evidenceReferenceId: "fixture-numeric-id-only",
    sourceRecordId: reviewCase.sourceRecordId,
    title: reviewCase.titleSnapshot,
    assertions: ["external-id-to-game-identity"],
    externalIdentifier: { provider: "bgg", value: "209418" },
  });
  const noGameIdentity = simulateIdentityAdjudication(
    reviewCase,
    [numericOnly],
    decision("confirmed-identity-candidate", [reviewCase.sourceRecordId]),
  );
  assert.equal(noGameIdentity.status, "rejected");
});

test("synthetic distinct-game and distinct-edition decisions require evidence for both records", () => {
  const reviewCase = generateIdentityReviewQueue().cases.find(
    (entry) =>
      entry.titleSnapshot === "The Resistance" && entry.caseType === "authored-source-identity",
  );
  const related = reviewCase.relatedSourceRecords.find(
    (record) => record.titleSnapshot === "Sleeping Queens",
  );
  const ids = [reviewCase.sourceRecordId, related.sourceRecordId];
  const distinctGames = simulateIdentityAdjudication(
    reviewCase,
    [
      evidence({
        evidenceReferenceId: "fixture-resistance-source",
        sourceRecordId: ids[0],
        title: "The Resistance",
        assertions: ["source-record-to-game-identity"],
      }),
      evidence({
        evidenceReferenceId: "fixture-queens-source",
        sourceRecordId: ids[1],
        title: "Sleeping Queens",
        assertions: ["source-record-to-game-identity"],
      }),
    ],
    decision("distinct-game", ids),
  );
  assert.equal(distinctGames.status, "simulated-separate-candidates");
  assert.equal(distinctGames.proposedIdentityLinks.length, 2);
  assert.deepEqual(distinctGames.proposedReferenceMappings, []);
  assert.equal(distinctGames.userReferenceWrites, 0);

  const incomplete = simulateIdentityAdjudication(
    reviewCase,
    [
      evidence({
        evidenceReferenceId: "fixture-only-first-record",
        sourceRecordId: ids[0],
        title: "The Resistance",
        assertions: ["source-record-to-game-identity"],
      }),
    ],
    decision("distinct-game", ids),
  );
  assert.equal(incomplete.status, "rejected");

  const sameTitleCase = {
    caseId: "fixture-same-title-editions",
    caseType: "authored-source-identity",
    sourceRecordId: "source-edition-one",
    titleSnapshot: "Fictional Harbor",
    relatedSourceRecords: [
      {
        sourceRecordId: "source-edition-two",
        titleSnapshot: "Fictional Harbor",
      },
    ],
  };
  const editions = simulateIdentityAdjudication(
    sameTitleCase,
    [
      evidence({
        evidenceReferenceId: "fixture-first-edition",
        sourceRecordId: "source-edition-one",
        title: "Fictional Harbor",
        edition: "First Edition",
        assertions: ["edition-distinction"],
      }),
      evidence({
        evidenceReferenceId: "fixture-second-edition",
        sourceRecordId: "source-edition-two",
        title: "Fictional Harbor",
        edition: "Second Edition",
        assertions: ["edition-distinction"],
      }),
    ],
    decision("distinct-edition", ["source-edition-one", "source-edition-two"]),
  );
  assert.equal(editions.status, "simulated-separate-candidates");
});

test("contradictory or mismatched evidence cannot confirm a source identity", () => {
  const reviewCase = generateIdentityReviewQueue().cases.find(
    (entry) =>
      entry.titleSnapshot === "Rhino Hero" && entry.caseType === "authored-source-identity",
  );
  const correct = evidence({
    evidenceReferenceId: "fixture-correct-identity-claim",
    sourceRecordId: reviewCase.sourceRecordId,
    title: reviewCase.titleSnapshot,
    assertions: ["source-record-to-game-identity"],
  });
  const contradiction = evidence({
    evidenceReferenceId: "fixture-contradictory-identity-claim",
    sourceRecordId: reviewCase.sourceRecordId,
    title: "Different Fictional Game",
    assertions: ["source-record-to-game-identity"],
    quality: "disputed",
  });
  const result = simulateIdentityAdjudication(
    reviewCase,
    [correct, contradiction],
    decision("confirmed-identity-candidate", [reviewCase.sourceRecordId]),
  );
  assert.equal(result.status, "rejected");
});

test("external-ID disputes must address the exact claim and never map identity or references", () => {
  const reviewCase = generateIdentityReviewQueue().cases.find(
    (entry) =>
      entry.titleSnapshot === "Rhino Hero" && entry.caseType === "authored-source-identity",
  );
  const disputedIdEvidence = evidence({
    evidenceReferenceId: "fixture-unrelated-numeric-id",
    sourceRecordId: reviewCase.sourceRecordId,
    title: reviewCase.titleSnapshot,
    assertions: ["external-id-to-game-identity"],
    quality: "disputed",
    externalIdentifier: { provider: "bgg", value: "123456" },
  });
  const unrelatedResult = simulateIdentityAdjudication(
    reviewCase,
    [disputedIdEvidence],
    decision("external-id-disputed-or-incorrect", [reviewCase.sourceRecordId]),
  );
  assert.equal(unrelatedResult.status, "rejected");
  const mismatchedTitleEvidence = {
    ...disputedIdEvidence,
    evidenceReferenceId: "fixture-rhino-id-wrong-game",
    claimedExternalIdentifier: { provider: "bgg", value: "209418" },
    relevantGame: { ...disputedIdEvidence.relevantGame, title: "Different Fictional Game" },
  };
  const mismatchedTitleResult = simulateIdentityAdjudication(
    reviewCase,
    [mismatchedTitleEvidence],
    decision("external-id-disputed-or-incorrect", [reviewCase.sourceRecordId]),
  );
  assert.equal(mismatchedTitleResult.status, "rejected");

  const exactClaimEvidence = evidence({
    evidenceReferenceId: "fixture-disputed-rhino-id",
    sourceRecordId: reviewCase.sourceRecordId,
    title: reviewCase.titleSnapshot,
    assertions: ["external-id-to-game-identity"],
    quality: "disputed",
    externalIdentifier: { provider: "bgg", value: "209418" },
  });
  const result = simulateIdentityAdjudication(
    reviewCase,
    [exactClaimEvidence],
    decision("external-id-disputed-or-incorrect", [reviewCase.sourceRecordId]),
  );
  assert.equal(result.status, "simulated-external-id-review-only");
  assert.equal(result.proposedIdentityLinks.length, 0);
  assert.deepEqual(result.proposedReferenceMappings, []);
  assert.equal(result.ledgerWrites, 0);
  assert.equal(result.userReferenceWrites, 0);
});

test("expansion target identifiers never resolve a relationship target", () => {
  const relationshipCase = generateIdentityReviewQueue().cases.find(
    (entry) =>
      entry.caseType === "catalog-relationship" &&
      entry.relationship.targetTitleSnapshot === "European Expansion",
  );
  const sourceEvidence = evidence({
    evidenceReferenceId: "fixture-wingspan-source",
    sourceRecordId: relationshipCase.sourceRecordId,
    title: relationshipCase.titleSnapshot,
    assertions: ["source-record-to-game-identity"],
  });
  const result = simulateIdentityAdjudication(
    relationshipCase,
    [sourceEvidence],
    decision("confirmed-identity-candidate", [relationshipCase.sourceRecordId]),
  );

  assert.equal(result.status, "simulated-candidate-only");
  assert.equal(result.proposedIdentityLinks.length, 1);
  assert.deepEqual(result.proposedReferenceMappings, []);
  assert.equal(relationshipCase.relationship.targetIdentityId, null);
});

test("missing, real-looking, forged, and cross-record evidence or decisions fail closed", () => {
  const reviewCase = generateIdentityReviewQueue().cases.find(
    (entry) =>
      entry.titleSnapshot === "Rhino Hero" && entry.caseType === "authored-source-identity",
  );
  const missingSource = evidence({
    evidenceReferenceId: "fixture-missing-source",
    sourceRecordId: reviewCase.sourceRecordId,
    title: reviewCase.titleSnapshot,
    assertions: ["source-record-to-game-identity"],
  });
  delete missingSource.source.urlOrDocumentReference;
  assert.throws(() => validateIdentityEvidence(missingSource), /incomplete/);

  const nonSynthetic = evidence({
    evidenceReferenceId: "fixture-claimed-real-source",
    sourceRecordId: reviewCase.sourceRecordId,
    title: reviewCase.titleSnapshot,
    assertions: ["source-record-to-game-identity"],
  });
  nonSynthetic.source.classification = "licensed-provider";
  assert.throws(() => validateIdentityEvidence(nonSynthetic), /simulation-only/);

  const valid = evidence({
    evidenceReferenceId: "fixture-valid-record",
    sourceRecordId: reviewCase.sourceRecordId,
    title: reviewCase.titleSnapshot,
    assertions: ["source-record-to-game-identity"],
  });
  assert.throws(
    () =>
      simulateIdentityAdjudication(reviewCase, [valid], {
        ...decision("confirmed-identity-candidate", [reviewCase.sourceRecordId]),
        simulation: false,
      }),
    /only explicit synthetic simulations/,
  );
  assert.throws(
    () =>
      simulateIdentityAdjudication(
        reviewCase,
        [valid],
        decision("verified-and-approved", [reviewCase.sourceRecordId]),
      ),
    /only explicit synthetic simulations/,
  );
  assert.throws(
    () =>
      simulateIdentityAdjudication(
        reviewCase,
        [valid],
        decision("confirmed-identity-candidate", ["different-source-record"]),
      ),
    /only explicit synthetic simulations/,
  );
  assert.throws(
    () =>
      simulateIdentityAdjudication(
        reviewCase,
        [valid],
        decision("confirmed-identity-candidate", ["gfc_custom-owned-by-another-user"]),
      ),
    /only explicit synthetic simulations/,
  );
});

test("incomplete evidence supports only an unresolved insufficiency outcome", () => {
  const reviewCase = generateIdentityReviewQueue().cases.find(
    (entry) =>
      entry.titleSnapshot === "Rhino Hero" && entry.caseType === "authored-source-identity",
  );
  const incompleteEvidence = evidence({
    evidenceReferenceId: "fixture-incomplete-existence",
    sourceRecordId: reviewCase.sourceRecordId,
    title: reviewCase.titleSnapshot,
    assertions: ["game-existence"],
    quality: "incomplete",
  });
  const result = simulateIdentityAdjudication(
    reviewCase,
    [incompleteEvidence],
    decision(
      "insufficient-evidence",
      [reviewCase.sourceRecordId],
      "Fixture lacks identity corroboration.",
    ),
  );

  assert.equal(result.status, "unresolved");
  assert.equal(result.proposedIdentityLinks.length, 0);
  assert.equal(result.ledgerWrites, 0);

  const duplicateReview = simulateIdentityAdjudication(
    reviewCase,
    [incompleteEvidence],
    decision(
      "potential-duplicate-needs-evidence",
      [reviewCase.sourceRecordId],
      "Keep the possible duplicate unresolved pending independent evidence.",
    ),
  );
  assert.equal(duplicateReview.status, "unresolved");
  assert.equal(duplicateReview.proposedIdentityLinks.length, 0);
});

test("historical references stay orphaned and explicit choices require a separate reference decision", () => {
  const historical = generateIdentityReviewQueue().cases.find(
    (entry) => entry.caseType === "historical-orphan-reference",
  );
  const orphanResult = simulateIdentityAdjudication(
    historical,
    [],
    decision("orphaned-historical-reference", []),
  );
  assert.equal(orphanResult.status, "unresolved");
  assert.deepEqual(orphanResult.proposedReferenceMappings, []);
  assert.equal(orphanResult.userReferenceWrites, 0);

  const referenceDecision = simulateIdentityAdjudication(
    historical,
    [],
    decision("requires-reference-specific-human-decision", []),
  );
  assert.equal(referenceDecision.status, "requires-reference-specific-human-decision");
  assert.deepEqual(referenceDecision.proposedReferenceMappings, []);
});

test("identity evidence cannot alter metadata, artwork rights, or reserved IDs", () => {
  const ledgerBefore = readFileSync(
    fileURLToPath(
      new URL("../docs/catalog-audit/proposed-identity-registry.json", import.meta.url),
    ),
    "utf8",
  );
  const ledgerSnapshot = JSON.parse(ledgerBefore);
  const reviewCase = generateIdentityReviewQueue().cases.find(
    (entry) =>
      entry.titleSnapshot === "Rhino Hero" && entry.caseType === "authored-source-identity",
  );
  const simulated = simulateIdentityAdjudication(
    reviewCase,
    [
      evidence({
        evidenceReferenceId: "fixture-identity-only",
        sourceRecordId: reviewCase.sourceRecordId,
        title: reviewCase.titleSnapshot,
        assertions: ["source-record-to-game-identity"],
      }),
    ],
    decision("confirmed-identity-candidate", [reviewCase.sourceRecordId]),
  );
  const ledgerAfter = JSON.parse(
    readFileSync(
      fileURLToPath(
        new URL("../docs/catalog-audit/proposed-identity-registry.json", import.meta.url),
      ),
      "utf8",
    ),
  );

  assert.equal(simulated.realApproval, false);
  assert.equal(simulated.ledgerWrites, 0);
  assert.equal("metadataRights" in simulated, false);
  assert.equal("artworkRights" in simulated, false);
  assert.equal(
    ledgerAfter.authoredRecords.find((row) => row.sourceRecordId === reviewCase.sourceRecordId)
      .reservedPermanentId,
    reviewCase.reservedPermanentId,
  );
  assert.deepEqual(ledgerAfter, ledgerSnapshot);
  assert.equal(
    ledgerAfter.proposedIdentities.every((identity) => identity.status === "proposed"),
    true,
  );
  assert.ok(
    ledgerAfter.proposedIdentities.every((identity) => identity.edition.status === "missing"),
  );
});
