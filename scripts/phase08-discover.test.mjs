import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
let server, discoverGames, discoverAlternatives, passesHardConstraints;
const base = {
  players: null,
  ageBand: null,
  maxTimeMin: null,
  timeOver60: false,
  vibes: [],
  exactTraits: null,
};
before(async () => {
  server = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    cacheDir: "node_modules/.vite-phase08-discover",
  });
  ({ discoverGames, discoverAlternatives } = await server.ssrLoadModule("/src/lib/scoring.ts"));
  ({ passesHardConstraints } = await server.ssrLoadModule("/src/lib/vibes.ts"));
});
after(async () => server?.close());
test("Discover alternatives retain title, hard age/time/player limits and exact-score targets", () => {
  const ctx = { ...base, players: 2, ageBand: "11-13", maxTimeMin: 45, vibes: ["dexterity"] };
  const query = "Splendor";
  assert.equal(discoverGames(ctx, query).length, 0);
  const result = discoverAlternatives(ctx, query);
  assert.ok(result.some((g) => g.name === "Splendor"));
  assert.ok(
    result.every((g) => passesHardConstraints(g, ctx) && g.name.toLowerCase().includes("splendor")),
  );
  assert.deepEqual(discoverAlternatives({ ...ctx, players: 13 }, query), []);
  assert.deepEqual(discoverAlternatives({ ...ctx, exactTraits: { dexterity: 5 } }, query), []);
});
test("Discover never adds alternatives when exact results already exist", () => {
  assert.ok(discoverGames(base, "Splendor").length > 0);
  assert.deepEqual(discoverAlternatives(base, "Splendor"), []);
});
