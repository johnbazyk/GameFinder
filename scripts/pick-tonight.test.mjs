import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const root = new URL("..", import.meta.url).pathname;
let server;
let catalog;
let scoring;
let constraints;
let defaultUserWeights;

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  catalog = await server.ssrLoadModule("/src/lib/catalog.ts");
  scoring = await server.ssrLoadModule("/src/lib/scoring.ts");
  constraints = await server.ssrLoadModule("/src/lib/vibes.ts");
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

function user(owned) {
  return { owned, wishlist: [], plays: [], vibeWeights: defaultUserWeights };
}

function assertEligibleOwnedPick(picked, filters, userSignals) {
  if (!picked) return;
  assert.ok(userSignals.owned.includes(picked.bggId), `${picked.name} must be owned`);
  assert.equal(
    constraints.passesHardConstraints(picked, filters),
    true,
    `${picked.name} must satisfy every selected hard constraint`,
  );
}

test("two-player request does not fall back to owned Catan", () => {
  const filters = context({ players: 2 });
  const signals = user(["13"]);
  const picked = scoring.pickTonight(filters, signals);

  assert.equal(picked, undefined);
  assertEligibleOwnedPick(picked, filters, signals);
});

test("ages 8–10 request does not fall back to an age-ineligible owned game", () => {
  const filters = context({ players: null, ageBand: "8-10" });
  const signals = user(["178900"]);
  const picked = scoring.pickTonight(filters, signals);

  assert.equal(picked, undefined);
  assertEligibleOwnedPick(picked, filters, signals);
});

test("60-minute maximum does not fall back to owned games that exceed the limit", () => {
  const filters = context({ players: null, ageBand: "adults", maxTimeMin: 60 });
  const signals = user(["13", "266192"]);
  const picked = scoring.pickTonight(filters, signals);

  assert.equal(picked, undefined);
  assertEligibleOwnedPick(picked, filters, signals);
});

test("multiple constraints choose the eligible game from a mixed owned Vault", () => {
  const filters = context({
    players: 4,
    ageBand: "8-10",
    maxTimeMin: 60,
  });
  const signals = user(["13", "178900", "266192", "9209"]);
  const picked = scoring.pickTonight(filters, signals);

  assert.equal(picked?.bggId, "9209");
  assertEligibleOwnedPick(picked, filters, signals);
});

test("empty Vault and all eligible games excluded by avoidId return undefined", () => {
  const filters = context();
  const emptyVault = user([]);
  assert.equal(scoring.pickTonight(filters, emptyVault), undefined);

  const oneEligibleGame = user(["9209"]);
  const avoidedPick = scoring.pickTonight(filters, oneEligibleGame, "9209");
  assert.equal(avoidedPick, undefined);
  assertEligibleOwnedPick(avoidedPick, filters, oneEligibleGame);
});

test("avoidId selects another eligible owned game without changing eligibility", () => {
  const filters = context();
  const signals = user(["9209", "230802"]);
  const picked = scoring.pickTonight(filters, signals, "9209");

  assert.equal(picked?.bggId, "230802");
  assertEligibleOwnedPick(picked, filters, signals);
});

test("pickTonight preserves wizard ranking and never substitutes eligible unowned games", () => {
  const filters = context({ players: 4, vibes: ["strategy"] });
  const rankedOwned = user(["9209", "230802", "13"]);
  const expectedTop = scoring.runWizard(filters, rankedOwned).ownedTop[0];
  const rankedPick = scoring.pickTonight(filters, rankedOwned);

  assert.equal(rankedPick?.bggId, expectedTop?.bggId);
  assertEligibleOwnedPick(rankedPick, filters, rankedOwned);

  const noOwnedMatch = user(["13"]);
  const unownedRecommendation = scoring.runWizard(filters, {
    ...noOwnedMatch,
    owned: [],
  }).unownedTop[0];
  const picked = scoring.pickTonight(context({ players: 2 }), noOwnedMatch);

  assert.ok(unownedRecommendation, "an eligible unowned recommendation exists");
  assert.equal(picked, undefined);
  assertEligibleOwnedPick(picked, context({ players: 2 }), noOwnedMatch);
});

test("every standalone Surprise Me result remains an unfiltered owned catalog selection", () => {
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    const picked = scoring.pickSurprise(["13"]);
    assert.equal(picked?.bggId, "13");
    assert.equal(
      constraints.passesHardConstraints(picked, context({ players: 2 })),
      false,
      "Surprise Me remains explicitly unfiltered",
    );
    assert.equal(
      catalog.GAMES.some((game) => game.bggId === picked.bggId),
      true,
    );
  } finally {
    Math.random = originalRandom;
  }
});
