import { isMainModule } from "./with-app-env.mjs";

/** Configuration-only check. No network, database, secret output or deployment. */
export function releasePreflight(env) {
  const checks = [];
  const add = (id, ok) => checks.push({ id, ok: Boolean(ok) });
  const value = (name) => (typeof env[name] === "string" ? env[name].trim() : "");
  let origin;
  try {
    origin = new URL(value("BETTER_AUTH_URL"));
  } catch {}
  add("explicit-auth-enabled", value("VITE_AUTH_ENABLED") === "true");
  add("persistent-database-configured", /^postgres(?:ql)?:\/\//.test(value("DATABASE_URL")));
  add("stable-auth-secret", value("BETTER_AUTH_SECRET").length >= 32);
  add(
    "https-auth-origin",
    origin?.protocol === "https:" &&
      !origin.username &&
      !origin.password &&
      origin.pathname === "/" &&
      !origin.search &&
      !origin.hash &&
      origin.hostname !== "localhost" &&
      !origin.hostname.endsWith(".localhost") &&
      origin.hostname !== "127.0.0.1",
  );
  add("local-subscription-simulation-off", value("GAMEFINDER_LOCAL_TEST_PLAN") !== "1");
  add("stripe-test-webhook-off", value("GAMEFINDER_STRIPE_TEST_WEBHOOK") !== "1");
  add("tls-verification-not-disabled", value("NODE_TLS_REJECT_UNAUTHORIZED") !== "0");
  add("remote-scan-not-enabled", value("GAMEFINDER_REMOTE_SCAN_APPROVED") !== "1");
  add("paid-provider-not-enabled", !value("XAI_API_KEY") && !value("STRIPE_SECRET_KEY"));
  return {
    ok: checks.every((c) => c.ok),
    scope: "configuration-only; does not certify beta or commercial readiness",
    checks,
  };
}
if (isMainModule(import.meta.url)) {
  const result = releasePreflight(process.env);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 1;
}
