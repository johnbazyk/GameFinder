import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const root = new URL("..", import.meta.url).pathname;
let server;
let reviewedFacts;
let catalog;
let vibes;
let scoring;

const rootIdentity = {
  kind: "legacy-bgg",
  key: "237182",
  expectedTitle: "Root",
};
const legacyRootScope = {
  product: "Root base game",
  edition: "Historical 2018 printing unknown",
  market: "Unknown",
};
const currentRootListingScope = {
  product: "Root base game",
  edition: "Current product listing; edition unspecified",
  market: "Leder Games listing; market unspecified",
};

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  reviewedFacts = await server.ssrLoadModule("/src/lib/reviewed-facts.ts");
  catalog = await server.ssrLoadModule("/src/lib/catalog.ts");
  vibes = await server.ssrLoadModule("/src/lib/vibes.ts");
  scoring = await server.ssrLoadModule("/src/lib/scoring.ts");
});

after(async () => {
  await server?.close();
});

function rootAgeFact(overrides = {}) {
  return {
    reviewRef: "review:root-current-age-2026",
    identity: rootIdentity,
    scope: currentRootListingScope,
    field: "publisherMinimumAge",
    value: 14,
    units: "years",
    semantics: "publisher-recommended-minimum-age",
    factualStatus: "VERIFIED",
    source: {
      reference: "source:leder-root-product-2026-10-30",
      url: "https://ledergames.com/products/root-a-game-of-woodland-might-and-right",
      publisher: "Leder Games",
      classification: "publisher-primary",
      accessStatus: "accessible",
      accessedAt: "2026-10-30",
    },
    researcher: { kind: "none", id: null, recordedAt: null },
    humanReview: { status: "pending", reviewerId: null, reviewedAt: null },
    ownerApproval: { status: "pending", approverId: null, decidedAt: null },
    rightsReview: {
      status: "pending",
      intendedUse: null,
      reviewerId: null,
      reviewedAt: null,
    },
    previousLegacyValue: { status: "known", value: 10 },
    correctionProposalRef: "proposal:root-age-review-05b4a",
    ...overrides,
  };
}

function rootCandidates() {
  return reviewedFacts.legacyReviewIdentityCandidates(
    catalog.GAMES,
    catalog.CATALOG_EXTERNAL_ID_CONFLICTS,
  );
}

function resolution(fact, overrides = {}) {
  return reviewedFacts.resolveReviewedFact({
    fact,
    targetIdentity: rootIdentity,
    targetScope: legacyRootScope,
    identityCandidates: rootCandidates(),
    legacyValue: 10,
    ...overrides,
  });
}

function completeForPublication(overrides = {}) {
  return rootAgeFact({
    scope: legacyRootScope,
    humanReview: {
      status: "reviewed",
      reviewerId: "fixture-human-reviewer",
      reviewedAt: "2026-10-30",
    },
    ownerApproval: {
      status: "approved",
      approverId: "fixture-owner",
      decidedAt: "2026-10-30",
    },
    rightsReview: {
      status: "cleared-for-stated-use",
      intendedUse: "Synthetic fixture only",
      reviewerId: "fixture-rights-reviewer",
      reviewedAt: "2026-10-30",
    },
    ...overrides,
  });
}

test("reviewed facts schema validates scoped fields without creating permanent identities", () => {
  const fact = rootAgeFact();
  assert.equal(reviewedFacts.isReviewedFactRecord(fact), true);
  assert.equal(reviewedFacts.isReviewedFactRecord({ ...fact, units: "minutes" }), false);
  assert.equal(
    reviewedFacts.isReviewedFactRecord({
      ...fact,
      factualStatus: "UNKNOWN",
      value: 14,
    }),
    false,
  );

  const custom = {
    kind: "custom-game",
    key: "gfc_local-existing-0001",
    expectedTitle: "My Table Game",
  };
  assert.equal(custom.kind, "custom-game");
  assert.equal(custom.key, "gfc_local-existing-0001");
});

test("unapproved and edition-mismatched facts preserve the legacy value", () => {
  const result = resolution(
    rootAgeFact({
      researcher: { kind: "ai-assisted", id: "fixture-ai", recordedAt: "2026-10-30" },
    }),
  );

  assert.equal(result.status, "blocked");
  assert.equal(result.legacyValue, 10);
  assert.equal(result.effectiveValue, 10);
  assert.ok(result.reasons.includes("scope-mismatch"));
  assert.ok(result.reasons.includes("human-review-required"));
  assert.ok(result.reasons.includes("owner-approval-required"));
  assert.ok(result.reasons.includes("rights-review-required"));
});

test("publication value is proposed only when every independent gate passes", () => {
  const result = resolution(completeForPublication(), { targetScope: legacyRootScope });

  assert.equal(result.status, "ready-for-publication");
  assert.equal(result.legacyValue, 10);
  assert.equal(result.effectiveValue, 14);
  assert.deepEqual(result.reasons, []);

  const provisional = resolution(completeForPublication({ factualStatus: "PROVISIONAL" }), {
    targetScope: legacyRootScope,
  });
  assert.equal(provisional.status, "blocked");
  assert.equal(provisional.effectiveValue, 10);
  assert.ok(provisional.reasons.includes("not-verified"));
});

test("custom-game research references remain exact and separate from legacy keys", () => {
  const customIdentity = {
    kind: "custom-game",
    key: "gfc_local-existing-0001",
    expectedTitle: "My Table Game",
  };
  const fact = completeForPublication({
    identity: customIdentity,
    scope: {
      product: "My Table Game",
      edition: "User-created record",
      market: "User-entered",
    },
    source: {
      reference: "fixture:custom-game-source",
      url: "https://publisher.example/my-table-game",
      publisher: "Fixture Publisher",
      classification: "publisher-primary",
      accessStatus: "accessible",
      accessedAt: "2026-10-30",
    },
    previousLegacyValue: { status: "unknown", value: null },
    value: 8,
  });
  const result = reviewedFacts.resolveReviewedFact({
    fact,
    targetIdentity: customIdentity,
    targetScope: fact.scope,
    identityCandidates: [{ ...customIdentity, ambiguous: false }],
    legacyValue: null,
  });

  assert.equal(result.status, "ready-for-publication");
  assert.equal(result.effectiveValue, 8);
});

test("a stale previous-value snapshot blocks an otherwise approved proposal", () => {
  const result = resolution(
    completeForPublication({ previousLegacyValue: { status: "known", value: 9 } }),
    {
      targetScope: legacyRootScope,
    },
  );

  assert.equal(result.effectiveValue, 10);
  assert.ok(result.reasons.includes("legacy-value-mismatch"));
});

test("verified facts cannot publish without primary accessible source evidence", () => {
  const fact = completeForPublication({
    source: {
      reference: null,
      url: null,
      publisher: null,
      classification: "none",
      accessStatus: "unavailable",
      accessedAt: null,
    },
  });
  const result = resolution(fact, { targetScope: legacyRootScope });

  assert.equal(result.status, "blocked");
  assert.equal(result.effectiveValue, 10);
  assert.ok(result.reasons.includes("missing-primary-source"));
});

test("disputed and conflicting claims cannot override the legacy value", () => {
  const fact = completeForPublication();
  const disputed = resolution(
    { ...fact, factualStatus: "DISPUTED" },
    {
      targetScope: legacyRootScope,
    },
  );
  const conflicting = resolution(fact, {
    targetScope: legacyRootScope,
    relatedClaims: [
      {
        ...fact,
        reviewRef: "review:root-age-conflicting-claim",
        value: 10,
        factualStatus: "PROVISIONAL",
      },
    ],
  });

  assert.equal(disputed.effectiveValue, 10);
  assert.ok(disputed.reasons.includes("disputed-value"));
  assert.equal(conflicting.effectiveValue, 10);
  assert.ok(conflicting.reasons.includes("conflicting-claims"));
});

test("factual verification does not imply rights clearance", () => {
  const fact = completeForPublication({
    rightsReview: {
      status: "pending",
      intendedUse: "GameFinder reviewed metadata display",
      reviewerId: null,
      reviewedAt: null,
    },
  });
  const result = resolution(fact, { targetScope: legacyRootScope });

  assert.equal(result.effectiveValue, 10);
  assert.ok(result.reasons.includes("rights-review-required"));
});

test("unknown adult-content classification remains unknown, not suitable", () => {
  const fact = {
    ...rootAgeFact(),
    reviewRef: "review:root-adult-content-unknown",
    field: "adultContent",
    value: null,
    units: "classification",
    semantics: "scoped-content-review",
    factualStatus: "UNKNOWN",
    source: {
      reference: null,
      url: null,
      publisher: null,
      classification: "none",
      accessStatus: "not-attempted",
      accessedAt: null,
    },
    previousLegacyValue: { status: "unknown", value: null },
  };
  const result = resolution(fact, { targetScope: currentRootListingScope, legacyValue: null });

  assert.equal(reviewedFacts.isReviewedFactRecord(fact), true);
  assert.equal(result.status, "blocked");
  assert.equal(result.effectiveValue, null);
  assert.ok(result.reasons.includes("unknown-value"));
  assert.equal(catalog.GAMES.find((game) => game.bggId === "237182").adultContent, undefined);
});

test("ambiguous, historical, and prefix-like identifiers never resolve by approximation", () => {
  const conflictCandidates = reviewedFacts.legacyReviewIdentityCandidates(
    catalog.GAMES,
    catalog.CATALOG_EXTERNAL_ID_CONFLICTS,
  );
  const resistance = conflictCandidates.find(
    (candidate) => candidate.kind === "legacy-bgg" && candidate.key === "41114",
  );
  assert.equal(resistance.ambiguous, true);

  const ambiguous = reviewedFacts.resolveReviewedFact({
    fact: rootAgeFact({
      identity: { ...rootIdentity, key: "41114", expectedTitle: "The Resistance" },
    }),
    targetIdentity: { kind: "legacy-bgg", key: "41114", expectedTitle: "The Resistance" },
    targetScope: currentRootListingScope,
    identityCandidates: conflictCandidates,
    legacyValue: null,
  });
  assert.ok(ambiguous.reasons.includes("identity-ambiguous"));

  const historical = reviewedFacts.resolveReviewedFact({
    fact: rootAgeFact({ identity: { ...rootIdentity, key: "318184" } }),
    targetIdentity: { kind: "legacy-bgg", key: "318184", expectedTitle: "Wonderland's War" },
    targetScope: currentRootListingScope,
    identityCandidates: conflictCandidates,
    legacyValue: null,
  });
  assert.ok(historical.reasons.includes("identity-not-found"));

  const prefixOnly = reviewedFacts.resolveReviewedFact({
    fact: rootAgeFact({ identity: { ...rootIdentity, key: "999" } }),
    targetIdentity: { kind: "legacy-bgg", key: "999", expectedTitle: "Prefix alias" },
    targetScope: currentRootListingScope,
    identityCandidates: [
      { kind: "legacy-bgg", key: "999001", expectedTitle: "Different Game", ambiguous: false },
    ],
    legacyValue: null,
  });
  assert.ok(prefixOnly.reasons.includes("identity-not-found"));

  const expectedPrefixPairs = [
    ["266192", "266192-asia"],
    ["13", "13-junior"],
    ["233078", "233078-short"],
    ["31260", "31260-revised"],
    ["199792", "199792-bellfaire"],
    ["21790", "21790-pitch"],
    ["266810", "266810-architects"],
  ];
  for (const [numericId, alias] of expectedPrefixPairs) {
    assert.equal(
      conflictCandidates.find((candidate) => candidate.key === numericId)?.ambiguous,
      true,
      numericId,
    );
    assert.equal(
      conflictCandidates.find((candidate) => candidate.key === alias)?.ambiguous,
      true,
      alias,
    );
  }
  const numericCandidate = conflictCandidates.find((candidate) => candidate.key === "13");
  assert.ok(numericCandidate);
  const prefixResolution = reviewedFacts.resolveReviewedFact({
    fact: completeForPublication({
      identity: {
        kind: numericCandidate.kind,
        key: numericCandidate.key,
        expectedTitle: numericCandidate.expectedTitle,
      },
      scope: currentRootListingScope,
    }),
    targetIdentity: {
      kind: numericCandidate.kind,
      key: numericCandidate.key,
      expectedTitle: numericCandidate.expectedTitle,
    },
    targetScope: currentRootListingScope,
    identityCandidates: conflictCandidates,
    legacyValue: 10,
  });
  assert.equal(prefixResolution.effectiveValue, 10);
  assert.ok(prefixResolution.reasons.includes("identity-ambiguous"));
});

test("Root shadow comparisons preserve current semantics and isolate changes to Root", () => {
  const rootGame = catalog.GAMES.find((game) => game.bggId === "237182");
  assert.ok(rootGame);
  assert.equal(rootGame.age.publisher, 10);
  assert.equal(rootGame.players.min, 2);
  assert.equal(rootGame.players.max, 4);
  assert.equal(rootGame.playtime.max, 90);
  assert.equal(rootGame.adultContent, undefined);

  const scenarios = reviewedFacts.rootShadowScenarios();
  const byId = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  const expectations = [
    ["age-8-10", false, false, 71, 71],
    ["age-11-13", true, false, 99, 98],
    ["age-14-17", true, true, 138, 138],
    ["age-adults", true, true, 142, 142],
  ];
  for (const [id, legacy, age14, legacyCount, age14Count] of expectations) {
    const scenario = byId.get(id);
    assert.ok(scenario);
    const baseline = reviewedFacts.simulateRootShadowTreatment(catalog.GAMES, scenario, "legacy");
    const corrected = reviewedFacts.simulateRootShadowTreatment(
      catalog.GAMES,
      scenario,
      "hypothetical-age-14",
    );
    const excluded = reviewedFacts.simulateRootShadowTreatment(
      catalog.GAMES,
      scenario,
      "disputed-under-14-excluded",
    );
    const noIntervention = reviewedFacts.simulateRootShadowTreatment(
      catalog.GAMES,
      scenario,
      "no-intervention",
    );
    assert.equal(baseline.rootTreatmentEligible, legacy, id);
    assert.equal(corrected.rootTreatmentEligible, age14, id);
    assert.equal(baseline.baselineEligibleIds.length, legacyCount, `${id} baseline count`);
    assert.equal(corrected.treatmentEligibleIds.length, age14Count, `${id} age-14 count`);
    assert.equal(excluded.treatmentEligibleIds.length, age14Count, `${id} exclusion count`);
    assert.equal(excluded.rootTreatmentEligible, id === "age-14-17" || id === "age-adults", id);
    assert.deepEqual(noIntervention.treatmentEligibleIds, baseline.treatmentEligibleIds);
    assert.equal(baseline.rootAgeStatus, "disputed");
    assert.equal(baseline.rootAdultContentStatus, "unknown");
    for (const result of [corrected, excluded]) {
      assert.deepEqual(result.addedIds, []);
      assert.ok(result.removedIds.every((gameId) => gameId === "237182"));
    }
  }

  for (const id of ["age-11-13-players-2", "age-11-13-players-4"]) {
    const comparison = reviewedFacts.simulateRootShadowTreatment(
      catalog.GAMES,
      byId.get(id),
      "legacy",
    );
    assert.equal(comparison.rootTreatmentEligible, true, id);
  }
  for (const id of ["age-11-13-players-1", "age-11-13-players-5"]) {
    const comparison = reviewedFacts.simulateRootShadowTreatment(
      catalog.GAMES,
      byId.get(id),
      "legacy",
    );
    assert.equal(comparison.rootTreatmentEligible, false, id);
  }
  assert.equal(
    reviewedFacts.simulateRootShadowTreatment(
      catalog.GAMES,
      byId.get("age-14-17-players-4-time-60"),
      "legacy",
    ).rootTreatmentEligible,
    false,
  );
  assert.equal(
    reviewedFacts.simulateRootShadowTreatment(
      catalog.GAMES,
      byId.get("age-14-17-players-4-time-90"),
      "legacy",
    ).rootTreatmentEligible,
    true,
  );
});

test("review and shadow evaluation preserve synthetic user references and perform no writes", () => {
  const references = {
    vault: ["237182"],
    history: [{ bggId: "237182", at: 1 }],
    scores: [{ bggId: "237182", id: "fixture-score-1" }],
  };
  const snapshot = JSON.stringify(references);
  const legacyFactsSnapshot = JSON.stringify(catalog.GAMES);
  const scenario = reviewedFacts.rootShadowScenarios()[1];

  resolution(rootAgeFact());
  reviewedFacts.simulateRootShadowTreatment(catalog.GAMES, scenario, "hypothetical-age-14");

  assert.equal(JSON.stringify(references), snapshot);
  assert.equal(JSON.stringify(catalog.GAMES), legacyFactsSnapshot);
});

test("reviewed facts remain isolated from live recommendation and persistence paths", () => {
  const runtimeFiles = ["src/lib/catalog.ts", "src/lib/store.ts", "src/lib/catalog-sync.ts"];
  for (const file of runtimeFiles) {
    assert.doesNotMatch(
      readFileSync(new URL(`../${file}`, import.meta.url), "utf8"),
      /reviewed-facts/,
    );
  }
  const scoringSource = readFileSync(new URL("../src/lib/scoring.ts", import.meta.url), "utf8");
  assert.match(scoringSource, /reviewed-facts-integration/);
  const reviewLayer = readFileSync(
    new URL("../src/lib/reviewed-facts.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(reviewLayer, /localStorage|indexedDB|fetch\(|writeFileSync|database/i);

  const root = catalog.GAMES.find((game) => game.bggId === "237182");
  const ageBand = {
    players: 4,
    ageBand: "11-13",
    maxTimeMin: 90,
    timeOver60: false,
    vibes: [],
    exactTraits: null,
  };
  assert.equal(vibes.passesHardConstraints(root, ageBand), true);
  assert.ok(scoring.eligibleGames(ageBand).some((game) => game.bggId === "237182"));
  assert.ok(scoring.discoverGames(ageBand).some((game) => game.bggId === "237182"));
});
