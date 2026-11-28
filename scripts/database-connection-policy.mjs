// Shared runtime/migration connection policy. Never weaken process-wide TLS.
/** @param {string} connectionString @param {NodeJS.ProcessEnv} env */
export function databaseConnectionPolicy(connectionString, env = process.env) {
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Invalid database URL");
  if (!url.hostname) throw new Error("Missing database host");
  const host = url.hostname.toLowerCase();
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(host);
  if (env.NODE_TLS_REJECT_UNAUTHORIZED === "0") throw new Error("Insecure TLS configuration");
  // pg connection string SSL parameters override the explicit SSL object.
  for (const key of [...url.searchParams.keys()]) {
    if (/^(host|hostname|hostaddr|port|user|password|dbname|database)$/i.test(key))
      throw new Error("Ambiguous database connection parameters");
    if (/^(ssl|sslmode|sslcert|sslkey|sslrootcert|sslnegotiation|uselibpqcompat)$/i.test(key))
      url.searchParams.delete(key);
  }
  if (host.endsWith(".pooler.supabase.com") && url.username === "postgres")
    url.username = "postgres.gposxgncsktonuhlgbpg";
  const ca = env.GAMEFINDER_DATABASE_CA_PEM?.trim().replaceAll("\\n", "\n");
  return {
    connectionString: url.href,
    ssl: local ? false : { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
  };
}
