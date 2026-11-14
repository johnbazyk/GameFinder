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

function approvedRating(score) {
  return {
    score,
    status: "approved",
    evidence: [
      {
        sourceKind: "structured-playtest",
        reference: "synthetic-test-only",
        observation: "Fictional test observation.",
      },
    ],
    reviewerId: "test-reviewer",
    reviewedAt: "2026-01-10",
    approverId: "test-approver",
    approvedAt: "2026-01-11",
  };
}

function sampleAssessment(record) {
  return {
    gamefinderId: record.gamefinderId,
    rubricVersion: standards.RATING_STANDARD_VERSION,
    dimensions: Object.fromEntries(
      types.DIMENSIONS.map((dimension) => [dimension, approvedRating(3)]),
    ),
    vibes: Object.fromEntries(types.VIBE_IDS.map((vibe) => [vibe, approvedRating(3)])),
  };
}

test("the existing synthetic catalog remains available for testing", () => {
  const source = snapshot();
  assert.equal(source.records.length, 9);
});

test("nine games without approved assessments all fail closed", () => {
  const audit = gate.auditCatalogRatingCoverage(snapshot(), []);

  assert.equal(audit.totalGames, 9);
  assert.equal(audit.readyGames, 0);
  assert.equal(audit.blockedGames, 9);
  assert.equal(audit.publishable, false);

  assert.throws(
    () => gate.assertCatalogRatingsApproved(snapshot(), []),
    /Catalog scoring approval blocked/,
  );
});

test("a complete-looking package cannot bypass unapproved anchors", () => {
  const source = snapshot();
  const assessment = sampleAssessment(source.records[0]);

  const audit = gate.auditCatalogRatingCoverage(source, [assessment]);

  assert.equal(audit.publishable, false);
  assert.ok(audit.globalBlockers.some((reason) => reason.includes("seven-dimension anchors")));
});

test("Vibe assessments must agree with catalog Vibe scores", () => {
  const source = snapshot();
  const assessment = sampleAssessment(source.records[0]);

  assessment.vibes.luck.score = 1.5;

  const audit = gate.auditCatalogRatingCoverage(source, [assessment]);

  const first = audit.rows[0];

  assert.ok(first.blockers.some((reason) => reason.includes("luck: catalog rating differs")));
});

test("duplicate and unknown identities cannot pass the gate", () => {
  const source = snapshot();
  const assessment = sampleAssessment(source.records[0]);

  const audit = gate.auditCatalogRatingCoverage(source, [
    assessment,
    structuredClone(assessment),
    {
      ...structuredClone(assessment),
      gamefinderId: "gf:unknown",
    },
  ]);

  assert.equal(audit.publishable, false);

  assert.ok(audit.rows[0].blockers.includes("Duplicate assessment packages."));

  assert.ok(audit.globalBlockers.some((reason) => reason.includes("absent from the snapshot")));
});

test("the scoring gate does not change source game data", () => {
  const source = snapshot();
  const before = structuredClone(source);

  gate.auditCatalogRatingCoverage(source, []);

  assert.deepEqual(source, before);
});
