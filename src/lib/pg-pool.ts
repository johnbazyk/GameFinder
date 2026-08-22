/**
 * Shared node-postgres pool for Netlify + Supabase.
 *
 * Lambda (IPv4) + transaction pooler needs a small pool, a connect timeout,
 * and TLS. Without `ssl`, sign-up 500s with an empty body because the first
 * query is the first TCP+TLS handshake.
 */
import { Pool } from "pg";

export function makePgPool(connectionString: string): Pool {
  const local = /localhost|127\.0\.0\.1/i.test(connectionString);
  return new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    ssl: local ? undefined : { rejectUnauthorized: false },
  });
}
