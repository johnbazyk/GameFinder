import {
  CATALOG_PROVIDER_IDS,
  CatalogProviderError,
  type CatalogFactStatus,
  type CatalogProviderId,
  type ExternalGameId,
} from "./catalog-foundation";

export type ProviderFieldProvenance = {
  provider: CatalogProviderId;
  providerRecordId: string;
  fieldName: string;
  reference: string | null;
  url: string | null;
  observedAt: string;
};

export type ProviderFieldClaim<T> =
  | { status: "reported"; value: T; provenance: ProviderFieldProvenance }
  | { status: "unknown"; value: null; provenance: ProviderFieldProvenance };

export type FactReview<T> = {
  status: CatalogFactStatus;
  value: T | null;
  evidence: ProviderFieldProvenance[];
  reviewerId: string | null;
  reviewedAt: string | null;
  approverId: string | null;
  approvedAt: string | null;
};

export type CandidateFact<T> = {
  claims: ProviderFieldClaim<T>[];
  reviewed: FactReview<T>;
};

export type CandidateRelationship = {
  kind: "base-game" | "expansion" | "standalone";
  relatedGame: {
    externalId: ExternalGameId | null;
    gamefinderId: string | null;
    title: string;
  } | null;
};

export type PublishedPlaytime = {
  minimumMinutes: number | null;
  maximumMinutes: number | null;
  maximumListedMinutes: number | null;
  basis: "published-range" | "explicit-upper-bound" | "advertised-duration" | "unknown";
};

export type CandidateFacts = {
  title: CandidateFact<string>;
  publisher: CandidateFact<string>;
  yearPublished: CandidateFact<number>;
  edition: CandidateFact<string>;
  printing: CandidateFact<string>;
  language: CandidateFact<string>;
  market: CandidateFact<string>;
  relationship: CandidateFact<CandidateRelationship>;
  playersMinimum: CandidateFact<number>;
  playersMaximum: CandidateFact<number>;
  publisherMinimumAge: CandidateFact<number>;
  publishedPlaytime: CandidateFact<PublishedPlaytime>;
  mechanics: CandidateFact<string[]>;
  categories: CandidateFact<string[]>;
};

type CandidateFactValue<T> = T extends CandidateFact<infer Value> ? Value : never;

export type ProviderCandidateFacts = {
  [Field in keyof CandidateFacts]: ProviderFieldClaim<CandidateFactValue<CandidateFacts[Field]>>[];
};

export type ReviewDecision = {
  status: "pending" | "approved" | "rejected";
  reviewerId: string | null;
  decidedAt: string | null;
};

export type MetadataRights = {
  status: "unknown" | "pending" | "cleared" | "restricted" | "revoked";
  commercialUse: "unknown" | "allowed" | "denied" | "revoked";
  storage: "unknown" | "allowed" | "denied" | "revoked";
  licenseReference: string | null;
  attribution: string | null;
  expiresAt: string | null;
};

export type ProviderRating = {
  provider: CatalogProviderId;
  score: number;
  scaleMinimum: number;
  scaleMaximum: number;
  votes: number | null;
  provenance: ProviderFieldProvenance;
};

export type ProviderGameCandidate = {
  provider: CatalogProviderId;
  providerRecordId: string;
  providerRecordReference: string;
  externalIds: ExternalGameId[];
  facts: ProviderCandidateFacts;
  providerRatings: ProviderRating[];
};

export type StagedCatalogCandidate = Omit<ProviderGameCandidate, "facts"> & {
  facts: CandidateFacts;
  metadataRights: MetadataRights;
  identityReview: {
    status: "unreviewed" | "verified" | "disputed" | "mismatch";
    gamefinderId: string | null;
    evidence: ProviderFieldProvenance[];
  };
  review: {
    humanReview: ReviewDecision;
    ownerApproval: ReviewDecision;
  };
  stagingId: string;
  stageStatus: "staged";
  timestamps: { importedAt: string; refreshedAt: string | null };
  history: {
    action: "import" | "refresh";
    at: string;
    provider: CatalogProviderId;
    providerRecordReference: string;
  }[];
};

export type CatalogIngestionProvider = {
  id: CatalogProviderId;
  searchByTitle(title: string, limit?: number): Promise<readonly ProviderGameCandidate[]>;
  retrieveByExternalId(externalId: ExternalGameId): Promise<ProviderGameCandidate>;
};

function stageFact<T>(claims: ProviderFieldClaim<T>[]): CandidateFact<T> {
  const reported = claims.some((claim) => claim.status === "reported");
  return {
    claims: [...claims],
    reviewed: {
      status: reported ? "unverified" : "missing",
      value: null,
      evidence: [],
      reviewerId: null,
      reviewedAt: null,
      approverId: null,
      approvedAt: null,
    },
  };
}

function stageFacts(facts: ProviderCandidateFacts): CandidateFacts {
  return {
    title: stageFact(facts.title),
    publisher: stageFact(facts.publisher),
    yearPublished: stageFact(facts.yearPublished),
    edition: stageFact(facts.edition),
    printing: stageFact(facts.printing),
    language: stageFact(facts.language),
    market: stageFact(facts.market),
    relationship: stageFact(facts.relationship),
    playersMinimum: stageFact(facts.playersMinimum),
    playersMaximum: stageFact(facts.playersMaximum),
    publisherMinimumAge: stageFact(facts.publisherMinimumAge),
    publishedPlaytime: stageFact(facts.publishedPlaytime),
    mechanics: stageFact(facts.mechanics),
    categories: stageFact(facts.categories),
  };
}

export function stageProviderCandidate(
  candidate: ProviderGameCandidate,
  importedAt: string,
): StagedCatalogCandidate {
  if (!Number.isFinite(Date.parse(importedAt))) {
    throw new CatalogProviderError("invalid-request", "A valid import timestamp is required.");
  }
  if (
    !CATALOG_PROVIDER_IDS.includes(candidate.provider) ||
    !candidate.providerRecordId.trim() ||
    !candidate.providerRecordReference.trim()
  ) {
    throw new CatalogProviderError("invalid-response", "A provider record reference is required.");
  }
  return {
    ...candidate,
    facts: stageFacts(candidate.facts),
    metadataRights: {
      status: "unknown",
      commercialUse: "unknown",
      storage: "unknown",
      licenseReference: null,
      attribution: null,
      expiresAt: null,
    },
    identityReview: { status: "unreviewed", gamefinderId: null, evidence: [] },
    review: {
      humanReview: { status: "pending", reviewerId: null, decidedAt: null },
      ownerApproval: { status: "pending", reviewerId: null, decidedAt: null },
    },
    stagingId: `stage:${candidate.provider}:${encodeURIComponent(candidate.providerRecordId)}`,
    stageStatus: "staged",
    timestamps: { importedAt, refreshedAt: null },
    history: [
      {
        action: "import",
        at: importedAt,
        provider: candidate.provider,
        providerRecordReference: candidate.providerRecordReference,
      },
    ],
  };
}

export function refreshStagedCandidate(
  current: StagedCatalogCandidate,
  refreshed: ProviderGameCandidate,
  refreshedAt: string,
): StagedCatalogCandidate {
  if (!Number.isFinite(Date.parse(refreshedAt))) {
    throw new CatalogProviderError("invalid-request", "A valid refresh timestamp is required.");
  }
  if (
    refreshed.provider !== current.provider ||
    refreshed.providerRecordId !== current.providerRecordId
  ) {
    throw new CatalogProviderError(
      "invalid-request",
      "A refresh must refer to the same provider record.",
    );
  }
  const updated = stageProviderCandidate(refreshed, current.timestamps.importedAt);
  return {
    ...updated,
    stagingId: current.stagingId,
    timestamps: { importedAt: current.timestamps.importedAt, refreshedAt },
    identityReview: {
      status: "unreviewed",
      gamefinderId: current.identityReview.gamefinderId,
      evidence: [],
    },
    history: [
      ...current.history,
      {
        action: "refresh",
        at: refreshedAt,
        provider: refreshed.provider,
        providerRecordReference: refreshed.providerRecordReference,
      },
    ],
  };
}

export type CandidateValidationReason =
  | "identity-unverified"
  | "identity-disputed"
  | "identity-mismatch"
  | "permanent-identity-unassigned"
  | "invalid-permanent-identity"
  | "duplicate-gamefinder-id"
  | "duplicate-external-identifier"
  | "conflicting-provider-claims"
  | "invalid-provider-claim"
  | "contradictory-player-counts"
  | "invalid-required-fact"
  | "required-fact-not-verified"
  | "required-fact-evidence-missing"
  | "metadata-rights-unresolved"
  | "metadata-commercial-use-not-cleared"
  | "metadata-storage-not-cleared"
  | "metadata-rights-expired"
  | "human-review-pending"
  | "owner-approval-pending"
  | "human-review-rejected"
  | "owner-approval-rejected";

export type CandidateValidation = {
  status: "quarantined" | "awaiting-approval" | "metadata-validated";
  reasons: CandidateValidationReason[];
};

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hasConflictingClaims(fact: CandidateFact<unknown>): boolean {
  const reported = fact.claims.flatMap((claim) =>
    claim.status === "reported" ? [stableSerialize(claim.value)] : [],
  );
  return new Set(reported).size > 1;
}

function validInteger(value: number | null, minimum: number, maximum: number): value is number {
  return value !== null && Number.isInteger(value) && value >= minimum && value <= maximum;
}

function validTimestamp(value: string | null): boolean {
  return value !== null && Number.isFinite(Date.parse(value));
}

function validProvenance(value: ProviderFieldProvenance): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    CATALOG_PROVIDER_IDS.includes(value.provider) &&
    typeof value.providerRecordId === "string" &&
    value.providerRecordId.trim().length > 0 &&
    typeof value.fieldName === "string" &&
    value.fieldName.trim().length > 0 &&
    (value.reference === null ||
      (typeof value.reference === "string" && value.reference.trim().length > 0)) &&
    (value.url === null || (typeof value.url === "string" && /^https:\/\//.test(value.url))) &&
    validTimestamp(value.observedAt) &&
    (value.reference !== null || value.url !== null)
  );
}

function isValidPublishedPlaytime(value: unknown): value is PublishedPlaytime {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !("minimumMinutes" in value) ||
    !("maximumMinutes" in value) ||
    !("maximumListedMinutes" in value) ||
    !("basis" in value)
  ) {
    return false;
  }
  const playtime = value;
  const validOptionalMinutes = (minutes: unknown) =>
    minutes === null || (typeof minutes === "number" && validInteger(minutes, 1, 100_000));
  if (
    !validOptionalMinutes(playtime.minimumMinutes) ||
    !validOptionalMinutes(playtime.maximumMinutes) ||
    !validOptionalMinutes(playtime.maximumListedMinutes) ||
    !["published-range", "explicit-upper-bound", "advertised-duration", "unknown"].includes(
      String(playtime.basis),
    )
  ) {
    return false;
  }
  if (
    typeof playtime.minimumMinutes === "number" &&
    typeof playtime.maximumMinutes === "number" &&
    playtime.minimumMinutes > playtime.maximumMinutes
  ) {
    return false;
  }
  return (
    typeof playtime.maximumListedMinutes === "number" &&
    (playtime.basis === "explicit-upper-bound" ||
      (playtime.basis === "published-range" &&
        typeof playtime.maximumMinutes === "number" &&
        playtime.maximumListedMinutes === playtime.maximumMinutes))
  );
}

export function validateStagedCandidate(
  candidate: StagedCatalogCandidate,
  otherCandidates: readonly StagedCatalogCandidate[] = [],
  now = new Date().toISOString(),
): CandidateValidation {
  const reasons = new Set<CandidateValidationReason>();
  const identity = candidate.identityReview;

  if (identity.status === "unreviewed") reasons.add("identity-unverified");
  if (identity.status === "disputed") reasons.add("identity-disputed");
  if (identity.status === "mismatch") reasons.add("identity-mismatch");
  if (
    identity.status === "verified" &&
    !identity.evidence.some((source) => validProvenance(source) && source.fieldName === "identity")
  ) {
    reasons.add("identity-unverified");
  }
  if (identity.status === "verified" && !identity.gamefinderId) {
    reasons.add("permanent-identity-unassigned");
  }
  if (
    identity.gamefinderId &&
    !/^gf:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      identity.gamefinderId,
    )
  ) {
    reasons.add("invalid-permanent-identity");
  }
  if (
    identity.gamefinderId &&
    otherCandidates.some(
      (other) =>
        other.stagingId !== candidate.stagingId &&
        other.identityReview.gamefinderId === identity.gamefinderId,
    )
  ) {
    reasons.add("duplicate-gamefinder-id");
  }
  const externalKeys = candidate.externalIds.map(
    (id) => `${id.provider}:${id.value.trim().toLocaleLowerCase()}`,
  );
  if (
    new Set(externalKeys).size !== externalKeys.length ||
    candidate.externalIds.some((id) =>
      otherCandidates.some(
        (other) =>
          other.stagingId !== candidate.stagingId &&
          other.externalIds.some(
            (otherId) =>
              otherId.provider === id.provider &&
              otherId.value.trim().toLocaleLowerCase() === id.value.trim().toLocaleLowerCase(),
          ),
      ),
    )
  ) {
    reasons.add("duplicate-external-identifier");
  }

  const facts = candidate.facts;
  const factsByName: [string, CandidateFact<unknown>][] = [
    ["title", facts.title],
    ["publisher", facts.publisher],
    ["yearPublished", facts.yearPublished],
    ["edition", facts.edition],
    ["printing", facts.printing],
    ["language", facts.language],
    ["market", facts.market],
    ["relationship", facts.relationship],
    ["playersMinimum", facts.playersMinimum],
    ["playersMaximum", facts.playersMaximum],
    ["publisherMinimumAge", facts.publisherMinimumAge],
    ["publishedPlaytime", facts.publishedPlaytime],
    ["mechanics", facts.mechanics],
    ["categories", facts.categories],
  ];
  for (const [fieldName, fact] of factsByName) {
    if (hasConflictingClaims(fact)) reasons.add("conflicting-provider-claims");
    if (
      !Array.isArray(fact.claims) ||
      fact.claims.length === 0 ||
      fact.claims.some(
        (claim) =>
          !claim ||
          !validProvenance(claim.provenance) ||
          claim.provenance.fieldName !== fieldName ||
          (claim.status === "unknown" && claim.value !== null) ||
          (claim.status === "reported" && claim.value == null) ||
          !["reported", "unknown"].includes(claim.status),
      )
    ) {
      reasons.add("invalid-provider-claim");
    }
  }
  const minimumPlayers = facts.playersMinimum.reviewed.value;
  const maximumPlayers = facts.playersMaximum.reviewed.value;
  const reportedMinimums = facts.playersMinimum.claims.flatMap((claim) =>
    claim.status === "reported" && validInteger(claim.value, 1, 100) ? [claim.value] : [],
  );
  const reportedMaximums = facts.playersMaximum.claims.flatMap((claim) =>
    claim.status === "reported" && validInteger(claim.value, 1, 100) ? [claim.value] : [],
  );
  if (
    (validInteger(minimumPlayers, 1, 100) &&
      validInteger(maximumPlayers, 1, 100) &&
      minimumPlayers > maximumPlayers) ||
    reportedMinimums.some((minimum) => reportedMaximums.some((maximum) => minimum > maximum))
  ) {
    reasons.add("contradictory-player-counts");
  }

  const requiredFacts: [keyof CandidateFacts, CandidateFact<unknown>][] = [
    ["title", facts.title],
    ["playersMinimum", facts.playersMinimum],
    ["playersMaximum", facts.playersMaximum],
    ["publisherMinimumAge", facts.publisherMinimumAge],
    ["publishedPlaytime", facts.publishedPlaytime],
  ];
  for (const [field, fact] of requiredFacts) {
    if (fact.reviewed.status !== "verified" || fact.reviewed.value === null) {
      reasons.add("required-fact-not-verified");
      continue;
    }
    if (
      !fact.reviewed.evidence.length ||
      fact.reviewed.evidence.some(
        (source) => !validProvenance(source) || source.fieldName !== field,
      )
    ) {
      reasons.add("required-fact-evidence-missing");
    }
    if (!fact.reviewed.reviewerId || !validTimestamp(fact.reviewed.reviewedAt)) {
      reasons.add("human-review-pending");
    }
    if (!fact.reviewed.approverId || !validTimestamp(fact.reviewed.approvedAt)) {
      reasons.add("owner-approval-pending");
    }
    if (
      field === "title" &&
      (typeof fact.reviewed.value !== "string" || !fact.reviewed.value.trim())
    ) {
      reasons.add("invalid-required-fact");
    } else if (
      field === "playersMinimum" &&
      (typeof fact.reviewed.value !== "number" || !validInteger(fact.reviewed.value, 1, 100))
    ) {
      reasons.add("invalid-required-fact");
    } else if (
      field === "playersMaximum" &&
      (typeof fact.reviewed.value !== "number" || !validInteger(fact.reviewed.value, 1, 100))
    ) {
      reasons.add("invalid-required-fact");
    } else if (
      field === "publisherMinimumAge" &&
      (typeof fact.reviewed.value !== "number" || !validInteger(fact.reviewed.value, 0, 120))
    ) {
      reasons.add("invalid-required-fact");
    } else if (field === "publishedPlaytime" && !isValidPublishedPlaytime(fact.reviewed.value)) {
      reasons.add("invalid-required-fact");
    }
  }
  if (
    facts.playersMinimum.reviewed.status === "disputed" ||
    facts.playersMaximum.reviewed.status === "disputed" ||
    facts.publisherMinimumAge.reviewed.status === "disputed" ||
    facts.publishedPlaytime.reviewed.status === "disputed"
  ) {
    reasons.add("required-fact-not-verified");
  }

  if (
    candidate.metadataRights.status !== "cleared" ||
    !candidate.metadataRights.licenseReference?.trim()
  ) {
    reasons.add("metadata-rights-unresolved");
  }
  if (candidate.metadataRights.commercialUse !== "allowed") {
    reasons.add("metadata-commercial-use-not-cleared");
  }
  if (candidate.metadataRights.storage !== "allowed") {
    reasons.add("metadata-storage-not-cleared");
  }
  if (
    candidate.metadataRights.expiresAt !== null &&
    (!validTimestamp(candidate.metadataRights.expiresAt) ||
      Date.parse(candidate.metadataRights.expiresAt) <= Date.parse(now))
  ) {
    reasons.add("metadata-rights-expired");
  }

  if (candidate.review.humanReview.status === "rejected") {
    reasons.add("human-review-rejected");
  } else if (candidate.review.humanReview.status !== "approved") {
    reasons.add("human-review-pending");
  }
  if (candidate.review.ownerApproval.status === "rejected") {
    reasons.add("owner-approval-rejected");
  } else if (candidate.review.ownerApproval.status !== "approved") {
    reasons.add("owner-approval-pending");
  }

  const allReasons = [...reasons];
  const quarantined = allReasons.some(
    (reason) => reason !== "human-review-pending" && reason !== "owner-approval-pending",
  );
  const awaitingApproval =
    !quarantined &&
    allReasons.some(
      (reason) => reason === "human-review-pending" || reason === "owner-approval-pending",
    );
  return {
    status: quarantined
      ? "quarantined"
      : awaitingApproval
        ? "awaiting-approval"
        : "metadata-validated",
    reasons: allReasons,
  };
}

function provenance(providerRecordId: string, fieldName: string): ProviderFieldProvenance {
  return {
    provider: "synthetic",
    providerRecordId,
    fieldName,
    reference: `synthetic-fixture:${providerRecordId}:${fieldName}`,
    url: null,
    observedAt: "2026-01-15T12:00:00.000Z",
  };
}

function syntheticCandidate(
  providerRecordId: string,
  input: {
    title: string;
    minimumPlayers?: number | null;
    maximumPlayers?: number | null;
    publisherMinimumAge?: number | null;
    maximumListedPlaytimeMinutes?: number | null;
    edition?: string | null;
    relationship?: CandidateRelationship;
  },
): ProviderGameCandidate {
  const reported = <T>(field: string, value: T | null | undefined): ProviderFieldClaim<T>[] =>
    value === null || value === undefined
      ? [{ status: "unknown", value: null, provenance: provenance(providerRecordId, field) }]
      : [{ status: "reported", value, provenance: provenance(providerRecordId, field) }];
  const providerId: ExternalGameId = { provider: "synthetic", value: providerRecordId };
  const maximumListedMinutes =
    input.maximumListedPlaytimeMinutes === null ? null : (input.maximumListedPlaytimeMinutes ?? 60);
  return {
    provider: "synthetic",
    providerRecordId,
    providerRecordReference: `synthetic-fixture:${providerRecordId}`,
    externalIds: [providerId],
    facts: {
      title: reported("title", input.title),
      publisher: reported("publisher", "Synthetic Tabletop Studio"),
      yearPublished: reported("yearPublished", 2024),
      edition: reported("edition", input.edition ?? null),
      printing: reported("printing", "Synthetic printing 1"),
      language: reported("language", "en"),
      market: reported("market", "synthetic-market"),
      relationship: reported(
        "relationship",
        input.relationship ?? { kind: "standalone", relatedGame: null },
      ),
      playersMinimum: reported(
        "playersMinimum",
        input.minimumPlayers === undefined ? 2 : input.minimumPlayers,
      ),
      playersMaximum: reported(
        "playersMaximum",
        input.maximumPlayers === undefined ? 4 : input.maximumPlayers,
      ),
      publisherMinimumAge: reported(
        "publisherMinimumAge",
        input.publisherMinimumAge === undefined ? 8 : input.publisherMinimumAge,
      ),
      publishedPlaytime: reported("publishedPlaytime", {
        minimumMinutes: 30,
        maximumMinutes: maximumListedMinutes,
        maximumListedMinutes,
        basis: input.maximumListedPlaytimeMinutes === null ? "unknown" : "published-range",
      }),
      mechanics: reported("mechanics", ["synthetic mechanic"]),
      categories: reported("categories", ["synthetic category"]),
    },
    providerRatings: [
      {
        provider: "synthetic",
        score: 7.4,
        scaleMinimum: 1,
        scaleMaximum: 10,
        votes: 23,
        provenance: provenance(providerRecordId, "provider-rating"),
      },
    ],
  };
}

const duplicateExternalId: ExternalGameId = {
  provider: "synthetic",
  value: "synth-shared-duplicate",
};

const SYNTHETIC_RECORDS: readonly ProviderGameCandidate[] = [
  syntheticCandidate("synth-base-001", { title: "Synthetic Cedar Grove" }),
  syntheticCandidate("synth-expansion-002", {
    title: "Synthetic Cedar Grove: Canopy",
    relationship: {
      kind: "expansion",
      relatedGame: {
        externalId: { provider: "synthetic", value: "synth-base-001" },
        gamefinderId: null,
        title: "Synthetic Cedar Grove",
      },
    },
  }),
  syntheticCandidate("synth-edition-1", {
    title: "Synthetic Star Routes",
    edition: "Synthetic first edition",
  }),
  syntheticCandidate("synth-edition-2", {
    title: "Synthetic Star Routes",
    edition: "Synthetic revised edition",
  }),
  syntheticCandidate("synth-missing-time", {
    title: "Synthetic Quiet Valley",
    maximumListedPlaytimeMinutes: null,
  }),
  syntheticCandidate("synth-conflicting-players", {
    title: "Synthetic Contradiction",
    minimumPlayers: 5,
    maximumPlayers: 2,
  }),
  {
    ...syntheticCandidate("synth-duplicate-a", { title: "Synthetic Duplicate A" }),
    externalIds: [duplicateExternalId],
  },
  {
    ...syntheticCandidate("synth-duplicate-b", { title: "Synthetic Duplicate B" }),
    externalIds: [duplicateExternalId],
  },
  syntheticCandidate("synth-unverified-age", {
    title: "Synthetic Age Unknown",
    publisherMinimumAge: 8,
  }),
  {
    ...syntheticCandidate("synth-incorrect-provider-id", {
      title: "Synthetic Identity Mismatch",
    }),
    externalIds: [{ provider: "synthetic", value: "synth-wrong-identity" }],
  },
  syntheticCandidate("synth-owner-pending", { title: "Synthetic Approval Pending" }),
];

export function createSyntheticCatalogProvider(): CatalogIngestionProvider {
  return {
    id: "synthetic",
    async searchByTitle(title, limit = 20) {
      if (!title.trim() || !Number.isInteger(limit) || limit < 1) {
        throw new CatalogProviderError(
          "invalid-request",
          "A title and positive limit are required.",
        );
      }
      const query = title.trim().toLocaleLowerCase();
      return SYNTHETIC_RECORDS.filter((record) =>
        record.facts.title.some(
          (claim) => claim.status === "reported" && claim.value.toLocaleLowerCase().includes(query),
        ),
      ).slice(0, limit);
    },
    async retrieveByExternalId(externalId) {
      if (externalId.provider !== "synthetic") {
        throw new CatalogProviderError(
          "invalid-request",
          "The synthetic provider accepts only synthetic identifiers.",
        );
      }
      const candidate = SYNTHETIC_RECORDS.find((record) =>
        record.externalIds.some((id) => id.value === externalId.value),
      );
      if (!candidate) {
        throw new CatalogProviderError(
          "unavailable",
          "No synthetic fixture matches that identifier.",
        );
      }
      return candidate;
    },
  };
}
