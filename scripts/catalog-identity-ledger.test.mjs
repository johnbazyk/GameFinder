import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { collectCurrentCatalogAudit } from "./catalog-audit.mjs";
import {
  buildProposedIdentityLedger,
  classifyProposedLegacyAlias,
  loadProposedIdentityLedger,
  validateProposedIdentityLedger,
} from "./catalog-identity-ledger.mjs";
import { collectIdentityDryRun } from "./catalog-identity-dry-run.mjs";

test("saved proposal maps every authored row without converting proposals into verified identities", async () => {
  const audit = await collectCurrentCatalogAudit();
  const ledger = loadProposedIdentityLedger();
  const summary = validateProposedIdentityLedger(ledger, audit);

  assert.deepEqual(
    {
      authoredRecords: summary.authoredRecords,
      runtimeVisibleRecords: summary.runtimeVisibleRecords,
      standaloneRecommendationPoolRecords: summary.standaloneRecommendationPoolRecords,
      uniqueSourceRecordIds: summary.uniqueSourceRecordIds,
      reservedPermanentIds: summary.reservedPermanentIds,
      proposedIdentityRecords: summary.proposedIdentityRecords,
      unresolvedSourceRecords: summary.unresolvedSourceRecords,
      verifiedIdentities: summary.verifiedIdentities,
      duplicateLegacyKeyRecords: summary.duplicateLegacyKeyRecords,
      possibleSuffixedKeyCollisionRecords: summary.possibleSuffixedKeyCollisionRecords,
    },
    {
      authoredRecords: 143,
      runtimeVisibleRecords: 142,
      standaloneRecommendationPoolRecords: 135,
      uniqueSourceRecordIds: 143,
      reservedPermanentIds: 143,
      proposedIdentityRecords: 126,
      unresolvedSourceRecords: 17,
      verifiedIdentities: 0,
      duplicateLegacyKeyRecords: 2,
      possibleSuffixedKeyCollisionRecords: 14,
    },
  );
  assert.equal(ledger.activation, "proposal-only");
  assert.equal(summary.writesPerformed, 0);
  assert.equal(summary.networkRequests, 0);
  assert.equal(new Set(ledger.proposedIdentities.map((identity) => identity.id)).size, 126);
});

test("repeated read-only inventory reuses the saved UUID assignments", async () => {
  const first = await collectIdentityDryRun();
  const second = await collectIdentityDryRun();
  const ledgerPath = fileURLToPath(
    new URL("../docs/catalog-audit/proposed-identity-registry.json", import.meta.url),
  );
  const ledgerContent = readFileSync(ledgerPath, "utf8");
  const snapshot = (result) =>
    result.catalogInventory.records.map((record) => [
      record.sourceRecordId,
      record.reservedPermanentId,
      record.proposedPermanentId,
      record.identityReviewStatus,
      record.reviewReasons,
    ]);

  assert.deepEqual(snapshot(first), snapshot(second));
  assert.equal(first.catalogInventory.standaloneRecommendationPoolRecords, 135);
  assert.equal(first.writesPerformed, 0);
  assert.equal(first.proposedReferenceReview.writesPerformed, 0);
  assert.equal(first.networkRequests, 0);
  assert.equal(readFileSync(ledgerPath, "utf8"), ledgerContent);
});

test("ledger initialization is explicit and refuses to overwrite saved assignments", () => {
  const ledgerPath = fileURLToPath(
    new URL("../docs/catalog-audit/proposed-identity-registry.json", import.meta.url),
  );
  const scriptPath = fileURLToPath(new URL("./catalog-identity-ledger.mjs", import.meta.url));
  const before = readFileSync(ledgerPath, "utf8");
  const result = spawnSync(process.execPath, [scriptPath, "--initialize"], {
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing to overwrite the saved identity ledger/);
  assert.equal(readFileSync(ledgerPath, "utf8"), before);
});

test("historical and disputed aliases remain ambiguous, review-only, or orphaned", () => {
  const ledger = loadProposedIdentityLedger();
  const duplicateAlias = classifyProposedLegacyAlias(ledger, "legacy-bgg", "41114");
  const proposedAlias = classifyProposedLegacyAlias(ledger, "legacy-bgg", "178900");

  assert.equal(duplicateAlias.classification, "ambiguous");
  assert.equal(duplicateAlias.candidateSourceRecordIds.length, 2);
  assert.equal(duplicateAlias.proposedPermanentIdCandidates.length, 0);
  assert.equal("reservedPermanentIdCandidates" in duplicateAlias, false);
  assert.equal(proposedAlias.classification, "requires-identity-review");
  assert.equal(proposedAlias.proposedPermanentIdCandidates.length, 1);
  assert.equal(
    classifyProposedLegacyAlias(ledger, "legacy-bgg", "31260-revised").classification,
    "requires-identity-review",
  );
  assert.deepEqual(
    classifyProposedLegacyAlias(ledger, "legacy-bgg", "31260-revised")
      .proposedPermanentIdCandidates,
    [],
  );
  assert.equal(
    classifyProposedLegacyAlias(ledger, "legacy-bgg", "318184").classification,
    "orphaned",
  );
  assert.equal(
    classifyProposedLegacyAlias(ledger, "legacy-bgg", "209418").classification,
    "requires-identity-review",
  );
  assert.equal(classifyProposedLegacyAlias(ledger, "legacy-bgg", "").classification, "invalid");
  assert.equal(ledger.historicalAliasReviewQueue[0].canonicalIdentityId, null);
});

test("ledger validation detects changed source rows and fabricated verification", async () => {
  const audit = await collectCurrentCatalogAudit();
  const ledger = loadProposedIdentityLedger();
  const changedAudit = {
    ...audit,
    rows: audit.rows.map((row, index) =>
      index === 0
        ? {
            ...row,
            title: "Changed source title",
            bggId: "999999",
            internalId: "gf:legacy:changed-source-title:999999",
            game: { ...row.game, name: "Changed source title", bggId: "999999" },
          }
        : row,
    ),
  };
  assert.throws(
    () => validateProposedIdentityLedger(ledger, changedAudit),
    /Source identity mismatch; explicit identity review required/,
  );

  const reorderedAudit = { ...audit, rows: [...audit.rows].reverse() };
  const reorderedSummary = validateProposedIdentityLedger(ledger, reorderedAudit);
  assert.equal(reorderedSummary.proposedIdentityRecords, 126);

  const fabricated = structuredClone(ledger);
  fabricated.proposedIdentities[0].status = "verified";
  assert.throws(() => validateProposedIdentityLedger(fabricated, audit), /improperly verified/);

  const fabricatedAlias = structuredClone(ledger);
  fabricatedAlias.authoredRecords[0].legacyAlias.status = "verified";
  assert.throws(
    () => validateProposedIdentityLedger(fabricatedAlias, audit),
    /altered identity trust status/,
  );
});

test("all seven numeric-prefix/suffix pairs remain in the identity review queue", async () => {
  const audit = await collectCurrentCatalogAudit();
  const ledger = loadProposedIdentityLedger();
  const expectedPairs = [
    ["31260", "31260-revised"],
    ["233078", "233078-short"],
    ["266810", "266810-architects"],
    ["266192", "266192-asia"],
    ["199792", "199792-bellfaire"],
    ["13", "13-junior"],
    ["21790", "21790-pitch"],
  ];
  assert.deepEqual(
    audit.summary.potentialAliasCollisions.map((pair) => [pair.numericBggId, pair.aliasBggId]),
    expectedPairs,
  );
  const collisionRows = ledger.authoredRecords.filter((record) =>
    record.reviewReasons.includes("possible-suffixed-key-collision"),
  );
  assert.equal(collisionRows.length, 14);
  assert.ok(collisionRows.every((record) => record.proposedIdentityId === null));
});

test("one-time proposal allocation is independent of title and source ordering", () => {
  const rows = [
    {
      internalId: "source:first",
      title: "Same Title",
      bggId: "90001",
      visible: true,
      game: { name: "Same Title", expansions: [] },
      duplicateExternalId: false,
      identifierCollisionFindings: [],
    },
    {
      internalId: "source:second",
      title: "Same Title",
      bggId: "90002",
      visible: true,
      game: { name: "Same Title", expansions: [] },
      duplicateExternalId: false,
      identifierCollisionFindings: [],
    },
  ];
  let nextId = 1;
  const allocateUuid = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`;
  const ledger = buildProposedIdentityLedger(
    { rows },
    { allocateUuid, generatedAt: "2026-01-01T00:00:00.000Z" },
  );

  assert.notEqual(ledger.proposedIdentities[0].id, ledger.proposedIdentities[1].id);
  assert.deepEqual(
    ledger.authoredRecords.map((record) => record.proposedIdentityId),
    ["gf:00000000-0000-4000-8000-000000000001", "gf:00000000-0000-4000-8000-000000000003"],
  );
  assert.equal(ledger.authoredRecords[0].sourceRecordId, "00000000-0000-4000-8000-000000000002");
});
