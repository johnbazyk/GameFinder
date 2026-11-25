import { test } from "node:test";
import assert from "node:assert/strict";
import { releasePreflight } from "./release-preflight.mjs";
const fixture = {
  VITE_AUTH_ENABLED: "true",
  DATABASE_URL: "postgresql://fixture:secret@example.invalid/db",
  BETTER_AUTH_SECRET: "fixture-secret-".repeat(4),
  BETTER_AUTH_URL: "https://beta.example.invalid",
};
test("restricted beta configuration passes without printing credential values", () => {
  const result = releasePreflight(fixture);
  assert.equal(result.ok, true);
  assert.ok(!JSON.stringify(result).includes("fixture-secret"));
  assert.ok(!JSON.stringify(result).includes("postgresql://"));
});
test("missing persistence, auth and stable HTTPS configuration fail closed", () => {
  assert.equal(releasePreflight({}).ok, false);
  for (const patch of [
    { VITE_AUTH_ENABLED: "false" },
    { DATABASE_URL: " " },
    { BETTER_AUTH_SECRET: "short" },
    { BETTER_AUTH_URL: "http://beta.example.invalid" },
    { BETTER_AUTH_URL: "https://localhost" },
    { BETTER_AUTH_URL: "https://beta.example.invalid/path" },
  ])
    assert.equal(releasePreflight({ ...fixture, ...patch }).ok, false);
});
test("test overrides and live paid provider configuration block restricted beta preflight", () => {
  for (const patch of [
    { GAMEFINDER_LOCAL_TEST_PLAN: "1" },
    { GAMEFINDER_STRIPE_TEST_WEBHOOK: "1" },
    { XAI_API_KEY: "fixture" },
    { STRIPE_SECRET_KEY: "fixture" },
  ])
    assert.equal(releasePreflight({ ...fixture, ...patch }).ok, false);
});
