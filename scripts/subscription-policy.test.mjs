import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
let server, p;
before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  p = await server.ssrLoadModule("/src/lib/subscription-policy.ts");
});
after(async () => server?.close());
const active = { status: "active", paidThrough: 2000, verifiedAt: 1000, cancelAtPeriodEnd: false };
test("paid active and scheduled cancellation retain access until the paid term ends", () => {
  assert.equal(p.subscriptionEntitlement(active, 1500), true);
  assert.equal(p.subscriptionEntitlement({ ...active, cancelAtPeriodEnd: true }, 1999), true);
  assert.equal(p.subscriptionEntitlement(active, 2000), false);
});
test("failed renewal cannot extend an unpaid term and revoked states fail closed", () => {
  assert.equal(p.subscriptionEntitlement({ ...active, status: "past_due" }, 1500), true);
  assert.equal(p.subscriptionEntitlement({ ...active, status: "past_due" }, 2001), false);
  for (const status of [
    "canceled",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "paused",
    "trialing",
    "unknown",
  ])
    assert.equal(p.subscriptionEntitlement({ ...active, status }, 1500), false);
  assert.equal(p.subscriptionEntitlement(null, 1500), false);
});
test("renewal extends verified period; stale and duplicate updates cannot overwrite newer evidence", () => {
  const renewed = { ...active, verifiedAt: 1900, paidThrough: 3000 };
  assert.equal(p.acceptSubscriptionUpdate(active, renewed), true);
  assert.equal(p.subscriptionEntitlement(renewed, 2500), true);
  assert.equal(p.acceptSubscriptionUpdate(renewed, active), false);
  assert.equal(p.acceptSubscriptionUpdate(renewed, renewed), false);
});
test("invalid timestamps and unknown provider states are rejected", () => {
  assert.equal(p.subscriptionEntitlement({ ...active, verifiedAt: 1600 }, 1500), false);
  assert.equal(p.subscriptionEntitlement({ ...active, paidThrough: Infinity }, 1500), false);
  assert.equal(p.acceptSubscriptionUpdate(null, { ...active, paidThrough: NaN }), false);
  assert.equal(p.acceptSubscriptionUpdate(null, { ...active, status: "unknown" }), false);
});
