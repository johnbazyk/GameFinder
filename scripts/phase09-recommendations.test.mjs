import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
let server, limits, scoring, similarity, catalog, dimensions, defaultWeights, hard;
before(async () => {
  server = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    cacheDir: "node_modules/.vite-phase09",
  });
  limits = await server.ssrLoadModule("/src/lib/recommendation-limits.ts");
  scoring = await server.ssrLoadModule("/src/lib/scoring.ts");
  similarity = await server.ssrLoadModule("/src/lib/game-similarity.ts");
  catalog = await server.ssrLoadModule("/src/lib/catalog.ts");
  ({ DIMENSIONS: dimensions } = await server.ssrLoadModule("/src/lib/types.ts"));
  ({ DEFAULT_USER_WEIGHTS: defaultWeights, passesHardConstraints: hard } =
    await server.ssrLoadModule("/src/lib/vibes.ts"));
});
after(async () => server?.close());
const base = {
  players: null,
  ageBand: null,
  maxTimeMin: null,
  timeOver60: false,
  vibes: [],
  exactTraits: null,
};
test("recommendations cap at three; all title searches and explicit browse retain full results", () => {
  const all = Array.from({ length: 50 }, (_, i) => i);
  assert.equal(limits.RECOMMENDATION_LIMIT, 3);
  assert.deepEqual(limits.recommendationGroup(all, 99), [0, 1, 2]);
  assert.deepEqual(limits.recommendationGroup([1, 2]), [1, 2]);
  assert.deepEqual(
    limits.discoverDisplay(all, [9, 8, 7, 6], { query: "", filtered: false, browseAll: false }),
    [9, 8, 7],
  );
  assert.deepEqual(
    limits.discoverDisplay(all, [], { query: "", filtered: true, browseAll: false }),
    [0, 1, 2],
  );
  assert.deepEqual(
    limits.discoverDisplay(all, [], { query: "a", filtered: true, browseAll: false }),
    all,
  );
  assert.deepEqual(
    limits.discoverDisplay(all, [], { query: "", filtered: true, browseAll: true }),
    all,
  );
});
test("actual Find groups preserve three, ownership, exclusions and hard limits", () => {
  const all = catalog.standaloneGames(),
    owned = all.slice(0, 40).map((g) => g.bggId);
  const ctx = { ...base, players: 2, ageBand: "11-13", maxTimeMin: 60 };
  const user = { owned, wishlist: [], plays: [], vibeWeights: defaultWeights };
  const first = scoring.runWizard(ctx, user);
  assert.equal(first.ownedTop.length, 3);
  assert.equal(first.unownedTop.length, 3);
  assert.ok(first.ownedTop.every((g) => owned.includes(g.bggId) && hard(g, ctx)));
  assert.ok(first.unownedTop.every((g) => !owned.includes(g.bggId) && hard(g, ctx)));
  const shown = [...first.ownedTop, ...first.unownedTop].map((g) => g.bggId);
  const second = scoring.runWizard(ctx, user, shown);
  assert.ok([...second.ownedTop, ...second.unownedTop].every((g) => !shown.includes(g.bggId)));
});
test("similarity dimensions equal weighting, symmetry and no popularity influence", () => {
  const a = catalog.standaloneGames()[0],
    b = catalog.standaloneGames()[1];
  const reader = (game, key) => (game.bggId === a.bggId ? 3 : key === dimensions[0] ? 5 : 3);
  const ab = similarity.compareGameCharacteristics(a, b, base, reader);
  assert.equal(ab.dimensions, 2 / 7);
  assert.deepEqual(ab, similarity.compareGameCharacteristics(b, a, base, reader));
  assert.deepEqual(
    ab,
    similarity.compareGameCharacteristics(a, { ...b, bggRating: 0 }, base, reader),
  );
  assert.equal(
    similarity.compareGameCharacteristics(a, b, base, (g, k) => (k === "skill" ? null : 3)),
    null,
  );
});
test("similarity tie order and normalized mechanics", () => {
  const a = { mechanics: ["Dice Rolling", "dice rolling", "Trading"] },
    b = { mechanics: ["DICE ROLLING", "Drafting"] };
  assert.equal(similarity.mechanicOverlap(a, b), 1 / 3);
  const equal = { dimensions: 0, vibes: 0, mechanics: 0, players: 0, age: 0, time: 0 };
  assert.ok(
    similarity.compareSimilarity(
      { ...equal, dimensions: 0.1, mechanics: 0 },
      { ...equal, dimensions: 0.2, mechanics: 1 },
    ) < 0,
  );
  assert.ok(similarity.compareSimilarity(equal, { ...equal, vibes: null }) < 0);
});
test("actual similar games capped, deterministic, independent of popularity and reviewed-only fail closed", () => {
  const game = scoring.getGame("3931");
  const results = scoring.similarGames(game, 99);
  assert.equal(results.length, 3);
  assert.equal(new Set(results.map((g) => g.bggId)).size, 3);
  assert.ok(results.every((g) => g.bggId !== game.bggId && catalog.isStandaloneGame(g)));
  assert.deepEqual(scoring.similarGames(game), results);
  assert.deepEqual(scoring.similarGames(game, 3, { ...base, ratingMode: "reviewed" }), []);
  const pool = results.map((g) => ({ ...g, bggRating: 0 }));
  assert.deepEqual(
    scoring.similarGames(game, 3, base, pool).map((g) => g.bggId),
    results.map((g) => g.bggId),
  );
  assert.deepEqual(scoring.similarGames(game, 3, base, [results[0], results[0]]), []);
});
