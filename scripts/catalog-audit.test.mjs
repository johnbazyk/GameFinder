import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AUDIT_RUBRIC_DIMENSIONS,
  AUDIT_VIBES,
  auditCatalog,
  collectCurrentCatalogAudit,
  renderCatalogAuditCsv,
} from "./catalog-audit.mjs";

function fixture(overrides = {}) {
  return {
    name: "Fixture Game",
    bggId: "12345",
    internalId: "gf:legacy:fixture-game:12345",
    yearPublished: 2020,
    publisher: "Fixture Publisher",
    edition: "First edition",
    players: { min: 2, max: 4, best: [3, 4] },
    playtime: { min: 30, max: 60, avg: 45 },
    age: { publisher: 8, community: 8 },
    rubric: Object.fromEntries(AUDIT_RUBRIC_DIMENSIONS.map((dimension) => [dimension, 50])),
    computedVibeScores: Object.fromEntries(AUDIT_VIBES.map((vibe) => [vibe, 2.5])),
    vibes: [],
    bggRating: 7,
    adultContent: false,
    catalogRecord: {
      sources: [
        { field: "players", verification: "unverified" },
        { field: "publisherMinimumAge", verification: "unverified" },
        { field: "maximumListedPlaytimeMinutes", verification: "unverified" },
        { field: "adultContent", verification: "unverified" },
      ],
    },
    ...overrides,
  };
}

test("catalog audit detects duplicate IDs and keeps readiness separate from structure", () => {
  const first = fixture({ name: "First title" });
  const second = fixture({
    name: "Second title",
    internalId: "gf:legacy:second-title:12345",
  });
  const audit = auditCatalog([first, second], {
    visibleInternalIds: new Set([first.internalId]),
  });

  assert.equal(audit.summary.authoredRecords, 2);
  assert.equal(audit.summary.visibleRecords, 1);
  assert.equal(audit.summary.uniqueBggIds, 1);
  assert.equal(audit.summary.structurallyValid, 2);
  assert.equal(audit.summary.verifiedHardFilterRecords, 0);
  assert.equal(audit.summary.authorizedRulebookRecords, 0);
  assert.ok(audit.rows.every((row) => row.discoverableReadiness === "Blocked by critical issue"));
  assert.ok(audit.rows.every((row) => row.recommendableReadiness === "Needs review"));
  assert.ok(audit.rows.every((row) => row.teachableReadiness === "Blocked by critical issue"));
});

test("catalog audit reports structural contradictions and does not infer missing data as verified", () => {
  const record = fixture({
    bggId: "local-alias",
    internalId: "invalid-id",
    publisher: null,
    edition: null,
    players: { min: 4, max: 2, best: [3] },
    playtime: { min: 30, max: 20, avg: 25 },
    rubric: { ...fixture().rubric, strategy: 101 },
    bggRating: 11,
    adultContent: undefined,
    catalogRecord: { sources: [] },
  });
  const audit = auditCatalog([record]);
  const [row] = audit.rows;

  assert.equal(row.structuralStatus, "Fails structural checks");
  assert.match(row.structuralErrors.join(" "), /player range/);
  assert.match(row.structuralErrors.join(" "), /internal GameFinder ID/);
  assert.match(row.structuralErrors.join(" "), /playtime/);
  assert.match(row.structuralErrors.join(" "), /rubric dimension/);
  assert.match(row.structuralErrors.join(" "), /BGG rating/);
  assert.equal(row.discoverableReadiness, "Blocked by critical issue");
  assert.equal(row.provenanceStatus, "Legacy unverified; no supporting source URLs in catalog records.");
  assert.equal(row.rulebookPermissionStatus, "not recorded");
  assert.equal(audit.summary.verifiedHardFilterRecords, 0);
});

test("user-entered facts are not counted as independent hard-filter verification", () => {
  const record = fixture({
    catalogRecord: {
      sources: [
        "players",
        "publisherMinimumAge",
        "maximumListedPlaytimeMinutes",
        "adultContent",
      ].map((field) => ({
        field,
        sourceClass: "user-entered",
        verification: "verified",
        sourceUrl: "https://example.invalid",
      })),
    },
  });
  const audit = auditCatalog([record]);

  assert.equal(audit.summary.verifiedHardFilterRecords, 0);
  assert.ok(Object.values(audit.rows[0].hardFilterVerification).every((status) => status !== "verified"));
});

test("potential numeric-prefix identifier collisions require review for both records", () => {
  const numeric = fixture();
  const alias = fixture({
    name: "Alias Game",
    bggId: "12345-short",
    internalId: "gf:legacy:alias-game:12345-short",
  });
  const audit = auditCatalog([numeric, alias]);

  assert.equal(audit.summary.potentialAliasCollisions.length, 1);
  assert.equal(audit.summary.potentialAliasCollisionRecords, 2);
  assert.ok(audit.rows.every((row) => row.discoverableReadiness === "Needs review"));
  assert.ok(audit.rows.every((row) => row.identifierCollisionFindings.length === 1));
});

test("CSV output includes every authored row and quotes data safely", () => {
  const audit = auditCatalog([fixture({ name: 'A "quoted", game' })]);
  const csv = renderCatalogAuditCsv(audit);

  assert.match(csv, /"A ""quoted"", game"/);
  assert.match(csv, /recommendable_readiness/);
  assert.equal(csv.trimEnd().split("\n").length, 2);
});

test("current audit covers every authored source record, including the deduplicated collision", async () => {
  const audit = await collectCurrentCatalogAudit();

  assert.equal(audit.summary.authoredRecords, 143);
  assert.equal(audit.summary.visibleRecords, 142);
  assert.equal(audit.summary.uniqueInternalIds, 143);
  assert.equal(audit.summary.uniqueBggIds, 142);
  assert.equal(audit.summary.structurallyInvalid, 1);
  assert.equal(audit.summary.provisionallyDiscoverable, 127);
  assert.equal(audit.summary.discoverableReadiness["Needs review"], 14);
  assert.equal(audit.summary.discoverableReadiness["Blocked by critical issue"], 2);
  assert.equal(audit.summary.verifiedHardFilterRecords, 0);
  assert.equal(audit.summary.validatedVibeRecords, 0);
  assert.equal(audit.summary.authorizedRulebookRecords, 0);
  assert.equal(audit.summary.adultContentExplicitRecords, 0);
  assert.equal(audit.summary.adultContentDefaultedFalseRecords, 139);
  assert.equal(audit.summary.adultContentCuratedPositives.length, 4);
  assert.equal(audit.summary.editionTitleCues.length, 1);
  assert.equal(audit.summary.editionTitleCues[0].title, "Twilight Imperium (4th)");
  assert.equal(audit.summary.unclassifiedGameKinds, 143);
  assert.equal(audit.summary.ageDisagreements.length, 50);
  assert.equal(audit.summary.visibleAgeDisagreementCount, 49);
  assert.equal(audit.summary.duplicateBggGroups.length, 1);
  assert.equal(audit.summary.potentialAliasCollisions.length, 7);
  assert.equal(audit.summary.potentialAliasCollisionRecords, 14);
  assert.equal(audit.summary.playtimeContradictions.length, 1);
  assert.equal(audit.summary.unresolvedExpansionReferences.length, 2);
  assert.equal(new Set(audit.rows.map((row) => row.internalId)).size, 143);
  assert.equal(new Set(audit.rows.map((row) => row.title)).size, 143);
  const readinessRows = audit.rows.reduce((counts, row) => {
    counts[row.discoverableReadiness] = (counts[row.discoverableReadiness] ?? 0) + 1;
    return counts;
  }, {});
  assert.deepEqual(readinessRows, {
    "Provisionally usable": 127,
    "Needs review": 14,
    "Blocked by critical issue": 2,
  });
  const identityReviewRows = audit.rows.filter(
    (row) => row.discoverableReadiness === "Needs review",
  );
  assert.ok(identityReviewRows.every((row) => row.identifierCollisionFindings.length > 0));
  const blockedRows = audit.rows.filter(
    (row) => row.discoverableReadiness === "Blocked by critical issue",
  );
  assert.deepEqual(
    blockedRows.map((row) => [row.title, row.bggId, row.visible]).sort(),
    [
      ["Sleeping Queens", "41114", false],
      ["The Resistance", "41114", true],
    ].sort(),
  );
  const sleepingQueens = audit.rows.find((row) => row.title === "Sleeping Queens");
  assert.equal(sleepingQueens.publisherAge, 8);
  assert.equal(sleepingQueens.communityAge, 5);
  assert.equal(sleepingQueens.visible, false);
  const sheriff = audit.rows.find((row) => row.title === "Sheriff of Nottingham");
  assert.equal(sheriff.discoverableReadiness, "Provisionally usable");
  assert.equal(sheriff.recommendableReadiness, "Needs review");
  assert.deepEqual(sheriff.criticalIssues, []);
  assert.equal(sheriff.fieldProvenance["playtime.average"].sourceClass, "legacy-unknown");
  assert.equal(sheriff.fieldProvenance.relationships.sourceClass, "missing");
  assert.deepEqual(audit.summary.boardScoreBuckets, { "1.4": 38, "2.6": 55, "4.3": 50 });
  assert.deepEqual(
    audit.summary.potentialVibeReviewCandidates.map((row) => row.title),
    ["Sagrada", "Boggle", "Connect Four", "Sequence", "Stockpile"],
  );
});
