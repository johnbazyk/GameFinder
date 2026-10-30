import type { AgeBand, Game, WizardContext } from "./types";
import { AGE_BANDS, passesHardConstraints } from "./vibes";

export const REVIEWED_FACT_STATUSES = ["VERIFIED", "PROVISIONAL", "UNKNOWN", "DISPUTED"] as const;

export type ReviewedFactStatus = (typeof REVIEWED_FACT_STATUSES)[number];
export type ReviewIdentityKind = "legacy-bgg" | "custom-game";
export type ReviewedField =
  | "publisherMinimumAge"
  | "players.minimum"
  | "players.maximum"
  | "maximumListedPlaytimeMinutes"
  | "adultContent";
export type ReviewedFactValue = number | boolean | null;
export type ReviewSourceAccess = "not-attempted" | "accessible" | "partial" | "unavailable";
export type ReviewRightsStatus =
  "not-reviewed" | "pending" | "cleared-for-stated-use" | "restricted";

export type ReviewIdentityReference = {
  kind: ReviewIdentityKind;
  key: string;
  expectedTitle: string;
};

export type ReviewScope = {
  product: string;
  edition: string;
  market: string;
};

export type ReviewedFactRecord = {
  reviewRef: string;
  identity: ReviewIdentityReference;
  scope: ReviewScope;
  field: ReviewedField;
  value: ReviewedFactValue;
  units: "years" | "players" | "minutes" | "classification";
  semantics:
    | "publisher-recommended-minimum-age"
    | "publisher-listed-player-bound"
    | "publisher-listed-range-upper-endpoint"
    | "publisher-explicit-upper-bound"
    | "scoped-content-review";
  factualStatus: ReviewedFactStatus;
  source: {
    reference: string | null;
    url: string | null;
    publisher: string | null;
    classification: "publisher-primary" | "regional-primary" | "secondary" | "none";
    accessStatus: ReviewSourceAccess;
    accessedAt: string | null;
  };
  researcher: {
    kind: "human" | "ai-assisted" | "none";
    id: string | null;
    recordedAt: string | null;
  };
  humanReview: {
    status: "pending" | "reviewed";
    reviewerId: string | null;
    reviewedAt: string | null;
  };
  ownerApproval: {
    status: "pending" | "approved" | "rejected";
    approverId: string | null;
    decidedAt: string | null;
  };
  rightsReview: {
    status: ReviewRightsStatus;
    intendedUse: string | null;
    reviewerId: string | null;
    reviewedAt: string | null;
  };
  previousLegacyValue: {
    status: "known" | "unknown" | "not-applicable";
    value: ReviewedFactValue;
  };
  correctionProposalRef: string;
};

export type ReviewIdentityCandidate = ReviewIdentityReference & {
  ambiguous: boolean;
};

export type ReviewResolutionReason =
  | "invalid-schema"
  | "identity-not-found"
  | "identity-ambiguous"
  | "identity-title-mismatch"
  | "scope-mismatch"
  | "legacy-value-mismatch"
  | "unknown-value"
  | "disputed-value"
  | "not-verified"
  | "missing-primary-source"
  | "conflicting-claims"
  | "human-review-required"
  | "owner-approval-required"
  | "rights-review-required";

export type ReviewResolution = {
  status: "blocked" | "ready-for-publication";
  legacyValue: ReviewedFactValue;
  effectiveValue: ReviewedFactValue;
  reasons: ReviewResolutionReason[];
};

const FIELD_RULES: Record<
  ReviewedField,
  { units: ReviewedFactRecord["units"]; semantics: ReviewedFactRecord["semantics"][] }
> = {
  publisherMinimumAge: {
    units: "years",
    semantics: ["publisher-recommended-minimum-age"],
  },
  "players.minimum": {
    units: "players",
    semantics: ["publisher-listed-player-bound"],
  },
  "players.maximum": {
    units: "players",
    semantics: ["publisher-listed-player-bound"],
  },
  maximumListedPlaytimeMinutes: {
    units: "minutes",
    semantics: ["publisher-listed-range-upper-endpoint", "publisher-explicit-upper-bound"],
  },
  adultContent: {
    units: "classification",
    semantics: ["scoped-content-review"],
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function sameScope(left: ReviewScope, right: ReviewScope): boolean {
  return (
    left.product === right.product && left.edition === right.edition && left.market === right.market
  );
}

function sameIdentity(left: ReviewIdentityReference, right: ReviewIdentityReference): boolean {
  return left.kind === right.kind && left.key === right.key;
}

function isValidValue(field: ReviewedField, value: unknown): value is ReviewedFactValue {
  if (field === "adultContent") return typeof value === "boolean" || value === null;
  if (typeof value !== "number" || !Number.isInteger(value)) return false;
  if (field === "publisherMinimumAge") return value >= 0 && value <= 99;
  if (field === "players.minimum" || field === "players.maximum") return value >= 1 && value <= 13;
  return value >= 1 && value <= 1440;
}

export function isReviewedFactRecord(value: unknown): value is ReviewedFactRecord {
  if (!isRecord(value) || !isRecord(value.identity) || !isRecord(value.scope)) return false;
  if (!isRecord(value.source) || !isRecord(value.researcher) || !isRecord(value.humanReview)) {
    return false;
  }
  if (!isRecord(value.ownerApproval) || !isRecord(value.rightsReview)) return false;
  if (!isRecord(value.previousLegacyValue)) return false;
  if (
    !isNonEmptyString(value.reviewRef) ||
    !/^review:[a-z0-9][a-z0-9-]{2,100}$/.test(value.reviewRef)
  ) {
    return false;
  }
  if (
    !["legacy-bgg", "custom-game"].includes(String(value.identity.kind)) ||
    !isNonEmptyString(value.identity.key) ||
    !isNonEmptyString(value.identity.expectedTitle)
  ) {
    return false;
  }
  if (
    !isNonEmptyString(value.scope.product) ||
    !isNonEmptyString(value.scope.edition) ||
    !isNonEmptyString(value.scope.market)
  ) {
    return false;
  }
  if (typeof value.field !== "string" || !Object.hasOwn(FIELD_RULES, value.field)) return false;
  const field = value.field as ReviewedField;
  const rule = FIELD_RULES[field];
  if (
    value.units !== rule.units ||
    typeof value.semantics !== "string" ||
    !(rule.semantics as readonly string[]).includes(value.semantics)
  ) {
    return false;
  }
  if (!REVIEWED_FACT_STATUSES.includes(value.factualStatus as ReviewedFactStatus)) return false;
  if (!isValidValue(field, value.value)) return false;
  if (value.factualStatus === "UNKNOWN" ? value.value !== null : value.value === null) return false;
  if (
    !["not-attempted", "accessible", "partial", "unavailable"].includes(
      String(value.source.accessStatus),
    ) ||
    !["publisher-primary", "regional-primary", "secondary", "none"].includes(
      String(value.source.classification),
    ) ||
    (value.source.reference !== null && !isNonEmptyString(value.source.reference)) ||
    (value.source.url !== null && !isNonEmptyString(value.source.url)) ||
    (value.source.publisher !== null && !isNonEmptyString(value.source.publisher)) ||
    (value.source.accessedAt !== null && !isDate(value.source.accessedAt))
  ) {
    return false;
  }
  if (
    !["human", "ai-assisted", "none"].includes(String(value.researcher.kind)) ||
    (value.researcher.id !== null && !isNonEmptyString(value.researcher.id)) ||
    (value.researcher.recordedAt !== null && !isDate(value.researcher.recordedAt))
  ) {
    return false;
  }
  if (
    !["pending", "reviewed"].includes(String(value.humanReview.status)) ||
    (value.humanReview.reviewerId !== null && !isNonEmptyString(value.humanReview.reviewerId)) ||
    (value.humanReview.reviewedAt !== null && !isDate(value.humanReview.reviewedAt))
  ) {
    return false;
  }
  if (
    !["pending", "approved", "rejected"].includes(String(value.ownerApproval.status)) ||
    (value.ownerApproval.approverId !== null &&
      !isNonEmptyString(value.ownerApproval.approverId)) ||
    (value.ownerApproval.decidedAt !== null && !isDate(value.ownerApproval.decidedAt))
  ) {
    return false;
  }
  if (
    !["not-reviewed", "pending", "cleared-for-stated-use", "restricted"].includes(
      String(value.rightsReview.status),
    ) ||
    (value.rightsReview.intendedUse !== null &&
      !isNonEmptyString(value.rightsReview.intendedUse)) ||
    (value.rightsReview.reviewerId !== null && !isNonEmptyString(value.rightsReview.reviewerId)) ||
    (value.rightsReview.reviewedAt !== null && !isDate(value.rightsReview.reviewedAt))
  ) {
    return false;
  }
  if (
    !["known", "unknown", "not-applicable"].includes(String(value.previousLegacyValue.status)) ||
    (value.previousLegacyValue.status === "known"
      ? !isValidValue(field, value.previousLegacyValue.value)
      : value.previousLegacyValue.value !== null) ||
    !isNonEmptyString(value.correctionProposalRef)
  ) {
    return false;
  }
  return true;
}

export function legacyReviewIdentityCandidates(
  games: readonly Pick<Game, "bggId" | "name">[],
  conflicts: readonly { externalId: string }[] = [],
): ReviewIdentityCandidate[] {
  const counts = new Map<string, number>();
  for (const game of games) counts.set(game.bggId, (counts.get(game.bggId) ?? 0) + 1);
  const conflictIds = new Set(conflicts.map((conflict) => conflict.externalId));
  const keys = new Set(games.map((game) => game.bggId));
  for (const key of keys) {
    if (!/^\d+$/.test(key)) continue;
    for (const candidate of keys) {
      if (candidate.startsWith(`${key}-`)) {
        conflictIds.add(key);
        conflictIds.add(candidate);
      }
    }
  }
  return games.map((game) => ({
    kind: "legacy-bgg",
    key: game.bggId,
    expectedTitle: game.name,
    ambiguous: (counts.get(game.bggId) ?? 0) > 1 || conflictIds.has(game.bggId),
  }));
}

export function resolveReviewedFact(input: {
  fact: unknown;
  targetIdentity: ReviewIdentityReference;
  targetScope: ReviewScope;
  identityCandidates: readonly ReviewIdentityCandidate[];
  legacyValue: ReviewedFactValue;
  relatedClaims?: readonly ReviewedFactRecord[];
}): ReviewResolution {
  const reasons: ReviewResolutionReason[] = [];
  const fact = input.fact;
  if (!isReviewedFactRecord(fact)) {
    return {
      status: "blocked",
      legacyValue: input.legacyValue,
      effectiveValue: input.legacyValue,
      reasons: ["invalid-schema"],
    };
  }
  const candidates = input.identityCandidates.filter((candidate) =>
    sameIdentity(candidate, input.targetIdentity),
  );
  if (candidates.length === 0) reasons.push("identity-not-found");
  else if (candidates.length !== 1 || candidates[0].ambiguous) reasons.push("identity-ambiguous");
  else if (
    candidates[0].expectedTitle !== input.targetIdentity.expectedTitle ||
    fact.identity.expectedTitle !== input.targetIdentity.expectedTitle
  ) {
    reasons.push("identity-title-mismatch");
  }
  if (!sameIdentity(fact.identity, input.targetIdentity)) reasons.push("identity-not-found");
  if (!sameScope(fact.scope, input.targetScope)) reasons.push("scope-mismatch");
  if (
    (fact.previousLegacyValue.status === "known" &&
      fact.previousLegacyValue.value !== input.legacyValue) ||
    (fact.previousLegacyValue.status !== "known" && input.legacyValue !== null)
  ) {
    reasons.push("legacy-value-mismatch");
  }
  if (fact.factualStatus === "UNKNOWN") reasons.push("unknown-value");
  if (fact.factualStatus === "DISPUTED") reasons.push("disputed-value");
  if (fact.factualStatus !== "VERIFIED") reasons.push("not-verified");

  const sourceIsPrimary =
    fact.source.reference !== null &&
    fact.source.url?.startsWith("https://") === true &&
    fact.source.publisher !== null &&
    ["publisher-primary", "regional-primary"].includes(fact.source.classification) &&
    fact.source.accessStatus === "accessible" &&
    fact.source.accessedAt !== null;
  if (!sourceIsPrimary) reasons.push("missing-primary-source");

  const claims = input.relatedClaims ?? [];
  if (claims.some((claim) => !isReviewedFactRecord(claim))) reasons.push("invalid-schema");
  const conflicts = claims.some(
    (claim) =>
      isReviewedFactRecord(claim) &&
      sameIdentity(claim.identity, fact.identity) &&
      sameScope(claim.scope, fact.scope) &&
      claim.field === fact.field &&
      claim.value !== fact.value &&
      claim.factualStatus !== "UNKNOWN",
  );
  if (conflicts || fact.factualStatus === "DISPUTED") reasons.push("conflicting-claims");
  if (
    fact.humanReview.status !== "reviewed" ||
    fact.humanReview.reviewerId === null ||
    fact.humanReview.reviewedAt === null
  ) {
    reasons.push("human-review-required");
  }
  if (
    fact.ownerApproval.status !== "approved" ||
    fact.ownerApproval.approverId === null ||
    fact.ownerApproval.decidedAt === null
  ) {
    reasons.push("owner-approval-required");
  }
  if (
    fact.rightsReview.status !== "cleared-for-stated-use" ||
    fact.rightsReview.intendedUse === null ||
    fact.rightsReview.reviewerId === null ||
    fact.rightsReview.reviewedAt === null
  ) {
    reasons.push("rights-review-required");
  }

  if (reasons.length) {
    return {
      status: "blocked",
      legacyValue: input.legacyValue,
      effectiveValue: input.legacyValue,
      reasons: [...new Set(reasons)],
    };
  }
  return {
    status: "ready-for-publication",
    legacyValue: input.legacyValue,
    effectiveValue: fact.value,
    reasons: [],
  };
}

export type RootShadowTreatment =
  "legacy" | "hypothetical-age-14" | "disputed-under-14-excluded" | "no-intervention";

export type RootShadowScenario = {
  id: string;
  context: WizardContext;
};

export type RootShadowComparison = {
  scenarioId: string;
  treatment: RootShadowTreatment;
  baselineEligibleIds: string[];
  treatmentEligibleIds: string[];
  addedIds: string[];
  removedIds: string[];
  rootBaselineEligible: boolean;
  rootTreatmentEligible: boolean;
  rootAgeStatus: "disputed";
  rootAdultContentStatus: "unknown";
};

export function rootShadowScenarios(): RootShadowScenario[] {
  const context = (overrides: Partial<WizardContext>): WizardContext => ({
    players: null,
    ageBand: null,
    maxTimeMin: null,
    timeOver60: false,
    vibes: [],
    exactTraits: null,
    ...overrides,
  });
  const ageBands: AgeBand[] = ["8-10", "11-13", "14-17", "adults"];
  return [
    ...ageBands.map((ageBand) => ({ id: `age-${ageBand}`, context: context({ ageBand }) })),
    { id: "age-11-13-players-2", context: context({ ageBand: "11-13", players: 2 }) },
    { id: "age-11-13-players-4", context: context({ ageBand: "11-13", players: 4 }) },
    { id: "age-11-13-players-1", context: context({ ageBand: "11-13", players: 1 }) },
    { id: "age-11-13-players-5", context: context({ ageBand: "11-13", players: 5 }) },
    {
      id: "age-14-17-players-4-time-60",
      context: context({ ageBand: "14-17", players: 4, maxTimeMin: 60 }),
    },
    {
      id: "age-14-17-players-4-time-90",
      context: context({ ageBand: "14-17", players: 4, maxTimeMin: 90 }),
    },
  ];
}

export function simulateRootShadowTreatment(
  games: readonly Game[],
  scenario: RootShadowScenario,
  treatment: RootShadowTreatment,
): RootShadowComparison {
  const baseline = games.filter((game) => passesHardConstraints(game, scenario.context));
  const band = AGE_BANDS.find((entry) => entry.id === scenario.context.ageBand);
  const underFourteen =
    scenario.context.ageBand !== null &&
    scenario.context.ageBand !== "adults" &&
    band?.youngestAge !== null &&
    band?.youngestAge !== undefined &&
    band.youngestAge < 14;
  const treated = games.filter((game) => {
    if (game.bggId !== "237182") return passesHardConstraints(game, scenario.context);
    if (treatment === "disputed-under-14-excluded" && underFourteen) return false;
    if (treatment === "hypothetical-age-14") {
      return passesHardConstraints(
        { ...game, age: { ...game.age, publisher: 14 } },
        scenario.context,
      );
    }
    return passesHardConstraints(game, scenario.context);
  });
  const baselineIds = baseline.map((game) => game.bggId).sort();
  const treatedIds = treated.map((game) => game.bggId).sort();
  const baselineSet = new Set(baselineIds);
  const treatedSet = new Set(treatedIds);
  return {
    scenarioId: scenario.id,
    treatment,
    baselineEligibleIds: baselineIds,
    treatmentEligibleIds: treatedIds,
    addedIds: treatedIds.filter((id) => !baselineSet.has(id)),
    removedIds: baselineIds.filter((id) => !treatedSet.has(id)),
    rootBaselineEligible: baselineSet.has("237182"),
    rootTreatmentEligible: treatedSet.has("237182"),
    rootAgeStatus: "disputed",
    rootAdultContentStatus: "unknown",
  };
}
