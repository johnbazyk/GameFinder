import assert from "node:assert/strict";
import { test } from "node:test";
import { collectIdentityDryRun, simulateIdentityMigration } from "./catalog-identity-dry-run.mjs";

const catalogId = (last) => `gf:00000000-0000-4000-8000-${last.padStart(12, "0")}`;

function identity(id, legacyKey, overrides = {}) {
  return {
    id,
    title: "Test Game",
    externalIds: [
      {
        provider: "bgg",
        value: legacyKey,
        status: "verified",
        evidenceRef: "fixture-source",
      },
    ],
    legacyAliases: [
      {
        namespace: "legacy-bgg",
        value: legacyKey,
        status: "verified",
        evidenceRef: "fixture-source",
      },
    ],
    relationships: [],
    ...overrides,
  };
}

function reference(id, value, kind = "vault") {
  return {
    id,
    kind,
    legacyKey: { namespace: "legacy-bgg", value },
  };
}

test("permanent identity survives title and external-ID corrections", () => {
  const permanentId = catalogId("1");
  const original = identity(permanentId, "1001", {
    legacyAliases: [
      {
        namespace: "legacy-bgg",
        value: "1001",
        status: "verified",
        evidenceRef: "fixture-source",
      },
    ],
  });
  const corrected = {
    ...original,
    title: "Corrected Title",
    externalIds: [
      {
        provider: "bgg",
        value: "2002",
        status: "verified",
        evidenceRef: "fixture-source",
      },
    ],
  };
  const before = simulateIdentityMigration([original], [reference("old-ref", "1001")]);
  const after = simulateIdentityMigration([corrected], [reference("old-ref", "1001")]);

  assert.equal(before.plan[0].proposedCatalogGameId, permanentId);
  assert.equal(after.plan[0].proposedCatalogGameId, permanentId);
  assert.equal(corrected.id, original.id);
});

test("duplicate permanent IDs fail rather than merging unrelated games", () => {
  const duplicateId = catalogId("2");
  assert.throws(
    () =>
      simulateIdentityMigration([identity(duplicateId, "1002"), identity(duplicateId, "1003")], []),
    /Duplicate permanent catalog ID/,
  );
});

test("shared legacy external IDs remain ambiguous until a per-reference decision", () => {
  const firstId = catalogId("3");
  const secondId = catalogId("4");
  const identities = [
    identity(firstId, "41114", {
      externalIds: [{ provider: "bgg", value: "41114", status: "disputed" }],
      legacyAliases: [{ namespace: "legacy-bgg", value: "41114", status: "unverified" }],
    }),
    identity(secondId, "41114", {
      externalIds: [{ provider: "bgg", value: "41114", status: "disputed" }],
      legacyAliases: [{ namespace: "legacy-bgg", value: "41114", status: "unverified" }],
    }),
  ];
  const ambiguous = simulateIdentityMigration(identities, [reference("saved-vault", "41114")]);
  const chosen = simulateIdentityMigration(identities, [reference("saved-vault", "41114")], {
    "saved-vault": { catalogGameId: secondId, decisionId: "human-review-001" },
  });

  assert.equal(ambiguous.plan[0].status, "ambiguous");
  assert.equal(ambiguous.plan[0].proposedCatalogGameId, null);
  assert.deepEqual(ambiguous.plan[0].candidateCatalogGameIds, [firstId, secondId]);
  assert.equal(chosen.plan[0].status, "explicitly-resolved-in-simulation");
  assert.equal(chosen.plan[0].proposedCatalogGameId, secondId);
  assert.throws(
    () =>
      simulateIdentityMigration(identities, [reference("saved-vault", "41114")], {
        "saved-vault": { catalogGameId: catalogId("9"), decisionId: "bad-choice" },
      }),
    /not a recorded candidate/,
  );
});

test("vault, play, and score references are not reassigned or mutated by a dry run", () => {
  const ambiguousIdOne = catalogId("5");
  const ambiguousIdTwo = catalogId("6");
  const identities = [
    identity(ambiguousIdOne, "41114", {
      legacyAliases: [{ namespace: "legacy-bgg", value: "41114", status: "unverified" }],
    }),
    identity(ambiguousIdTwo, "41114", {
      legacyAliases: [{ namespace: "legacy-bgg", value: "41114", status: "unverified" }],
    }),
  ];
  const references = [
    reference("vault-1", "41114", "vault"),
    reference("play-1", "41114", "play-history"),
    reference("score-1", "41114", "score-session"),
  ];
  const snapshot = JSON.stringify({ identities, references });
  const result = simulateIdentityMigration(identities, references);

  assert.equal(JSON.stringify({ identities, references }), snapshot);
  assert.ok(result.plan.every((entry) => entry.status === "ambiguous"));
  assert.ok(result.plan.every((entry) => entry.proposedCatalogGameId === null));
  assert.equal(result.summary.writesPerformed, 0);
});

test("user-created permanent IDs remain stable and separate from provider IDs", () => {
  const userId = "gfc_local-test-0001";
  const custom = {
    id: userId,
    title: "Renamed Table Game",
    externalIds: [],
    legacyAliases: [
      {
        namespace: "legacy-user",
        value: "old-title-key",
        status: "verified",
        evidenceRef: "user-decision-001",
      },
    ],
    relationships: [],
  };
  const result = simulateIdentityMigration(
    [custom],
    [
      {
        id: "custom-vault",
        kind: "vault",
        legacyKey: { namespace: "legacy-user", value: "old-title-key" },
      },
    ],
  );

  assert.equal(result.plan[0].proposedCatalogGameId, userId);
  assert.equal(custom.id, userId);
});

test("edition and expansion relationships point to permanent IDs, not names or BGG IDs", () => {
  const baseId = catalogId("7");
  const editionId = catalogId("8");
  const expansionId = catalogId("9");
  const unresolvedRelationId = catalogId("10");
  const identities = [
    identity(baseId, "base", {
      externalIds: [],
      legacyAliases: [],
      relationships: [
        { relation: "edition", catalogGameId: editionId },
        { relation: "expansion", catalogGameId: expansionId },
      ],
    }),
    identity(editionId, "edition", { externalIds: [], legacyAliases: [] }),
    identity(expansionId, "expansion", { externalIds: [], legacyAliases: [] }),
    identity(unresolvedRelationId, "unresolved", {
      externalIds: [],
      legacyAliases: [],
      relationships: [{ relation: "edition", catalogGameId: null }],
    }),
  ];

  assert.equal(simulateIdentityMigration(identities, []).summary.unresolvedRelationshipCount, 1);
  assert.throws(
    () =>
      simulateIdentityMigration(
        [
          identity(baseId, "base", {
            externalIds: [],
            legacyAliases: [],
            relationships: [{ relation: "expansion", catalogGameId: catalogId("10") }],
          }),
        ],
        [],
      ),
    /invalid catalog relationship/,
  );
});

test("unknown and invalid identifiers are quarantined instead of treated as matches", () => {
  const known = identity(catalogId("11"), "999011");
  const invalidBgg = identity(catalogId("12"), "not-a-bgg-id", {
    externalIds: [
      {
        provider: "bgg",
        value: "not-a-bgg-id",
        status: "verified",
        evidenceRef: "fixture-source",
      },
    ],
  });

  assert.throws(
    () => simulateIdentityMigration([invalidBgg], []),
    /Verified BGG IDs must be numeric/,
  );
  const result = simulateIdentityMigration(
    [known],
    [
      reference("unknown", "unknown"),
      { id: "invalid", kind: "vault", legacyKey: { namespace: "legacy-bgg", value: "" } },
    ],
  );
  assert.deepEqual(
    result.plan.map((entry) => entry.status),
    ["orphan", "invalid-reference"],
  );
  assert.ok(result.plan.every((entry) => entry.proposedCatalogGameId === null));
});

test("unverified suffixed aliases are review-only and never auto-mapped", () => {
  const record = identity(catalogId("13"), "31260-revised", {
    externalIds: [{ provider: "bgg", value: "31260-revised", status: "disputed" }],
    legacyAliases: [{ namespace: "legacy-bgg", value: "31260-revised", status: "unverified" }],
  });
  const result = simulateIdentityMigration(
    [record],
    [reference("old-score", "31260-revised", "score-session")],
  );

  assert.equal(result.plan[0].status, "needs-identity-review");
  assert.equal(result.plan[0].proposedCatalogGameId, null);
  assert.equal(result.summary.proposedAutomaticMappings, 0);
});

test("verified mappings require an evidence reference", () => {
  const record = identity(catalogId("14"), "999014", {
    legacyAliases: [{ namespace: "legacy-bgg", value: "999014", status: "verified" }],
  });

  assert.throws(() => simulateIdentityMigration([record], []), /invalid legacy alias/);
});

test("current inventory and reference-surface report reads no user data or network", async () => {
  const result = await collectIdentityDryRun();

  assert.equal(result.catalogInventory.authoredRecords, 143);
  assert.equal(result.catalogInventory.visibleRecords, 142);
  assert.equal(result.catalogInventory.records.length, 143);
  assert.equal(result.catalogInventory.exactDuplicateBggGroups.length, 1);
  assert.equal(result.catalogInventory.possibleNumericPrefixPairs.length, 7);
  assert.equal(result.catalogInventory.affectedPrefixCollisionRecords, 14);
  assert.equal(result.catalogInventory.guildTransformation.currentCatalogRowsForSourceKey, 0);
  assert.equal(
    result.catalogInventory.guildTransformation.currentRecord.title,
    "The Guild of Merchant Explorers",
  );
  assert.equal(result.catalogInventory.guildTransformation.currentRecord.legacyBggKey, "367041");
  assert.equal(
    result.syntheticDryRun.disclaimer,
    "Synthetic fixture references only; no local or cloud user data was read.",
  );
  assert.deepEqual(result.syntheticDryRun.summary.countsByStatus, {
    "safe-candidate": 1,
    ambiguous: 1,
    "needs-identity-review": 1,
    orphan: 2,
  });
  assert.equal(
    result.syntheticDryRun.plan.find((entry) => entry.legacyKey?.value === "318184").status,
    "orphan",
  );
  assert.equal(result.syntheticDryRun.summary.writesPerformed, 0);
  assert.equal(result.writesPerformed, 0);
  assert.equal(result.networkRequests, 0);
  assert.ok(
    result.referenceSurfaces.some((surface) => surface.references.includes("vault_games.bgg_id")),
  );
  assert.ok(
    result.referenceSurfaces.some((surface) => surface.references.includes("group_plays.bgg_id")),
  );
});
