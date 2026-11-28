import { test } from "node:test";
import assert from "node:assert/strict";
import { databaseConnectionPolicy as policy } from "./database-connection-policy.mjs";
test("remote database cannot override verified TLS through connection parameters", () => {
  const result = policy(
    "postgresql://user:localhost@remote.example.invalid/db?sslmode=disable&ssl=false&sslrootcert=anything&application_name=gf",
    {},
  );
  assert.equal(result.ssl.rejectUnauthorized, true);
  const parsed = new URL(result.connectionString);
  assert.equal(parsed.hostname, "remote.example.invalid");
  assert.equal(parsed.searchParams.get("sslmode"), null);
  assert.equal(parsed.searchParams.get("ssl"), null);
  assert.equal(parsed.searchParams.get("sslrootcert"), null);
  assert.equal(parsed.searchParams.get("application_name"), "gf");
});
test("trusted provider CA supported and insecure global TLS configuration rejected", () => {
  assert.deepEqual(
    policy("postgres://u:p@remote.example.invalid/db", {
      GAMEFINDER_DATABASE_CA_PEM: "fixture\\nCA",
    }).ssl,
    { rejectUnauthorized: true, ca: "fixture\nCA" },
  );
  assert.throws(
    () => policy("postgres://u:p@remote.example.invalid/db", { NODE_TLS_REJECT_UNAUTHORIZED: "0" }),
    /Insecure TLS/,
  );
});
test("only literal loopback database hosts bypass TLS", () => {
  assert.equal(policy("postgres://postgres:p@127.0.0.1/db", {}).ssl, false);
  assert.equal(
    new URL(policy("postgres://postgres:p@localhost/db", {}).connectionString).username,
    "postgres",
  );
  assert.equal(
    policy("postgres://u:p@localhost.example.invalid/db", {}).ssl.rejectUnauthorized,
    true,
  );
});

test("query parameters cannot redirect a loopback connection to a remote server", () => {
  assert.throws(
    () => policy("postgres://u:p@localhost/db?host=remote.example.invalid", {}),
    /Ambiguous/,
  );
  assert.throws(() => policy("postgres://u:p@/db", {}), /Missing database host|Invalid URL/);
});
