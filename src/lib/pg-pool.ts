/**
 * Shared node-postgres pool for Netlify + Supabase.
 *
 * Lambda (IPv4) + transaction pooler needs a small pool, a connect timeout,
 * and TLS. The shared pooler also requires user `postgres.<project-ref>` —
 * a URL with user `postgres` authenticates as the wrong role and sign-up
 * 500s with "password authentication failed for user postgres".
 *
 * Do not use the URL() parser here: passwords often contain `@` / `:` and
 * URL() then throws, which used to skip the rewrite.
 *
 * `sslmode=require` in the URI makes node-pg *verify* the cert. Supabase's
 * chain then fails with "self-signed certificate in certificate chain".
 * Strip sslmode and force rejectUnauthorized: false.
 */
import { Pool } from "pg";

export const SUPABASE_REF = "gposxgncsktonuhlgbpg";

function stripSslMode(url: string): string {
  const [base, qs] = url.split("?");
  if (!qs) return url;
  const kept = qs
    .split("&")
    .filter((p) => p && !/^sslmode=/i.test(p) && !/^ssl=/i.test(p))
    .join("&");
  return kept ? `${base}?${kept}` : base;
}

/** Rewrite pooler URLs that still use the bare `postgres` user. */
export function normalizeDatabaseUrl(connectionString: string): string {
  return stripSslMode(
    connectionString.replace(
      /^(postgres(?:ql)?:\/\/)postgres(:)/i,
      `$1postgres.${SUPABASE_REF}$2`,
    ),
  );
}

export function peekDbUser(connectionString: string | undefined): string | null {
  if (!connectionString) return null;
  const m = normalizeDatabaseUrl(connectionString).match(/^postgres(?:ql)?:\/\/([^:]+):/i);
  return m ? decodeURIComponent(m[1]) : null;
}

export function makePgPool(connectionString: string): Pool {
  const url = normalizeDatabaseUrl(connectionString);
  const local = /localhost|127\.0\.0\.1/i.test(url);
  return new Pool({
    connectionString: url,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    ssl: local ? false : { rejectUnauthorized: false },
  });
}
