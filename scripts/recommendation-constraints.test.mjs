import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const root = new URL("..", import.meta.url).pathname;
let server;
let constraints;
let games;
let runWizard;
let pickSurprise;
let defaultUserWeights;

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  constraints = await server.ssrLoadModule("/src/lib/vibes.ts");
  ({ GAMES: games } = await server.ssrLoadModule("/src/lib/catalog.ts"));
  ({ runWizard, pickSurprise } = await server.ssrLoadModule("/src/lib/scoring.ts"));
  ({ DEFAULT_USER_WEIGHTS: defaultUserWeights } = constraints);
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
