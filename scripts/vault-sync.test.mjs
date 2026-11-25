import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
let server, db, policy, replace;
before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
    resolve: { alias: { "@": new URL("../src", import.meta.url).pathname } },
  });
  policy = await server.ssrLoadModule("/src/lib/vault-policy.ts");
  ({ replaceVaultSnapshot: replace } = await server.ssrLoadModule("/src/lib/vault-sync.server.ts"));
  db = new PGlite();
  await db.waitReady;
  await db.exec(readFileSync(new URL("../migrations/0002_social.sql", import.meta.url), "utf8"));
  await db.exec(
    readFileSync(new URL("../migrations/0007_subscription_lifecycle.sql", import.meta.url), "utf8"),
  );
  await db.exec(
    "insert into profiles (user_id, display_name, plan) values ('free-fixture','Free','free'), ('paid-fixture','Paid','premium')",
  );
});
after(async () => {
  await db?.close();
  await server?.close();
});
const ids = (n) => Array.from({ length: n }, (_, i) => "fixture-" + i);
const snapshot = (owned) => ({ owned, wishlist: [] });
const sqlFor =
  (tx, fail = false) =>
  async (parts, ...params) => {
    const query = parts.reduce((out, p, i) => out + (i ? "$" + i : "") + p, "");
    if (fail && query.startsWith("insert into vault_games")) throw new Error("injected failure");
    return (await tx.query(query, params)).rows;
  };
const save = (user, owned, fail = false) =>
  db.transaction((tx) => replace(sqlFor(tx, fail), user, snapshot(owned)));
const rows = async (user) =>
  (
    await db.query(
      "select bgg_id from vault_games where user_id=$1 and list='owned' order by bgg_id",
      [user],
    )
  ).rows.map((r) => r.bgg_id);
test("free Vault accepts 50 and rejects 51 without data loss", async () => {
  await save("free-fixture", ids(50));
  await assert.rejects(save("free-fixture", ids(51)), /50 games/);
  assert.equal((await rows("free-fixture")).length, 50);
});
test("Premium persists 501 games and downgrade retains them while denying additions", async () => {
  await save("paid-fixture", ids(501));
  assert.equal((await rows("paid-fixture")).length, 501);
  await db.exec("update profiles set plan='free' where user_id='paid-fixture'");
  await save("paid-fixture", ids(501));
  await assert.rejects(save("paid-fixture", ids(502)), /50 games/);
  assert.equal((await rows("paid-fixture")).length, 501);
  await save("paid-fixture", ids(500));
  assert.equal((await rows("paid-fixture")).length, 500);
});
test("rollback preserves prior rows if replacement insert fails", async () => {
  const prior = await rows("free-fixture");
  await assert.rejects(save("free-fixture", ["different"], true), /injected failure/);
  assert.deepEqual(await rows("free-fixture"), prior);
});
test("normalization validates inputs and deduplicates ownership", () => {
  assert.deepEqual(policy.normalizeVault({ owned: ["a", "a"], wishlist: ["a", "b", "b"] }), {
    owned: ["a"],
    wishlist: ["b"],
  });
  assert.throws(() => policy.normalizeVault({ owned: [null], wishlist: [] }), /Invalid/);
  assert.throws(() => policy.normalizeVault({ owned: "abc", wishlist: [] }), /Invalid/);
});

test("transactional delta preserves unrelated concurrent cloud edits", async () => {
  await save("free-fixture", ["base", "remove"]);
  const baseline = snapshot(["base", "remove"]);
  await db.transaction((tx) =>
    replace(sqlFor(tx), "free-fixture", { ...snapshot(["base", "remote"]), baseline }),
  );
  const merged = await db.transaction((tx) =>
    replace(sqlFor(tx), "free-fixture", { ...snapshot(["base", "local"]), baseline }),
  );
  assert.deepEqual(merged.owned.sort(), ["base", "local", "remote"]);
  assert.deepEqual(await rows("free-fixture"), ["base", "local", "remote"]);
});
