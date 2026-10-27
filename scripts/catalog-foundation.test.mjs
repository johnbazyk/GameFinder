import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { createServer } from "vite";

const root = new URL("..", import.meta.url).pathname;
let server;
let catalog;
let foundation;
let types;
let store;

before(async () => {
  globalThis.localStorage ??= {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  catalog = await server.ssrLoadModule("/src/lib/catalog.ts");
  foundation = await server.ssrLoadModule("/src/lib/catalog-foundation.ts");
  types = await server.ssrLoadModule("/src/lib/types.ts");
  ({ useAppStore: store } = await server.ssrLoadModule("/src/lib/store.ts"));
});

after(async () => {
  await server?.close();
});

function context(overrides = {}) {
  return {
    players: null,
    ageBand: null,
    maxTimeMin: null,
    timeOver60: false,
    vibes: [],
    exactTraits: null,
    ...overrides,
  };
}

function rulebook(overrides = {}) {
  return foundation.createRulebookReference({
    id: "rulebook-test-1",
    catalogGameId: "gf:legacy:lantern-orchard:1",
    edition: null,
    publisher: "Fictional Orchard Press",
    officialSourceUrl: "https://publisher.example/lantern-orchard/rules",
    documentTitle: "Lantern Orchard Rules",
    language: "en",
    version: "1",
    publicationDate: null,
    lastVerifiedDate: null,
    sourceClassification: "official-publisher",
    ...overrides,
  });
}

test("legacy games have stable internal IDs and keep BGG IDs as external IDs", () => {
  const game = catalog.GAMES.find((entry) => entry.bggId === "9209");
  assert.ok(game);
  const first = foundation.catalogRecordFromGame(game);
  const second = foundation.catalogRecordFromGame(game);

  assert.equal(first.id, second.id);
  assert.notEqual(first.id, game.bggId);
  assert.deepEqual(first.externalIds, [{ provider: "bgg", value: "9209" }]);
  assert.equal(first.yearPublished, game.yearPublished);
  assert.equal(first.adultContent, null);
});

test("legacy facts retain unverified provenance instead of implying licensing or verification", () => {
  const game = catalog.GAMES.find((entry) => entry.bggId === "9209");
  assert.ok(game);
  const record = foundation.catalogRecordFromGame(game);

  assert.ok(record.sources.some((source) => source.field === "externalIds.bgg"));
  assert.ok(record.sources.every((source) => source.verification === "unverified"));
  assert.ok(record.sources.every((source) => source.lastVerified === null));
  assert.deepEqual(record.missingFields, ["publisher", "edition"]);
});

test("legacy and user-entered entries share one catalog model and title search", () => {
  const custom = foundation.createCustomCatalogGame("Lantern Orchard", "gfc_local-test-0010");
  const records = foundation.unifiedCatalogRecords(catalog.GAMES, [custom]);
  const found = foundation.searchCatalogRecords(records, "lantern");

  assert.equal(found.length, 1);
  assert.equal(found[0].id, custom.id);
  assert.equal(
    foundation.searchCatalogRecords(records, "codenames")[0].externalIds[0].value,
    "178900",
  );
  assert.throws(() => foundation.unifiedCatalogRecords(catalog.GAMES, [custom, custom]));
});

test("the legacy 41114 collision is audited without reassigning either title", () => {
  const conflict = catalog.CATALOG_EXTERNAL_ID_CONFLICTS.find(
    (entry) => entry.externalId === "41114",
  );
  assert.deepEqual(conflict, {
    provider: "bgg",
    externalId: "41114",
    names: ["The Resistance", "Sleeping Queens"],
  });
  assert.equal(catalog.GAMES.filter((game) => game.bggId === "41114").length, 1);
});

test("quality audit reports issues without mutating catalog entries", () => {
  const audit = catalog.auditCatalogQuality();
  assert.deepEqual(audit.duplicateExternalIds[0].names, ["The Resistance", "Sleeping Queens"]);
  assert.equal(audit.invalidPlayerCounts.length, 0);
  assert.deepEqual(audit.invalidPlaytimes, ["Sheriff of Nottingham"]);
  assert.equal(audit.invalidAges.length, 0);
  assert.equal(audit.invalidRubrics.length, 0);
  assert.equal(audit.invalidRatings.length, 0);
  assert.equal(audit.unverifiedCommunityRatingCount, catalog.GAMES.length + 1);
  assert.equal(audit.missingPublisherCount, catalog.GAMES.length + 1);
  assert.equal(audit.missingEditionCount, catalog.GAMES.length + 1);
  assert.ok(audit.editionLabelsWithoutMetadata.includes("Twilight Imperium (4th)"));
  assert.ok(audit.ageDisagreements.length > 0);
  assert.ok(audit.unresolvedExpansionReferences.length > 0);
});

test("custom records get stable IDs and keep unknown facts unknown", () => {
  const record = foundation.createCustomCatalogGame("  My Table Game  ", "gfc_local-test-0001");
  assert.equal(record.title, "My Table Game");
  assert.equal(record.id, "gfc_local-test-0001");
  assert.equal(record.players.minimum, null);
  assert.equal(record.players.maximum, null);
  assert.equal(record.publisherMinimumAge, null);
  assert.equal(record.maximumListedPlaytimeMinutes, null);
  assert.equal(record.adultContent, null);
  assert.deepEqual(record.rubric, {});
  assert.deepEqual(record.vibeScores, {});
  assert.equal(foundation.isCustomCatalogGame(record), true);
  assert.throws(() => foundation.createCustomCatalogGame("  "));
});

test("unknown required hard-filter fields prevent eligibility", () => {
  const record = foundation.createCustomCatalogGame("Cloud Harbor", "gfc_local-test-0002");
  const constrained = context({
    players: 4,
    ageBand: "8-10",
    maxTimeMin: 60,
  });
  assert.equal(foundation.catalogHardEligible(record, constrained), false);
  assert.equal(foundation.catalogHardEligible(record, context()), true);
});

test("catalog hard filters use known values while unknown adult status fails closed", () => {
  const base = foundation.createCustomCatalogGame("Lantern Orchard", "gfc_local-test-0003");
  const complete = {
    ...base,
    players: { minimum: 2, maximum: 4, best: [3, 4] },
    publisherMinimumAge: 8,
    maximumListedPlaytimeMinutes: 45,
    adultContent: false,
  };
  assert.equal(
    foundation.catalogHardEligible(
      complete,
      context({ players: 4, ageBand: "8-10", maxTimeMin: 60 }),
    ),
    true,
  );
  assert.equal(
    foundation.catalogHardEligible(
      { ...complete, adultContent: null },
      context({ ageBand: "8-10" }),
    ),
    false,
  );
  assert.equal(
    foundation.catalogHardEligible(
      { ...complete, maximumListedPlaytimeMinutes: null },
      context({ maxTimeMin: 60 }),
    ),
    false,
  );
});

test("soft Vibe data affects ranking only when provided", () => {
  const record = foundation.createCustomCatalogGame("Cloud Harbor", "gfc_local-test-0004");
  assert.equal(foundation.catalogVibePreferenceScore(record, ["strategy"]), null);
  const scored = {
    ...record,
    vibeScores: { strategy: 4.5, luck: 1 },
  };
  assert.equal(foundation.catalogVibePreferenceScore(scored, ["strategy"]), 39);
  assert.equal(foundation.catalogHardEligible(record, context({ vibes: ["strategy"] })), true);
});

test("external provider IDs are detected as conflicts instead of merged", () => {
  const resistance = catalog.GAMES.find((game) => game.name === "The Resistance");
  assert.ok(resistance);
  const record = foundation.catalogRecordFromGame(resistance);
  const conflict = foundation.createCustomCatalogGame("Different title", "gfc_local-test-0005");
  conflict.externalIds = [{ provider: "bgg", value: "41114" }];

  assert.deepEqual(
    foundation.findExternalIdConflicts([record], "bgg", "41114").map((entry) => entry.title),
    ["The Resistance"],
  );
  assert.equal(foundation.isExternalIdConflictFree([record], conflict), false);
  assert.equal(foundation.isExternalIdConflictFree([], conflict), true);
});

test("BGG stays disabled and test searches use only authored local mocks", async () => {
  const disabled = foundation.createBggMockProvider();
  assert.equal(disabled.policy.enabled, false);
  assert.equal(disabled.policy.cacheEnabled, false);
  assert.equal(disabled.policy.cacheRetentionMs, 0);
  assert.equal(disabled.policy.commercialUseAuthorized, false);
  assert.equal(disabled.policy.aiUseAuthorized, false);
  await assert.rejects(disabled.searchByTitle("Lantern"), {
    name: "CatalogProviderError",
    code: "disabled",
  });

  const mock = foundation.createBggMockProvider({ useLocalMocks: true });
  await assert.rejects(mock.searchByTitle(" "), { code: "invalid-request" });
  assert.throws(
    () =>
      mock.normalize({
        externalId: "",
        title: "",
        minimumPlayers: -1,
        maximumPlayers: 0,
      }),
    { code: "invalid-response" },
  );
  const found = await mock.searchByTitle("Lantern");
  assert.equal(found.length, 1);
  const normalized = mock.normalize(found[0]);
  assert.equal(normalized.origin, "mock");
  assert.deepEqual(normalized.externalIds, [{ provider: "bgg", value: "mock-0001" }]);
  assert.equal(normalized.publisherMinimumAge, null);
  const possibleEdition = {
    relation: "edition",
    catalogGameId: null,
    externalIds: [],
    title: "Lantern Orchard Deluxe",
  };
  assert.deepEqual(
    mock.identifyPossibleRelations({ ...found[0], relationships: [possibleEdition] }),
    [possibleEdition],
  );
  assert.ok(mock.reportMissingInformation(found[0]).includes("publisherMinimumAge"));
  const incomplete = await mock.retrieveByExternalId("mock-0002");
  assert.deepEqual(mock.reportMissingInformation(incomplete), [
    "publisher",
    "yearPublished",
    "edition",
    "publisherMinimumAge",
    "maximumListedPlaytimeMinutes",
    "adultContent",
    "categories",
    "mechanics",
    "rubric",
    "vibeScores",
    "players.minimum",
    "players.maximum",
  ]);
});

test("rulebook links do not grant rights and Finn requires documented AI permissions", () => {
  const fictionalExcerpt =
    "Lantern Orchard is a fictional test game. On your turn, place one seed token in an empty grove.";
  const linkOnly = rulebook({ copyrightStatus: "official-link-available" });
  assert.equal(foundation.rulebookReferenceCanBeUsedByFinn(linkOnly), false);
  assert.ok(fictionalExcerpt.length < 200);
  assert.equal(
    foundation.rulebookReferenceCanBeUsedByFinn(
      rulebook({
        sourceClassification: "fictional-test",
        copyrightStatus: "unknown",
      }),
    ),
    false,
  );

  const pending = rulebook();
  assert.equal(pending.copyrightStatus, "permission-pending");
  assert.deepEqual(pending.permissionScope, {
    storage: false,
    parsing: false,
    aiRetrieval: false,
    display: false,
  });
  assert.equal(foundation.rulebookReferenceCanBeUsedByFinn(pending), false);

  const authorized = rulebook({
    copyrightStatus: "authorized",
    permissionScope: { storage: true, parsing: true, aiRetrieval: true, display: true },
  });
  assert.equal(foundation.rulebookReferenceCanBeUsedByFinn(authorized), true);
  assert.equal(
    foundation.rulebookReferenceCanBeUsedByFinn(
      rulebook({
        copyrightStatus: "authorized",
        permissionScope: { storage: true, parsing: true, aiRetrieval: false, display: true },
      }),
    ),
    false,
  );
  assert.equal(
    foundation.rulebookReferenceCanBeUsedByFinn(
      rulebook({
        copyrightStatus: "revoked",
        permissionScope: { storage: true, parsing: true, aiRetrieval: true, display: true },
      }),
    ),
    false,
  );
});

test("adding a custom record preserves legacy Vault IDs and the free Vault cap", () => {
  const previousOwned = ["9209"];
  store.setState({ owned: previousOwned, customGames: [] });
  const custom = store.getState().addCustomGame("My Night Game");

  assert.deepEqual(store.getState().owned, previousOwned);
  assert.equal(store.getState().addOwned(custom.id), "ok");
  assert.deepEqual(store.getState().owned, ["9209", custom.id]);
  assert.equal(store.getState().customGames[0].id, custom.id);

  store.setState({
    owned: Array.from({ length: types.FREE_VAULT_LIMIT }, (_, index) => `legacy-${index}`),
    isPremium: false,
  });
  assert.equal(store.getState().addOwned(custom.id), "limit");
});

test("the schema migrates and all rulebook permission scopes default to false", async () => {
  const db = new PGlite();
  try {
    await db.exec('create table "user" (id text primary key)');
    await db.exec("create table vault_games (user_id text, bgg_id text, list text)");
    await db.exec("insert into vault_games values ('legacy-user', '41114', 'owned')");
    await db.exec(
      readFileSync(new URL("../migrations/0006_catalog_foundation.sql", import.meta.url), "utf8"),
    );
    const rows = await db.query(
      "select column_name, column_default from information_schema.columns where table_name = 'rulebook_sources'",
    );
    const defaults = new Map(rows.rows.map((row) => [row.column_name, row.column_default]));
    assert.equal(defaults.get("allow_storage"), "false");
    assert.equal(defaults.get("allow_parsing"), "false");
    assert.equal(defaults.get("allow_ai_retrieval"), "false");
    assert.equal(defaults.get("allow_display"), "false");
    const vault = await db.query(
      "select user_id, bgg_id, list from vault_games where bgg_id = '41114'",
    );
    assert.deepEqual(vault.rows, [{ user_id: "legacy-user", bgg_id: "41114", list: "owned" }]);
    await db.exec("drop table rulebook_sources");
  } finally {
    await db.close();
  }
});
