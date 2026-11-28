import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
let server, preview, confirm;
before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ previewCollectionImport: preview, planConfirmedCollectionImport: confirm } =
    await server.ssrLoadModule("/src/lib/catalog-collection-preview.ts"));
});
after(async () => server?.close());
const fixture = (n, external = String(n), overrides = {}) => ({
  id: "gf:00000000-0000-4000-8000-" + String(n).padStart(12, "0"),
  title: "Fixture " + n,
  status: "verified",
  conflictStatus: "none",
  edition: {
    name: null,
    printing: null,
    language: null,
    regionalMarket: null,
    status: "missing",
    evidenceRef: null,
  },
  sourceRecords: [
    {
      sourceNamespace: "fixture",
      sourceRecordId: String(n),
      recordKey: String(n),
      fingerprint: "a".repeat(64),
    },
  ],
  legacyAliases: [],
  relationships: [],
  externalIds: [{ provider: "synthetic", value: external, status: "verified", evidenceRef: "e" }],
  evidence: [
    {
      id: "e",
      kind: "curator-review",
      reference: "fixture",
      observedAt: "2026-01-01",
      reviewerId: "fixture",
    },
  ],
  createdAt: "2026-01-01",
  revisionHistory: [{ revision: 1, recordedAt: "2026-01-01", changeRef: "fixture" }],
  ...overrides,
});
const claim = (n, title = "Fixture " + n) => ({
  provider: "synthetic",
  externalId: String(n),
  title,
});
test("preview preserves ambiguity and requires verified identity without title-only matching", () => {
  const identities = [
    fixture(1),
    fixture(2),
    fixture(3, "3", { conflictStatus: "review-required" }),
    fixture(4, "4"),
    fixture(5, "4"),
  ];
  const input = [
    claim(1),
    claim(1),
    claim(2),
    claim(3),
    claim(4),
    claim(9, "Fixture 1"),
    claim(1, "Other edition"),
    null,
  ];
  const before = JSON.stringify({ input, identities });
  const result = preview(input, identities, [identities[1].id], false);
  assert.deepEqual(
    result.rows.map((r) => r.status),
    [
      "ready",
      "duplicate",
      "already-owned",
      "review",
      "ambiguous",
      "unresolved",
      "review",
      "invalid",
    ],
  );
  assert.deepEqual(result.eligibleIds, [identities[0].id]);
  assert.equal(JSON.stringify({ input, identities }), before);
});
test("preview respects capacity without silently truncating or modifying ownership", () => {
  const identities = [fixture(1), fixture(2)];
  const owned = Array.from({ length: 49 }, (_, i) => "legacy-" + i);
  const free = preview([claim(1), claim(2)], identities, owned, false);
  assert.equal(free.available, 1);
  assert.equal(free.requiresSelection, true);
  assert.equal(free.eligibleIds.length, 2);
  assert.equal(preview([claim(1), claim(2)], identities, owned, true).requiresSelection, false);
  assert.equal(preview([claim(1)], identities, [...owned, "old", "old2"], false).available, 0);
  assert.equal(owned.length, 49);
});

test("confirmation revalidates identity and current capacity and supports safe replay", () => {
  const identities = [fixture(1), fixture(2)];
  const input = [claim(1), claim(2)];
  const owned = Array.from({ length: 49 }, (_, i) => "legacy-" + i);
  const first = identities[0].id,
    second = identities[1].id;
  assert.throws(() => confirm(input, identities, owned, false, [first, second]), /capacity/);
  const planned = confirm(input, identities, owned, false, [first, first]);
  assert.deepEqual(planned.additions, [first]);
  assert.deepEqual(planned.nextOwnedIds, [...owned, first]);
  assert.deepEqual(confirm(input, identities, planned.nextOwnedIds, false, [first]).additions, []);
  assert.throws(
    () => confirm(input, identities, planned.nextOwnedIds, false, [second]),
    /capacity/,
  );
  assert.throws(
    () =>
      confirm(
        input,
        [fixture(1, "1", { conflictStatus: "ambiguous" }), identities[1]],
        owned,
        true,
        [first],
      ),
    /no longer eligible/,
  );
  assert.throws(() => confirm(input, identities, owned, true, ["legacy-0"]), /no longer eligible/);
  assert.throws(() => confirm(input, identities, owned, true, ["forged"]), /no longer eligible/);
  assert.equal(owned.length, 49);
});
