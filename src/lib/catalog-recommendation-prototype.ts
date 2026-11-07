import {
  catalogHardEligible,
  catalogRecommendationScore,
  type CatalogGameRecord,
} from "./catalog-foundation";
import {
  stageProviderCandidate,
  validateStagedCandidate,
  type CandidateFact,
  type CandidateFacts,
  type CandidateRelationship,
  type ProviderCandidateFacts,
  type ProviderFieldClaim,
  type ProviderFieldProvenance,
  type ProviderGameCandidate,
  type StagedCatalogCandidate,
} from "./catalog-ingestion";
import {
  artworkPublicationReadiness,
  selectApprovedArtwork,
  type ArtworkCandidate,
  type ArtworkEditionScope,
  type ArtworkGameIdentity,
  type ArtworkSelection,
  type ScopedValue,
} from "./catalog-artwork";
import { AGE_BANDS, VIBE_META } from "./vibes";
import { MAX_PLAYER_COUNT } from "./types";
import type { VibeId, WizardContext } from "./types";

type FixtureIdentityStatus = "verified" | "disputed" | "unreviewed";

type FixtureDefinition = {
  id: string;
  slug: string;
  title: string;
  publisher: string;
  yearPublished: number;
  edition: string;
  printing: string;
  language: string;
  market: string;
  minimumPlayers: number;
  maximumPlayers: number;
  bestPlayers: number[];
  publisherMinimumAge: number | null;
  publishedMinimumMinutes: number;
  maximumListedPlaytimeMinutes: number;
  adultContent: boolean;
  vibeScores: Partial<Record<VibeId, number>>;
  mechanics: string[];
  categories: string[];
  relationship: CandidateRelationship;
  editionOf?: { gamefinderId: string; title: string };
  identityStatus?: FixtureIdentityStatus;
  conflictingPlayerClaims?: { minimum: number[]; maximum: number[] };
};

type SyntheticFixture = {
  readonly fixtureOnly: true;
  readonly simulation: "test-data-only";
  readonly definition: FixtureDefinition;
  readonly candidate: StagedCatalogCandidate;
  readonly adultContentReview: {
    status: "verified";
    value: boolean;
    simulation: "test-data-only";
    evidence: ProviderFieldProvenance;
    reviewerId: string;
    reviewedAt: string;
    approverId: string;
    approvedAt: string;
  };
  readonly editionRelationshipReview: {
    status: "verified";
    simulation: "test-data-only";
    evidence: ProviderFieldProvenance;
    reviewerId: string;
    reviewedAt: string;
    approverId: string;
    approvedAt: string;
  } | null;
};

export type PrototypeArtworkView =
  | {
      status: "selected";
      authenticity: "synthetic-test-artwork-not-commercial";
      reference: string;
      cachingPermitted: boolean;
      transformationPermitted: boolean;
    }
  | {
      status: "fallback";
      placeholder: "original-gamefinder-placeholder";
      reason: ArtworkSelection["status"] | "catalog-entry-not-published";
      authenticity: "not-an-authentic-game-cover";
    };

export type RecommendationPreviewEntry = {
  gamefinderId: string;
  legacyCompatibility:
    | { status: "verified-alias"; namespace: "synthetic-legacy"; key: string }
    | { status: "no-verified-alias"; namespace: "synthetic-legacy" };
  title: string;
  edition: string;
  relationship: {
    kind: "base-game" | "expansion" | "edition";
    targetGamefinderId: string | null;
    targetTitle: string;
  } | null;
  ownership: "owned" | "unowned";
  players: { minimum: number; maximum: number };
  publisherMinimumAge: number | null;
  maximumListedPlaytimeMinutes: number;
  adultContent: boolean;
  vibeScores: Partial<Record<VibeId, number>>;
  score: number | null;
  matchExplanation: string[];
  artwork: PrototypeArtworkView;
  catalogPublished: boolean;
  recommendationEligible: boolean;
  rejectionReasons: string[];
};

export type LegacyCompatibilityResult =
  | {
      status: "resolved";
      namespace: "synthetic-legacy";
      legacyKey: string;
      gamefinderId: string;
    }
  | {
      status: "ambiguous" | "unverified" | "orphaned";
      namespace: "synthetic-legacy";
      legacyKey: string;
      candidateGamefinderIds: string[];
    };

export type SyntheticCatalogRecommendationPreview = {
  simulationOnly: true;
  summary: {
    sourceCandidates: number;
    catalogPublished: number;
    recommendationEligible: number;
    ownedEligible: number;
    unownedEligible: number;
    excludedGamefinderIds: string[];
    exhaustedOwned: boolean;
    exhaustedUnowned: boolean;
  };
  entries: RecommendationPreviewEntry[];
  ownedTop: RecommendationPreviewEntry[];
  unownedTop: RecommendationPreviewEntry[];
  compatibility: {
    references: LegacyCompatibilityResult[];
    customGame: {
      id: string;
      ownerScope: "synthetic-owner-only";
      resolvedAsGlobalGame: false;
    };
  };
};

const SYNTHETIC_REVIEW_AT = "2026-01-15T12:00:00.000Z";
const SIMULATED_REVIEWER = "synthetic-human-reviewer";
const SIMULATED_OWNER = "synthetic-catalog-owner";
const UUID_IDS = {
  glowOrchard: "gf:1a000001-1111-4111-8111-000000000001",
  clockworkEstuary: "gf:1a000002-1111-4111-8111-000000000002",
  cloudKiteFestival: "gf:1a000003-1111-4111-8111-000000000003",
  festivalOfTides: "gf:1a000004-1111-4111-8111-000000000004",
  boroughsAndBridges: "gf:1a000005-1111-4111-8111-000000000005",
  midnightMasquerade: "gf:1a000006-1111-4111-8111-000000000006",
  skylineFoundryFirst: "gf:1a000007-1111-4111-8111-000000000007",
  skylineFoundrySecond: "gf:1a000008-1111-4111-8111-000000000008",
  windwardKites: "gf:1a000009-1111-4111-8111-000000000009",
  hollowLanterns: "gf:1a00000a-1111-4111-8111-00000000000a",
  mirrorHarbor: "gf:1a00000b-1111-4111-8111-00000000000b",
  splitCurrent: "gf:1a00000c-1111-4111-8111-00000000000c",
} as const;

const standalone = (): CandidateRelationship => ({ kind: "standalone", relatedGame: null });
const expansionOf = (gamefinderId: string, title: string): CandidateRelationship => ({
  kind: "expansion",
  relatedGame: { externalId: null, gamefinderId, title },
});

const DEFINITIONS: readonly FixtureDefinition[] = [
  {
    id: UUID_IDS.glowOrchard,
    slug: "glow-orchard",
    title: "Glow Orchard",
    publisher: "Fable Finch Studio",
    yearPublished: 2024,
    edition: "First Edition",
    printing: "Demo Printing 1",
    language: "English",
    market: "Synthetic Demo Market",
    minimumPlayers: 2,
    maximumPlayers: 4,
    bestPlayers: [3, 4],
    publisherMinimumAge: 8,
    publishedMinimumMinutes: 25,
    maximumListedPlaytimeMinutes: 45,
    adultContent: false,
    vibeScores: { luck: 4, strategy: 2.5, dexterity: 1.5, family: 4.5, party: 2, board: 3 },
    mechanics: ["set collection", "push your luck"],
    categories: ["family", "fictional"],
    relationship: standalone(),
  },
  {
    id: UUID_IDS.clockworkEstuary,
    slug: "clockwork-estuary",
    title: "Clockwork Estuary",
    publisher: "Copper Heron Games",
    yearPublished: 2023,
    edition: "First Edition",
    printing: "Demo Printing 1",
    language: "English",
    market: "Synthetic Demo Market",
    minimumPlayers: 1,
    maximumPlayers: 4,
    bestPlayers: [2],
    publisherMinimumAge: 12,
    publishedMinimumMinutes: 70,
    maximumListedPlaytimeMinutes: 100,
    adultContent: false,
    vibeScores: { luck: 1.5, strategy: 4.8, dexterity: 1, family: 2.4, party: 1.5, board: 4.5 },
    mechanics: ["worker placement", "network building"],
    categories: ["strategy", "fictional"],
    relationship: standalone(),
  },
  {
    id: UUID_IDS.cloudKiteFestival,
    slug: "cloud-kite-festival",
    title: "Cloud Kite Festival",
    publisher: "Fable Finch Studio",
    yearPublished: 2025,
    edition: "First Edition",
    printing: "Demo Printing 1",
    language: "English",
    market: "Synthetic Demo Market",
    minimumPlayers: 2,
    maximumPlayers: 6,
    bestPlayers: [4],
    publisherMinimumAge: 6,
    publishedMinimumMinutes: 15,
    maximumListedPlaytimeMinutes: 30,
    adultContent: false,
    vibeScores: { luck: 3.2, strategy: 2, dexterity: 4.8, family: 4.7, party: 3.5, board: 2.8 },
    mechanics: ["dexterity", "balancing"],
    categories: ["family", "fictional"],
    relationship: standalone(),
  },
  {
    id: UUID_IDS.festivalOfTides,
    slug: "festival-of-tides",
    title: "Festival of Tides",
    publisher: "Blue Gull Workshop",
    yearPublished: 2022,
    edition: "First Edition",
    printing: "Demo Printing 1",
    language: "English",
    market: "Synthetic Demo Market",
    minimumPlayers: 2,
    maximumPlayers: 5,
    bestPlayers: [4],
    publisherMinimumAge: 8,
    publishedMinimumMinutes: 35,
    maximumListedPlaytimeMinutes: 60,
    adultContent: false,
    vibeScores: { luck: 2.5, strategy: 3.4, dexterity: 1, family: 3.6, board: 4.1 },
    mechanics: ["tile placement", "route building"],
    categories: ["family", "fictional"],
    relationship: standalone(),
  },
  {
    id: UUID_IDS.boroughsAndBridges,
    slug: "boroughs-and-bridges",
    title: "Boroughs and Bridges",
    publisher: "Copper Heron Games",
    yearPublished: 2021,
    edition: "First Edition",
    printing: "Demo Printing 1",
    language: "English",
    market: "Synthetic Demo Market",
    minimumPlayers: 2,
    maximumPlayers: 4,
    bestPlayers: [3],
    publisherMinimumAge: 6,
    publishedMinimumMinutes: 20,
    maximumListedPlaytimeMinutes: 50,
    adultContent: false,
    vibeScores: { luck: 2.2, strategy: 3.2, dexterity: 1, family: 4, party: 2.2, board: 4.4 },
    mechanics: ["network building", "tile placement"],
    categories: ["family", "fictional"],
    relationship: standalone(),
  },
  {
    id: UUID_IDS.midnightMasquerade,
    slug: "midnight-masquerade",
    title: "Midnight Masquerade",
    publisher: "Lantern Fox Press",
    yearPublished: 2020,
    edition: "First Edition",
    printing: "Demo Printing 1",
    language: "English",
    market: "Synthetic Demo Market",
    minimumPlayers: 3,
    maximumPlayers: 6,
    bestPlayers: [5],
    publisherMinimumAge: 16,
    publishedMinimumMinutes: 45,
    maximumListedPlaytimeMinutes: 75,
    adultContent: true,
    vibeScores: { luck: 3, strategy: 3.8, dexterity: 1, family: 1.5, party: 4.6, board: 1.8 },
    mechanics: ["bluffing", "hidden roles"],
    categories: ["adult", "fictional"],
    relationship: standalone(),
  },
  {
    id: UUID_IDS.skylineFoundryFirst,
    slug: "skyline-foundry-first",
    title: "Skyline Foundry",
    publisher: "Copper Heron Games",
    yearPublished: 2022,
    edition: "First Edition",
    printing: "Demo Printing 1",
    language: "English",
    market: "Synthetic Demo Market",
    minimumPlayers: 2,
    maximumPlayers: 4,
    bestPlayers: [4],
    publisherMinimumAge: 8,
    publishedMinimumMinutes: 30,
    maximumListedPlaytimeMinutes: 55,
    adultContent: false,
    vibeScores: { luck: 2.4, strategy: 4, dexterity: 1, family: 3.4, party: 2.1, board: 4.2 },
    mechanics: ["tile placement", "engine building"],
    categories: ["strategy", "fictional"],
    relationship: standalone(),
  },
  {
    id: UUID_IDS.skylineFoundrySecond,
    slug: "skyline-foundry-second",
    title: "Skyline Foundry",
    publisher: "Copper Heron Games",
    yearPublished: 2025,
    edition: "Second Edition",
    printing: "Demo Printing 1",
    language: "English",
    market: "Synthetic Demo Market",
    minimumPlayers: 2,
    maximumPlayers: 4,
    bestPlayers: [3, 4],
    publisherMinimumAge: 8,
    publishedMinimumMinutes: 25,
    maximumListedPlaytimeMinutes: 60,
    adultContent: false,
    vibeScores: { luck: 2.8, strategy: 4.2, dexterity: 1, family: 3.2, party: 2.4, board: 4.3 },
    mechanics: ["tile placement", "engine building"],
    categories: ["strategy", "fictional"],
    relationship: standalone(),
    editionOf: {
      gamefinderId: UUID_IDS.skylineFoundryFirst,
      title: "Skyline Foundry (First Edition)",
    },
  },
  {
    id: UUID_IDS.windwardKites,
    slug: "windward-kites",
    title: "Cloud Kite Festival: Windward Kites",
    publisher: "Fable Finch Studio",
    yearPublished: 2026,
    edition: "First Edition",
    printing: "Demo Printing 1",
    language: "English",
    market: "Synthetic Demo Market",
    minimumPlayers: 2,
    maximumPlayers: 6,
    bestPlayers: [4],
    publisherMinimumAge: 6,
    publishedMinimumMinutes: 10,
    maximumListedPlaytimeMinutes: 20,
    adultContent: false,
    vibeScores: { luck: 3, strategy: 2.5, dexterity: 4.5, family: 4.4, party: 3, board: 2.6 },
    mechanics: ["dexterity", "balancing"],
    categories: ["expansion", "fictional"],
    relationship: expansionOf(UUID_IDS.cloudKiteFestival, "Cloud Kite Festival"),
  },
  {
    id: UUID_IDS.hollowLanterns,
    slug: "hollow-lanterns",
    title: "Hollow Lanterns",
    publisher: "Lantern Fox Press",
    yearPublished: 2024,
    edition: "First Edition",
    printing: "Demo Printing 1",
    language: "English",
    market: "Synthetic Demo Market",
    minimumPlayers: 2,
    maximumPlayers: 4,
    bestPlayers: [3],
    publisherMinimumAge: null,
    publishedMinimumMinutes: 20,
    maximumListedPlaytimeMinutes: 40,
    adultContent: false,
    vibeScores: { luck: 3, strategy: 3, dexterity: 1, family: 3.2, party: 2, board: 3.5 },
    mechanics: ["set collection"],
    categories: ["fictional"],
    relationship: standalone(),
  },
  {
    id: UUID_IDS.mirrorHarbor,
    slug: "mirror-harbor",
    title: "Mirror Harbor",
    publisher: "Blue Gull Workshop",
    yearPublished: 2024,
    edition: "First Edition",
    printing: "Demo Printing 1",
    language: "English",
    market: "Synthetic Demo Market",
    minimumPlayers: 2,
    maximumPlayers: 4,
    bestPlayers: [3],
    publisherMinimumAge: 8,
    publishedMinimumMinutes: 25,
    maximumListedPlaytimeMinutes: 45,
    adultContent: false,
    vibeScores: { luck: 3.4, strategy: 3.8, dexterity: 1, family: 3.8, party: 2.5, board: 3.7 },
    mechanics: ["area majority"],
    categories: ["fictional"],
    relationship: standalone(),
    identityStatus: "disputed",
  },
  {
    id: UUID_IDS.splitCurrent,
    slug: "split-current",
    title: "Split Current",
    publisher: "Blue Gull Workshop",
    yearPublished: 2023,
    edition: "First Edition",
    printing: "Demo Printing 1",
    language: "English",
    market: "Synthetic Demo Market",
    minimumPlayers: 3,
    maximumPlayers: 2,
    bestPlayers: [],
    publisherMinimumAge: 8,
    publishedMinimumMinutes: 30,
    maximumListedPlaytimeMinutes: 55,
    adultContent: false,
    vibeScores: { luck: 3, strategy: 3.5, dexterity: 1, family: 3.2, party: 2.5, board: 4 },
    mechanics: ["route building"],
    categories: ["fictional"],
    relationship: standalone(),
    identityStatus: "unreviewed",
    conflictingPlayerClaims: { minimum: [2, 3], maximum: [2, 4] },
  },
];

export const SYNTHETIC_RECOMMENDATION_DEFAULT_CONTEXT: WizardContext = {
  players: 4,
  ageBand: "8-10",
  maxTimeMin: 60,
  timeOver60: false,
  vibes: ["family"],
  exactTraits: null,
};

export const SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS: readonly string[] = [
  UUID_IDS.glowOrchard,
  UUID_IDS.cloudKiteFestival,
  UUID_IDS.skylineFoundryFirst,
];

function provenance(providerRecordId: string, fieldName: string): ProviderFieldProvenance {
  return {
    provider: "synthetic",
    providerRecordId,
    fieldName,
    reference: `synthetic-fixture:${providerRecordId}:${fieldName}`,
    url: null,
    observedAt: SYNTHETIC_REVIEW_AT,
  };
}

function claims<T>(
  providerRecordId: string,
  fieldName: string,
  value: T | null,
): ProviderFieldClaim<T>[] {
  const source = provenance(providerRecordId, fieldName);
  return value === null
    ? [{ status: "unknown", value: null, provenance: source }]
    : [{ status: "reported", value, provenance: source }];
}

function candidateFacts(definition: FixtureDefinition): ProviderCandidateFacts {
  const providerRecordId = `fixture-${definition.slug}`;
  const facts: ProviderCandidateFacts = {
    title: claims(providerRecordId, "title", definition.title),
    publisher: claims(providerRecordId, "publisher", definition.publisher),
    yearPublished: claims(providerRecordId, "yearPublished", definition.yearPublished),
    edition: claims(providerRecordId, "edition", definition.edition),
    printing: claims(providerRecordId, "printing", definition.printing),
    language: claims(providerRecordId, "language", definition.language),
    market: claims(providerRecordId, "market", definition.market),
    relationship: claims(providerRecordId, "relationship", definition.relationship),
    playersMinimum: claims(providerRecordId, "playersMinimum", definition.minimumPlayers),
    playersMaximum: claims(providerRecordId, "playersMaximum", definition.maximumPlayers),
    publisherMinimumAge: claims(
      providerRecordId,
      "publisherMinimumAge",
      definition.publisherMinimumAge,
    ),
    publishedPlaytime: claims(providerRecordId, "publishedPlaytime", {
      minimumMinutes: definition.publishedMinimumMinutes,
      maximumMinutes: definition.maximumListedPlaytimeMinutes,
      maximumListedMinutes: definition.maximumListedPlaytimeMinutes,
      basis: "published-range",
    }),
    mechanics: claims(providerRecordId, "mechanics", definition.mechanics),
    categories: claims(providerRecordId, "categories", definition.categories),
  };
  if (definition.conflictingPlayerClaims) {
    facts.playersMinimum = definition.conflictingPlayerClaims.minimum.map((value) => ({
      status: "reported",
      value,
      provenance: provenance(providerRecordId, "playersMinimum"),
    }));
    facts.playersMaximum = definition.conflictingPlayerClaims.maximum.map((value) => ({
      status: "reported",
      value,
      provenance: provenance(providerRecordId, "playersMaximum"),
    }));
  }
  return facts;
}

function reviewedFact<T>(
  fact: CandidateFact<T>,
  providerRecordId: string,
  fieldName: keyof CandidateFacts,
  value: T | null,
): CandidateFact<T> {
  const status = value === null ? "missing" : "verified";
  const evidence = value === null ? [] : [provenance(providerRecordId, fieldName)];
  return {
    ...fact,
    reviewed: {
      status,
      value,
      evidence,
      reviewerId: value === null ? null : SIMULATED_REVIEWER,
      reviewedAt: value === null ? null : SYNTHETIC_REVIEW_AT,
      approverId: value === null ? null : SIMULATED_OWNER,
      approvedAt: value === null ? null : SYNTHETIC_REVIEW_AT,
    },
  };
}

function createCandidate(definition: FixtureDefinition): SyntheticFixture {
  const providerRecordId = `fixture-${definition.slug}`;
  const providerCandidate: ProviderGameCandidate = {
    provider: "synthetic",
    providerRecordId,
    providerRecordReference: `synthetic-fixture://${definition.slug}`,
    externalIds: [],
    facts: candidateFacts(definition),
    providerRatings: [],
  };
  const staged = stageProviderCandidate(providerCandidate, SYNTHETIC_REVIEW_AT);
  const facts: CandidateFacts = {
    title: reviewedFact(staged.facts.title, providerRecordId, "title", definition.title),
    publisher: reviewedFact(
      staged.facts.publisher,
      providerRecordId,
      "publisher",
      definition.publisher,
    ),
    yearPublished: reviewedFact(
      staged.facts.yearPublished,
      providerRecordId,
      "yearPublished",
      definition.yearPublished,
    ),
    edition: reviewedFact(staged.facts.edition, providerRecordId, "edition", definition.edition),
    printing: reviewedFact(
      staged.facts.printing,
      providerRecordId,
      "printing",
      definition.printing,
    ),
    language: reviewedFact(
      staged.facts.language,
      providerRecordId,
      "language",
      definition.language,
    ),
    market: reviewedFact(staged.facts.market, providerRecordId, "market", definition.market),
    relationship: reviewedFact(
      staged.facts.relationship,
      providerRecordId,
      "relationship",
      definition.relationship,
    ),
    playersMinimum: reviewedFact(
      staged.facts.playersMinimum,
      providerRecordId,
      "playersMinimum",
      definition.minimumPlayers,
    ),
    playersMaximum: reviewedFact(
      staged.facts.playersMaximum,
      providerRecordId,
      "playersMaximum",
      definition.maximumPlayers,
    ),
    publisherMinimumAge: reviewedFact(
      staged.facts.publisherMinimumAge,
      providerRecordId,
      "publisherMinimumAge",
      definition.publisherMinimumAge,
    ),
    publishedPlaytime: reviewedFact(
      staged.facts.publishedPlaytime,
      providerRecordId,
      "publishedPlaytime",
      {
        minimumMinutes: definition.publishedMinimumMinutes,
        maximumMinutes: definition.maximumListedPlaytimeMinutes,
        maximumListedMinutes: definition.maximumListedPlaytimeMinutes,
        basis: "published-range",
      },
    ),
    mechanics: reviewedFact(
      staged.facts.mechanics,
      providerRecordId,
      "mechanics",
      definition.mechanics,
    ),
    categories: reviewedFact(
      staged.facts.categories,
      providerRecordId,
      "categories",
      definition.categories,
    ),
  };
  const identityStatus = definition.identityStatus ?? "verified";
  const candidate: StagedCatalogCandidate = {
    ...staged,
    facts,
    identityReview: {
      status:
        identityStatus === "verified"
          ? "verified"
          : identityStatus === "disputed"
            ? "disputed"
            : "unreviewed",
      gamefinderId: identityStatus === "unreviewed" ? null : definition.id,
      evidence: identityStatus === "unreviewed" ? [] : [provenance(providerRecordId, "identity")],
    },
    metadataRights: {
      status: "cleared",
      commercialUse: "allowed",
      storage: "allowed",
      licenseReference: `synthetic-fixture-metadata-permission:${definition.slug}`,
      attribution: "Synthetic fixture; no real publisher or rights holder.",
      expiresAt: null,
    },
    review: {
      humanReview: {
        status: "approved",
        reviewerId: SIMULATED_REVIEWER,
        decidedAt: SYNTHETIC_REVIEW_AT,
      },
      ownerApproval: {
        status: "approved",
        reviewerId: SIMULATED_OWNER,
        decidedAt: SYNTHETIC_REVIEW_AT,
      },
    },
  };
  return {
    fixtureOnly: true,
    simulation: "test-data-only",
    definition,
    candidate,
    adultContentReview: {
      status: "verified",
      value: definition.adultContent,
      simulation: "test-data-only",
      evidence: provenance(providerRecordId, "adultContent"),
      reviewerId: SIMULATED_REVIEWER,
      reviewedAt: SYNTHETIC_REVIEW_AT,
      approverId: SIMULATED_OWNER,
      approvedAt: SYNTHETIC_REVIEW_AT,
    },
    editionRelationshipReview: definition.editionOf
      ? {
          status: "verified",
          simulation: "test-data-only",
          evidence: provenance(providerRecordId, "editionRelationship"),
          reviewerId: SIMULATED_REVIEWER,
          reviewedAt: SYNTHETIC_REVIEW_AT,
          approverId: SIMULATED_OWNER,
          approvedAt: SYNTHETIC_REVIEW_AT,
        }
      : null,
  };
}

const FIXTURES: readonly SyntheticFixture[] = Object.freeze(DEFINITIONS.map(createCandidate));
const CANDIDATES = FIXTURES.map((fixture) => fixture.candidate);
const DEFINITIONS_BY_ID = new Map(DEFINITIONS.map((definition) => [definition.id, definition]));

function known(value: string): ScopedValue {
  return { status: "known", value };
}

function editionScope(definition: FixtureDefinition): ArtworkEditionScope {
  return {
    edition: known(definition.edition),
    printing: known(definition.printing),
    language: known(definition.language),
    market: known(definition.market),
  };
}

function artworkCandidate(
  definition: FixtureDefinition,
  options: {
    id: string;
    commercialDisplay: ArtworkCandidate["rights"]["commercialDisplay"];
    expiresAt?: string | null;
    revokedAt?: string | null;
    availability?: ArtworkCandidate["image"]["availability"];
  },
): ArtworkCandidate {
  const fixture = FIXTURES.find((item) => item.definition.id === definition.id);
  if (!fixture) throw new Error("Synthetic artwork must match a catalog fixture.");
  return {
    id: options.id,
    game: {
      stagingId: fixture.candidate.stagingId,
      gamefinderId: definition.id,
    },
    scope: editionScope(definition),
    source: {
      provider: "synthetic",
      originalImageReference: `synthetic-asset://${definition.slug}/${options.id}.svg`,
      provenance: provenance(fixture.candidate.providerRecordId, "cover-artwork"),
    },
    rights: {
      rightsHolder: "Fictional fixture studio",
      permissionReference: `synthetic-fixture-artwork-permission:${options.id}`,
      commercialDisplay: options.commercialDisplay,
      cachingHosting: "allowed",
      resizingTransformation: "allowed",
      attribution: { required: false, text: null },
      expiresAt: options.expiresAt ?? null,
      revokedAt: options.revokedAt ?? null,
    },
    review: {
      verification: "verified",
      approval: "approved",
      reviewerId: SIMULATED_REVIEWER,
      reviewedAt: SYNTHETIC_REVIEW_AT,
    },
    image: {
      availability: options.availability ?? "available",
      width: 800,
      height: 1100,
      format: "svg",
      fileSizeBytes: 1200,
      quality: "standard",
    },
  };
}

const ARTWORK_FIXTURES: readonly ArtworkCandidate[] = [
  artworkCandidate(DEFINITIONS[0], { id: "art-glow-orchard-first", commercialDisplay: "allowed" }),
  artworkCandidate(DEFINITIONS[1], {
    id: "art-clockwork-estuary-first",
    commercialDisplay: "allowed",
  }),
  artworkCandidate(DEFINITIONS[2], {
    id: "art-cloud-kite-first",
    commercialDisplay: "allowed",
  }),
  artworkCandidate(DEFINITIONS[3], {
    id: "art-festival-tides-first",
    commercialDisplay: "allowed",
  }),
  artworkCandidate(DEFINITIONS[4], {
    id: "art-boroughs-first",
    commercialDisplay: "allowed",
  }),
  artworkCandidate(DEFINITIONS[6], {
    id: "art-skyline-first-edition",
    commercialDisplay: "allowed",
  }),
  artworkCandidate(DEFINITIONS[7], {
    id: "art-skyline-second-edition-unlicensed",
    commercialDisplay: "denied",
  }),
  artworkCandidate(DEFINITIONS[7], {
    id: "art-skyline-second-edition-expired",
    commercialDisplay: "allowed",
    expiresAt: "2025-01-01T00:00:00.000Z",
  }),
  artworkCandidate(DEFINITIONS[7], {
    id: "art-skyline-second-edition-revoked",
    commercialDisplay: "allowed",
    revokedAt: "2025-12-01T00:00:00.000Z",
  }),
  artworkCandidate(DEFINITIONS[8], {
    id: "art-windward-kites-first",
    commercialDisplay: "allowed",
  }),
];

function isSyntheticFixture(fixture: SyntheticFixture): boolean {
  return (
    fixture.fixtureOnly === true &&
    fixture.simulation === "test-data-only" &&
    fixture.candidate.provider === "synthetic" &&
    fixture.candidate.providerRecordId.startsWith("fixture-") &&
    fixture.candidate.providerRecordReference.startsWith("synthetic-fixture://") &&
    fixture.candidate.metadataRights.licenseReference?.startsWith("synthetic-fixture-") === true &&
    fixture.candidate.review.humanReview.reviewerId === SIMULATED_REVIEWER &&
    fixture.candidate.review.ownerApproval.reviewerId === SIMULATED_OWNER
  );
}

function publicationReasons(
  fixture: SyntheticFixture,
  allCandidates: readonly StagedCatalogCandidate[],
): string[] {
  const reasons = new Set<string>();
  const candidate = fixture.candidate;
  if (!isSyntheticFixture(fixture)) reasons.add("not-an-allowlisted-synthetic-fixture");
  if (
    candidate.identityReview.status !== "verified" ||
    !candidate.identityReview.gamefinderId ||
    !candidate.identityReview.evidence.some(
      (source) =>
        source.provider === "synthetic" &&
        source.fieldName === "identity" &&
        source.reference?.startsWith("synthetic-fixture:") === true,
    )
  ) {
    reasons.add("identity-not-verified-in-fixture");
  }
  if (
    fixture.adultContentReview.status !== "verified" ||
    fixture.adultContentReview.simulation !== "test-data-only" ||
    typeof fixture.adultContentReview.value !== "boolean" ||
    fixture.adultContentReview.evidence.provider !== "synthetic" ||
    fixture.adultContentReview.evidence.fieldName !== "adultContent" ||
    !fixture.adultContentReview.evidence.reference?.startsWith("synthetic-fixture:") ||
    fixture.adultContentReview.reviewerId !== SIMULATED_REVIEWER ||
    fixture.adultContentReview.approverId !== SIMULATED_OWNER ||
    !Number.isFinite(Date.parse(fixture.adultContentReview.reviewedAt)) ||
    !Number.isFinite(Date.parse(fixture.adultContentReview.approvedAt))
  ) {
    reasons.add("adult-content-evidence-missing");
  }
  const relationship = candidate.facts.relationship;
  if (
    relationship.reviewed.status !== "verified" ||
    relationship.reviewed.value === null ||
    relationship.reviewed.evidence.length !== 1 ||
    relationship.reviewed.evidence[0].provider !== "synthetic" ||
    relationship.reviewed.evidence[0].fieldName !== "relationship" ||
    !relationship.reviewed.evidence[0].reference?.startsWith("synthetic-fixture:")
  ) {
    reasons.add("relationship-not-verified-in-fixture");
  } else if (relationship.reviewed.value.kind !== "standalone") {
    const targetId = relationship.reviewed.value.relatedGame?.gamefinderId;
    const target = targetId ? FIXTURES.find((item) => item.definition.id === targetId) : undefined;
    if (!target || target.candidate.identityReview.status !== "verified") {
      reasons.add("relationship-target-unresolved");
    }
  }
  if (fixture.definition.editionOf) {
    const editionReview = fixture.editionRelationshipReview;
    const target = FIXTURES.find(
      (item) => item.definition.id === fixture.definition.editionOf?.gamefinderId,
    );
    if (
      !editionReview ||
      editionReview.status !== "verified" ||
      editionReview.simulation !== "test-data-only" ||
      editionReview.evidence.provider !== "synthetic" ||
      editionReview.evidence.fieldName !== "editionRelationship" ||
      !editionReview.evidence.reference?.startsWith("synthetic-fixture:") ||
      editionReview.reviewerId !== SIMULATED_REVIEWER ||
      editionReview.approverId !== SIMULATED_OWNER ||
      !Number.isFinite(Date.parse(editionReview.reviewedAt)) ||
      !Number.isFinite(Date.parse(editionReview.approvedAt)) ||
      !target ||
      target.candidate.identityReview.status !== "verified"
    ) {
      reasons.add("edition-relationship-not-verified-in-fixture");
    }
  }
  const validation = validateStagedCandidate(candidate, allCandidates, SYNTHETIC_REVIEW_AT);
  for (const reason of validation.reasons) reasons.add(reason);
  return [...reasons].sort();
}

function toCatalogRecord(fixture: SyntheticFixture): CatalogGameRecord {
  const definition = fixture.definition;
  const candidate = fixture.candidate;
  const relationship = candidate.facts.relationship.reviewed.value;
  const relationships: CatalogGameRecord["relationships"] =
    !relationship || (relationship.kind === "standalone" && !relationship.relatedGame)
      ? []
      : relationship
        ? [
            {
              relation: relationship.kind === "standalone" ? "edition" : relationship.kind,
              catalogGameId: relationship.relatedGame?.gamefinderId ?? null,
              externalIds: relationship.relatedGame?.externalId
                ? [relationship.relatedGame.externalId]
                : [],
              title: relationship.relatedGame?.title ?? definition.title,
            },
          ]
        : [];
  return {
    id: definition.id,
    title: candidate.facts.title.reviewed.value ?? definition.title,
    alternateTitles: [],
    publisher: candidate.facts.publisher.reviewed.value,
    yearPublished: candidate.facts.yearPublished.reviewed.value,
    edition: candidate.facts.edition.reviewed.value,
    relationships: definition.editionOf
      ? [
          ...relationships,
          {
            relation: "edition",
            catalogGameId: definition.editionOf.gamefinderId,
            externalIds: [],
            title: definition.editionOf.title,
          },
        ]
      : relationships,
    externalIds: [],
    players: {
      minimum: candidate.facts.playersMinimum.reviewed.value,
      maximum: candidate.facts.playersMaximum.reviewed.value,
      best: definition.bestPlayers,
    },
    publisherMinimumAge: candidate.facts.publisherMinimumAge.reviewed.value,
    maximumListedPlaytimeMinutes:
      candidate.facts.publishedPlaytime.reviewed.value?.maximumListedMinutes ?? null,
    adultContent: fixture.adultContentReview.value,
    bggRating: null,
    categories: definition.categories,
    mechanics: definition.mechanics,
    rubric: {},
    vibeScores: { ...definition.vibeScores },
    sources: [
      {
        field: "fixture",
        provider: "synthetic",
        sourceClass: "mock",
        verification: "verified",
        lastVerified: SYNTHETIC_REVIEW_AT,
      },
    ],
    missingFields: definition.publisherMinimumAge === null ? ["publisherMinimumAge"] : [],
    disputedFields: definition.conflictingPlayerClaims ? ["players"] : [],
    origin: "mock",
  };
}

function requestedVibes(context: WizardContext): VibeId[] {
  return [
    ...new Set([
      ...context.vibes,
      ...Object.keys(context.exactTraits ?? {}).filter(
        (vibe): vibe is VibeId => VIBE_META[vibe as VibeId] !== undefined,
      ),
    ]),
  ];
}

function hardFilterReasons(game: CatalogGameRecord, context: WizardContext): string[] {
  const reasons: string[] = [];
  if (context.players !== null) {
    const incompatible =
      game.players.minimum === null ||
      game.players.maximum === null ||
      (context.players >= MAX_PLAYER_COUNT
        ? game.players.maximum < MAX_PLAYER_COUNT || game.players.minimum > MAX_PLAYER_COUNT
        : context.players < game.players.minimum || context.players > game.players.maximum);
    if (incompatible) {
      reasons.push("player-count");
    }
  }
  if (context.ageBand) {
    const band = AGE_BANDS.find((item) => item.id === context.ageBand);
    if (
      context.ageBand !== "adults" &&
      (game.publisherMinimumAge === null || game.publisherMinimumAge > (band?.youngestAge ?? -1))
    ) {
      reasons.push("publisher-minimum-age");
    }
  }
  if (game.adultContent === true && context.ageBand !== "adults") {
    reasons.push("adult-content");
  }
  if (context.timeOver60) {
    if (game.maximumListedPlaytimeMinutes === null || game.maximumListedPlaytimeMinutes <= 60) {
      reasons.push("maximum-listed-playtime");
    }
  } else if (
    context.maxTimeMin !== null &&
    (game.maximumListedPlaytimeMinutes === null ||
      game.maximumListedPlaytimeMinutes > context.maxTimeMin)
  ) {
    reasons.push("maximum-listed-playtime");
  }
  if (
    requestedVibes(context).some(
      (vibe) =>
        typeof game.vibeScores[vibe] !== "number" || !Number.isFinite(game.vibeScores[vibe]),
    )
  ) {
    reasons.push("requested-vibe-score-missing");
  }
  return reasons;
}

function artworkView(
  fixture: SyntheticFixture,
  catalogPublished: boolean,
  now: string,
): PrototypeArtworkView {
  if (!catalogPublished) {
    return {
      status: "fallback",
      placeholder: "original-gamefinder-placeholder",
      reason: "catalog-entry-not-published",
      authenticity: "not-an-authentic-game-cover",
    };
  }
  const identity: ArtworkGameIdentity = {
    stagingId: fixture.candidate.stagingId,
    gamefinderId: fixture.definition.id,
  };
  const readiness = artworkPublicationReadiness(
    identity,
    editionScope(fixture.definition),
    ARTWORK_FIXTURES.filter((candidate) => candidate.game.gamefinderId === fixture.definition.id),
    now,
  );
  if (readiness.selection.status !== "selected") {
    return {
      status: "fallback",
      placeholder: "original-gamefinder-placeholder",
      reason: readiness.selection.status,
      authenticity: "not-an-authentic-game-cover",
    };
  }
  return {
    status: "selected",
    authenticity: "synthetic-test-artwork-not-commercial",
    reference: readiness.selection.artwork.source.originalImageReference ?? "",
    cachingPermitted: readiness.selection.cachingPermitted,
    transformationPermitted: readiness.selection.transformationPermitted,
  };
}

const LEGACY_ALIAS_PROPOSALS = [
  { key: "demo-key-glow-orchard", id: UUID_IDS.glowOrchard, status: "verified" },
  { key: "41114", id: UUID_IDS.glowOrchard, status: "disputed" },
  { key: "41114", id: UUID_IDS.mirrorHarbor, status: "disputed" },
  { key: "demo-key-unverified", id: UUID_IDS.clockworkEstuary, status: "unverified" },
] as const;

function resolveSyntheticLegacyReference(key: string): LegacyCompatibilityResult {
  const proposals = LEGACY_ALIAS_PROPOSALS.filter((proposal) => proposal.key === key);
  const candidateGamefinderIds = [...new Set(proposals.map((proposal) => proposal.id))].sort();
  if (candidateGamefinderIds.length > 1) {
    return {
      status: "ambiguous",
      namespace: "synthetic-legacy",
      legacyKey: key,
      candidateGamefinderIds,
    };
  }
  if (proposals.length === 0) {
    return {
      status: "orphaned",
      namespace: "synthetic-legacy",
      legacyKey: key,
      candidateGamefinderIds: [],
    };
  }
  if (proposals.some((proposal) => proposal.status !== "verified")) {
    return {
      status: "unverified",
      namespace: "synthetic-legacy",
      legacyKey: key,
      candidateGamefinderIds,
    };
  }
  return {
    status: "resolved",
    namespace: "synthetic-legacy",
    legacyKey: key,
    gamefinderId: candidateGamefinderIds[0],
  };
}

function legacyCompatibilityFor(
  gamefinderId: string,
): RecommendationPreviewEntry["legacyCompatibility"] {
  const verifiedKeys = [
    ...new Set(
      LEGACY_ALIAS_PROPOSALS.filter(
        (proposal) => proposal.id === gamefinderId && proposal.status === "verified",
      ).map((proposal) => proposal.key),
    ),
  ];
  return verifiedKeys.length === 1
    ? {
        status: "verified-alias",
        namespace: "synthetic-legacy",
        key: verifiedKeys[0],
      }
    : { status: "no-verified-alias", namespace: "synthetic-legacy" };
}

const LEGACY_COMPATIBILITY_REFERENCES = [
  "demo-key-glow-orchard",
  "41114",
  "demo-key-unverified",
  "demo-orphan-key",
] as const;

function compareEntries(left: RecommendationPreviewEntry, right: RecommendationPreviewEntry) {
  return (
    (right.score ?? 0) - (left.score ?? 0) ||
    left.title.localeCompare(right.title) ||
    left.gamefinderId.localeCompare(right.gamefinderId)
  );
}

export function createSyntheticCatalogRecommendationPreview(
  context: WizardContext = SYNTHETIC_RECOMMENDATION_DEFAULT_CONTEXT,
  ownedGamefinderIds: readonly string[] = SYNTHETIC_RECOMMENDATION_DEFAULT_OWNED_IDS,
  excludedGamefinderIds: readonly string[] = [],
  now = SYNTHETIC_REVIEW_AT,
): SyntheticCatalogRecommendationPreview {
  if (!Number.isFinite(Date.parse(now))) {
    throw new Error("A valid fixed timestamp is required for a deterministic preview.");
  }
  const owned = new Set(ownedGamefinderIds);
  const excluded = new Set(excludedGamefinderIds);
  const records = new Map<string, CatalogGameRecord>();
  const entries = FIXTURES.map((fixture) => {
    const validationReasons = publicationReasons(fixture, CANDIDATES);
    const catalogPublished = validationReasons.length === 0;
    const record = catalogPublished ? toCatalogRecord(fixture) : null;
    if (record) records.set(record.id, record);
    const reasons = [...validationReasons];
    if (catalogPublished && record) {
      if (record.relationships.some((relationship) => relationship.relation === "expansion")) {
        reasons.push("expansion-not-standalone");
      }
      reasons.push(...hardFilterReasons(record, context));
      if (!catalogHardEligible(record, context)) {
        if (!reasons.length) reasons.push("existing-catalog-hard-filter");
      }
    }
    const recommendationEligible = catalogPublished && reasons.length === 0;
    const isOwned = owned.has(fixture.definition.id);
    const score =
      recommendationEligible && record
        ? catalogRecommendationScore(record, context, isOwned)
        : null;
    const vibeExplanations = requestedVibes(context).map((vibe) => {
      const value = fixture.definition.vibeScores[vibe];
      return `${VIBE_META[vibe].label}: ${value === undefined ? "unrated" : `${value.toFixed(1)}/5`}`;
    });
    const matchExplanation =
      recommendationEligible && record
        ? [
            `Fits ${record.players.minimum}–${record.players.maximum} players.`,
            `Publisher minimum age ${record.publisherMinimumAge}+; maximum listed time ${record.maximumListedPlaytimeMinutes} minutes.`,
            ...vibeExplanations,
            `Score uses GameFinder catalog scoring; ${isOwned ? "owned" : "unowned"} bonus ${isOwned ? "applied" : "not applied"}.`,
            "Synthetic fixture result; no production identity or approval.",
          ]
        : reasons.map((reason) => `Not recommended: ${reason}.`);
    return {
      gamefinderId: fixture.definition.id,
      legacyCompatibility: legacyCompatibilityFor(fixture.definition.id),
      title: fixture.definition.title,
      edition: fixture.definition.edition,
      relationship: fixture.definition.editionOf
        ? {
            kind: "edition",
            targetGamefinderId: fixture.definition.editionOf.gamefinderId,
            targetTitle: fixture.definition.editionOf.title,
          }
        : fixture.definition.relationship.relatedGame === null
          ? null
          : {
              kind:
                fixture.definition.relationship.kind === "standalone"
                  ? "edition"
                  : fixture.definition.relationship.kind,
              targetGamefinderId: fixture.definition.relationship.relatedGame.gamefinderId,
              targetTitle: fixture.definition.relationship.relatedGame.title,
            },
      ownership: isOwned ? "owned" : "unowned",
      players: {
        minimum: fixture.definition.minimumPlayers,
        maximum: fixture.definition.maximumPlayers,
      },
      publisherMinimumAge: fixture.definition.publisherMinimumAge,
      maximumListedPlaytimeMinutes: fixture.definition.maximumListedPlaytimeMinutes,
      adultContent: fixture.definition.adultContent,
      vibeScores: { ...fixture.definition.vibeScores },
      score,
      matchExplanation,
      artwork: artworkView(fixture, catalogPublished, now),
      catalogPublished,
      recommendationEligible,
      rejectionReasons: [...new Set(reasons)].sort(),
    } satisfies RecommendationPreviewEntry;
  });
  const recommendationEntries = entries.filter((entry) => entry.recommendationEligible);
  const ownedEligible = recommendationEntries
    .filter((entry) => entry.ownership === "owned")
    .sort(compareEntries);
  const unownedEligible = recommendationEntries
    .filter((entry) => entry.ownership === "unowned")
    .sort(compareEntries);
  const ownedFresh = ownedEligible.filter((entry) => !excluded.has(entry.gamefinderId));
  const unownedFresh = unownedEligible.filter((entry) => !excluded.has(entry.gamefinderId));
  const rejectedForHardFilters = recommendationEntries.filter(
    (entry) => entry.score === null || records.get(entry.gamefinderId) === undefined,
  );
  if (rejectedForHardFilters.length) {
    throw new Error("Eligible synthetic recommendation is missing a validated catalog record.");
  }
  return {
    simulationOnly: true,
    summary: {
      sourceCandidates: FIXTURES.length,
      catalogPublished: FIXTURES.filter(
        (fixture) => publicationReasons(fixture, CANDIDATES).length === 0,
      ).length,
      recommendationEligible: recommendationEntries.length,
      ownedEligible: ownedEligible.length,
      unownedEligible: unownedEligible.length,
      excludedGamefinderIds: [...excluded].sort(),
      exhaustedOwned: ownedEligible.length > 0 && ownedFresh.length === 0,
      exhaustedUnowned: unownedEligible.length > 0 && unownedFresh.length === 0,
    },
    entries,
    ownedTop: ownedFresh.slice(0, 3),
    unownedTop: unownedFresh.slice(0, 3),
    compatibility: {
      references: LEGACY_COMPATIBILITY_REFERENCES.map(resolveSyntheticLegacyReference),
      customGame: {
        id: "gfc_synthetic_owner_game_0001",
        ownerScope: "synthetic-owner-only",
        resolvedAsGlobalGame: false,
      },
    },
  };
}

export function selectSyntheticFixtureArtwork(
  gamefinderId: string,
  scope: ArtworkEditionScope,
  now = SYNTHETIC_REVIEW_AT,
): ArtworkSelection {
  const fixture = FIXTURES.find((item) => item.definition.id === gamefinderId);
  if (!fixture) {
    return {
      status: "identity-mismatch",
      artwork: null,
      cachingPermitted: false,
      transformationPermitted: false,
    };
  }
  return selectApprovedArtwork(
    { stagingId: fixture.candidate.stagingId, gamefinderId },
    scope,
    ARTWORK_FIXTURES.filter((candidate) => candidate.game.gamefinderId === gamefinderId),
    now,
  );
}

export function syntheticFixtureIdentityIds(): readonly string[] {
  return DEFINITIONS.map(({ id }) => id);
}

export function syntheticFixtureDefinition(id: string): Readonly<FixtureDefinition> | undefined {
  return DEFINITIONS_BY_ID.get(id);
}
