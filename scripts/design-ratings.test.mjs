import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
let server, catalog, design, data, policy, app, scoring, vibes;
before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  [catalog, design, data, policy, app, scoring, vibes] = await Promise.all(
    [
      "catalog",
      "ratings/design-catalog",
      "ratings/design-assessments",
      "rating-policy",
      "application-ratings",
      "scoring",
      "vibes",
    ].map((name) => server.ssrLoadModule(`/src/lib/${name}.ts`)),
  );
});
after(async () => {
  await server?.close();
});
const context = (extra = {}) => ({
  players: null,
  ageBand: null,
  maxTimeMin: null,
  timeOver60: false,
  vibes: [],
  exactTraits: null,
  ...extra,
});
const identity = (games) => games;

test("every authored title has exactly one explicit identity-bound profile with 11 half-point judgments", () => {
  assert.equal(design.DESIGN_CATALOG.length, catalog.AUTHORED_GAMES.length);
  assert.equal(new Set(design.DESIGN_CATALOG.map((r) => r.id)).size, design.DESIGN_CATALOG.length);
  for (const game of catalog.AUTHORED_GAMES) {
    const records = design.DESIGN_CATALOG.filter(
      (r) => r.legacyId === game.bggId && r.expectedTitle === game.name,
    );
    assert.equal(records.length, 1, game.name);
    const record = records[0];
    assert.equal(record.scope, "design-baseline");
    assert.equal(record.version, "0.4-design");
    assert.equal(Object.keys(record.ratings).length, 11);
    for (const key of policy.RATING_KEYS) {
      const rating = app.gameRating(game, key, context());
      assert.ok(policy.validRating(rating.value), `${game.name} ${key}`);
      assert.equal(rating.label, "Provisional");
      assert.equal(rating.assessment.review, undefined);
      assert.ok(
        rating.assessment.sources.every(
          (s) => s.url.startsWith("https://") && s.observation.length > 20,
        ),
      );
      assert.equal(app.gameRating(game, key, context({ ratingMode: "reviewed" })).value, null);
    }
  }
});
test("design Family is independent of age band and never changes the hard age gate", () => {
  const game = catalog.GAMES.find((g) => g.name === "Connect Four");
  for (const ageBand of [null, "under6", "6-7", "8-10", "11-13", "14-17", "adults"]) {
    assert.equal(app.gameRating(game, "family", context({ ageBand })).value, 4.5);
  }
  assert.equal(
    scoring.eligibleGames(
      context({ players: 2, ageBand: "under6", vibes: ["family"] }),
      [game],
      identity,
    ).length,
    0,
  );
});
test("saved legacy mode resolves to the same canonical values; unsupported editions and counts fail closed", () => {
  const game = catalog.GAMES.find((g) => g.name === "Connect Four");
  assert.equal(app.ratingMode(context({ ratingMode: "legacy" })), "beta");
  assert.equal(app.gameRating(game, "strategy", context({ ratingMode: "legacy" })).value, 4);
  for (const extra of [
    { players: 3 },
    { ratingEdition: "Other edition" },
    { ratingPlayMode: "house rules" },
  ]) {
    assert.equal(app.gameRating(game, "strategy", context(extra)).value, null);
  }
});
test("actual catalog fills 3 owned plus 3 unowned and preserves every selected constraint on reroll", () => {
  const ctx = context({
    players: 2,
    ageBand: "8-10",
    maxTimeMin: 60,
    vibes: ["strategy"],
    ratingSeed: "coverage",
  });
  const eligible = scoring.eligibleGames(ctx, catalog.standaloneGames(), identity);
  assert.ok(eligible.length >= 8);
  const user = {
    owned: eligible.slice(0, 4).map((g) => g.bggId),
    wishlist: [],
    plays: [],
    vibeWeights: {},
  };
  const first = scoring.runWizard(ctx, user, [], identity);
  assert.equal(first.ownedTop.length, 3);
  assert.equal(first.unownedTop.length, 3);
  const shown = [...first.ownedTop, ...first.unownedTop];
  assert.equal(new Set(shown.map((g) => g.bggId)).size, 6);
  for (const game of shown) {
    assert.ok(vibes.passesHardConstraints(game, ctx));
    assert.ok(app.gameRating(game, "strategy", ctx).value >= 3);
  }
  const next = scoring.runWizard(
    ctx,
    user,
    shown.map((g) => g.bggId),
    identity,
  );
  assert.equal(next.ownedTop.length, 1);
  assert.ok(
    [...next.ownedTop, ...next.unownedTop].every(
      (g) => !shown.some((old) => old.bggId === g.bggId),
    ),
  );
});
test("identity collision cannot transfer Sleeping Queens scores onto The Resistance", () => {
  const a = catalog.AUTHORED_GAMES.find((g) => g.name === "Sleeping Queens");
  const b = catalog.AUTHORED_GAMES.find((g) => g.name === "The Resistance");
  assert.equal(a.bggId, b.bggId);
  assert.notEqual(app.ratingRecord(a).id, app.ratingRecord(b).id);
  assert.equal(app.gameRating(a, "luck", context()).value, 4);
  assert.equal(app.gameRating(b, "luck", context()).value, 1.5);
  assert.ok(!catalog.GAMES.some((g) => g.name === "Sleeping Queens"));
});
test("rules-based calibration contrasts remain distinct without popularity input", () => {
  const byName = (name) => catalog.GAMES.find((g) => g.name === name);
  for (const name of ["Chess", "Connect Four"])
    assert.equal(app.gameRating(byName(name), "luck", context()).value, 1);
  for (const name of ["Candy Land", "Left Right Center"]) {
    assert.equal(app.gameRating(byName(name), "luck", context()).value, 5);
    assert.equal(app.gameRating(byName(name), "strategy", context()).value, 1);
  }
  assert.equal(app.gameRating(byName("Jenga"), "dexterity", context()).value, 5);
  assert.equal(app.gameRating(byName("Boggle"), "dexterity", context()).value, 1);
  assert.equal(app.gameRating(byName("Wavelength"), "board", context()).value, 1);
  const chess = byName("Chess");
  assert.equal(
    app.gameRating({ ...chess, bggRating: 0, rubric: {} }, "strategy", context()).value,
    5,
  );
});
