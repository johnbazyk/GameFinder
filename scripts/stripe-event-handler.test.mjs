import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { readFileSync } from "node:fs";
import { createServer } from "vite";
import { PGlite } from "@electric-sql/pglite";
let server, db, handler;
before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  handler = await server.ssrLoadModule("/src/lib/stripe-event-handler.server.ts");
  db = new PGlite();
  await db.waitReady;
  for (const migration of ["0002_social.sql", "0007_subscription_lifecycle.sql"])
    await db.exec(readFileSync(new URL("../migrations/" + migration, import.meta.url), "utf8"));
  await db.exec(
    "insert into profiles (user_id,display_name) values ('a','A'); insert into billing_subscriptions values ('a','sub_A','cus_A','active',2000000,1000,false)",
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
const event = {
  id: "evt_A",
  type: "customer.subscription.updated",
  livemode: false,
  created: 1000,
  data: { object: { id: "sub_A" } },
};
let calls = 0;
const provider = async (path) => {
  calls++;
  assert.equal(path, "subscriptions/sub_A");
  return {
    id: "sub_A",
    customer: "cus_A",
    status: "canceled",
    cancel_at_period_end: false,
    items: { data: [{ price: "price_A", quantity: 1 }] },
  };
};
const process = (e = event, fetcher = provider) =>
  db.transaction((tx) => handler.processStripeEvent(sql(tx), e, fetcher, ["price_A"], false));
test("event applies cancellation once and duplicate delivery never calls provider", async () => {
  assert.equal(await process(), "reconciled");
  assert.equal(await process(), "duplicate");
  assert.equal(calls, 1);
  assert.equal(
    (await db.query("select status from billing_subscriptions")).rows[0].status,
    "canceled",
  );
});
test("failed provider request rolls back event receipt", async () => {
  const e = { ...event, id: "evt_retry" };
  await assert.rejects(
    process(e, async () => {
      throw new Error("offline");
    }),
    /offline/,
  );
  assert.equal(
    (await db.query("select event_id from billing_webhook_events where event_id='evt_retry'")).rows
      .length,
    0,
  );
});
test("unknown binding does not consume event and live mode is rejected", async () => {
  await assert.rejects(
    process({ ...event, id: "evt_unknown", data: { object: { id: "sub_UNKNOWN" } } }),
    /not bound/,
  );
  await assert.rejects(process({ ...event, id: "evt_live", livemode: true }), /environment/);
  assert.equal((await db.query("select event_id from billing_webhook_events")).rows.length, 1);
});
test("extracts nested invoice subscription and ignores unrelated event", () => {
  assert.equal(
    handler.subscriptionForEvent({
      ...event,
      type: "invoice.paid",
      data: { object: { parent: { subscription_details: { subscription: "sub_A" } } } },
    }),
    "sub_A",
  );
  assert.equal(handler.subscriptionForEvent({ ...event, type: "charge.succeeded" }), null);
});
