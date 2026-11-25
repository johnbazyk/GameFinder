import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
let server, verify;
before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ verifiedSubscriptionState: verify } = await server.ssrLoadModule(
    "/src/lib/stripe-reconciliation.server.ts",
  ));
});
after(async () => server?.close());
const binding = {
  user_id: "a",
  provider_subscription_id: "sub_A",
  provider_customer_id: "cus_A",
  paid_through_ms: 2000000,
  verified_at_ms: 1000000,
};
const sub = {
  id: "sub_A",
  customer: "cus_A",
  status: "active",
  cancel_at_period_end: false,
  latest_invoice: "in_A",
  items: { data: [{ price: { id: "price_A" }, quantity: 1, current_period_end: 3000 }] },
};
const invoice = {
  id: "in_A",
  customer: "cus_A",
  subscription: "sub_A",
  status: "paid",
  paid: true,
  currency: "usd",
  amount_paid: 499,
  lines: { data: [{ price: { id: "price_A" }, quantity: 1, period: { start: 2000, end: 3000 } }] },
};
const check = (s = sub, i = invoice) => verify(s, i, binding, ["price_A"], 2100000);
test("verified matching paid invoice extends entitlement", () =>
  assert.equal(check().paidThrough, 3000000));
test("failed, zero, unrelated, and mismatched invoices cannot extend paid term", () => {
  for (const patch of [
    { status: "open" },
    { amount_paid: 0 },
    { customer: "cus_B" },
    { subscription: "sub_B" },
    { id: "in_B" },
    { currency: "eur" },
    { lines: { data: [] } },
  ])
    assert.equal(check(sub, { ...invoice, ...patch }).paidThrough, 2000000);
  assert.equal(check({ ...sub, status: "past_due" }).paidThrough, 2000000);
});
test("identity and unexpected price are rejected", () => {
  assert.throws(() => check({ ...sub, customer: "cus_B" }), /identity/);
  assert.throws(() => verify(sub, invoice, binding, ["price_B"], 2100000), /price/);
});
