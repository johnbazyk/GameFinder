/**
 * Shared node-postgres pool for Netlify + Supabase.
 *
 * Lambda (IPv4) + transaction pooler needs a small pool, a connect timeout,
 * and TLS. The shared pooler also requires user `postgres.<project-ref>` —
 * a URL with user `postgres` authenticates as the wrong role and sign-up
 * 500s with "password authentication failed for user postgres".
 */
import { Pool } from "pg";

const SUPABASE_REF = "gposxgncsktonuhlgbpg";

/** Rewrite pooler URLs that still use the bare `postgres` user. */
export function normalizeDatabaseUrl(connectionString: string): string {
  try {
    const u = new URL(connectionString.replace(/^postgres(ql)?:/i, "https:"));
    const pooler = u.hostname.includes("pooler.supabase.com");
    if (pooler && u.username === "postgres") {
      u.username = `postgres.${SUPABASE_REF}`;
    }
    return u.toString().replace(/^https:/i, connectionString.startsWith("postgres://") ? "postgres:" : "postgresql:");
  } catch {
    return connectionString;
  }
}

export function makePgPool(connectionString: string): Pool {
  const url = normalizeDatabaseUrl(connectionString);
  const local = /localhost|127\.0\.0\.1/i.test(url);
  return new Pool({
    connectionString: url,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    ssl: local ? undefined : { rejectUnauthorized: false },
  });
}
