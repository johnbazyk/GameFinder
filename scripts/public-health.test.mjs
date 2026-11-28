import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
let server, health;
before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ publicHealth: health } = await server.ssrLoadModule("/src/lib/public-health.server.ts"));
});
after(async () => server?.close());
test("public health reports only readiness and never caches", async () => {
  const r = await health(async () => async () => [{ n: 1 }]);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.deepEqual(await r.json(), { ok: true });
});
test("database errors and missing required persistence fail closed without diagnostic disclosure", async () => {
  const r = await health(async () => {
    throw Error("fixture secret database details");
  });
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { ok: false });
  const missing = await health(
    async () => {
      assert.fail("must not load embedded DB");
    },
    true,
    false,
  );
  assert.equal(missing.status, 503);
});
test("persistent readiness requires release schema", async () => {
  const missing = await health(
    async () => async (parts) =>
      parts[0].includes("to_regclass") ? [{ ready: false }] : [{ n: 1 }],
    true,
    true,
  );
  assert.equal(missing.status, 503);
  const ready = await health(
    async () => async (parts) =>
      parts[0].includes("to_regclass") ? [{ ready: true }] : [{ n: 1 }],
    true,
    true,
  );
  assert.equal(ready.status, 200);
});
