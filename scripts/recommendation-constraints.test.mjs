import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const root = new URL("..", import.meta.url).pathname;
let server;
let constraints;
let games;
let runWizard;
let eligibleGames;
let discoverGames;
let recommendationScore;
let vibePreferenceScore;
let pickSurprise;
let defaultUserWeights;
let wizardOptions;
let vibeMeta;
let filterTypes;
let appStore;

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  constraints = await server.ssrLoadModule("/src/lib/vibes.ts");
  ({ GAMES: games } = await server.ssrLoadModule("/src/lib/catalog.ts"));
  ({
    runWizard,
    eligibleGames,
    discoverGames,
    recommendationScore,
    vibePreferenceScore,
    pickSurprise,
  } = await server.ssrLoadModule("/src/lib/scoring.ts"));
  ({ DEFAULT_USER_WEIGHTS: defaultUserWeights } = constraints);
  wizardOptions = await server.ssrLoadModule("/src/lib/wizard-options.ts");
  vibeMeta = await server.ssrLoadModule("/src/lib/vibes.ts");
  filterTypes = await server.ssrLoadModule("/src/lib/types.ts");
  globalThis.localStorage ??= {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
  ({ useAppStore: appStore } = await server.ssrLoadModule("/src/lib/store.ts"));
});

after(async () => {
  await server?.close();
});

function context(overrides = {}) {
  return {
    players: 4,
    ageBand: null,
    maxTimeMin: null,
    timeOver60: false,
    vibes: [],
    exactTraits: null,
    ...overrides,
  };
}

function game(id) {
  const found = games.find((candidate) => candidate.bggId === id);
  assert.ok(found, `expected catalog game ${id}`);
  return found;
}

test("8–10 requires suitability for an eight-year-old; younger-rated games remain eligible", () => {
  const wingspan = game("266192");
  const ticketToRide = game("9209");

  assert.equal(
    constraints.passesHardConstraints(wingspan, context({ ageBand: "8-10" })),
    false,
  );
  assert.equal(
    constraints.passesHardConstraints(ticketToRide, context({ ageBand: "8-10" })),
    true,
  );
});

test("age bands use their lower bound, while Adults Only has no minimum-age cutoff", () => {
  const wingspan = game("266192");

  for (const [ageBand, youngestAge] of [
    ["6-7", 6],
    ["8-10", 8],
    ["11-13", 11],
    ["14-17", 14],
  ]) {
    assert.equal(
      constraints.passesHardConstraints(
        { ...wingspan, age: { publisher: youngestAge, community: youngestAge } },
        context({ ageBand }),
      ),
      true,
      `${ageBand} should allow a game rated for age ${youngestAge}`,
    );
    assert.equal(
      constraints.passesHardConstraints(
        {
          ...wingspan,
          age: { publisher: youngestAge + 1, community: youngestAge + 1 },
        },
        context({ ageBand }),
      ),
      false,
      `${ageBand} should reject a game rated for age ${youngestAge + 1}`,
    );
  }

  assert.equal(
    constraints.passesHardConstraints(game("9209"), context({ ageBand: "14-17" })),
    true,
    "games rated for younger children should remain eligible for older players",
  );
  assert.equal(
    constraints.passesHardConstraints(
      { ...wingspan, age: { publisher: 17, community: 17 } },
      context({ ageBand: "adults" }),
    ),
    true,
  );
});

test("Under 6 keeps its existing age cutoff", () => {
  const ticketToRide = game("9209");

  assert.equal(
    constraints.passesHardConstraints(ticketToRide, context({ ageBand: "under6" })),
    false,
  );
  assert.equal(
    constraints.passesHardConstraints(
      { ...ticketToRide, age: { publisher: 5, community: 5 } },
      context({ ageBand: "under6" }),
    ),
    true,
  );
});

test("17+ publisher age does not by itself classify a game as adult content", () => {
  const matureRated = {
    ...game("266192"),
    age: { publisher: 17, community: 17 },
  };

  assert.equal(constraints.hasAdultContent(matureRated), false);
  assert.equal(
    constraints.passesHardConstraints(matureRated, context({ ageBand: "adults" })),
    true,
  );
});

test("explicit and curated adult content stays out of non-adult age bands", () => {
  const wingspan = game("266192");
  const explicit = { ...wingspan, adultContent: true };
  const curated = { ...wingspan, bggId: "188834" };

  assert.equal(
    constraints.passesHardConstraints(explicit, context({ ageBand: "8-10" })),
    false,
  );
  assert.equal(
    constraints.passesHardConstraints(curated, context({ ageBand: "8-10" })),
    false,
  );
  assert.equal(
    constraints.passesHardConstraints(explicit, context({ ageBand: "adults" })),
    true,
  );
});

test("time limits compare the listed maximum playtime to the selected boundary", () => {
  const wingspan = game("266192");
  const slowAverage = {
    ...wingspan,
    playtime: { min: 10, max: 70, avg: 30 },
  };
  const sixtyMinuteGame = {
    ...wingspan,
    playtime: { min: 40, max: 60, avg: 50 },
  };

  assert.equal(constraints.listedPlaytime(wingspan), 70);
  assert.equal(
    constraints.passesHardConstraints(wingspan, context({ maxTimeMin: 60 })),
    false,
  );
  assert.equal(
    constraints.passesHardConstraints(slowAverage, context({ maxTimeMin: 60 })),
    false,
    "a low average cannot override a listed 70-minute maximum",
  );
  assert.equal(
    constraints.passesHardConstraints(wingspan, context({ timeOver60: true, maxTimeMin: null })),
    true,
  );
  assert.equal(
    constraints.passesHardConstraints(
      sixtyMinuteGame,
      context({ timeOver60: true, maxTimeMin: null }),
    ),
    false,
  );
});

test("player count remains a hard constraint", () => {
  const wingspan = game("266192");

  assert.equal(constraints.passesHardConstraints(wingspan, context({ players: 4 })), true);
  assert.equal(constraints.passesHardConstraints(wingspan, context({ players: 6 })), false);
  assert.equal(
    constraints.passesHardConstraints(
      { ...wingspan, players: { ...wingspan.players, max: 16 } },
      context({ players: 13 }),
    ),
    true,
  );
  assert.equal(constraints.passesHardConstraints(wingspan, context({ players: 13 })), false);
  assert.equal(
    constraints.passesHardConstraints(
      { ...wingspan, players: { min: 14, max: 20, best: [16] } },
      context({ players: 13 }),
    ),
    false,
    "13+ requires support for 13, not only larger counts",
  );
});

test("Find and Discover use the same hard-filter eligibility decisions", () => {
  const user = {
    owned: ["9209", "230802"],
    wishlist: [],
    plays: [],
    vibeWeights: defaultUserWeights,
  };
  const scenarios = [
    context({
      players: 4,
      ageBand: "8-10",
      maxTimeMin: 60,
      vibes: ["family", "board"],
    }),
    context({ players: 13, ageBand: "under6", maxTimeMin: 10 }),
    context({ players: null, ageBand: "adults", timeOver60: true, maxTimeMin: null }),
  ];

  for (const filters of scenarios) {
    const found = runWizard(filters, user);
    const findIds = [...found.ownedList, ...found.unownedList]
      .map((candidate) => candidate.bggId)
      .sort();
    const sharedEligibleIds = eligibleGames(filters)
      .map((candidate) => candidate.bggId)
      .sort();
    const discoverIds = discoverGames(filters)
      .map((candidate) => candidate.bggId)
      .sort();

    assert.deepEqual(sharedEligibleIds, findIds);
    assert.deepEqual(discoverIds, findIds);
  }
});

test("Vibe preferences rank eligible games without excluding low-scoring matches", () => {
  const lowVibeGame = game("5048");
  const highVibeGame = game("169786");
  const filters = context({ players: null, vibes: ["strategy"] });
  const unfilteredIds = new Set(
    eligibleGames(context({ players: null })).map((candidate) => candidate.bggId),
  );
  const filtered = discoverGames(filters);

  assert.equal(filtered.length, unfilteredIds.size);
  assert.ok(filtered.some((candidate) => candidate.bggId === lowVibeGame.bggId));
  assert.ok(filtered.some((candidate) => candidate.bggId === highVibeGame.bggId));
  assert.ok(
    recommendationScore(highVibeGame, filters) > recommendationScore(lowVibeGame, filters),
  );
});

test("multiple Vibe selections use the same preference scoring in Find and Discover", () => {
  const filters = context({ players: null, vibes: ["luck", "strategy", "board"] });
  const user = {
    owned: [],
    wishlist: [],
    plays: [],
    vibeWeights: defaultUserWeights,
  };
  const find = runWizard(filters, user).unownedList;
  const discover = discoverGames(filters);

  for (const candidate of [game("169786"), game("5048")]) {
    const expected = candidate.bggRating + vibePreferenceScore(candidate, filters.vibes);
    assert.equal(recommendationScore(candidate, filters), expected);
    assert.equal(
      find.find((result) => result.bggId === candidate.bggId)?.score,
      expected,
    );
    assert.equal(
      discover.find((result) => result.bggId === candidate.bggId)?.bggId,
      candidate.bggId,
    );
  }
});

test("Discover filter controls expose the wizard's approved questions and choices", () => {
  assert.equal(filterTypes.MAX_PLAYER_COUNT, 13);
  assert.deepEqual(
    wizardOptions.WIZARD_QUESTIONS.map(({ title }) => title),
    [
      "How many people are playing?",
      "How old is the youngest player?",
      "How much time do you want to play?",
      "What kind of game are you in the mood for?",
    ],
  );
  assert.deepEqual(
    wizardOptions.TIME_OPTIONS.map(({ label, value, over60 }) => [label, value, over60]),
    [
      ["10 minutes or less", 10, false],
      ["15 minutes or less", 15, false],
      ["30 minutes or less", 30, false],
      ["45 minutes or less", 45, false],
      ["60 minutes or less", 60, false],
      ["More than 60 minutes", null, true],
    ],
  );
  assert.deepEqual(
    vibeMeta.AGE_BANDS.map(({ id, label }) => [id, label]),
    [
      ["under6", "Under 6"],
      ["6-7", "6–7"],
      ["8-10", "8–10"],
      ["11-13", "11–13"],
      ["14-17", "14–17"],
      ["adults", "Adults Only"],
    ],
  );
  assert.deepEqual(
    Object.values(vibeMeta.VIBE_META).map(({ label }) => label),
    ["Luck", "Strategy", "Dexterity", "Family", "Party", "Board-Based"],
  );
});

test("runWizard excludes Wingspan from owned and unowned recommendations for the reported scenario", () => {
  const scenario = context({
    players: 4,
    ageBand: "8-10",
    maxTimeMin: 60,
    timeOver60: false,
    vibes: ["family"],
  });
  const vaultIds = ["266192", "1294", "2453", "230802", "9209", "13", "30549"];
  const user = {
    owned: vaultIds,
    wishlist: [],
    plays: [],
    vibeWeights: defaultUserWeights,
  };
  const result = runWizard(scenario, user);

  assert.ok(user.owned.includes("266192"), "Wingspan is in the vault");
  assert.equal(result.ownedList.some((candidate) => candidate.bggId === "266192"), false);
  assert.equal(result.ownedTop.some((candidate) => candidate.bggId === "266192"), false);

  const unownedWingspanResult = runWizard(scenario, {
    ...user,
    owned: user.owned.filter((id) => id !== "266192"),
  });
  assert.equal(
    unownedWingspanResult.unownedList.some((candidate) => candidate.bggId === "266192"),
    false,
  );
  assert.equal(
    unownedWingspanResult.unownedTop.some((candidate) => candidate.bggId === "266192"),
    false,
  );

  const ticketToRide = result.ownedList.find((candidate) => candidate.bggId === "9209");
  assert.equal(game("9209").playtime.max, 60);
  assert.ok(ticketToRide, "Ticket to Ride remains eligible at an exact 60-minute maximum");
});

test("rerolls show at most three new owned recommendations and exclude prior unowned recommendations", () => {
  const scenario = context({
    players: 4,
    ageBand: "8-10",
    maxTimeMin: 60,
    timeOver60: false,
    vibes: ["family"],
  });
  const user = {
    owned: ["1294", "2453", "230802", "9209", "13", "30549", "266192"],
    wishlist: [],
    plays: [],
    vibeWeights: defaultUserWeights,
  };
  const first = runWizard(scenario, user);
  const previouslyShown = [
    ...first.ownedTop,
    ...first.unownedTop,
  ].map((candidate) => candidate.bggId);
  const next = runWizard(scenario, user, previouslyShown);

  assert.ok(first.ownedTop.length <= 3);
  assert.ok(next.ownedTop.length <= 3);
  assert.equal(
    next.ownedTop.some((candidate) => previouslyShown.includes(candidate.bggId)),
    false,
  );
  assert.equal(
    next.unownedTop.some((candidate) => previouslyShown.includes(candidate.bggId)),
    false,
  );
  assert.deepEqual(next.appliedFilters, scenario);
});

test("rerolls clearly report exhaustion after every matching owned game was shown", () => {
  const scenario = context({ players: null });
  const user = {
    owned: ["9209"],
    wishlist: [],
    plays: [],
    vibeWeights: defaultUserWeights,
  };
  const first = runWizard(scenario, user);
  const shownIds = [...first.ownedTop, ...first.unownedTop].map((candidate) => candidate.bggId);
  const next = runWizard(scenario, user, shownIds);

  assert.equal(first.ownedTop.length, 1);
  assert.equal(next.ownedTop.length, 0);
  assert.equal(next.exhaustedVault, true);
});

test("Sniff Again rerolls through the shared constraints and avoids games already shown", () => {
  appStore.setState({
    wizard: context({ players: null }),
    owned: ["9209", "266192"],
    wishlist: [],
    plays: [],
    shownIds: [],
    recPool: null,
  });
  const first = appStore.getState().sniffAgain();
  const firstIds = (first?.ownedTop ?? []).map((candidate) => candidate.bggId);
  const next = appStore.getState().sniffAgain();

  assert.ok(firstIds.length > 0);
  assert.equal(
    next?.ownedTop.some((candidate) => firstIds.includes(candidate.bggId)),
    false,
  );
  assert.deepEqual(next?.appliedFilters, context({ players: null }));
});

test("Surprise Me randomly selects only an owned catalog game and avoids the previous pick when possible", () => {
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    assert.equal(pickSurprise(["9209", "266192"])?.bggId, "9209");
    assert.equal(pickSurprise(["9209", "266192"], "9209")?.bggId, "266192");
    assert.equal(pickSurprise(["not-in-catalog"]), undefined);
    assert.equal(pickSurprise(["9209"], "9209")?.bggId, "9209");
  } finally {
    Math.random = originalRandom;
  }
});

test("Free Vault additions stay available below the limit and capped at 50", () => {
  appStore.setState({
    owned: [],
    wishlist: [],
    isPremium: false,
    upgradePrompt: null,
  });
  assert.equal(appStore.getState().addOwned("9209"), "ok");
  assert.equal(appStore.getState().addOwned("266192"), "ok");
  assert.equal(appStore.getState().addOwned("9209"), "exists");

  appStore.setState({
    owned: Array.from({ length: 50 }, (_, index) => `vault-${index}`),
    upgradePrompt: null,
  });
  assert.equal(appStore.getState().addOwned("9209"), "limit");
  assert.ok(appStore.getState().upgradePrompt);
});
