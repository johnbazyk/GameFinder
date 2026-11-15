import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
let server, p, app, scoring, catalog, pilot, anchors;
before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  [p, app, scoring, catalog, pilot, anchors] = await Promise.all(
    [
      "/src/lib/rating-policy.ts",
      "/src/lib/application-ratings.ts",
      "/src/lib/scoring.ts",
      "/src/lib/catalog.ts",
      "/src/lib/rating-pilot.ts",
      "/src/lib/rating-anchors-03.ts",
    ].map((x) => server.ssrLoadModule(x)),
  );
});
after(async () => {
  await server?.close();
});
const context = (patch = {}) => ({
  players: 2,
  ageBand: null,
  maxTimeMin: null,
  timeOver60: false,
  vibes: [],
  exactTraits: null,
  ratingMode: "beta",
  ratingSeed: "test",
  ...patch,
});
const user = { owned: ["3931"], wishlist: [], plays: [], vibeWeights: {} };
const identity = (games) => games;
const game = () => catalog.GAMES.find((g) => g.bggId === "3931");
const rec = () => structuredClone(pilot.RATING_PILOT[0]);
const scope = (r) => ({
  players: r.playerCounts[0],
  edition: r.edition,
  mode: r.mode,
  ageBand: "8-10",
});
test("0.3 has all 11 constructs and exact shared Luck/Strategy keys", () => {
  assert.equal(p.RATING_KEYS.length, 11);
  assert.equal(Object.keys(anchors.RATING_ANCHORS).length, 11);
  for (const k of p.RATING_KEYS)
    assert.equal(Object.keys(anchors.RATING_ANCHORS[k].anchors).length, 9);
});
test("canonical scale rejects malformed input", () => {
  for (const x of [0, 3.7, NaN, Infinity, "3", true, null, 6])
    assert.equal(p.validRating(x), false);
  for (const x of [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]) assert.equal(p.validRating(x), true);
});
test("proposed assessments require beta opt-in and never imply review", () => {
  const r = rec();
  assert.equal(p.resolveRating(r, "strategy", scope(r), "reviewed").value, null);
  assert.equal(p.resolveRating(r, "strategy", scope(r), "beta").label, "Provisional");
  r.ratings.strategy.beta.eligible = false;
  assert.equal(p.resolveRating(r, "strategy", scope(r), "beta").value, null);
});
test("reviewed path can succeed with real-shaped review metadata, not a hardcoded false", () => {
  const r = rec();
  r.ratings.strategy.status = "reviewed";
  assert.equal(p.resolveRating(r, "strategy", scope(r), "reviewed").value, null);
  r.ratings.strategy.review = { by: "human-test-fixture", at: "2026-11-14" };
  assert.equal(p.resolveRating(r, "strategy", scope(r), "reviewed").label, "Reviewed");
});
test("missing, stale, incomplete and blocked evidence fail without crashes", () => {
  assert.deepEqual(p.assessmentBlockers(null, "beta"), ["Missing assessment"]);
  for (const mutation of [
    (r) => (r.version = "old"),
    (r) => (r.ratings.strategy.sources = []),
    (r) => (r.ratings.strategy.blockers = ["disputed"]),
    (r) => (r.ratings.strategy.neighboringAnchor = ""),
    (r) => (r.ratings.strategy.beta.version = "old"),
    (r) => (r.ratings.strategy.value = 3.7),
    (r) => delete r.ratings,
  ]) {
    const r = rec();
    mutation(r);
    assert.equal(p.resolveRating(r, "strategy", scope(r), "beta").value, null);
  }
});
test("scope is edition, mode and player specific", () => {
  const r = rec();
  for (const patch of [
    { players: null },
    { players: 4 },
    { edition: "other" },
    { mode: "house rules" },
  ])
    assert.equal(p.resolveRating(r, "strategy", { ...scope(r), ...patch }, "beta").value, null);
});
test("Family is age-scoped and requires all task evidence", () => {
  const r = rec();
  assert.equal(p.resolveRating(r, "family", scope(r), "beta").value, 3.5);
  for (const ageBand of [null, "6-7", "adults", "under6"])
    assert.equal(p.resolveRating(r, "family", { ...scope(r), ageBand }, "beta").value, null);
  r.family["8-10"].taskEvidence = [];
  assert.equal(p.resolveRating(r, "family", scope(r), "beta").value, null);
});
test("identity bindings are explicit, never title or id alone", () => {
  assert.equal(app.ratingRecord({ ...game(), name: "Connect Four: Other Edition" }), undefined);
  assert.equal(app.ratingRecord({ ...game(), bggId: "unknown" }), undefined);
});
test("all selected vibes required; unknown only blocks when selected", () => {
  const r = rec();
  assert.equal(
    p.matchesRatings(r, context({ vibes: ["strategy", "board"] }), scope(r), "beta"),
    true,
  );
  assert.equal(
    p.matchesRatings(r, context({ vibes: ["strategy", "party"] }), scope(r), "beta"),
    false,
  );
  assert.equal(p.matchesRatings(undefined, context(), scope(r), "beta"), true);
  assert.equal(
    p.matchesRatings(undefined, context({ vibes: ["strategy"] }), scope(r), "beta"),
    false,
  );
});
test("exact low targets override only the same vibe, range endpoints included", () => {
  const r = rec();
  assert.equal(
    p.matchesRatings(
      r,
      context({ vibes: ["luck", "strategy"], exactTraits: { luck: 1 } }),
      scope(r),
      "beta",
    ),
    true,
  );
  assert.equal(
    p.matchesRatings(
      r,
      context({ vibes: ["luck", "party"], exactTraits: { luck: 1 } }),
      scope(r),
      "beta",
    ),
    false,
  );
  for (const v of [1.5, 2, 2.5])
    assert.equal(p.matchesTarget(v, { kind: "range", min: 1.5, max: 2.5 }), true);
  assert.equal(p.matchesTarget(2.5, { kind: "exact", value: 2 }), false);
  for (const t of [
    { kind: "range", min: 4, max: 2 },
    { kind: "unknown", value: 3 },
    { kind: "exact", value: "3" },
  ])
    assert.equal(p.validTarget(t), false);
});
test("invalid targets cannot be silently ignored", () => {
  assert.equal(p.selectedTargets(context({ exactTraits: { luck: 3.7 } })), null);
  assert.equal(
    p.selectedTargets(context({ ratingTargets: { bogus: { kind: "exact", value: 3 } } })),
    null,
  );
});
test("Find, Discover and tonight enforce same beta conditions without touching original data", () => {
  const before = JSON.stringify(catalog.GAMES);
  const ctx = context({ vibes: ["strategy", "board"] });
  const result = scoring.runWizard(ctx, user, [], identity);
  assert.deepEqual(
    result.ownedTop.map((g) => g.bggId),
    ["3931"],
  );
  assert.match(result.ownedTop[0].why, /Strategy 4\/5 \(provisional\)/);
  assert.equal(result.ownedTop[0].ratingContext.ratingMode, "beta");
  assert.deepEqual(
    scoring.discoverGames(ctx, "", identity, catalog.GAMES).map((g) => g.bggId),
    ["3931"],
  );
  assert.equal(scoring.pickTonight(ctx, user).bggId, "3931");
  assert.equal(JSON.stringify(catalog.GAMES), before);
});
test("hard constraints, scope and reroll cannot be rescued by scores", () => {
  for (const patch of [
    { players: 3 },
    { maxTimeMin: 5 },
    { ageBand: "under6" },
    { ratingMode: "reviewed" },
  ])
    assert.equal(
      scoring.runWizard(context({ vibes: ["strategy"], ...patch }), user, [], identity).ownedTop
        .length,
      0,
    );
  const r = scoring.runWizard(context({ vibes: ["strategy"] }), user, ["3931"], identity);
  assert.equal(r.ownedTop.length, 0);
  assert.equal(r.exhaustedVault, true);
  assert.equal(scoring.pickTonight(context({ vibes: ["party"] }), user), undefined);
});
test("beta ranking is seeded and unaffected by popularity or ownership bonus", () => {
  const a = game(),
    b = catalog.GAMES.find((g) => g.bggId === "2452"),
    ctx = context();
  assert.equal(
    app.compareRatedGames(a, b, ctx),
    app.compareRatedGames({ ...a, bggRating: 1000 }, b, ctx),
  );
  assert.equal(
    scoring.recommendationScore(a, ctx, true),
    scoring.recommendationScore(a, ctx, false),
  );
  assert.equal(p.seededOrder("a", "s"), p.seededOrder("a", "s"));
  assert.notEqual(p.seededOrder("a", "s"), p.seededOrder("a", "other"));
});
