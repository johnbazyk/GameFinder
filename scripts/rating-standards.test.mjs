import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let standards;
let types;

before(async () => {
  server = await createServer({
    root: new URL("../", import.meta.url).pathname,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  standards = await server.ssrLoadModule("/src/lib/rating-standards.ts");
  types = await server.ssrLoadModule("/src/lib/types.ts");
});

after(async () => {
  await server?.close();
});

test("the universal scale has nine half-point ratings", () => {
  assert.deepEqual(standards.RATING_LEVELS, [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]);

  for (const score of standards.RATING_LEVELS) {
    assert.equal(standards.isRatingLevel(score), true);
  }

  for (const score of [0, 0.5, 2.1, 3.7, 5.5, 70, null, "4.0"]) {
    assert.equal(standards.isRatingLevel(score), false);
  }
});

test("the original seven dimensions remain structurally intact", () => {
  assert.deepEqual(Object.keys(standards.DIMENSION_CONCEPTS).sort(), [...types.DIMENSIONS].sort());
  assert.equal(types.DIMENSIONS.length, 7);
  assert.equal(standards.ORIGINAL_DIMENSION_ANCHORS_LOCKED, false);
});

test("each of the six Vibes has nine distinct operational anchors", () => {
  assert.equal(types.VIBE_IDS.length, 6);
  assert.deepEqual(Object.keys(standards.VIBE_RUBRIC).sort(), [...types.VIBE_IDS].sort());

  for (const id of types.VIBE_IDS) {
    const rubric = standards.VIBE_RUBRIC[id];
    assert.ok(rubric.description.length >= 30);
    assert.ok(rubric.assessmentFocus.length >= 30);
    assert.equal(Object.keys(rubric.anchors).length, 9);

    const anchors = standards.RATING_LEVELS.map((level) => rubric.anchors[level]);
    assert.ok(anchors.every((text) => text.length >= 35));
    assert.equal(new Set(anchors).size, 9);
  }
});

test("incomplete scoring records cannot pass the readiness gate", () => {
  const record = {
    gamefinderId: "gf:test",
    rubricVersion: standards.RATING_STANDARD_VERSION,
    dimensions: {},
    vibes: {},
  };

  const result = standards.evaluateRatingReadiness(record);
  assert.equal(result.publishable, false);
  assert.ok(result.blockers.length >= 14);
  assert.ok(result.blockers.some((message) => message.includes("seven-dimension anchors")));
});
