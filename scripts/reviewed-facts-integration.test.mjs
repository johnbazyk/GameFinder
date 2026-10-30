import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const root = new URL("..", import.meta.url).pathname;
let server;
let catalog;
let scoring;
let integration;
let vibes;
let types;

const identity = { kind: "legacy-bgg", key: "237182", expectedTitle: "Root" };
const scope = {
  product: "Root base game",
  edition: "Synthetic approved scope for integration test only",
  market: "Synthetic test market",
};

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  catalog = await server.ssrLoadModule("/src/lib/catalog.ts");
  scoring = await server.ssrLoadModule("/src/lib/scoring.ts");
  integration = await server.ssrLoadModule("/src/lib/reviewed-facts-integration.ts");
  vibes = await server.ssrLoadModule("/src/lib/vibes.ts");
  types = await server.ssrLoadModule("/src/lib/types.ts");
});

after(async () => {
  await server?.close();
});

function context(ageBand, overrides = {}) {
  return {
    players: null,
    ageBand,
    maxTimeMin: null,
    timeOver60: false,
    vibes: [],
    exactTraits: null,
    ...overrides,
  };
}

function syntheticApprovedRootAgeFact() {
  return {
    reviewRef: "review:test-fixture-root-age-14",
    identity,
    scope,
    field: "publisherMinimumAge",
    value: 14,
    units: "years",
    semantics: "publisher-recommended-minimum-age",
    factualStatus: "VERIFIED",
    source: {
      reference: "test-fixture:synthetic-primary-source",
      url: "https://publisher.example.test/root",
      publisher: "Synthetic Fixture Publisher",
      classification: "publisher-primary",
      accessStatus: "accessible",
      accessedAt: "2026-10-30",
    },
    researcher: {
      kind: "human",
      id: "test-fixture-researcher",
      recordedAt: "2026-10-30",
    },
    humanReview: {
      status: "reviewed",
      reviewerId: "test-fixture-human-reviewer",
      reviewedAt: "2026-10-30",
    },
    ownerApproval: {
      status: "approved",
      approverId: "test-fixture-owner",
      decidedAt: "2026-10-30",
    },
    rightsReview: {
      status: "cleared-for-stated-use",
      intendedUse: "Synthetic test only",
      reviewerId: "test-fixture-rights-reviewer",
      reviewedAt: "2026-10-30",
    },
    previousLegacyValue: { status: "known", value: 10 },
    correctionProposalRef: "test-fixture:root-age-proposal",
  };
}

function correctionAdapter(facts = [syntheticApprovedRootAgeFact()]) {
  return (games) =>
    integration.applyReviewedFactsRegistry(
      games,
      facts.map((fact) => ({
        fact,
        targetIdentity: fact.identity,
        targetScope: fact.scope,
      })),
    );
}

function temporaryUnder14Adapter(games, ctx) {
  const band = vibes.AGE_BANDS.find((item) => item.id === ctx.ageBand);
  const under14 = band?.youngestAge != null && band.youngestAge < 14;
  return under14 ? games.filter((game) => game.bggId !== "237182") : games;
}

function runFind(
  ctx,
  adapter = integration.applicationReviewedFactsAdapter,
  userOwned = ["237182"],
) {
  return scoring.runWizard(
    ctx,
    {
      owned: userOwned,
      wishlist: ["237182"],
      plays: [
        { id: "fixture-play", bggId: "237182", players: 4, durationMin: 80, enjoyed: true, at: 1 },
      ],
      vibeWeights: { ...vibes.DEFAULT_USER_WEIGHTS },
    },
    [],
    adapter,
    catalog.standaloneGames(),
  );
}

function runDiscover(ctx, adapter = integration.applicationReviewedFactsAdapter) {
  return scoring.discoverGames(ctx, "", adapter, catalog.standaloneGames());
}

function resultsFor(ctx, adapter) {
  const find = runFind(ctx, adapter);
  const discover = runDiscover(ctx, adapter);
  const findIds = [...find.ownedList, ...find.unownedList].map((game) => game.bggId).sort();
  const discoverIds = discover.map((game) => game.bggId).sort();
  return { find, discover, findIds, discoverIds };
}

test("production reviewed-facts source is code-controlled, empty, and disabled", () => {
  assert.equal(integration.applicationReviewedFactsEnabled(), false);
  assert.equal(integration.applicationReviewedFactsRegistrySize(), 0);

  const games = catalog.standaloneGames();
  const snapshot = JSON.stringify(games);
  process.env.VITE_REVIEWED_FACTS_ENABLED = "true";
  try {
    const root = games.find((game) => game.bggId === "237182");
    const result = integration.applicationReviewedFactsAdapter(games, context("11-13"), [
      syntheticApprovedRootAgeFact(),
    ]);
    assert.equal(result, games);
    assert.equal(root.age.publisher, 10);
    assert.equal(JSON.stringify(games), snapshot);
    assert.equal(integration.applicationReviewedFactsRegistrySize(), 0);
  } finally {
    delete process.env.VITE_REVIEWED_FACTS_ENABLED;
  }
});

test("inactive Find and Discover match the unadapted legacy pipeline exactly", () => {
  const ctx = context("11-13", { players: 4, maxTimeMin: 90 });
  const games = catalog.standaloneGames();
  const baselineFind = scoring.runWizard(
    ctx,
    {
      owned: ["237182", "9209"],
      wishlist: ["237182"],
      plays: [],
      vibeWeights: { ...vibes.DEFAULT_USER_WEIGHTS },
    },
    [],
    (records) => records,
    games,
  );
  const productionFind = scoring.runWizard(
    ctx,
    {
      owned: ["237182", "9209"],
      wishlist: ["237182"],
      plays: [],
      vibeWeights: { ...scoring.DEFAULT_USER_WEIGHTS },
    },
    [],
    integration.applicationReviewedFactsAdapter,
    games,
  );
  const baselineDiscover = scoring.discoverGames(ctx, "", (records) => records, games);
  const productionDiscover = scoring.discoverGames(
    ctx,
    "",
    integration.applicationReviewedFactsAdapter,
    games,
  );

  assert.deepEqual(productionFind, baselineFind);
  assert.deepEqual(productionDiscover, baselineDiscover);
  assert.equal(productionFind.ownedList.find((game) => game.bggId === "237182").owned, true);
  assert.equal(
    productionFind.unownedList.some((game) => game.bggId === "237182"),
    false,
  );
});

test("synthetic age correction and temporary safeguard flow through actual Find and Discover", () => {
  const scenarios = [
    { id: "8-10", context: context("8-10"), count: [69, 69, 69], root: [false, false, false] },
    { id: "11-13", context: context("11-13"), count: [96, 95, 95], root: [true, false, false] },
    { id: "14-17", context: context("14-17"), count: [131, 131, 131], root: [true, true, true] },
    { id: "adults", context: context("adults"), count: [135, 135, 135], root: [true, true, true] },
  ];
  const adapters = [
    integration.applicationReviewedFactsAdapter,
    correctionAdapter(),
    temporaryUnder14Adapter,
  ];
  for (const scenario of scenarios) {
    for (const [mode, adapter] of adapters.entries()) {
      const { find, discover, findIds, discoverIds } = resultsFor(scenario.context, adapter);
      const eligibleCount = catalog
        .standaloneGames()
        .filter((game) => vibes.passesHardConstraints(game, scenario.context)).length;
      const expectedCount = scenario.count[mode] ?? eligibleCount;
      assert.equal(discover.length, expectedCount, `${scenario.id}: Discover mode ${mode}`);
      assert.equal(
        find.ownedCount + find.unownedCount,
        expectedCount,
        `${scenario.id}: Find mode ${mode}`,
      );
      assert.deepEqual(findIds, discoverIds, `${scenario.id}: Find/Discover ids mode ${mode}`);
      assert.equal(
        discover.some((game) => game.bggId === "237182"),
        scenario.root[mode],
      );
    }
  }
});

test("Root player-count and playtime constraints are still enforced in all shadow modes", () => {
  const adapters = [
    integration.applicationReviewedFactsAdapter,
    correctionAdapter(),
    temporaryUnder14Adapter,
  ];
  const scenarios = [
    { ctx: context("11-13", { players: 2 }), expected: [true, false, false], counts: [86, 85, 85] },
    { ctx: context("11-13", { players: 4 }), expected: [true, false, false], counts: [87, 86, 86] },
    {
      ctx: context("11-13", { players: 1 }),
      expected: [false, false, false],
      counts: [10, 10, 10],
    },
    {
      ctx: context("11-13", { players: 5 }),
      expected: [false, false, false],
      counts: [53, 53, 53],
    },
    {
      ctx: context("14-17", { players: 4, maxTimeMin: 60 }),
      expected: [false, false, false],
      counts: [89, 89, 89],
    },
    {
      ctx: context("14-17", { players: 4, maxTimeMin: 90 }),
      expected: [true, true, true],
      counts: [99, 99, 99],
    },
  ];
  for (const scenario of scenarios) {
    adapters.forEach((adapter, mode) => {
      const { discover, find } = resultsFor(scenario.ctx, adapter);
      const ids = discover.map((game) => game.bggId);
      assert.equal(ids.includes("237182"), scenario.expected[mode]);
      assert.equal(discover.length, scenario.counts[mode]);
      assert.equal(find.ownedCount + find.unownedCount, scenario.counts[mode]);
    });
  }
});

test("synthetic correction changes only Root and never classifies its content as adult", () => {
  const games = catalog.standaloneGames();
  const originalById = new Map(games.map((game) => [game.bggId, game]));
  const syntheticFact = syntheticApprovedRootAgeFact();
  const adapted = integration.applyReviewedFactsRegistry(games, [
    { fact: syntheticFact, targetIdentity: identity, targetScope: scope },
  ]);

  for (const game of adapted) {
    const original = originalById.get(game.bggId);
    assert.ok(original);
    if (game.bggId === "237182") {
      assert.equal(original.age.publisher, 10);
      assert.equal(game.age.publisher, 14);
      assert.equal(game.adultContent, undefined);
      assert.equal(vibes.hasAdultContent(game), false);
    } else {
      assert.equal(game, original, `${game.name} must retain its original instance`);
    }
  }
});

test("disputed, scope-mismatched, stale, and identity-ambiguous entries fail closed", () => {
  const base = syntheticApprovedRootAgeFact();
  const cases = [
    { ...base, factualStatus: "DISPUTED" },
    { ...base, scope: { ...scope, edition: "Current listing edition" } },
    { ...base, previousLegacyValue: { status: "known", value: 9 } },
  ];
  for (const fact of cases) {
    const output = integration.applyReviewedFactsRegistry(catalog.standaloneGames(), [
      { fact, targetIdentity: identity, targetScope: scope },
    ]);
    assert.equal(output.find((game) => game.bggId === "237182").age.publisher, 10);
  }

  const root = catalog.standaloneGames().find((game) => game.bggId === "237182");
  const ambiguousEntries = [
    {
      fact: {
        ...base,
        identity: { kind: "legacy-bgg", key: root.bggId, expectedTitle: root.name },
      },
      targetIdentity: { ...identity, expectedTitle: "Wrong title" },
      targetScope: scope,
    },
  ];
  const output = integration.applyReviewedFactsRegistry(
    catalog.standaloneGames(),
    ambiguousEntries,
  );
  assert.equal(output.find((game) => game.bggId === "237182").age.publisher, 10);
});

test("Discover subsets cannot bypass whole-catalog identity ambiguity", () => {
  const catan = catalog.standaloneGames().find((game) => game.bggId === "13");
  assert.ok(catan);
  const fact = {
    ...syntheticApprovedRootAgeFact(),
    identity: { kind: "legacy-bgg", key: "13", expectedTitle: "Catan" },
    scope: { ...scope, product: "Catan base game" },
    previousLegacyValue: { status: "known", value: catan.age.publisher },
  };
  const subset = [catan];
  const output = integration.applyReviewedFactsRegistry(subset, [
    {
      fact,
      targetIdentity: fact.identity,
      targetScope: fact.scope,
    },
  ]);
  assert.equal(output[0].age.publisher, catan.age.publisher);
  assert.equal(output[0], catan);
});

test("missing and conflicting evidence cannot be authorized by browser-shaped records", () => {
  const base = syntheticApprovedRootAgeFact();
  const missingEvidence = {
    ...base,
    source: {
      reference: null,
      url: null,
      publisher: null,
      classification: "none",
      accessStatus: "unavailable",
      accessedAt: null,
    },
  };
  const noApproval = {
    ...base,
    ownerApproval: { status: "pending", approverId: null, decidedAt: null },
  };
  for (const fact of [missingEvidence, noApproval]) {
    const output = integration.applyReviewedFactsRegistry(catalog.standaloneGames(), [
      { fact, targetIdentity: identity, targetScope: scope },
    ]);
    assert.equal(output.find((game) => game.bggId === "237182").age.publisher, 10);
  }
  const conflict = {
    ...base,
    reviewRef: "review:test-fixture-root-age-conflict",
    value: 13,
  };
  const output = integration.applyReviewedFactsRegistry(catalog.standaloneGames(), [
    { fact: base, targetIdentity: identity, targetScope: scope },
    { fact: conflict, targetIdentity: identity, targetScope: scope },
    { fact: { ...base, factualStatus: "INVALID" }, targetIdentity: identity, targetScope: scope },
    null,
    "approved",
  ]);
  assert.equal(output.find((game) => game.bggId === "237182").age.publisher, 10);

  const customGameEntry = {
    fact: {
      ...base,
      identity: {
        kind: "custom-game",
        key: "gfc_local-test-0001",
        expectedTitle: "User Game",
      },
    },
    targetIdentity: {
      kind: "custom-game",
      key: "gfc_local-test-0001",
      expectedTitle: "User Game",
    },
    targetScope: scope,
  };
  const userRecordOutput = integration.applyReviewedFactsRegistry(catalog.standaloneGames(), [
    customGameEntry,
  ]);
  assert.equal(userRecordOutput.find((game) => game.bggId === "237182").age.publisher, 10);
});

test("legacy values and user references are preserved for rollback", () => {
  const games = catalog.standaloneGames();
  const root = games.find((game) => game.bggId === "237182");
  const before = JSON.stringify(games);
  const userReferences = {
    owned: ["237182"],
    wishlist: ["237182"],
    plays: [{ bggId: "237182", at: 1 }],
    scores: [{ bggId: "237182", id: "fixture-score" }],
    groupPlays: [{ bggId: "237182", groupId: "fixture-group" }],
  };
  const referencesBefore = JSON.stringify(userReferences);
  const syntheticFact = syntheticApprovedRootAgeFact();
  const adapted = integration.applyReviewedFactsRegistry(games, [
    { fact: syntheticFact, targetIdentity: identity, targetScope: scope },
  ]);

  assert.equal(root.age.publisher, 10);
  assert.equal(JSON.stringify(games), before);
  assert.equal(JSON.stringify(userReferences), referencesBefore);
  assert.equal(adapted.find((game) => game.bggId === "237182").age.publisher, 14);
  assert.equal(adapted.find((game) => game.bggId === "237182").bggId, "237182");
});

test("owned versus unowned Find pools change only for Root when a synthetic fact is active", () => {
  const ctx = context("11-13", { players: 4 });
  const correction = correctionAdapter();
  const rootOwnedBefore = runFind(ctx, integration.applicationReviewedFactsAdapter, ["237182"]);
  const rootOwnedAfter = runFind(ctx, correction, ["237182"]);
  assert.equal(rootOwnedBefore.ownedCount, 1);
  assert.equal(rootOwnedAfter.ownedCount, 0);
  assert.equal(rootOwnedBefore.unownedCount, 86);
  assert.equal(rootOwnedAfter.unownedCount, 86);

  const rootUnownedBefore = runFind(ctx, integration.applicationReviewedFactsAdapter, ["9209"]);
  const rootUnownedAfter = runFind(ctx, correction, ["9209"]);
  assert.equal(rootUnownedBefore.ownedCount, 1);
  assert.equal(rootUnownedAfter.ownedCount, 1);
  assert.equal(rootUnownedBefore.unownedCount, 86);
  assert.equal(rootUnownedAfter.unownedCount, 85);
  assert.deepEqual(
    rootUnownedBefore.ownedList.map((game) => game.bggId),
    rootUnownedAfter.ownedList.map((game) => game.bggId),
  );
});

test("six-Vibe scoring, Surprise Me, and Find ownership pools remain unchanged when inactive", () => {
  const ctx = context("11-13", { players: 4, vibes: ["strategy", "family"] });
  const games = catalog.standaloneGames();
  const identityAdapter = (records) => records;
  const expectedDiscover = scoring.discoverGames(ctx, "", identityAdapter, games);
  const actualDiscover = scoring.discoverGames(
    ctx,
    "",
    integration.applicationReviewedFactsAdapter,
    games,
  );
  assert.deepEqual(actualDiscover, expectedDiscover);
  assert.deepEqual(
    actualDiscover.map((game) => scoring.vibePreferenceScore(game, ctx.vibes)),
    expectedDiscover.map((game) => scoring.vibePreferenceScore(game, ctx.vibes)),
  );

  const find = runFind(ctx);
  assert.ok(find.ownedList.every((game) => game.owned));
  assert.ok(find.unownedList.every((game) => !game.owned));
  assert.equal(
    find.ownedList.some((game) => find.unownedList.includes(game)),
    false,
  );
  assert.equal(typeof scoring.pickSurprise(["9209"])?.bggId, "string");
  assert.deepEqual(types.VIBE_IDS, ["luck", "strategy", "dexterity", "family", "party", "board"]);
});
