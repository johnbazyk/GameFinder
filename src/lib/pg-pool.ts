import { Pool } from "pg";
import { databaseConnectionPolicy } from "../../scripts/database-connection-policy.mjs";

/** Verified TLS for remote connections. Configure the provider CA if needed. */
export function makePgPool(connectionString: string): Pool {
  return new Pool({
    ...databaseConnectionPolicy(connectionString),
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  });
}
