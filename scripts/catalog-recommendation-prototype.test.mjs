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
let ingestion;
let syntheticProvider;
let artworkModule;

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  prototype = await server.ssrLoadModule("/src/lib/catalog-recommendation-prototype.ts");
  ingestion = await server.ssrLoadModule("/src/lib/catalog-ingestion.ts");
  artworkModule = await server.ssrLoadModule("/src/lib/catalog-artwork.ts");
  syntheticProvider = ingestion.createSyntheticCatalogProvider();
});

after(async () => {
  await server?.close();
});

function context(overrides = {}) {
  return {
    players: 4,
    ageBand: "8-10",
    maxTimeMin: 60,
    timeOver60: false,
    vibes: ["family"],
    exactTraits: null,
    ...overrides,
  };
}

function entryByTitle(preview, title, edition) {
  const found = preview.entries.find(
    (entry) => entry.title === title && (!edition || entry.edition === edition),
  );
  assert.ok(found, `expected fixture entry ${title}${edition ? ` (${edition})` : ""}`);
  return found;
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function artworkCandidate({
  id,
  stagingId,
  gamefinderId,
  scope,
  expiresAt = null,
  revokedAt = null,
  availability = "available",
  approvalStatus = "approved",
  cachingHosting = "allowed",
  resizingTransformation = "allowed",
  attribution = { required: false, text: null },
}) {
  return {
    id,
    game: { stagingId, gamefinderId },
    scope,
    source: {
      provider: "synthetic",
      originalImageReference: `synthetic-asset://${id}.svg`,
      provenance: {
        provider: "synthetic",
        providerRecordId: "fixture-artwork-test",
        fieldName: "cover-artwork",
        reference: `synthetic-fixture:fixture-artwork-test:${id}`,
        url: null,
        observedAt: "2026-01-15T12:00:00.000Z",
      },
    },
    rights: {
      rightsHolder: "Fictional test studio",
      permissionReference: `synthetic-fixture-permission:${id}`,
      commercialDisplay: "allowed",
      cachingHosting,
      resizingTransformation,
      attribution,
      expiresAt,
      revokedAt,
    },
    review: {
      verification: "verified",
      approval: approvalStatus,
      reviewerId: "synthetic-test-reviewer",
      reviewedAt: "2026-01-15T12:00:00.000Z",
    },
    image: {
      availability,
      width: 800,
      height: 1100,
      format: "svg",
      fileSizeBytes: 1200,
      quality: "standard",
    },
  };
}

test("the fixture boundary publishes only validated, explicitly synthetic catalog entries", () => {
  const preview = prototype.createSyntheticCatalogRecommendationPreview();

  assert.equal(preview.simulationOnly, true);
  assert.equal(preview.summary.sourceCandidates, 12);
  assert.equal(preview.summary.catalogPublished, 9);
  assert.equal(preview.summary.recommendationEligible, 6);
  assert.ok(preview.entries.every((entry) => !("bggId" in entry)));
  assert.equal(new Set(preview.entries.map((entry) => entry.gamefinderId)).size, 12);
  assert.ok(
    preview.entries.every((entry) =>
      /^gf:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/.test(
        entry.gamefinderId,
      ),
    ),
  );

  const missing = entryByTitle(preview, "Hollow Lanterns");
  assert.equal(missing.catalogPublished, false);
  assert.ok(missing.rejectionReasons.includes("required-fact-not-verified"));
  const disputed = entryByTitle(preview, "Mirror Harbor");
  assert.equal(disputed.catalogPublished, false);
  assert.ok(disputed.rejectionReasons.includes("identity-not-verified-in-fixture"));
  const conflicting = entryByTitle(preview, "Split Current");
  assert.equal(conflicting.catalogPublished, false);
  assert.ok(conflicting.rejectionReasons.includes("contradictory-player-counts"));
  assert.ok(conflicting.rejectionReasons.includes("identity-not-verified-in-fixture"));

  const reservedIds = new Set(
    JSON.parse(readFileSync(ledgerPath, "utf8"))
      .authoredRecords.map((record) => record.reservedPermanentId)
      .filter(Boolean),
  );
  assert.ok(
    prototype.syntheticFixtureIdentityIds().every((identity) => !reservedIds.has(identity)),
    "fixture identities must not impersonate reserved 05E1 IDs",
  );
});

test("staging discards forged approval-shaped provider fields", async () => {
  const [providerCandidate] = await syntheticProvider.searchByTitle("Synthetic Cedar Grove", 1);
  assert.ok(providerCandidate);
  const forged = Object.assign({}, providerCandidate, {
    identityReview: {
      status: "verified",
      gamefinderId: "gf:1a000001-1111-4111-8111-000000000001",
      evidence: [{ provider: "publisher", fieldName: "identity" }],
    },
    metadataRights: { status: "cleared", commercialUse: "allowed", storage: "allowed" },
    review: {
      humanReview: { status: "approved", reviewerId: "forged", decidedAt: "2026-01-15T12:00:00Z" },
      ownerApproval: {
        status: "approved",
        reviewerId: "forged",
        decidedAt: "2026-01-15T12:00:00Z",
      },
    },
  });

  const staged = ingestion.stageProviderCandidate(forged, "2026-01-15T12:00:00.000Z");
  assert.equal(staged.identityReview.status, "unreviewed");
  assert.equal(staged.identityReview.gamefinderId, null);
  assert.equal(staged.metadataRights.status, "unknown");
  assert.equal(staged.review.humanReview.status, "pending");
  assert.equal(staged.review.ownerApproval.status, "pending");
  assert.notEqual(
    ingestion.validateStagedCandidate(staged, [], "2026-01-15T12:00:00.000Z").status,
    "metadata-validated",
  );
});

test("default Find-style preview has three owned and three unowned stable results", () => {
  const first = prototype.createSyntheticCatalogRecommendationPreview();
  const second = prototype.createSyntheticCatalogRecommendationPreview();

  assert.deepEqual(first, second);
  assert.equal(first.ownedTop.length, 3);
  assert.equal(first.unownedTop.length, 3);
  assert.ok(first.ownedTop.every((entry) => entry.ownership === "owned"));
  assert.ok(first.unownedTop.every((entry) => entry.ownership === "unowned"));
  assert.ok(first.ownedTop.every((entry) => entry.recommendationEligible));
  assert.ok(first.unownedTop.every((entry) => entry.recommendationEligible));
  assert.equal(new Set(first.ownedTop.map((entry) => entry.gamefinderId)).size, 3);
  assert.equal(new Set(first.unownedTop.map((entry) => entry.gamefinderId)).size, 3);
  assert.ok(
    first.ownedTop.every(
      (entry) =>
        entry.legacyCompatibility.status === "verified-alias" ||
        entry.legacyCompatibility.status === "no-verified-alias",
    ),
  );
  assert.equal(
    first.summary.recommendationEligible,
    first.summary.ownedEligible + first.summary.unownedEligible,
  );
});

test("permanent identity drives membership, results, exclusions, and deterministic ties", () => {
  const owned = prototype.SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS;
  const withoutVibes = context({ ageBand: null, maxTimeMin: null, vibes: [] });
  const first = prototype.createSyntheticCatalogRecommendationPreview(withoutVibes, owned);
  const repeated = prototype.createSyntheticCatalogRecommendationPreview(withoutVibes, owned);

  assert.deepEqual(
    first.ownedTop.map(({ gamefinderId, score }) => [gamefinderId, score]),
    repeated.ownedTop.map(({ gamefinderId, score }) => [gamefinderId, score]),
  );
  const equalScoreTitles = first.ownedTop
    .filter((entry) => entry.score === first.ownedTop[0].score)
    .map((entry) => entry.title);
  assert.deepEqual(equalScoreTitles, [...equalScoreTitles].sort());
  assert.ok(first.entries.every((entry) => entry.gamefinderId.startsWith("gf:")));
  assert.ok(first.entries.every((entry) => !Object.hasOwn(entry, "bggId")));
});

test("player, age, maximum-listed-time, and adult-content constraints fail closed", () => {
  const noPlayerMatches = prototype.createSyntheticCatalogRecommendationPreview(
    context({ players: 10 }),
  );
  assert.equal(noPlayerMatches.ownedTop.length, 0);
  assert.equal(noPlayerMatches.unownedTop.length, 0);
  assert.ok(
    noPlayerMatches.entries
      .filter((entry) => entry.catalogPublished)
      .every((entry) => entry.rejectionReasons.includes("player-count")),
  );

  const youngAge = prototype.createSyntheticCatalogRecommendationPreview(
    context({ ageBand: "6-7" }),
  );
  assert.ok(
    entryByTitle(youngAge, "Glow Orchard").rejectionReasons.includes("publisher-minimum-age"),
  );
  assert.ok(entryByTitle(youngAge, "Cloud Kite Festival").recommendationEligible);

  const shortTime = prototype.createSyntheticCatalogRecommendationPreview(
    context({ maxTimeMin: 30, vibes: [] }),
  );
  assert.ok(
    entryByTitle(shortTime, "Glow Orchard").rejectionReasons.includes("maximum-listed-playtime"),
  );
  assert.ok(entryByTitle(shortTime, "Cloud Kite Festival").recommendationEligible);

  const adultAgeBand = prototype.createSyntheticCatalogRecommendationPreview(
    context({ ageBand: "14-17", maxTimeMin: null, vibes: [] }),
  );
  assert.ok(
    entryByTitle(adultAgeBand, "Midnight Masquerade").rejectionReasons.includes("adult-content"),
  );
  assert.ok(
    entryByTitle(adultAgeBand, "Midnight Masquerade").rejectionReasons.includes(
      "publisher-minimum-age",
    ),
  );
});

test("the six independent Vibes score known facts and missing requested scores never match", () => {
  for (const vibe of ["luck", "strategy", "dexterity", "family", "party", "board"]) {
    const preview = prototype.createSyntheticCatalogRecommendationPreview(
      context({ ageBand: null, maxTimeMin: null, vibes: [vibe] }),
    );
    const eligible = preview.entries.filter((entry) => entry.recommendationEligible);
    assert.ok(eligible.length > 0, `${vibe} should have at least one eligible fixture`);
    assert.ok(
      eligible.every((entry) => typeof entry.vibeScores[vibe] === "number"),
      `${vibe} must have an explicit score for every eligible recommendation`,
    );
    assert.ok(
      eligible.every((entry) =>
        entry.matchExplanation.some((line) => line.toLowerCase().includes(vibe)),
      ),
    );
  }

  const party = prototype.createSyntheticCatalogRecommendationPreview(
    context({ ageBand: null, maxTimeMin: null, vibes: ["party"] }),
  );
  const incomplete = entryByTitle(party, "Festival of Tides");
  assert.equal(incomplete.recommendationEligible, false);
  assert.ok(incomplete.rejectionReasons.includes("requested-vibe-score-missing"));
});

test("exact Vibe targets use complete fixture scores and retain deterministic scoring", () => {
  const preferences = context({
    ageBand: null,
    maxTimeMin: null,
    vibes: [],
    exactTraits: { family: 4, strategy: 3 },
  });
  const first = prototype.createSyntheticCatalogRecommendationPreview(preferences);
  const second = prototype.createSyntheticCatalogRecommendationPreview(preferences);

  assert.deepEqual(
    first.unownedTop.map(({ gamefinderId, score }) => [gamefinderId, score]),
    second.unownedTop.map(({ gamefinderId, score }) => [gamefinderId, score]),
  );
  assert.ok(
    first.entries
      .filter((entry) => entry.recommendationEligible)
      .every(
        (entry) =>
          typeof entry.vibeScores.family === "number" &&
          typeof entry.vibeScores.strategy === "number",
      ),
  );
});

test("expansions remain distinct and are not recommended as standalone games", () => {
  const preview = prototype.createSyntheticCatalogRecommendationPreview();
  const expansion = entryByTitle(preview, "Cloud Kite Festival: Windward Kites");

  assert.equal(expansion.catalogPublished, true);
  assert.equal(expansion.recommendationEligible, false);
  assert.equal(expansion.relationship.kind, "expansion");
  assert.equal(
    expansion.relationship.targetGamefinderId,
    "gf:1a000003-1111-4111-8111-000000000003",
  );
  assert.ok(expansion.rejectionReasons.includes("expansion-not-standalone"));
  assert.notEqual(expansion.gamefinderId, expansion.relationship.targetGamefinderId);
});

test("reroll exclusions use GameFinder IDs and exhaustion is explicit", () => {
  const first = prototype.createSyntheticCatalogRecommendationPreview();
  const partialReroll = prototype.createSyntheticCatalogRecommendationPreview(
    context(),
    prototype.SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS,
    [first.ownedTop[0].gamefinderId, first.unownedTop[0].gamefinderId],
  );
  assert.equal(partialReroll.ownedTop.length, 2);
  assert.equal(partialReroll.unownedTop.length, 2);
  assert.ok(
    [...partialReroll.ownedTop, ...partialReroll.unownedTop].every(
      (entry) =>
        entry.gamefinderId !== first.ownedTop[0].gamefinderId &&
        entry.gamefinderId !== first.unownedTop[0].gamefinderId,
    ),
  );

  const exclusions = [
    ...first.ownedTop.map((entry) => entry.gamefinderId),
    ...first.unownedTop.map((entry) => entry.gamefinderId),
  ];
  const reroll = prototype.createSyntheticCatalogRecommendationPreview(
    context(),
    prototype.SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS,
    exclusions,
  );

  assert.deepEqual(reroll.ownedTop, []);
  assert.deepEqual(reroll.unownedTop, []);
  assert.equal(reroll.summary.exhaustedOwned, true);
  assert.equal(reroll.summary.exhaustedUnowned, true);
  assert.deepEqual(reroll.summary.excludedGamefinderIds, [...exclusions].sort());
});

test("only unique verified synthetic legacy aliases resolve automatically", () => {
  const preview = prototype.createSyntheticCatalogRecommendationPreview();
  const byKey = new Map(
    preview.compatibility.references.map((reference) => [reference.legacyKey, reference]),
  );
  const verified = byKey.get("demo-key-glow-orchard");
  assert.equal(verified.status, "resolved");
  assert.equal(verified.gamefinderId, "gf:1a000001-1111-4111-8111-000000000001");
  assert.deepEqual(entryByTitle(preview, "Glow Orchard").legacyCompatibility, {
    status: "verified-alias",
    namespace: "synthetic-legacy",
    key: "demo-key-glow-orchard",
  });
  assert.deepEqual(entryByTitle(preview, "Festival of Tides").legacyCompatibility, {
    status: "no-verified-alias",
    namespace: "synthetic-legacy",
  });

  const ambiguous = byKey.get("41114");
  assert.equal(ambiguous.status, "ambiguous");
  assert.equal(ambiguous.candidateGamefinderIds.length, 2);

  const unverified = byKey.get("demo-key-unverified");
  assert.equal(unverified.status, "unverified");
  const orphan = byKey.get("demo-orphan-key");
  assert.equal(orphan.status, "orphaned");
  assert.deepEqual(orphan.candidateGamefinderIds, []);

  assert.equal(preview.compatibility.customGame.id, "gfc_synthetic_owner_game_0001");
  assert.equal(preview.compatibility.customGame.ownerScope, "synthetic-owner-only");
  assert.equal(preview.compatibility.customGame.resolvedAsGlobalGame, false);
});

test("editions select only their own exact artwork and unauthorized art falls back explicitly", () => {
  const preview = prototype.createSyntheticCatalogRecommendationPreview();
  const firstEdition = entryByTitle(preview, "Skyline Foundry", "First Edition");
  const secondEdition = entryByTitle(preview, "Skyline Foundry", "Second Edition");

  assert.notEqual(firstEdition.gamefinderId, secondEdition.gamefinderId);
  assert.equal(firstEdition.artwork.status, "selected");
  assert.ok(firstEdition.artwork.reference.includes("art-skyline-first-edition"));
  assert.equal(firstEdition.artwork.cachingPermitted, true);
  assert.equal(firstEdition.artwork.transformationPermitted, true);
  assert.equal(secondEdition.catalogPublished, true);
  assert.equal(secondEdition.artwork.status, "fallback");
  assert.equal(secondEdition.artwork.reason, "rights-unresolved");
  assert.equal(secondEdition.artwork.authenticity, "not-an-authentic-game-cover");

  const firstScope = prototype.syntheticFixtureDefinition(firstEdition.gamefinderId);
  const mismatch = prototype.selectSyntheticFixtureArtwork(secondEdition.gamefinderId, {
    edition: { status: "known", value: firstScope.edition },
    printing: { status: "known", value: firstScope.printing },
    language: { status: "known", value: firstScope.language },
    market: { status: "known", value: firstScope.market },
  });
  assert.equal(mismatch.status, "edition-mismatch");

  for (const field of ["printing", "language", "market"]) {
    const wrongScope = {
      edition: { status: "known", value: firstScope.edition },
      printing: { status: "known", value: firstScope.printing },
      language: { status: "known", value: firstScope.language },
      market: { status: "known", value: firstScope.market },
    };
    wrongScope[field] = { status: "known", value: `Different ${field}` };
    assert.equal(
      prototype.selectSyntheticFixtureArtwork(firstEdition.gamefinderId, wrongScope).status,
      "edition-mismatch",
      `${field} mismatch must not select artwork`,
    );
  }
});

test("expired and revoked artwork never selects; identity mismatch cannot borrow another cover", () => {
  const skylineSecondId = "gf:1a000008-1111-4111-8111-000000000008";
  const definition = prototype.syntheticFixtureDefinition(skylineSecondId);
  const scope = {
    edition: { status: "known", value: definition.edition },
    printing: { status: "known", value: definition.printing },
    language: { status: "known", value: definition.language },
    market: { status: "known", value: definition.market },
  };
  const secondStagingId = "stage:synthetic:fixture-skyline-foundry-second";
  const expired = artworkModule.selectApprovedArtwork(
    { stagingId: secondStagingId, gamefinderId: skylineSecondId },
    scope,
    [
      artworkCandidate({
        id: "expired-art",
        stagingId: secondStagingId,
        gamefinderId: skylineSecondId,
        scope,
        expiresAt: "2025-01-01T00:00:00.000Z",
      }),
    ],
    "2026-01-15T12:00:00.000Z",
  );
  assert.equal(expired.status, "rights-unresolved");
  assert.equal(expired.cachingPermitted, false);

  const revoked = artworkModule.selectApprovedArtwork(
    { stagingId: secondStagingId, gamefinderId: skylineSecondId },
    scope,
    [
      artworkCandidate({
        id: "revoked-art",
        stagingId: secondStagingId,
        gamefinderId: skylineSecondId,
        scope,
        revokedAt: "2025-12-01T00:00:00.000Z",
      }),
    ],
    "2026-01-15T12:00:00.000Z",
  );
  assert.equal(revoked.status, "rights-unresolved");

  const missingAttribution = artworkModule.selectApprovedArtwork(
    { stagingId: secondStagingId, gamefinderId: skylineSecondId },
    scope,
    [
      artworkCandidate({
        id: "missing-attribution-art",
        stagingId: secondStagingId,
        gamefinderId: skylineSecondId,
        scope,
        attribution: { required: true, text: null },
      }),
    ],
    "2026-01-15T12:00:00.000Z",
  );
  assert.equal(missingAttribution.status, "rights-unresolved");

  const unavailable = artworkModule.selectApprovedArtwork(
    { stagingId: secondStagingId, gamefinderId: skylineSecondId },
    scope,
    [
      artworkCandidate({
        id: "unavailable-art",
        stagingId: secondStagingId,
        gamefinderId: skylineSecondId,
        scope,
        availability: "unavailable",
      }),
    ],
    "2026-01-15T12:00:00.000Z",
  );
  assert.equal(unavailable.status, "image-unavailable");

  const pendingReview = artworkModule.selectApprovedArtwork(
    { stagingId: secondStagingId, gamefinderId: skylineSecondId },
    scope,
    [
      artworkCandidate({
        id: "pending-review-art",
        stagingId: secondStagingId,
        gamefinderId: skylineSecondId,
        scope,
        approvalStatus: "pending",
      }),
    ],
    "2026-01-15T12:00:00.000Z",
  );
  assert.equal(pendingReview.status, "approval-pending");

  const otherEditionScope = {
    ...scope,
    edition: { status: "known", value: "First Edition" },
  };
  const wrongEdition = prototype.selectSyntheticFixtureArtwork(skylineSecondId, otherEditionScope);
  assert.equal(wrongEdition.status, "edition-mismatch");

  const otherGameArt = artworkCandidate({
    id: "first-edition-art",
    stagingId: secondStagingId,
    gamefinderId: "gf:1a000007-1111-4111-8111-000000000007",
    scope,
  });
  const identityMismatch = artworkModule.selectApprovedArtwork(
    { stagingId: secondStagingId, gamefinderId: skylineSecondId },
    scope,
    [otherGameArt],
  );
  assert.equal(identityMismatch.status, "identity-mismatch");
  assert.equal(identityMismatch.artwork, null);
  assert.equal(identityMismatch.cachingPermitted, false);

  const displayOnly = artworkModule.selectApprovedArtwork(
    { stagingId: secondStagingId, gamefinderId: skylineSecondId },
    scope,
    [
      artworkCandidate({
        id: "display-only-art",
        stagingId: secondStagingId,
        gamefinderId: skylineSecondId,
        scope,
        cachingHosting: "denied",
        resizingTransformation: "denied",
      }),
    ],
    "2026-01-15T12:00:00.000Z",
  );
  assert.equal(displayOnly.status, "selected");
  assert.equal(displayOnly.cachingPermitted, false);
  assert.equal(displayOnly.transformationPermitted, false);
});

test("metadata approval does not grant artwork rights", () => {
  const preview = prototype.createSyntheticCatalogRecommendationPreview();
  const secondEdition = entryByTitle(preview, "Skyline Foundry", "Second Edition");

  assert.equal(secondEdition.catalogPublished, true);
  assert.equal(secondEdition.recommendationEligible, true);
  assert.equal(secondEdition.artwork.status, "fallback");
  assert.equal(secondEdition.artwork.reason, "rights-unresolved");
});

test("preview generation leaves approved identity and adjudication snapshots unchanged", () => {
  const before = [hashFile(ledgerPath), hashFile(queuePath)];
  prototype.createSyntheticCatalogRecommendationPreview();
  prototype.createSyntheticCatalogRecommendationPreview(
    context({ vibes: ["party"], exactTraits: { strategy: 4 } }),
  );
  const after = [hashFile(ledgerPath), hashFile(queuePath)];

  assert.deepEqual(after, before);
});

test("the preview accepts no candidate or approval input and remains fixture-only", () => {
  const forgedClientPayload = {
    gamefinderId: "gf:ffffffff-ffff-4fff-8fff-ffffffffffff",
    humanApproval: true,
    ownerApproval: true,
    metadataRights: "allowed",
    artworkRights: "allowed",
  };
  const baseline = prototype.createSyntheticCatalogRecommendationPreview();
  const withExtraPayload = prototype.createSyntheticCatalogRecommendationPreview(
    context(),
    prototype.SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS,
    [],
    "2026-01-15T12:00:00.000Z",
    forgedClientPayload,
  );

  assert.deepEqual(withExtraPayload, baseline);
  assert.equal(withExtraPayload.simulationOnly, true);
  assert.ok(
    withExtraPayload.entries.every(
      (entry) => entry.gamefinderId !== forgedClientPayload.gamefinderId,
    ),
  );
});
