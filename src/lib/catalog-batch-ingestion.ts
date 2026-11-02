import {
  CATALOG_PROVIDER_IDS,
  CatalogProviderError,
  type CatalogProviderId,
} from "./catalog-foundation";
import {
  refreshStagedCandidate,
  stageProviderCandidate,
  validateStagedCandidate,
  type CandidateValidation,
  type ProviderGameCandidate,
  type StagedCatalogCandidate,
} from "./catalog-ingestion";
import {
  selectApprovedArtwork,
  type ArtworkCandidate,
  type ArtworkEditionScope,
  type ArtworkGameIdentity,
  type ArtworkSelection,
  type ScopedValue,
} from "./catalog-artwork";

export type BatchRecordOutcome = "newly-staged" | "existing" | "refreshed" | "error";

export type BatchRecordResult = {
  inputIndex: number;
  outcome: BatchRecordOutcome;
  stagingId: string | null;
  providerRecordId: string | null;
  errorCode: "invalid-record" | null;
};

export type BatchProgressCheckpoint = {
  version: 1;
  inputSignature: string;
  batchSize: number;
  nextIndex: number;
  batchesCompleted: number;
};

export type BatchRecordDiagnostic = {
  stagingId: string;
  providerRecordId: string;
  validation: CandidateValidation;
  artwork: ArtworkSelection;
};

export type ArtworkReadinessSummary = {
  recordsAssessed: number;
  ready: number;
  missingEligibleArtwork: number;
  rightsFailures: number;
  approvalPending: number;
  approvalRejected: number;
  unavailableImages: number;
  editionMismatches: number;
  identityMismatches: number;
  selectedLowQuality: number;
};

export type CatalogBatchReport = {
  totalRecordsReceived: number;
  recordsProcessed: number;
  newlyStaged: number;
  existingRecordsEncountered: number;
  safelyRefreshed: number;
  rejectedOrQuarantined: number;
  quarantinedStagedRecords: number;
  duplicateExternalIds: number;
  identityConflicts: number;
  incompleteHardFilterFacts: number;
  metadataRightsFailures: number;
  artworkRightsFailures: number;
  missingEligibleArtwork: number;
  artworkApprovalPending: number;
  recordsAwaitingHumanApproval: number;
  recordsAwaitingOwnerApproval: number;
  processingErrors: number;
  progress: {
    nextIndex: number;
    totalRecords: number;
    batchSize: number;
    batchesCompleted: number;
    complete: boolean;
  };
  duplicateExternalIdValues: { provider: string; value: string; recordCount: number }[];
  diagnostics: BatchRecordDiagnostic[];
  artworkReadiness: ArtworkReadinessSummary;
};

export type CatalogBatchRun = {
  checkpoint: BatchProgressCheckpoint;
  report: CatalogBatchReport;
  records: StagedCatalogCandidate[];
  results: BatchRecordResult[];
  elapsedMilliseconds: number;
};

export type CatalogBatchOptions = {
  batchSize: number;
  importedAt?: string;
  now?: string;
  maxBatches?: number;
  checkpoint?: BatchProgressCheckpoint;
  existingRecords?: readonly StagedCatalogCandidate[];
  artworkCandidates?: readonly ArtworkCandidate[];
};

const DEFAULT_TIMESTAMP = "2026-01-15T12:00:00.000Z";
const MAX_BATCH_SIZE = 1000;

function stableSerialize(value: unknown, seen = new WeakSet<object>()): string {
  if (value === null) return "null";
  if (typeof value === "bigint") return `bigint:${value.toString()}`;
  if (typeof value !== "object") return JSON.stringify(value) ?? String(value);
  if (seen.has(value)) return '"[Circular]"';
  seen.add(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry, seen)).join(",")}]`;
  }
  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry, seen)}`)
    .join(",")}}`;
}

function fingerprint(value: unknown): string {
  const serialized = stableSerialize(value);
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function inputFingerprints(records: readonly unknown[]): string[] {
  return records.map((record) => stableSerialize(record));
}

function inputSignature(fingerprints: readonly string[]): string {
  return fingerprint(JSON.stringify(fingerprints));
}

function isProviderCandidate(value: unknown): value is ProviderGameCandidate {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<ProviderGameCandidate>;
  const factFields: (keyof ProviderGameCandidate["facts"])[] = [
    "title",
    "publisher",
    "yearPublished",
    "edition",
    "printing",
    "language",
    "market",
    "relationship",
    "playersMinimum",
    "playersMaximum",
    "publisherMinimumAge",
    "publishedPlaytime",
    "mechanics",
    "categories",
  ];
  return (
    CATALOG_PROVIDER_IDS.includes(candidate.provider as CatalogProviderId) &&
    typeof candidate.providerRecordId === "string" &&
    candidate.providerRecordId.trim().length > 0 &&
    typeof candidate.providerRecordReference === "string" &&
    candidate.providerRecordReference.trim().length > 0 &&
    Array.isArray(candidate.externalIds) &&
    candidate.externalIds.every(
      (external) =>
        external !== null &&
        typeof external === "object" &&
        CATALOG_PROVIDER_IDS.includes(external.provider) &&
        typeof external.value === "string" &&
        external.value.trim().length > 0,
    ) &&
    typeof candidate.facts === "object" &&
    candidate.facts !== null &&
    factFields.every((field) => Array.isArray(candidate.facts?.[field])) &&
    Array.isArray(candidate.providerRatings) &&
    candidate.providerRatings.every(
      (rating) =>
        rating !== null &&
        typeof rating === "object" &&
        CATALOG_PROVIDER_IDS.includes(rating.provider) &&
        Number.isFinite(rating.score) &&
        Number.isFinite(rating.scaleMinimum) &&
        Number.isFinite(rating.scaleMaximum) &&
        (rating.votes === null || Number.isInteger(rating.votes)),
    )
  );
}

function recordKey(
  candidate: Pick<ProviderGameCandidate, "provider" | "providerRecordId">,
): string {
  return `stage:${candidate.provider}:${encodeURIComponent(candidate.providerRecordId)}`;
}

function normalizedExternalKey(provider: string, value: string): string {
  return `${provider}:${value.trim().toLocaleLowerCase()}`;
}

function rawPayloadFromStaged(record: StagedCatalogCandidate): ProviderGameCandidate {
  const facts = Object.fromEntries(
    Object.entries(record.facts).map(([field, fact]) => [field, fact.claims]),
  ) as ProviderGameCandidate["facts"];
  return {
    provider: record.provider,
    providerRecordId: record.providerRecordId,
    providerRecordReference: record.providerRecordReference,
    externalIds: record.externalIds,
    facts,
    providerRatings: record.providerRatings,
  };
}

function createCheckpoint(signature: string, batchSize: number): BatchProgressCheckpoint {
  return {
    version: 1,
    inputSignature: signature,
    batchSize,
    nextIndex: 0,
    batchesCompleted: 0,
  };
}

function isProgressCheckpoint(value: unknown): value is BatchProgressCheckpoint {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const checkpoint = value as Partial<BatchProgressCheckpoint>;
  const keys = Object.keys(value).sort();
  return (
    keys.length === 5 &&
    keys.join(",") ===
      ["batchSize", "batchesCompleted", "inputSignature", "nextIndex", "version"].join(",") &&
    checkpoint.version === 1 &&
    typeof checkpoint.inputSignature === "string" &&
    Number.isInteger(checkpoint.batchSize) &&
    Number.isInteger(checkpoint.nextIndex) &&
    Number.isInteger(checkpoint.batchesCompleted)
  );
}

function cloneCheckpoint(checkpoint: BatchProgressCheckpoint): BatchProgressCheckpoint {
  return {
    version: checkpoint.version,
    inputSignature: checkpoint.inputSignature,
    batchSize: checkpoint.batchSize,
    nextIndex: checkpoint.nextIndex,
    batchesCompleted: checkpoint.batchesCompleted,
  };
}

function claimScope(value: unknown): ScopedValue {
  if (!Array.isArray(value) || value.length !== 1) return { status: "unknown", value: null };
  const claim = value[0];
  if (
    !claim ||
    claim.status !== "reported" ||
    typeof claim.value !== "string" ||
    !claim.value.trim()
  ) {
    return { status: "unknown", value: null };
  }
  return { status: "known", value: claim.value };
}

function artworkScope(record: StagedCatalogCandidate): ArtworkEditionScope {
  return {
    edition: claimScope(record.facts.edition.claims),
    printing: claimScope(record.facts.printing.claims),
    language: claimScope(record.facts.language.claims),
    market: claimScope(record.facts.market.claims),
  };
}

function artworkIdentity(record: StagedCatalogCandidate): ArtworkGameIdentity {
  return {
    stagingId: record.stagingId,
    gamefinderId: record.identityReview.gamefinderId,
  };
}

function indexArtwork(candidates: readonly ArtworkCandidate[]): Map<string, ArtworkCandidate[]> {
  const index = new Map<string, ArtworkCandidate[]>();
  for (const candidate of candidates) {
    const keys = new Set([`stage:${candidate.game.stagingId}`]);
    if (candidate.game.gamefinderId) keys.add(`game:${candidate.game.gamefinderId}`);
    for (const key of keys) {
      const group = index.get(key);
      if (group) group.push(candidate);
      else index.set(key, [candidate]);
    }
  }
  return index;
}

function matchingArtwork(
  record: StagedCatalogCandidate,
  index: ReadonlyMap<string, ArtworkCandidate[]>,
): ArtworkCandidate[] {
  const result = new Set<ArtworkCandidate>();
  for (const key of [
    `stage:${record.stagingId}`,
    ...(record.identityReview.gamefinderId ? [`game:${record.identityReview.gamefinderId}`] : []),
  ]) {
    for (const candidate of index.get(key) ?? []) result.add(candidate);
  }
  return [...result];
}

function externalDuplicateIndex(
  records: readonly StagedCatalogCandidate[],
): Map<string, StagedCatalogCandidate[]> {
  const index = new Map<string, StagedCatalogCandidate[]>();
  for (const record of records) {
    for (const external of record.externalIds) {
      const key = normalizedExternalKey(external.provider, external.value);
      const group = index.get(key);
      if (group) group.push(record);
      else index.set(key, [record]);
    }
  }
  return index;
}

function gamefinderIdIndex(
  records: readonly StagedCatalogCandidate[],
): Map<string, StagedCatalogCandidate[]> {
  const index = new Map<string, StagedCatalogCandidate[]>();
  for (const record of records) {
    const id = record.identityReview.gamefinderId;
    if (!id) continue;
    const group = index.get(id);
    if (group) group.push(record);
    else index.set(id, [record]);
  }
  return index;
}

function duplicateExternalValues(
  records: readonly StagedCatalogCandidate[],
  index: ReadonlyMap<string, StagedCatalogCandidate[]>,
): CatalogBatchReport["duplicateExternalIdValues"] {
  const values = new Map<string, CatalogBatchReport["duplicateExternalIdValues"][number]>();
  for (const record of records) {
    for (const external of record.externalIds) {
      const key = normalizedExternalKey(external.provider, external.value);
      const group = index.get(key) ?? [];
      if (group.length > 1) {
        values.set(key, {
          provider: external.provider,
          value: external.value,
          recordCount: group.length,
        });
      }
    }
  }
  return [...values.values()].sort(
    (left, right) =>
      left.provider.localeCompare(right.provider) || left.value.localeCompare(right.value),
  );
}

function incrementArtworkSummary(
  summary: ArtworkReadinessSummary,
  selection: ArtworkSelection,
): void {
  summary.recordsAssessed += 1;
  if (selection.status === "selected") {
    summary.ready += 1;
    if (selection.artwork.image.quality === "low") summary.selectedLowQuality += 1;
    return;
  }
  summary.missingEligibleArtwork += 1;
  if (selection.status === "rights-unresolved") summary.rightsFailures += 1;
  if (selection.status === "approval-pending") summary.approvalPending += 1;
  if (selection.status === "approval-rejected") summary.approvalRejected += 1;
  if (selection.status === "image-unavailable") summary.unavailableImages += 1;
  if (selection.status === "edition-mismatch") summary.editionMismatches += 1;
  if (selection.status === "identity-mismatch") summary.identityMismatches += 1;
}

function validationCandidates(
  record: StagedCatalogCandidate,
  externalIndex: ReadonlyMap<string, StagedCatalogCandidate[]>,
  identityIndex: ReadonlyMap<string, StagedCatalogCandidate[]>,
): StagedCatalogCandidate[] {
  const related = new Set<StagedCatalogCandidate>();
  for (const external of record.externalIds) {
    for (const match of externalIndex.get(
      normalizedExternalKey(external.provider, external.value),
    ) ?? []) {
      if (match !== record) related.add(match);
    }
  }
  const gamefinderId = record.identityReview.gamefinderId;
  if (gamefinderId) {
    for (const match of identityIndex.get(gamefinderId) ?? []) {
      if (match !== record) related.add(match);
    }
  }
  return [...related];
}

function buildReport(
  inputCount: number,
  checkpoint: BatchProgressCheckpoint,
  records: readonly StagedCatalogCandidate[],
  results: readonly BatchRecordResult[],
  now: string,
  artworkCandidates: readonly ArtworkCandidate[],
): CatalogBatchReport {
  const externalIndex = externalDuplicateIndex(records);
  const identityIndex = gamefinderIdIndex(records);
  const artworkIndex = indexArtwork(artworkCandidates);
  const diagnostics: BatchRecordDiagnostic[] = [];
  const artworkReadiness: ArtworkReadinessSummary = {
    recordsAssessed: 0,
    ready: 0,
    missingEligibleArtwork: 0,
    rightsFailures: 0,
    approvalPending: 0,
    approvalRejected: 0,
    unavailableImages: 0,
    editionMismatches: 0,
    identityMismatches: 0,
    selectedLowQuality: 0,
  };
  let quarantinedStagedRecords = 0;
  let identityConflicts = 0;
  let incompleteHardFilterFacts = 0;
  let metadataRightsFailures = 0;
  let recordsAwaitingHumanApproval = 0;
  let recordsAwaitingOwnerApproval = 0;

  for (const record of records) {
    const validation = validateStagedCandidate(
      record,
      validationCandidates(record, externalIndex, identityIndex),
      now,
    );
    if (validation.status === "quarantined") quarantinedStagedRecords += 1;
    if (
      validation.reasons.some((reason) =>
        [
          "identity-disputed",
          "identity-mismatch",
          "duplicate-gamefinder-id",
          "duplicate-external-identifier",
        ].includes(reason),
      )
    ) {
      identityConflicts += 1;
    }
    if (
      validation.reasons.some((reason) =>
        [
          "required-fact-not-verified",
          "required-fact-evidence-missing",
          "invalid-required-fact",
          "invalid-provider-claim",
          "contradictory-player-counts",
        ].includes(reason),
      )
    ) {
      incompleteHardFilterFacts += 1;
    }
    if (validation.reasons.some((reason) => reason.startsWith("metadata-rights-"))) {
      metadataRightsFailures += 1;
    }
    if (validation.reasons.includes("human-review-pending")) recordsAwaitingHumanApproval += 1;
    if (validation.reasons.includes("owner-approval-pending")) recordsAwaitingOwnerApproval += 1;

    const art = matchingArtwork(record, artworkIndex);
    const selection = selectApprovedArtwork(
      artworkIdentity(record),
      artworkScope(record),
      art,
      now,
    );
    incrementArtworkSummary(artworkReadiness, selection);
    diagnostics.push({
      stagingId: record.stagingId,
      providerRecordId: record.providerRecordId,
      validation,
      artwork: selection,
    });
  }

  const duplicateValues = duplicateExternalValues(records, externalIndex);
  const resultCounts = {
    newlyStaged: results.filter((result) => result.outcome === "newly-staged").length,
    existingRecordsEncountered: results.filter((result) => result.outcome === "existing").length,
    safelyRefreshed: results.filter((result) => result.outcome === "refreshed").length,
    processingErrors: results.filter((result) => result.outcome === "error").length,
  };

  return {
    totalRecordsReceived: inputCount,
    recordsProcessed: checkpoint.nextIndex,
    ...resultCounts,
    rejectedOrQuarantined: quarantinedStagedRecords + resultCounts.processingErrors,
    quarantinedStagedRecords,
    duplicateExternalIds: duplicateValues.length,
    identityConflicts,
    incompleteHardFilterFacts,
    metadataRightsFailures,
    artworkRightsFailures: artworkReadiness.rightsFailures,
    missingEligibleArtwork: artworkReadiness.missingEligibleArtwork,
    artworkApprovalPending: artworkReadiness.approvalPending,
    recordsAwaitingHumanApproval,
    recordsAwaitingOwnerApproval,
    processingErrors: resultCounts.processingErrors,
    progress: {
      nextIndex: checkpoint.nextIndex,
      totalRecords: inputCount,
      batchSize: checkpoint.batchSize,
      batchesCompleted: checkpoint.batchesCompleted,
      complete: checkpoint.nextIndex === inputCount,
    },
    duplicateExternalIdValues: duplicateValues,
    diagnostics,
    artworkReadiness,
  };
}

export function processCatalogBatch(
  input: readonly unknown[],
  options: CatalogBatchOptions,
): CatalogBatchRun {
  const startedAt = performance.now();
  const { batchSize } = options;
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_BATCH_SIZE) {
    throw new CatalogProviderError(
      "invalid-request",
      `Batch size must be an integer from 1 to ${MAX_BATCH_SIZE}.`,
    );
  }
  if (
    options.maxBatches !== undefined &&
    (!Number.isInteger(options.maxBatches) || options.maxBatches < 1)
  ) {
    throw new CatalogProviderError("invalid-request", "maxBatches must be a positive integer.");
  }
  const fingerprints = inputFingerprints(input);
  const signature = inputSignature(fingerprints);
  if (options.checkpoint !== undefined && !isProgressCheckpoint(options.checkpoint)) {
    throw new CatalogProviderError("invalid-request", "The progress checkpoint is malformed.");
  }
  const checkpoint =
    options.checkpoint === undefined
      ? createCheckpoint(signature, batchSize)
      : cloneCheckpoint(options.checkpoint);
  if (
    checkpoint.version !== 1 ||
    checkpoint.inputSignature !== signature ||
    checkpoint.batchSize !== batchSize ||
    !Number.isInteger(checkpoint.nextIndex) ||
    checkpoint.nextIndex < 0 ||
    checkpoint.nextIndex > input.length ||
    !Number.isInteger(checkpoint.batchesCompleted) ||
    checkpoint.batchesCompleted !== Math.ceil(checkpoint.nextIndex / batchSize) ||
    (checkpoint.nextIndex !== input.length && checkpoint.nextIndex % batchSize !== 0)
  ) {
    throw new CatalogProviderError(
      "invalid-request",
      "The progress checkpoint does not match this input and batch configuration.",
    );
  }

  const recordsById = new Map(
    (options.existingRecords ?? []).map((record) => [record.stagingId, record]),
  );
  const sourceFingerprints = new Map<string, string>();
  for (const record of options.existingRecords ?? []) {
    sourceFingerprints.set(record.stagingId, stableSerialize(rawPayloadFromStaged(record)));
  }
  const results: BatchRecordResult[] = [];
  const importedAt = options.importedAt ?? DEFAULT_TIMESTAMP;
  const now = options.now ?? DEFAULT_TIMESTAMP;
  const maxBatches = options.maxBatches ?? Number.POSITIVE_INFINITY;
  let completedThisCall = 0;

  const initialCursor = checkpoint.nextIndex;
  const processRecord = (index: number) => {
    const item = input[index];
    let providerRecordId: string | null = null;
    try {
      if (
        item !== null &&
        typeof item === "object" &&
        "providerRecordId" in item &&
        typeof item.providerRecordId === "string"
      ) {
        providerRecordId = item.providerRecordId.slice(0, 120);
      }
      if (!isProviderCandidate(item)) {
        throw new CatalogProviderError("invalid-response", "Malformed provider candidate.");
      }
      const stagingId = recordKey(item);
      const incomingFingerprint = fingerprints[index];
      const existing = recordsById.get(stagingId);
      if (!existing) {
        const staged = stageProviderCandidate(item, importedAt);
        recordsById.set(staged.stagingId, staged);
        sourceFingerprints.set(stagingId, incomingFingerprint);
        results.push({
          inputIndex: index,
          outcome: "newly-staged",
          stagingId,
          providerRecordId,
          errorCode: null,
        });
      } else if (sourceFingerprints.get(stagingId) === incomingFingerprint) {
        results.push({
          inputIndex: index,
          outcome: "existing",
          stagingId,
          providerRecordId,
          errorCode: null,
        });
      } else {
        const refreshed = refreshStagedCandidate(existing, item, now);
        recordsById.set(stagingId, refreshed);
        sourceFingerprints.set(stagingId, incomingFingerprint);
        results.push({
          inputIndex: index,
          outcome: "refreshed",
          stagingId,
          providerRecordId,
          errorCode: null,
        });
      }
    } catch {
      results.push({
        inputIndex: index,
        outcome: "error",
        stagingId: null,
        providerRecordId,
        errorCode: "invalid-record",
      });
    }
  };

  // Rebuild every previously processed record from source input; the cursor never
  // grants authority to serialized staged records or review decisions.
  for (let index = 0; index < initialCursor; index += 1) {
    processRecord(index);
  }

  while (checkpoint.nextIndex < input.length && completedThisCall < maxBatches) {
    const batchEnd = Math.min(input.length, checkpoint.nextIndex + batchSize);
    for (let index = checkpoint.nextIndex; index < batchEnd; index += 1) {
      processRecord(index);
      checkpoint.nextIndex = index + 1;
    }
    checkpoint.batchesCompleted += 1;
    completedThisCall += 1;
  }

  const records = [...recordsById.values()];
  const report = buildReport(
    input.length,
    checkpoint,
    records,
    results,
    now,
    options.artworkCandidates ?? [],
  );
  return {
    checkpoint,
    report,
    records,
    results,
    elapsedMilliseconds: performance.now() - startedAt,
  };
}
