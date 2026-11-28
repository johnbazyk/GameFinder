import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let bridge;
let scoring;
let games;
let vibes;
let foundation;

before(async () => {
  server = await createServer({
    root: new URL("../", import.meta.url).pathname,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  [bridge, scoring, games, vibes, foundation] = await Promise.all([
    server.ssrLoadModule("/src/lib/catalog-legacy-bridge.ts"),
    server.ssrLoadModule("/src/lib/scoring.ts"),
    server.ssrLoadModule("/src/lib/catalog.ts"),
    server.ssrLoadModule("/src/lib/vibes.ts"),
    server.ssrLoadModule("/src/lib/catalog-foundation.ts"),
  ]);
});

after(async () => {
  await server?.close();
});

const base = {
  players: null,
  ageBand: null,
  maxTimeMin: null,
  timeOver60: false,
  vibes: [],
  exactTraits: null,
};

const scenarios = [
  base,
  { ...base, players: 4, vibes: ["family"] },
  { ...base, players: 2, maxTimeMin: 60, vibes: ["strategy"] },
  { ...base, ageBand: "8-10", players: 4, vibes: ["luck", "board"] },
  { ...base, timeOver60: true, vibes: ["party", "dexterity"] },
  {
    ...base,
    players: 4,
    exactTraits: { strategy: 4.5, family: 3 },
  },
];

function previousScore(game, context, owned) {
  let score = owned ? 18 : 0;

  if (
    context.players !== null &&
    context.players < 13 &&
    game.players.best.includes(context.players)
  ) {
    score += 8;
  }

  score += game.bggRating;

  const exact = Object.entries(context.exactTraits ?? {});
  if (exact.length) {
    const distance =
      exact.reduce(
        (total, [vibe, target]) => total + Math.abs(vibes.traitScore(game, vibe) - target),
        0,
      ) / exact.length;

    return score + Math.max(0, 40 - distance * 18);
  }

  if (!context.vibes.length) return score;

  const values = context.vibes.map((vibe) => vibes.traitScore(game, vibe));
  const qualifying = values.filter((value) => value >= 3).length;
  const average = values.reduce((a, b) => a + b, 0) / values.length;

  return score + qualifying * 12 + average * 6;
}

test("legacy compatibility bridge retains its historical scoring independently of the active rating policy", () => {
  assert.ok(games.GAMES.length > 0);

  for (const game of games.GAMES) {
    for (const context of scenarios) {
      for (const owned of [false, true]) {
        const actual = bridge.scoreLegacyGameWithCatalogFoundation(game, context, owned);
        const expected = previousScore(game, context, owned);

        assert.ok(
          Number.isFinite(actual) &&
            Number.isFinite(expected) &&
            Math.abs(actual - expected) <= 1e-10,
          `${game.name}: expected ${expected}, received ${actual}; catalog score must remain compatible`,
        );
      }
    }
  }
});

test("legacy IDs are never promoted to permanent published identities", () => {
  for (const game of games.GAMES) {
    const before = JSON.stringify(game);
    const record = bridge.legacyGameToRecommendationRecord(game);

    assert.ok(record.id.startsWith("gf:legacy:"));
    assert.equal(record.title, game.name);
    assert.deepEqual(record.players.best, game.players.best);
    assert.equal(JSON.stringify(game), before);
    assert.equal("bggId" in record, false);
  }
});

test("BGG remains disabled until authorization", () => {
  assert.equal(foundation.BGG_PROVIDER_POLICY.enabled, false);
  assert.equal(foundation.BGG_PROVIDER_POLICY.commercialUseAuthorized, false);
});

test("the four-screen application remains intact", () => {
  const shell = readFileSync("src/components/app-shell.tsx", "utf8");
  const discover = readFileSync("src/routes/discover.tsx", "utf8");

  for (const label of ["Find", "Vault", "Discover", "Profile"]) {
    assert.ok(shell.includes(`label: "${label}"`), label);
  }

  assert.equal(discover.includes("CatalogLab"), false);
  assert.equal(discover.includes("Try New Catalog Engine"), false);
});
