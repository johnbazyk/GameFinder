import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let gate;
let prototype;
let standards;
let types;

before(async () => {
  server = await createServer({
    root: new URL("../", import.meta.url).pathname,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  [gate, prototype, standards, types] = await Promise.all([
    server.ssrLoadModule("/src/lib/catalog-rating-gate.ts"),
    server.ssrLoadModule("/src/lib/catalog-recommendation-prototype.ts"),
    server.ssrLoadModule("/src/lib/rating-standards.ts"),
    server.ssrLoadModule("/src/lib/types.ts"),
  ]);
});

after(async () => {
  await server?.close();
});

function snapshot() {
  return prototype.createSyntheticPublishedCatalogSnapshot();
}

function approved(score) {
  return {
    score,
    status: "approved",
    evidence: [
      {
        sourceKind: "structured-playtest",
        reference: "fictional-test-only",
        observation: "Synthetic scoring test.",
      },
    ],
    reviewerId: "test-reviewer",
    reviewedAt: "2026-01-10",
    approverId: "test-approver",
    approvedAt: "2026-01-11",
  };
}

function assessmentFor(record) {
  return {
    gamefinderId: record.gamefinderId,
    rubricVersion: standards.RATING_STANDARD_VERSION,
    dimensions: Object.fromEntries(types.DIMENSIONS.map((dimension) => [dimension, approved(3)])),
    vibes: Object.fromEntries(
      types.VIBE_IDS.map((vibe) => [vibe, approved(record.vibeScores[vibe] ?? 3)]),
    ),
  };
}

test("the old nine-game fixture remains intact", () => {
  const source = snapshot();
  assert.equal(source.records.length, 9);
  assert.ok(source.records.every((record) => record.ratingAssessment === undefined));
});

test("the strict gate rejects records without 13 ratings", () => {
  const source = snapshot();
  const audit = gate.auditEmbeddedCatalogRatingCoverage(source);

  assert.equal(audit.totalGames, 9);
  assert.equal(audit.blockedGames, 9);
  assert.equal(audit.publishable, false);

  assert.throws(
    () => gate.assertScoredPublishedCatalogSnapshot(source),
    /Scored catalog publication blocked/,
  );
});

test("embedded scoring packages retain seven plus six fields", () => {
  const source = structuredClone(snapshot());
  source.records[0].ratingAssessment = assessmentFor(source.records[0]);

  const assessment = source.records[0].ratingAssessment;

  assert.equal(Object.keys(assessment.dimensions).length, 7);

  assert.equal(Object.keys(assessment.vibes).length, 6);

  assert.equal(
    Object.keys(assessment.dimensions).length + Object.keys(assessment.vibes).length,
    13,
  );

  // The original dimension anchors are not approved yet.
  assert.equal(gate.auditEmbeddedCatalogRatingCoverage(source).publishable, false);
});

test("invalid half-point ratings block publication", () => {
  const source = structuredClone(snapshot());
  const assessment = assessmentFor(source.records[0]);

  assessment.dimensions.strategy.score = 3.7;
  source.records[0].ratingAssessment = assessment;

  const audit = gate.auditEmbeddedCatalogRatingCoverage(source);

  assert.ok(
    audit.rows[0].blockers.some((reason) => reason.includes("dimension.strategy: invalid rating")),
  );
});

test("existing game data is never changed by the audit", () => {
  const source = snapshot();
  const before = structuredClone(source);

  gate.auditEmbeddedCatalogRatingCoverage(source);

  assert.deepEqual(source, before);
});
