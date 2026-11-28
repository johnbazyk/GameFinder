import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createHmac } from "node:crypto";
import { createServer } from "vite";
let server, verify;
before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ verifyStripeEvent: verify } = await server.ssrLoadModule("/src/lib/stripe-webhook.server.ts"));
});
after(async () => server?.close());
const secret = "whsec_fixture",
  time = 1800000000;
const body = JSON.stringify({
  id: "evt_Fixture",
  type: "invoice.paid",
  livemode: false,
  created: time,
  data: { object: { id: "in_Fixture" } },
});
const sign = (raw = body, t = time) =>
  "t=" +
  t +
  ",v1=" +
  createHmac("sha256", secret)
    .update(t + "." + raw)
    .digest("hex");
test("signed raw payload validates and modified payload fails", () => {
  assert.equal(verify(body, sign(), secret, time * 1000).id, "evt_Fixture");
  assert.throws(() => verify(body + " ", sign(), secret, time * 1000), /signature/);
  assert.throws(() => verify(body, sign(), "whsec_other", time * 1000), /signature/);
});
test("stale and future signatures and malformed headers fail closed", () => {
  for (const t of [time - 301, time + 301])
    assert.throws(() => verify(body, sign(body, t), secret, time * 1000), /timestamp/);
  assert.throws(() => verify(body, sign() + ",t=" + time, secret, time * 1000), /timestamp/);
  assert.throws(() => verify(body, "t=" + time + ",v1=bad", secret, time * 1000), /signature/);
});
test("valid signature is not sufficient for malformed event", () => {
  const bad = JSON.stringify({ id: "evt_Fixture" });
  assert.throws(() => verify(bad, sign(bad), secret, time * 1000), /event/);
});
