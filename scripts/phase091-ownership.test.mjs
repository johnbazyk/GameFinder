import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
let server, scoring, catalog, policy, account, store;
const storage = new Map();
before(async () => {
  globalThis.localStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, v),
    removeItem: (k) => storage.delete(k),
  };
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
    cacheDir: "node_modules/.vite-phase091",
  });
  scoring = await server.ssrLoadModule("/src/lib/scoring.ts");
  catalog = await server.ssrLoadModule("/src/lib/catalog.ts");
  policy = await server.ssrLoadModule("/src/lib/vault-policy.ts");
  account = await server.ssrLoadModule("/src/lib/account-vault.ts");
  ({ useAppStore: store } = await server.ssrLoadModule("/src/lib/store.ts"));
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
test("owned status wins local Wishlist toggle and concurrent cloud changes", () => {
  assert.deepEqual(policy.toggleUnownedWishlist({ owned: ["a"], wishlist: ["a", "b"] }, "a"), {
    owned: ["a"],
    wishlist: ["b"],
  });
  assert.deepEqual(
    account.mergeVaultDelta(
      { owned: [], wishlist: [] },
      { owned: ["a"], wishlist: [] },
      { owned: [], wishlist: ["a", "b"] },
    ),
    { owned: ["a"], wishlist: ["b"] },
  );
  assert.deepEqual(
    account.switchVault({ ownerId: "a", owned: ["a"], wishlist: ["a", "b"] }, {}, "a").vault,
    { ownerId: "a", owned: ["a"], wishlist: ["b"] },
  );
});
test("actual store rejects owned Wishlist, transfers on add, never auto-stocks or auto-wishlists", () => {
  store.setState({ owned: [], wishlist: [], isPremium: false, haptics: false });
  const s = () => store.getState();
  assert.equal(s().stockStarterShelf, undefined);
  s().toggleWishlist("3931");
  assert.deepEqual(s().wishlist, ["3931"]);
  assert.equal(s().addOwned("3931"), "ok");
  assert.deepEqual(s().wishlist, []);
  s().toggleWishlist("3931");
  assert.deepEqual(s().wishlist, []);
  s().removeOwned("3931");
  assert.deepEqual(s().owned, []);
  assert.deepEqual(s().wishlist, []);
  const custom = s().addCustomGame("Ownership fixture");
  s().addOwned(custom.id);
  s().toggleWishlist(custom.id);
  assert.deepEqual(s().wishlist, []);
});
test("persisted duplicate records normalize on hydration without deleting owned titles", async () => {
  const current = JSON.parse(storage.get("gamefinder-v2"));
  current.state.owned = ["3931", "822"];
  current.state.wishlist = ["3931", "9209"];
  storage.set("gamefinder-v2", JSON.stringify(current));
  await store.persist.rehydrate();
  assert.deepEqual(store.getState().owned, ["3931", "822"]);
  assert.deepEqual(store.getState().wishlist, ["9209"]);
});
test("Featured uses stable rotation, replaces acquired titles, returns fewer if pool exhausted", () => {
  const now = 0,
    featured = scoring.featuredGames([], now);
  assert.equal(featured.length, 3);
  assert.deepEqual(scoring.featuredGames([], now + 1000), featured);
  assert.notDeepEqual(scoring.featuredGames([], now + 604800000), featured);
  const replacement = scoring.featuredGames([featured[0].bggId], now);
  assert.equal(replacement.length, 3);
  assert.ok(!replacement.some((g) => g.bggId === featured[0].bggId));
  assert.deepEqual(scoring.featuredGames(catalog.FEATURED_GAME_IDS, now), []);
});
test("Discover acquisition excludes owned before ranking; explicit retrieval remains complete", () => {
  const ctx = { ...base, players: 2, maxTimeMin: 60 };
  const all = scoring.discoverGames(ctx);
  const owned = all.slice(0, 10).map((g) => g.bggId);
  const found = scoring.discoverRecommendations(ctx, owned);
  assert.deepEqual(
    found.map((g) => g.bggId),
    all.filter((g) => !owned.includes(g.bggId)).map((g) => g.bggId),
  );
  assert.ok(found.length >= 3);
  assert.ok(scoring.discoverGames(base, "Splendor").some((g) => g.bggId === "148228"));
  assert.deepEqual(
    scoring.discoverRecommendations(
      ctx,
      all.map((g) => g.bggId),
    ),
    [],
  );
});
test("Discover fallback excludes all owned even when only owned strict matches remain", () => {
  const ctx = { ...base, vibes: ["strategy"] };
  const owned = scoring.discoverGames(ctx).map((g) => g.bggId);
  const alt = scoring.discoverAlternatives(ctx, "", 99, owned);
  assert.ok(alt.length > 0 && alt.length <= 3);
  assert.ok(alt.every((g) => !owned.includes(g.bggId)));
});
test("Similar Games excludes owned before limit, independent of reference ownership", () => {
  const game = scoring.getGame("3931"),
    first = scoring.similarGames(game);
  const owned = first.map((g) => g.bggId);
  const next = scoring.similarGames(game, 3, base, undefined, owned);
  assert.equal(next.length, 3);
  assert.ok(next.every((g) => !owned.includes(g.bggId) && g.bggId !== game.bggId));
  assert.deepEqual(scoring.similarGames(game, 3, base, undefined, [...owned, game.bggId]), next);
  assert.deepEqual(
    scoring.similarGames(
      game,
      3,
      base,
      undefined,
      catalog.GAMES.map((g) => g.bggId),
    ),
    [],
  );
});
test("database migration preserves owned entries and rejects future overlap per account", async () => {
  const db = new PGlite();
  try {
    await db.waitReady;
    await db.exec(readFileSync(new URL("../migrations/0002_social.sql", import.meta.url), "utf8"));
    await db.exec(
      "insert into vault_games(user_id,bgg_id,list) values ('a','1','owned'),('a','1','wishlist'),('a','2','wishlist'),('b','1','wishlist')",
    );
    const migration = readFileSync(
      new URL("../migrations/0008_vault_ownership_integrity.sql", import.meta.url),
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration);
    const result = await db.query(
      "select user_id,bgg_id,list from vault_games order by user_id,bgg_id,list",
    );
    assert.deepEqual(result.rows, [
      { user_id: "a", bgg_id: "1", list: "owned" },
      { user_id: "a", bgg_id: "2", list: "wishlist" },
      { user_id: "b", bgg_id: "1", list: "wishlist" },
    ]);
    await assert.rejects(
      db.exec("insert into vault_games(user_id,bgg_id,list) values ('a','1','wishlist')"),
      /duplicate key/i,
    );
  } finally {
    await db.close();
  }
});
