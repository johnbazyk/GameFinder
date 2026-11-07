import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const root = new URL("..", import.meta.url).pathname;
const ledgerPath = fileURLToPath(
  new URL("../docs/catalog-audit/proposed-identity-registry.json", import.meta.url),
);
const queuePath = fileURLToPath(
  new URL("../docs/catalog-audit/identity-review-queue.json", import.meta.url),
);
let server;
let prototype;
let adapterModule;
let foundation;

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  prototype = await server.ssrLoadModule("/src/lib/catalog-recommendation-prototype.ts");
  adapterModule = await server.ssrLoadModule("/src/lib/catalog-view-adapter.ts");
  foundation = await server.ssrLoadModule("/src/lib/catalog-foundation.ts");
});

after(async () => {
  await server?.close();
});

const DEFAULT_CONTEXT = {
  players: 4,
  ageBand: "8-10",
  maxTimeMin: 60,
  timeOver60: false,
  vibes: ["family"],
  exactTraits: null,
};

function context(overrides = {}) {
  return { ...DEFAULT_CONTEXT, ...overrides };
}

function makeAdapter(snapshot = prototype.createSyntheticPublishedCatalogSnapshot()) {
  return adapterModule.createReadOnlyCatalogViewAdapter(snapshot);
}

function byTitle(entries, title, edition) {
  return entries.find((entry) => entry.title === title && (!edition || entry.edition === edition));
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("the adapter accepts only validated synthetic publication records with permanent IDs", () => {
  const fixtureGate = prototype.createSyntheticCatalogPublicationSnapshot();
  const source = prototype.createSyntheticPublishedCatalogSnapshot();
  const adapter = makeAdapter(source);
  const preview = adapter.find(context(), prototype.SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS);

  assert.equal(fixtureGate.boundary, "synthetic-fixture-publication-v1");
  assert.equal(fixtureGate.simulationOnly, true);
  assert.equal(source.records.length, 9);
  assert.ok(
    source.records.every(({ gamefinderId }) =>
      /^gf:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/i.test(gamefinderId),
    ),
  );
  assert.ok(
    source.records.every(
      ({ identityStatus, revision, sourceIdentity }) =>
        identityStatus === "verified" &&
        revision === source.source.revision &&
        sourceIdentity.namespace === "synthetic",
    ),
  );
  assert.equal(preview.entries.length, 9);
  assert.ok(preview.entries.every((entry) => !("bggId" in entry)));
});

test("Find and Discover share the same eligibility, scoring, and rejection decisions", () => {
  const adapter = makeAdapter();
  const owned = prototype.SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS;
  const find = adapter.find(context(), owned);
  const discover = adapter.discover(context(), "", owned);
  const eligibleFromFind = find.entries
    .filter((entry) => entry.eligible)
    .map(({ gamefinderId, score, rejectionReasons }) => [gamefinderId, score, rejectionReasons]);

  assert.deepEqual(
    discover.entries.map(({ gamefinderId, score, rejectionReasons }) => [
      gamefinderId,
      score,
      rejectionReasons,
    ]),
    eligibleFromFind,
  );
  assert.deepEqual(
    find.rejectedEntries.map(({ gamefinderId, rejectionReasons }) => [
      gamefinderId,
      rejectionReasons,
    ]),
    discover.rejectedEntries.map(({ gamefinderId, rejectionReasons }) => [
      gamefinderId,
      rejectionReasons,
    ]),
  );
  assert.ok(discover.entries.every((entry) => entry.eligible && entry.score !== null));
});

test("Find returns up to three owned and three unowned results with UI-ready identity fields", () => {
  const adapter = makeAdapter();
  const find = adapter.find(context(), prototype.SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS);

  assert.equal(find.ownedTop.length, 3);
  assert.equal(find.unownedTop.length, 3);
  assert.ok(find.ownedTop.every((entry) => entry.ownership === "owned"));
  assert.ok(find.unownedTop.every((entry) => entry.ownership === "unowned"));
  for (const entry of [...find.ownedTop, ...find.unownedTop]) {
    assert.match(entry.gamefinderId, /^gf:[0-9a-f-]{36}$/i);
    assert.ok(entry.title);
    assert.ok(Array.isArray(entry.matchExplanation));
    assert.equal(entry.eligible, true);
    assert.equal(entry.score !== null, true);
    assert.ok(["selected", "fallback"].includes(entry.artwork.status));
  }
});

test("player, age, duration, and adult-content hard filters fail closed in both views", () => {
  const adapter = makeAdapter();
  const cases = [
    [context({ players: 10 }), "player-count"],
    [context({ ageBand: "6-7" }), "publisher-minimum-age"],
    [context({ maxTimeMin: 20, vibes: [] }), "maximum-listed-playtime"],
    [context({ ageBand: "14-17", maxTimeMin: null, vibes: [] }), "adult-content"],
  ];

  for (const [filters, reason] of cases) {
    const find = adapter.find(filters);
    const discover = adapter.discover(filters);
    const findRejected = new Set(
      find.rejectedEntries
        .filter((entry) => entry.rejectionReasons.includes(reason))
        .map((entry) => entry.gamefinderId),
    );
    const discoverRejected = new Set(
      discover.rejectedEntries
        .filter((entry) => entry.rejectionReasons.includes(reason))
        .map((entry) => entry.gamefinderId),
    );
    assert.ok(findRejected.size > 0, `${reason} should reject at least one fixture`);
    assert.deepEqual(discoverRejected, findRejected);
  }
});

test("each of the six GameFinder Vibes uses explicit fixture scores", () => {
  const adapter = makeAdapter();
  for (const vibe of ["luck", "strategy", "dexterity", "family", "party", "board"]) {
    const discover = adapter.discover(context({ ageBand: null, maxTimeMin: null, vibes: [vibe] }));
    assert.ok(discover.entries.length > 0);
    assert.ok(discover.entries.every((entry) => typeof entry.vibeScores[vibe] === "number"));
    assert.ok(
      discover.entries.every((entry) =>
        entry.matchExplanation.some((explanation) =>
          explanation.toLocaleLowerCase().includes(vibe),
        ),
      ),
    );
  }
});

test("missing Vibe scores reject multi-Vibe requests rather than silently dropping a preference", () => {
  const adapter = makeAdapter();
  const filters = context({
    ageBand: null,
    maxTimeMin: null,
    vibes: ["family", "party"],
  });
  const find = adapter.find(filters);
  const festival = byTitle(find.entries, "Festival of Tides");

  assert.equal(festival.eligible, false);
  assert.ok(festival.rejectionReasons.includes("requested-vibe-score-missing"));
  assert.ok(
    adapter
      .discover(filters)
      .rejectedEntries.some(
        (entry) =>
          entry.gamefinderId === festival.gamefinderId &&
          entry.rejectionReasons.includes("requested-vibe-score-missing"),
      ),
  );
});

test("exact Vibe targets use complete explicit scores and shared catalog scoring", () => {
  const adapter = makeAdapter();
  const filters = context({
    ageBand: null,
    maxTimeMin: null,
    vibes: [],
    exactTraits: { family: 4, strategy: 3 },
  });
  const owned = prototype.SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS;
  const find = adapter.find(filters, owned);
  const discover = adapter.discover(filters, "", owned);
  const rawRecords = prototype.createSyntheticCatalogPublicationSnapshot().records;
  const expected = discover.entries.map((entry) => {
    const record = rawRecords.find((row) => row.record.id === entry.gamefinderId).record;
    return [
      entry.gamefinderId,
      foundation.catalogRecommendationScore(record, filters, entry.ownership === "owned"),
    ];
  });

  assert.deepEqual(
    discover.entries.map(({ gamefinderId, score }) => [gamefinderId, score]),
    expected,
  );
  assert.deepEqual(
    find.entries
      .filter((entry) => entry.eligible)
      .map(({ gamefinderId, score }) => [gamefinderId, score]),
    expected,
  );
  const source = prototype.createSyntheticPublishedCatalogSnapshot();
  const missingExactVibe = ["luck", "strategy", "dexterity", "family", "party", "board"].find(
    (vibe) => source.records.some(({ vibeScores }) => typeof vibeScores[vibe] !== "number"),
  );
  assert.ok(missingExactVibe);
  assert.ok(
    adapter
      .find(
        context({
          ageBand: null,
          maxTimeMin: null,
          vibes: [],
          exactTraits: { [missingExactVibe]: 3 },
        }),
      )
      .rejectedEntries.some((entry) =>
        entry.rejectionReasons.includes("requested-vibe-score-missing"),
      ),
  );
});

test("result ordering and title/ID tie-breaking are stable", () => {
  const adapter = makeAdapter();
  const filters = context({ ageBand: null, maxTimeMin: null, vibes: [] });
  const first = adapter.discover(filters).entries;
  const second = adapter.discover(filters).entries;

  assert.deepEqual(first, second);
  assert.deepEqual(
    first,
    [...first].sort(
      (left, right) =>
        (right.score ?? 0) - (left.score ?? 0) ||
        left.title.localeCompare(right.title) ||
        left.gamefinderId.localeCompare(right.gamefinderId),
    ),
  );
});

test("reroll exclusions are GameFinder-ID based and exhaustion is explicit", () => {
  const adapter = makeAdapter();
  const owned = prototype.SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS;
  const first = adapter.find(context(), owned);
  const exclusions = [
    ...first.ownedTop.map((entry) => entry.gamefinderId),
    ...first.unownedTop.map((entry) => entry.gamefinderId),
  ];
  const reroll = adapter.find(context(), owned, exclusions);

  assert.deepEqual(reroll.ownedTop, []);
  assert.deepEqual(reroll.unownedTop, []);
  assert.equal(reroll.exhaustedOwned, true);
  assert.equal(reroll.exhaustedUnowned, true);
  assert.deepEqual(reroll.excludedGamefinderIds, [...exclusions].sort());
});

test("Discover title search is read-only and preserves distinct same-title editions", () => {
  const adapter = makeAdapter();
  const discover = adapter.discover(context(), "  skyline foundry  ");

  assert.equal(discover.query, "  skyline foundry  ");
  assert.equal(discover.entries.length, 2);
  assert.equal(new Set(discover.entries.map((entry) => entry.gamefinderId)).size, 2);
  assert.deepEqual(discover.entries.map((entry) => entry.edition).sort(), [
    "First Edition",
    "Second Edition",
  ]);
  assert.equal(adapter.discover(context(), "not a real title").entries.length, 0);
  assert.equal(adapter.discover(context({ players: 10 }), "skyline foundry").entries.length, 0);
});

test("legacy aliases resolve only when unique and independently verified", () => {
  const adapter = makeAdapter();

  assert.equal(adapter.resolveLegacyReference("demo-key-glow-orchard").status, "resolved");
  assert.equal(adapter.resolveLegacyReference("41114").status, "ambiguous");
  assert.equal(adapter.resolveLegacyReference("demo-key-unverified").status, "unverified");
  assert.equal(adapter.resolveLegacyReference("demo-orphan-key").status, "orphaned");
  assert.equal(adapter.customGame.ownerScope, "owner-only");
  assert.equal(adapter.customGame.resolvedAsGlobalGame, false);
});

test("edition artwork requires exact scope and rights; missing or unauthorized art falls back", () => {
  const source = prototype.createSyntheticPublishedCatalogSnapshot();
  const adapter = makeAdapter(source);
  const result = adapter.discover(context(), "skyline foundry");
  const first = byTitle(result.entries, "Skyline Foundry", "First Edition");
  const second = byTitle(result.entries, "Skyline Foundry", "Second Edition");

  assert.equal(first.artwork.status, "selected");
  assert.equal("cachingPermitted" in first.artwork, false);
  assert.equal("permissionReference" in first.artwork, false);
  assert.equal(second.artwork.status, "fallback");
  assert.equal(second.artwork.reason, "rights-unresolved");

  const rightsDenied = structuredClone(source);
  const firstFixture = rightsDenied.records.find(
    (row) =>
      row.displayMetadata.edition === "First Edition" &&
      row.displayMetadata.title === "Glow Orchard",
  );
  firstFixture.artwork = {
    status: "fallback",
    placeholder: "original-gamefinder-placeholder",
    reason: "rights-unresolved",
    authenticity: "not-an-authentic-game-cover",
  };
  assert.equal(
    byTitle(makeAdapter(rightsDenied).discover(context(), "glow orchard").entries, "Glow Orchard")
      .artwork.status,
    "fallback",
  );

  const expired = structuredClone(source);
  const glow = expired.records.find((row) => row.displayMetadata.title === "Glow Orchard");
  glow.artwork.expiresAt = "2025-01-01T00:00:00.000Z";
  assert.throws(() => makeAdapter(expired), /invalid identity, facts, metadata, or artwork/);
});

test("unverified facts and forged approval-shaped objects cannot cross the source boundary", () => {
  const source = prototype.createSyntheticPublishedCatalogSnapshot();
  const unverified = structuredClone(source);
  unverified.records[0].facts.players = { status: "unverified", value: null };
  const unverifiedEntry = byTitle(makeAdapter(unverified).find(context()).entries, "Glow Orchard");
  assert.equal(unverifiedEntry.eligible, false);
  assert.ok(unverifiedEntry.rejectionReasons.includes("unverified-players"));

  const rawFixture = prototype.createSyntheticCatalogPublicationSnapshot();
  const forgedApproval = structuredClone(rawFixture);
  forgedApproval.records[0].candidate.review.ownerApproval.reviewerId = "client";
  assert.throws(() => makeAdapter(forgedApproval), /invalid source or structure/);

  assert.throws(
    () =>
      makeAdapter({
        approved: true,
        published: true,
        rights: "allowed",
      }),
    /invalid source or structure/,
  );
});

test("the source and catalogs remain immutable and do not alter identity snapshots", () => {
  const source = prototype.createSyntheticPublishedCatalogSnapshot();
  const sourceBefore = JSON.stringify(source);
  const ledgerBefore = hashFile(ledgerPath);
  const queueBefore = hashFile(queuePath);
  const adapter = makeAdapter(source);

  adapter.find(context(), prototype.SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS);
  adapter.discover(context(), "skyline");

  assert.equal(JSON.stringify(source), sourceBefore);
  assert.equal(hashFile(ledgerPath), ledgerBefore);
  assert.equal(hashFile(queuePath), queueBefore);
});

test("the adapter is not imported by application routes, scoring, or user storage", () => {
  for (const path of [
    "src/routes/discover.tsx",
    "src/routes/results.tsx",
    "src/lib/scoring.ts",
    "src/lib/store.ts",
  ]) {
    const text = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    assert.equal(text.includes("catalog-view-adapter"), false, `${path} must remain unchanged`);
  }
});
