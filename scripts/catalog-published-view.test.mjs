import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const root = new URL("..", import.meta.url).pathname;
let server;
let prototype;
let adapterModule;
let contract;

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  prototype = await server.ssrLoadModule("/src/lib/catalog-recommendation-prototype.ts");
  adapterModule = await server.ssrLoadModule("/src/lib/catalog-view-adapter.ts");
  contract = await server.ssrLoadModule("/src/lib/catalog-published-view.ts");
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

function makeAdapter(snapshot = prototype.createSyntheticPublishedCatalogSnapshot()) {
  return adapterModule.createReadOnlyCatalogViewAdapter(snapshot);
}

function context(overrides = {}) {
  return { ...DEFAULT_CONTEXT, ...overrides };
}

test("the synthetic gate emits only accepted records in the neutral published-view shape", () => {
  const raw = prototype.createSyntheticCatalogPublicationSnapshot();
  const snapshot = prototype.createSyntheticPublishedCatalogSnapshot();
  const view = makeAdapter(snapshot);
  const discover = view.discover(
    context(),
    "",
    prototype.SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS,
  );

  assert.equal(raw.boundary, "synthetic-fixture-publication-v1");
  assert.equal(snapshot.records.length, 9);
  assert.equal(snapshot.source.sourceId, "synthetic-fixture-source");
  assert.equal(snapshot.records[0].revision, snapshot.source.revision);
  assert.ok(snapshot.records.every((record) => !("candidate" in record)));
  assert.ok(snapshot.records.every((record) => !("providerPayload" in record)));
  assert.ok(
    discover.entries.every(
      (entry) =>
        /^gf:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          entry.gamefinderId,
        ) && !("bggId" in entry),
    ),
  );
  assert.deepEqual(Object.keys(snapshot.records[0].vibeScores).sort(), [
    "board",
    "dexterity",
    "family",
    "luck",
    "party",
    "strategy",
  ]);
});

test("Find and Discover retain the approved 05E4 default results and scoring", () => {
  const adapter = makeAdapter();
  const owned = prototype.SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS;
  const expected = prototype.createSyntheticCatalogRecommendationPreview();
  const find = adapter.find(context(), owned);
  const discover = adapter.discover(context(), "", owned);

  assert.deepEqual(
    find.ownedTop.map(({ gamefinderId, score }) => [gamefinderId, score]),
    expected.ownedTop.map(({ gamefinderId, score }) => [gamefinderId, score]),
  );
  assert.deepEqual(
    find.unownedTop.map(({ gamefinderId, score }) => [gamefinderId, score]),
    expected.unownedTop.map(({ gamefinderId, score }) => [gamefinderId, score]),
  );
  assert.deepEqual(
    discover.entries.map(({ gamefinderId, score }) => [gamefinderId, score]),
    find.entries
      .filter((entry) => entry.eligible)
      .map(({ gamefinderId, score }) => [gamefinderId, score]),
  );
  assert.deepEqual(
    adapter
      .discover(context(), "skyline foundry")
      .entries.map(({ edition }) => edition)
      .sort(),
    ["First Edition", "Second Edition"],
  );
});

test("missing hard facts and requested Vibes fail closed without losing explicit missing values", () => {
  const source = prototype.createSyntheticPublishedCatalogSnapshot();
  const missingFact = structuredClone(source);
  missingFact.records[0].facts.players = { status: "unverified", value: null };
  const missingFactId = missingFact.records[0].gamefinderId;
  const entry = makeAdapter(missingFact)
    .find(context())
    .entries.find((candidate) => candidate.gamefinderId === missingFactId);
  assert.equal(entry.eligible, false);
  assert.ok(entry.rejectionReasons.includes("unverified-players"));
  assert.ok(makeAdapter(missingFact).discover(context()).rejectedEntries.length > 0);

  const missingVibe = structuredClone(source);
  missingVibe.records[0].vibeScores.family = null;
  const missingVibeId = missingVibe.records[0].gamefinderId;
  const vibeEntry = makeAdapter(missingVibe)
    .find(context())
    .entries.find((candidate) => candidate.gamefinderId === missingVibeId);
  assert.equal(vibeEntry.eligible, false);
  assert.ok(vibeEntry.rejectionReasons.includes("requested-vibe-score-missing"));

  const malformedFact = structuredClone(source);
  malformedFact.records[0].facts.players = {
    status: "unverified",
    value: { minimum: 1, maximum: 6, best: [4] },
  };
  assert.throws(() => makeAdapter(malformedFact), /invalid identity, facts, metadata, or artwork/);
});

test("duplicate identities, record revision mismatches, and invalid structures are rejected", () => {
  const source = prototype.createSyntheticPublishedCatalogSnapshot();
  const duplicate = structuredClone(source);
  duplicate.records[1].gamefinderId = duplicate.records[0].gamefinderId;
  assert.throws(() => makeAdapter(duplicate), /duplicate permanent identities/);

  const staleRevision = structuredClone(source);
  staleRevision.records[0].revision = "older-publication";
  assert.throws(() => makeAdapter(staleRevision), /invalid identity, facts, metadata, or artwork/);

  const mismatchedSource = structuredClone(source);
  mismatchedSource.source.namespace = "publisher";
  assert.throws(
    () => makeAdapter(mismatchedSource),
    /invalid identity, facts, metadata, or artwork/,
  );

  const stalePublication = structuredClone(source);
  stalePublication.records[0].publicationId = "another-publication";
  assert.throws(
    () => makeAdapter(stalePublication),
    /invalid identity, facts, metadata, or artwork/,
  );

  const expiredMetadataRights = structuredClone(source);
  expiredMetadataRights.records[0].metadataPermissions.expiresAt = "2025-01-01T00:00:00.000Z";
  assert.throws(
    () => makeAdapter(expiredMetadataRights),
    /invalid identity, facts, metadata, or artwork/,
  );

  const relationshipRecord = source.records.find((record) => record.relationships.length > 0);
  assert.ok(relationshipRecord);
  const originalId = relationshipRecord.gamefinderId;
  const selfReference = structuredClone(source);
  const selfRecord = selfReference.records.find((record) => record.gamefinderId === originalId);
  const verifiedRelationship = selfRecord.relationships.find(
    (relationship) => relationship.status === "verified",
  );
  assert.ok(verifiedRelationship);
  verifiedRelationship.targetGamefinderId = originalId;
  assert.throws(
    () => makeAdapter(selfReference),
    /self-referential or unresolved identity relationship/,
  );

  const unpublishedTarget = structuredClone(source);
  const unresolvedRecord = unpublishedTarget.records.find(
    (record) => record.gamefinderId === originalId,
  );
  const unresolvedTargetRelationship = unresolvedRecord.relationships.find(
    (relationship) => relationship.status === "verified",
  );
  assert.ok(unresolvedTargetRelationship);
  unresolvedTargetRelationship.targetGamefinderId = "gf:1a00000b-1111-4111-8111-00000000000b";
  assert.throws(
    () => makeAdapter(unpublishedTarget),
    /self-referential or unresolved identity relationship/,
  );

  assert.throws(
    () => makeAdapter({ approved: true, published: true, rights: "allowed" }),
    /invalid source or structure/,
  );
});

test("legacy conflicts remain unresolved and custom games remain owner-scoped", () => {
  const adapter = makeAdapter();
  assert.equal(adapter.resolveLegacyReference("demo-key-glow-orchard").status, "resolved");
  assert.equal(adapter.resolveLegacyReference("41114").status, "ambiguous");
  assert.equal(adapter.resolveLegacyReference("demo-key-unverified").status, "unverified");
  assert.equal(adapter.resolveLegacyReference("demo-orphan-key").status, "orphaned");
  assert.equal(adapter.customGame.ownerScope, "owner-only");
  assert.equal(adapter.customGame.resolvedAsGlobalGame, false);
});

test("artwork decisions preserve placeholders and reject identity or edition mismatches", () => {
  const source = prototype.createSyntheticPublishedCatalogSnapshot();
  const fallback = structuredClone(source);
  const glow = fallback.records.find((record) => record.displayMetadata.title === "Glow Orchard");
  glow.artwork = {
    status: "fallback",
    placeholder: "original-gamefinder-placeholder",
    reason: "rights-unresolved",
    authenticity: "not-an-authentic-game-cover",
  };
  const fallbackEntry = makeAdapter(fallback).discover(context(), "glow orchard").entries[0];
  assert.equal(fallbackEntry.artwork.status, "fallback");
  assert.equal(fallbackEntry.artwork.authenticity, "not-an-authentic-game-cover");

  const wrongIdentity = structuredClone(source);
  const selected = wrongIdentity.records.find(
    (record) =>
      record.displayMetadata.title === "Glow Orchard" && record.artwork.status === "selected",
  );
  selected.artwork.gamefinderId = wrongIdentity.records[1].gamefinderId;
  assert.throws(() => makeAdapter(wrongIdentity), /invalid identity, facts, metadata, or artwork/);

  const wrongEdition = structuredClone(source);
  const selectedEdition = wrongEdition.records.find(
    (record) =>
      record.displayMetadata.title === "Glow Orchard" && record.artwork.status === "selected",
  );
  selectedEdition.artwork.scope.printing = "another printing";
  assert.throws(() => makeAdapter(wrongEdition), /invalid identity, facts, metadata, or artwork/);

  const unknownArtworkScope = structuredClone(source);
  const unknownScopeArtwork = unknownArtworkScope.records.find(
    (record) =>
      record.displayMetadata.title === "Glow Orchard" && record.artwork.status === "selected",
  );
  unknownScopeArtwork.artwork.scope.language = null;
  assert.throws(
    () => makeAdapter(unknownArtworkScope),
    /invalid identity, facts, metadata, or artwork/,
  );
});

test("the adapter cannot mutate its source or expose mutable nested view data", () => {
  const source = prototype.createSyntheticPublishedCatalogSnapshot();
  const before = JSON.stringify(source);
  const adapter = makeAdapter(source);
  const first = adapter.discover(context(), "glow orchard").entries[0];
  if (first.artwork.status === "selected") first.artwork.attribution.text = "tampered";
  assert.equal(JSON.stringify(source), before);
  assert.notEqual(
    adapter.discover(context(), "glow orchard").entries[0].artwork.status === "selected"
      ? adapter.discover(context(), "glow orchard").entries[0].artwork.attribution.text
      : null,
    "tampered",
  );
});

test("the neutral adapter remains outside production imports and fixture generation is closed", () => {
  for (const path of [
    "src/routes/discover.tsx",
    "src/routes/results.tsx",
    "src/lib/scoring.ts",
    "src/lib/store.ts",
  ]) {
    const text = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    assert.equal(text.includes("catalog-published-view"), false);
    assert.equal(text.includes("catalog-view-adapter"), false);
  }
  assert.equal(typeof contract.assertPublishedCatalogSnapshot, "function");
  assert.throws(
    () => prototype.createSyntheticPublishedCatalogSnapshot({ records: [] }),
    /valid fixed timestamp/,
  );
});
