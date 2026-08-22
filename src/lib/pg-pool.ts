/**
 * Shared node-postgres pool for Netlify + Supabase.
 *
 * Lambda (IPv4) + transaction pooler needs a small pool, a connect timeout,
 * and TLS. The shared pooler also requires user `postgres.<project-ref>`.
 *
 * Do not use the URL() parser here: passwords often contain `@` / `:`.
 *
 * Netlify's Node CA bundle does not trust Supabase's pooler chain
 * (`self-signed certificate in certificate chain`). Turning off TLS
 * verification on this process is the documented serverless workaround;
 * the lambda only talks to the pooler.
 */
import { Pool } from "pg";

export const SUPABASE_REF = "gposxgncsktonuhlgbpg";

/** Rewrite pooler URLs that still use the bare `postgres` user. */
export function normalizeDatabaseUrl(connectionString: string): string {
  return connectionString.replace(
    /^(postgres(?:ql)?:\/\/)postgres(:)/i,
    `$1postgres.${SUPABASE_REF}$2`,
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
  if (!local) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
  return new Pool({
    connectionString: url,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    ssl: local
      ? false
      : { rejectUnauthorized: false, checkServerIdentity: () => undefined },
  });
}
