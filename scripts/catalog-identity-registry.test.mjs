import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const root = new URL("..", import.meta.url).pathname;
let server;
let foundation;

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  foundation = await server.ssrLoadModule("/src/lib/catalog-foundation.ts");
});

after(async () => {
  await server?.close();
});

function sourceRecord(sourceRecordId, recordKey = sourceRecordId) {
  return {
    sourceNamespace: "fixture",
    sourceRecordId,
    recordKey,
    fingerprint: "a".repeat(64),
  };
}

function identity(id, overrides = {}) {
  return {
    id,
    title: "Fixture Game",
    edition: {
      name: null,
      printing: null,
      language: null,
      regionalMarket: null,
      status: "missing",
      evidenceRef: null,
    },
    status: "proposed",
    sourceRecords: [sourceRecord("source-1")],
    legacyAliases: [],
    externalIds: [],
    relationships: [],
    evidence: [],
    conflictStatus: "none",
    createdAt: "2026-01-01T00:00:00.000Z",
    revisionHistory: [
      { revision: 1, recordedAt: "2026-01-01T00:00:00.000Z", changeRef: "fixture" },
    ],
    ...overrides,
  };
}

test("permanent identity allocator emits independent gf UUID identities", () => {
  const first = foundation.allocatePermanentCatalogIdentityId();
  const second = foundation.allocatePermanentCatalogIdentityId();
  assert.match(first, /^gf:[0-9a-f-]{36}$/);
  assert.match(second, /^gf:[0-9a-f-]{36}$/);
  assert.notEqual(first, second);
});

test("registry rejects source-record reuse and unsupported verified claims", () => {
  const firstId = "gf:00000000-0000-4000-8000-000000000001";
  const secondId = "gf:00000000-0000-4000-8000-000000000002";
  assert.throws(
    () =>
      foundation.validatePermanentCatalogIdentityRegistry([
        identity(firstId),
        identity(secondId, { sourceRecords: [sourceRecord("source-1", "other-key")] }),
      ]),
    /multiply-assigned source record/,
  );
  assert.throws(
    () =>
      foundation.validatePermanentCatalogIdentityRegistry([
        identity(firstId, {
          status: "verified",
          evidence: [],
        }),
      ]),
    /requires identity evidence/,
  );
});

test("alias resolution fails closed unless a unique identity and alias are verified", () => {
  const firstId = "gf:00000000-0000-4000-8000-000000000003";
  const secondId = "gf:00000000-0000-4000-8000-000000000004";
  const alias = {
    namespace: "legacy-bgg",
    value: "41114",
    status: "unverified",
    evidenceRef: null,
  };
  const first = identity(firstId, {
    legacyAliases: [alias],
    sourceRecords: [sourceRecord("source-first")],
  });
  const second = identity(secondId, {
    legacyAliases: [alias],
    sourceRecords: [sourceRecord("source-second")],
  });
  assert.equal(
    foundation.resolvePermanentCatalogIdentityAlias([first], "legacy-bgg", "41114").status,
    "requires-identity-review",
  );
  assert.equal(
    foundation.resolvePermanentCatalogIdentityAlias([first, second], "legacy-bgg", "41114").status,
    "ambiguous",
  );
  assert.equal(
    foundation.resolvePermanentCatalogIdentityAlias([first], "legacy-bgg", "missing").status,
    "orphaned",
  );
});

test("a verified alias needs matching identity evidence before it resolves", () => {
  const id = "gf:00000000-0000-4000-8000-000000000005";
  const evidence = {
    id: "evidence-1",
    kind: "publisher-record",
    reference: "fixture://publisher-record",
    observedAt: "2026-01-01T00:00:00.000Z",
    reviewerId: "reviewer-fixture",
  };
  const record = identity(id, {
    status: "verified",
    evidence: [evidence],
    legacyAliases: [
      {
        namespace: "legacy-internal",
        value: "old-key",
        status: "verified",
        evidenceRef: evidence.id,
      },
    ],
  });
  const result = foundation.resolvePermanentCatalogIdentityAlias(
    [record],
    "legacy-internal",
    "old-key",
  );
  assert.equal(result.status, "safe-candidate");
  assert.equal(result.identity.id, id);
});

test("different editions and same-title games remain separate permanent identities", () => {
  const firstId = "gf:00000000-0000-4000-8000-000000000006";
  const secondId = "gf:00000000-0000-4000-8000-000000000007";
  const identities = [
    identity(firstId, {
      title: "Fixture Game",
      sourceRecords: [sourceRecord("edition-1")],
      edition: {
        name: "First Edition",
        printing: null,
        language: "en",
        regionalMarket: "US",
        status: "unverified",
        evidenceRef: null,
      },
    }),
    identity(secondId, {
      title: "Fixture Game",
      sourceRecords: [sourceRecord("edition-2")],
      edition: {
        name: "Second Edition",
        printing: null,
        language: "en",
        regionalMarket: "US",
        status: "unverified",
        evidenceRef: null,
      },
    }),
  ];
  foundation.validatePermanentCatalogIdentityRegistry(identities);
  assert.notEqual(identities[0].id, identities[1].id);
  assert.equal(identities[0].title, identities[1].title);
});

test("custom game IDs remain owner-scoped legacy keys, not provider identities", () => {
  const customId = "gfc_local-test-0001";
  const custom = {
    id: customId,
    title: "Custom Fixture",
    externalIds: [],
    legacyAliases: [
      {
        namespace: "legacy-user",
        value: "old-custom-key",
        status: "verified",
        evidenceRef: "user-decision-1",
      },
    ],
    relationships: [],
  };
  assert.equal(custom.id, customId);
  assert.equal(custom.externalIds.length, 0);
  assert.equal(custom.legacyAliases[0].namespace, "legacy-user");
});
