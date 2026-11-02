import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const root = new URL("..", import.meta.url).pathname;
const fixtureTime = "2026-02-01T00:00:00.000Z";
let server;
let catalog;
let foundation;
let ingestion;
let artwork;
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
  ingestion = await server.ssrLoadModule("/src/lib/catalog-ingestion.ts");
  artwork = await server.ssrLoadModule("/src/lib/catalog-artwork.ts");
  ({ useAppStore: store } = await server.ssrLoadModule("/src/lib/store.ts"));
});

after(async () => {
  await server?.close();
});

function provider() {
  return ingestion.createSyntheticCatalogProvider();
}

async function staged(title) {
  const [candidate] = await provider().searchByTitle(title);
  assert.ok(candidate, `Expected a synthetic fixture matching ${title}`);
  return ingestion.stageProviderCandidate(candidate, fixtureTime);
}

function approvedFact(fact) {
  const claim = fact.claims.find((entry) => entry.status === "reported");
  if (!claim) return fact;
  return {
    ...fact,
    reviewed: {
      status: "verified",
      value: claim.value,
      evidence: [claim.provenance],
      reviewerId: "synthetic-reviewer",
      reviewedAt: fixtureTime,
      approverId: "synthetic-fact-owner",
      approvedAt: fixtureTime,
    },
  };
}

function completeMetadataCandidate(candidate, { ownerApproval = "pending" } = {}) {
  const facts = Object.fromEntries(
    Object.entries(candidate.facts).map(([field, value]) => [field, approvedFact(value)]),
  );
  const evidence = {
    ...candidate.facts.title.claims[0].provenance,
    fieldName: "identity",
  };
  return {
    ...candidate,
    facts,
    identityReview: {
      status: "verified",
      gamefinderId: "gf:00000000-0000-4000-8000-000000000001",
      evidence: [evidence],
    },
    metadataRights: {
      status: "cleared",
      commercialUse: "allowed",
      storage: "allowed",
      licenseReference: "synthetic-fixture:metadata-permission",
      attribution: "Synthetic fixture",
      expiresAt: null,
    },
    review: {
      humanReview: { status: "approved", reviewerId: "synthetic-reviewer", decidedAt: fixtureTime },
      ownerApproval:
        ownerApproval === "approved"
          ? {
              status: "approved",
              reviewerId: "synthetic-owner",
              decidedAt: fixtureTime,
            }
          : { status: "pending", reviewerId: null, decidedAt: null },
    },
  };
}

function known(value) {
  return { status: "known", value };
}

function artworkIdentity(candidate) {
  return {
    stagingId: candidate.stagingId,
    gamefinderId: candidate.identityReview.gamefinderId,
  };
}

function artworkCandidate(game, scope, { rights = {}, review = {}, image = {} } = {}) {
  const provenance = {
    ...game.facts.title.claims[0].provenance,
    fieldName: "artwork",
  };
  return {
    id: "synthetic-artwork-1",
    game: { stagingId: game.stagingId, gamefinderId: game.identityReview.gamefinderId },
    scope,
    source: {
      provider: "synthetic",
      originalImageReference: "synthetic-fixture:image:cedar-grove",
      provenance,
    },
    rights: {
      rightsHolder: "Synthetic fixture rights holder",
      permissionReference: "synthetic-fixture:art-permission",
      commercialDisplay: "allowed",
      cachingHosting: "allowed",
      resizingTransformation: "allowed",
      attribution: { required: false, text: null },
      expiresAt: null,
      revokedAt: null,
      ...rights,
    },
    review: {
      verification: "verified",
      approval: "approved",
      reviewerId: "synthetic-art-reviewer",
      reviewedAt: fixtureTime,
      ...review,
    },
    image: {
      availability: "available",
      width: 1200,
      height: 1600,
      format: "image/png",
      fileSizeBytes: 240_000,
      quality: "high",
      ...image,
    },
  };
}

const cedarScope = {
  edition: known("Synthetic first edition"),
  printing: known("Synthetic printing 1"),
  language: known("en"),
  market: known("synthetic-market"),
};

test("synthetic provider is deterministic, provider-neutral, and stages without assigning identity", async () => {
  const source = provider();
  assert.equal(source.id, "synthetic");
  assert.deepEqual(
    await source.searchByTitle("Synthetic Star Routes"),
    await source.searchByTitle("Synthetic Star Routes"),
  );
  await assert.rejects(
    source.retrieveByExternalId({ provider: "bgg", value: "synthetic-only" }),
    /synthetic identifiers/,
  );

  const original = (await source.searchByTitle("Synthetic Cedar Grove"))[0];
  const stagedCandidate = ingestion.stageProviderCandidate(original, fixtureTime);
  assert.equal(stagedCandidate.stagingId, "stage:synthetic:synth-base-001");
  assert.equal(stagedCandidate.stageStatus, "staged");
  assert.equal(stagedCandidate.identityReview.gamefinderId, null);
  assert.equal(stagedCandidate.timestamps.importedAt, fixtureTime);
  assert.equal(stagedCandidate.timestamps.refreshedAt, null);
  assert.equal(stagedCandidate.history[0].action, "import");
  assert.equal(stagedCandidate.facts.title.claims[0].status, "reported");
  assert.equal("review" in original, false);
  assert.equal("identityReview" in original, false);
  assert.equal("metadataRights" in original, false);
  assert.equal(stagedCandidate.facts.title.reviewed.status, "unverified");
  assert.equal(stagedCandidate.metadataRights.status, "unknown");
  assert.equal(stagedCandidate.providerRatings[0].provider, "synthetic");
  assert.equal("vibes" in stagedCandidate, false);
  assert.equal("rubric" in stagedCandidate, false);
  assert.equal(ingestion.validateStagedCandidate(stagedCandidate).status, "quarantined");

  const updated = ingestion.refreshStagedCandidate(
    completeMetadataCandidate(stagedCandidate, { ownerApproval: "approved" }),
    original,
    "2026-03-01T00:00:00.000Z",
  );
  assert.equal(updated.timestamps.importedAt, fixtureTime);
  assert.equal(updated.timestamps.refreshedAt, "2026-03-01T00:00:00.000Z");
  assert.deepEqual(
    updated.history.map((entry) => entry.action),
    ["import", "refresh"],
  );
  assert.equal(updated.identityReview.status, "unreviewed");
  assert.equal(updated.identityReview.gamefinderId, "gf:00000000-0000-4000-8000-000000000001");
  assert.equal(updated.review.ownerApproval.status, "pending");
  assert.equal(updated.metadataRights.status, "unknown");
});

test("synthetic provider includes independent editions and base/expansion relationships", async () => {
  const source = provider();
  const editions = await source.searchByTitle("Synthetic Star Routes");
  const base = (await source.searchByTitle("Synthetic Cedar Grove"))[0];
  const expansion = (await source.searchByTitle("Synthetic Cedar Grove: Canopy"))[0];

  assert.equal(editions.length, 2);
  assert.notEqual(editions[0].providerRecordId, editions[1].providerRecordId);
  assert.equal(editions[0].facts.edition[0].value, "Synthetic first edition");
  assert.equal(editions[1].facts.edition[0].value, "Synthetic revised edition");
  assert.equal(base.facts.relationship[0].value.kind, "standalone");
  assert.equal(expansion.facts.relationship[0].value.kind, "expansion");
  assert.equal(
    expansion.facts.relationship[0].value.relatedGame.externalId.value,
    base.providerRecordId,
  );
});

test("unknown maximum duration, unverified age, and contradictory player counts fail closed", async () => {
  const noMaximum = await staged("Synthetic Quiet Valley");
  const unknownMaximum = noMaximum.facts.publishedPlaytime.claims[0].value;
  assert.equal(unknownMaximum.maximumListedMinutes, null);
  assert.equal(unknownMaximum.basis, "unknown");
  assert.ok(
    ingestion.validateStagedCandidate(noMaximum).reasons.includes("required-fact-not-verified"),
  );

  const unverifiedAge = await staged("Synthetic Age Unknown");
  assert.equal(unverifiedAge.facts.publisherMinimumAge.claims[0].value, 8);
  assert.equal(unverifiedAge.facts.publisherMinimumAge.reviewed.value, null);
  assert.ok(
    ingestion.validateStagedCandidate(unverifiedAge).reasons.includes("required-fact-not-verified"),
  );

  const contradictory = await staged("Synthetic Contradiction");
  const result = ingestion.validateStagedCandidate(contradictory);
  assert.equal(result.status, "quarantined");
  assert.ok(result.reasons.includes("contradictory-player-counts"));
});

test("incorrect and duplicate provider identifiers are quarantined without merging", async () => {
  const source = provider();
  const incorrectSource = await source.searchByTitle("Synthetic Identity Mismatch");
  const stagedIncorrect = ingestion.stageProviderCandidate(incorrectSource[0], fixtureTime);
  const incorrect = {
    ...stagedIncorrect,
    identityReview: {
      status: "mismatch",
      gamefinderId: null,
      evidence: [
        {
          ...stagedIncorrect.facts.title.claims[0].provenance,
          fieldName: "identity",
        },
      ],
    },
  };
  assert.equal(incorrect.externalIds[0].value, "synth-wrong-identity");
  assert.equal(
    ingestion.validateStagedCandidate(incorrect).reasons.includes("identity-mismatch"),
    true,
  );

  const duplicates = await source.searchByTitle("Synthetic Duplicate");
  const stagedDuplicates = duplicates.map((candidate) =>
    ingestion.stageProviderCandidate(candidate, fixtureTime),
  );
  assert.notEqual(stagedDuplicates[0].stagingId, stagedDuplicates[1].stagingId);
  for (const candidate of stagedDuplicates) {
    assert.ok(
      ingestion
        .validateStagedCandidate(candidate, stagedDuplicates)
        .reasons.includes("duplicate-external-identifier"),
    );
  }
});

test("complete metadata still waits for owner approval and never publishes during staging", async () => {
  const candidate = completeMetadataCandidate(await staged("Synthetic Approval Pending"));
  const validation = ingestion.validateStagedCandidate(candidate, [], fixtureTime);
  assert.equal(validation.status, "awaiting-approval");
  assert.deepEqual(validation.reasons, ["owner-approval-pending"]);
  assert.equal(candidate.stageStatus, "staged");
  assert.equal("publishedAt" in candidate, false);
  assert.equal("published" in candidate, false);

  const approved = completeMetadataCandidate(candidate, { ownerApproval: "approved" });
  assert.equal(
    ingestion.validateStagedCandidate(approved, [], fixtureTime).status,
    "metadata-validated",
  );
});

test("artwork is selected only for the exact game and edition with approved display rights", async () => {
  const candidate = completeMetadataCandidate(await staged("Synthetic Star Routes"));
  const correctScope = {
    edition: known("Synthetic first edition"),
    printing: known("Synthetic printing 1"),
    language: known("en"),
    market: known("synthetic-market"),
  };
  const firstEdition = artworkCandidate(candidate, correctScope);
  const wrongEdition = artworkCandidate(candidate, {
    ...correctScope,
    edition: known("Synthetic revised edition"),
  });

  assert.equal(
    artwork.selectApprovedArtwork(artworkIdentity(candidate), correctScope, [firstEdition]).status,
    "selected",
  );
  assert.equal(
    artwork.selectApprovedArtwork(artworkIdentity(candidate), correctScope, [wrongEdition]).status,
    "edition-mismatch",
  );
  const wrongIdentity = {
    ...artworkCandidate(candidate, correctScope),
    game: {
      stagingId: candidate.stagingId,
      gamefinderId: "gf:00000000-0000-4000-8000-000000000002",
    },
  };
  assert.equal(
    artwork.selectApprovedArtwork(artworkIdentity(candidate), correctScope, [wrongIdentity]).status,
    "identity-mismatch",
  );
  assert.equal(
    artwork.artworkPublicationReadiness(artworkIdentity(candidate), correctScope, [])
      .missingAuthenticArtwork,
    true,
  );
});

test("artwork display, caching, transformations, and rights approval remain independent", async () => {
  const candidate = completeMetadataCandidate(await staged("Synthetic Star Routes"), {
    ownerApproval: "approved",
  });
  const displayOnly = artworkCandidate(candidate, cedarScope, {
    rights: { cachingHosting: "denied", resizingTransformation: "unknown" },
  });
  const selected = artwork.selectApprovedArtwork(
    artworkIdentity(candidate),
    cedarScope,
    [displayOnly],
    fixtureTime,
  );
  assert.equal(selected.status, "selected");
  assert.equal(selected.cachingPermitted, false);
  assert.equal(selected.transformationPermitted, false);

  const unclearRights = artworkCandidate(candidate, cedarScope, {
    rights: { commercialDisplay: "unknown" },
  });
  assert.equal(
    artwork.selectApprovedArtwork(
      artworkIdentity(candidate),
      cedarScope,
      [unclearRights],
      fixtureTime,
    ).status,
    "rights-unresolved",
  );
  const unapprovedImage = artworkCandidate(candidate, cedarScope, {
    review: { approval: "pending" },
  });
  assert.equal(
    ingestion.validateStagedCandidate(candidate, [], fixtureTime).status,
    "metadata-validated",
  );
  assert.equal(
    artwork.selectApprovedArtwork(
      artworkIdentity(candidate),
      cedarScope,
      [unapprovedImage],
      fixtureTime,
    ).status,
    "approval-pending",
  );
});

test("catalog, recommendations, and persisted user references are untouched by staging", async () => {
  const catalogSnapshot = JSON.stringify({
    authored: catalog.AUTHORED_GAMES,
    visible: catalog.GAMES,
    recommendations: catalog.standaloneGames(),
  });
  const state = store.getState();
  const userSnapshot = JSON.stringify({
    owned: state.owned,
    wishlist: state.wishlist,
    plays: state.plays,
    scoreSessions: state.scoreSessions,
  });
  const stagedCandidate = await staged("Synthetic Cedar Grove");
  const unchanged = JSON.stringify({
    authored: catalog.AUTHORED_GAMES,
    visible: catalog.GAMES,
    recommendations: catalog.standaloneGames(),
  });

  assert.equal(catalog.AUTHORED_GAMES.length, 143);
  assert.equal(catalog.GAMES.length, 142);
  assert.equal(catalog.standaloneGames().length, 135);
  assert.equal(unchanged, catalogSnapshot);
  assert.equal(
    JSON.stringify({
      owned: state.owned,
      wishlist: state.wishlist,
      plays: state.plays,
      scoreSessions: state.scoreSessions,
    }),
    userSnapshot,
  );
  assert.equal(stagedCandidate.stageStatus, "staged");
  assert.equal(foundation.BGG_PROVIDER_POLICY.enabled, false);
  assert.equal(foundation.BGG_PROVIDER_POLICY.commercialUseAuthorized, false);
});
