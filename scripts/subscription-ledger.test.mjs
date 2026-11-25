import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { readFileSync } from "node:fs";
import { createServer } from "vite";
import { PGlite } from "@electric-sql/pglite";
let server, db, ledger, entitlement;
before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
    resolve: { alias: { "@": new URL("../src", import.meta.url).pathname } },
  });
  ledger = await server.ssrLoadModule("/src/lib/subscription-ledger.server.ts");
  entitlement = await server.ssrLoadModule("/src/lib/premium-entitlement.server.ts");
  db = new PGlite();
  await db.waitReady;
  for (const migration of ["0002_social.sql", "0007_subscription_lifecycle.sql"])
    await db.exec(readFileSync(new URL("../migrations/" + migration, import.meta.url), "utf8"));
  await db.exec(
    "insert into profiles (user_id,display_name,plan) values ('a','A','premium'),('b','B','free')",
  );
});
after(async () => {
  await db?.close();
  await server?.close();
});
const sql =
  (tx) =>
  async (parts, ...values) =>
    (
      await tx.query(
        parts.reduce((s, p, i) => s + (i ? "$" + i : "") + p, ""),
        values,
      )
    ).rows;
const active = { status: "active", paidThrough: 2000, verifiedAt: 1000, cancelAtPeriodEnd: false };
const record = (user, sub, customer, state) =>
  db.transaction((tx) =>
    ledger.recordVerifiedSubscription(sql(tx), user, sub, customer, state, 4000),
  );
test("managed subscription overrides legacy plan and expires without deleting account", async () => {
  assert.equal(await entitlement.resolveAccountPremium(sql(db), "a", 1500), true);
  assert.equal(await entitlement.resolveAccountPremium(sql(db), "b", 1500), false);
  assert.equal(await record("a", "sub_A", "cus_A", active), true);
  assert.equal(await entitlement.resolveAccountPremium(sql(db), "a", 1999), true);
  assert.equal(await entitlement.resolveAccountPremium(sql(db), "a", 2000), false);
  assert.equal(
    (await db.query("select plan from profiles where user_id='a'")).rows[0].plan,
    "premium",
  );
});
test("ledger rejects duplicate or older evidence and cross-account subscription reuse", async () => {
  assert.equal(await record("a", "sub_A", "cus_A", active), false);
  assert.equal(await record("a", "sub_A", "cus_A", { ...active, verifiedAt: 999 }), false);
  await assert.rejects(record("b", "sub_A", "cus_B", active));
  await assert.rejects(record("b", "sub_B", "cus_A", active));
  await assert.rejects(
    record("a", "sub_B", "cus_A", { ...active, verifiedAt: 1100 }),
    /identity changed/,
  );
  assert.equal(await entitlement.resolveAccountPremium(sql(db), "b", 1500), false);
});
test("renewal, scheduled cancellation and revoked status reconcile persisted access", async () => {
  assert.equal(
    await record("a", "sub_A", "cus_A", {
      ...active,
      verifiedAt: 1900,
      paidThrough: 3000,
      cancelAtPeriodEnd: true,
    }),
    true,
  );
  assert.equal(await entitlement.resolveAccountPremium(sql(db), "a", 2500), true);
  assert.equal(
    await record("a", "sub_A", "cus_A", {
      ...active,
      status: "canceled",
      verifiedAt: 2600,
      paidThrough: 3000,
    }),
    true,
  );
  assert.equal(await entitlement.resolveAccountPremium(sql(db), "a", 2700), false);
});
