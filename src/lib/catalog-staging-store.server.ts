import { createHash } from "node:crypto";
import {
  CATALOG_PROVIDER_IDS,
  CatalogProviderError,
  type CatalogProviderId,
} from "./catalog-foundation";
import {
  refreshStagedCandidate,
  stageProviderCandidate,
  validateStagedCandidate,
  type ProviderCandidateFacts,
  type ProviderFieldClaim,
  type ProviderFieldProvenance,
  type ProviderGameCandidate,
  type StagedCatalogCandidate,
} from "./catalog-ingestion";
import type { ArtworkCandidate, ArtworkEditionScope, ScopedValue } from "./catalog-artwork";

type QueryResult<Row> = { rows: Row[]; rowCount?: number | null };

export type StagingSqlExecutor = {
  query<Row = Record<string, unknown>>(
    text: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<Row>>;
};

export type TransactionalStagingDatabase = StagingSqlExecutor & {
  transaction<T>(work: (tx: StagingSqlExecutor) => Promise<T>): Promise<T>;
};

export type PgPoolLike = {
  query<Row = Record<string, unknown>>(text: string, params?: unknown[]): Promise<QueryResult<Row>>;
  connect(): Promise<{
    query<Row = Record<string, unknown>>(
      text: string,
      params?: unknown[],
    ): Promise<QueryResult<Row>>;
    release(): void;
  }>;
};

export type StagingRun = {
  runId: string;
  providerId: CatalogProviderId;
  batchSize: number;
  totalRecords: number;
  nextIndex: number;
  batchesCompleted: number;
  status: "running" | "complete";
};

export type PersistedBatchOutcome = {
  runId: string;
  startIndex: number;
  nextIndex: number;
  batchesCompleted: number;
  records: {
    inputIndex: number;
    outcome: "newly-staged" | "existing" | "refreshed" | "error";
    stagingId: string | null;
    errorCode: "invalid-record" | null;
    validation: ReturnType<typeof validateStagedCandidate> | null;
  }[];
  replayed: boolean;
};

const FACT_FIELDS: (keyof ProviderCandidateFacts)[] = [
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

function stableSerialize(value: unknown, ancestors = new Set<object>()): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "bigint") return `bigint:${value.toString()}`;
  if (typeof value === "number" && !Number.isFinite(value)) return `number:${String(value)}`;
  if (typeof value === "number" && Object.is(value, -0)) return "number:-0";
  if (typeof value !== "object") return JSON.stringify(value) ?? String(value);
  if (value instanceof Date) return `date:${JSON.stringify(value.toISOString())}`;
  if (ancestors.has(value)) {
    throw new CatalogProviderError("invalid-request", "Source input must not contain cycles.");
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((entry) => stableSerialize(entry, ancestors)).join(",")}]`;
    }
    return `{${Object.entries(value)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry, ancestors)}`)
      .join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

function signature(value: unknown): string {
  return createHash("sha256").update(stableSerialize(value)).digest("hex");
}

function candidateId(provider: string, providerRecordId: string): string {
  return `stage:${provider}:${encodeURIComponent(providerRecordId)}`;
}

function reconstructPersistedCandidate(
  stagingId: string,
  raw: unknown,
  now: string,
): StagedCatalogCandidate {
  const candidate = cleanProviderCandidate(raw);
  if (!candidate || stagingId !== candidateId(candidate.provider, candidate.providerRecordId)) {
    throw new CatalogProviderError(
      "invalid-response",
      "Persisted staging candidate is malformed or has mismatched identity.",
    );
  }
  return stageProviderCandidate(candidate, now);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isProviderId(value: unknown): value is CatalogProviderId {
  return typeof value === "string" && CATALOG_PROVIDER_IDS.includes(value as CatalogProviderId);
}

function cleanProvenance(value: unknown): ProviderFieldProvenance | null {
  if (!isRecord(value) || !isProviderId(value.provider)) return null;
  if (
    typeof value.providerRecordId !== "string" ||
    typeof value.fieldName !== "string" ||
    typeof value.observedAt !== "string" ||
    (value.reference !== null && typeof value.reference !== "string") ||
    (value.url !== null && typeof value.url !== "string")
  ) {
    return null;
  }
  return {
    provider: value.provider,
    providerRecordId: value.providerRecordId,
    fieldName: value.fieldName,
    reference: value.reference,
    url: value.url,
    observedAt: value.observedAt,
  };
}

function cleanClaim(value: unknown): ProviderFieldClaim<unknown> | null {
  if (!isRecord(value) || (value.status !== "reported" && value.status !== "unknown")) {
    return null;
  }
  const provenance = cleanProvenance(value.provenance);
  if (!provenance || (value.status === "unknown" && value.value !== null)) return null;
  if (value.status === "reported" && value.value == null) return null;
  return {
    status: value.status,
    value: value.value,
    provenance,
  } as ProviderFieldClaim<unknown>;
}

function cleanProviderCandidate(value: unknown): ProviderGameCandidate | null {
  if (!isRecord(value) || !isProviderId(value.provider)) return null;
  if (
    typeof value.providerRecordId !== "string" ||
    !value.providerRecordId.trim() ||
    typeof value.providerRecordReference !== "string" ||
    !value.providerRecordReference.trim() ||
    !Array.isArray(value.externalIds) ||
    !isRecord(value.facts) ||
    !Array.isArray(value.providerRatings)
  ) {
    return null;
  }
  const externalIds = value.externalIds.map((entry) => {
    if (!isRecord(entry) || !isProviderId(entry.provider) || typeof entry.value !== "string") {
      return null;
    }
    return { provider: entry.provider, value: entry.value };
  });
  if (externalIds.some((entry) => !entry || !entry.value.trim())) return null;

  const rawFacts = value.facts as Record<string, unknown>;
  const factEntries: (readonly [string, ProviderFieldClaim<unknown>[]])[] = [];
  for (const field of FACT_FIELDS) {
    const rawClaims = rawFacts[field];
    if (!Array.isArray(rawClaims) || rawClaims.length === 0) return null;
    const claims = rawClaims.map(cleanClaim);
    if (claims.some((claim) => !claim)) return null;
    factEntries.push([field, claims as ProviderFieldClaim<unknown>[]]);
  }
  const facts = Object.fromEntries(factEntries) as ProviderCandidateFacts;

  const providerRatings = value.providerRatings.map((entry) => {
    if (!isRecord(entry) || !isProviderId(entry.provider)) return null;
    const provenance = cleanProvenance(entry.provenance);
    if (
      !provenance ||
      typeof entry.score !== "number" ||
      !Number.isFinite(entry.score) ||
      typeof entry.scaleMinimum !== "number" ||
      typeof entry.scaleMaximum !== "number" ||
      !Number.isFinite(entry.scaleMinimum) ||
      !Number.isFinite(entry.scaleMaximum) ||
      (entry.votes !== null &&
        (typeof entry.votes !== "number" || !Number.isInteger(entry.votes) || entry.votes < 0))
    ) {
      return null;
    }
    return {
      provider: entry.provider,
      score: entry.score,
      scaleMinimum: entry.scaleMinimum,
      scaleMaximum: entry.scaleMaximum,
      votes: entry.votes,
      provenance,
    };
  });
  if (providerRatings.some((rating) => !rating)) return null;

  const candidate: ProviderGameCandidate = {
    provider: value.provider,
    providerRecordId: value.providerRecordId,
    providerRecordReference: value.providerRecordReference,
    externalIds: externalIds as ProviderGameCandidate["externalIds"],
    facts,
    providerRatings: providerRatings as ProviderGameCandidate["providerRatings"],
  };
  try {
    JSON.stringify(candidate);
  } catch {
    return null;
  }
  return candidate;
}

function rawCandidate(record: StagedCatalogCandidate): ProviderGameCandidate {
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

function cleanScopedValue(value: unknown): ScopedValue | null {
  if (!isRecord(value)) return null;
  if (value.status === "unknown" && value.value === null) return { status: "unknown", value: null };
  if (value.status === "known" && typeof value.value === "string" && value.value.trim()) {
    return { status: "known", value: value.value };
  }
  return null;
}

function cleanEditionScope(value: unknown): ArtworkEditionScope | null {
  if (!isRecord(value)) return null;
  const edition = cleanScopedValue(value.edition);
  const printing = cleanScopedValue(value.printing);
  const language = cleanScopedValue(value.language);
  const market = cleanScopedValue(value.market);
  return edition && printing && language && market ? { edition, printing, language, market } : null;
}

type ArtworkRightsClaims = {
  rightsHolder: string | null;
  permissionReference: string | null;
  commercialDisplay: string | null;
  cachingHosting: string | null;
  resizingTransformation: string | null;
  attribution: { required: boolean | null; text: string | null };
  expiresAt: string | null;
  revokedAt: string | null;
};

function cleanArtworkCandidate(
  value: unknown,
): { candidate: ArtworkCandidate; rightsClaims: ArtworkRightsClaims } | null {
  if (
    !isRecord(value) ||
    !isRecord(value.game) ||
    !isRecord(value.source) ||
    !isRecord(value.image)
  ) {
    return null;
  }
  const scope = cleanEditionScope(value.scope);
  const provider = isProviderId(value.source.provider) ? value.source.provider : null;
  if (
    typeof value.id !== "string" ||
    !value.id.trim() ||
    typeof value.game.stagingId !== "string" ||
    !scope ||
    !provider ||
    (value.source.originalImageReference !== null &&
      typeof value.source.originalImageReference !== "string")
  ) {
    return null;
  }
  const provenance = cleanProvenance(value.source.provenance);
  const image = value.image;
  if (
    !["unknown", "available", "unavailable"].includes(String(image.availability)) ||
    !["unknown", "low", "standard", "high"].includes(String(image.quality))
  ) {
    return null;
  }
  const rightsClaims = isRecord(value.rights) ? value.rights : {};
  const attribution = isRecord(rightsClaims.attribution) ? rightsClaims.attribution : {};
  const claimsSnapshot = {
    rightsHolder: typeof rightsClaims.rightsHolder === "string" ? rightsClaims.rightsHolder : null,
    permissionReference:
      typeof rightsClaims.permissionReference === "string"
        ? rightsClaims.permissionReference
        : null,
    commercialDisplay:
      typeof rightsClaims.commercialDisplay === "string" ? rightsClaims.commercialDisplay : null,
    cachingHosting:
      typeof rightsClaims.cachingHosting === "string" ? rightsClaims.cachingHosting : null,
    resizingTransformation:
      typeof rightsClaims.resizingTransformation === "string"
        ? rightsClaims.resizingTransformation
        : null,
    attribution: {
      required: typeof attribution.required === "boolean" ? attribution.required : null,
      text: typeof attribution.text === "string" ? attribution.text : null,
    },
    expiresAt: typeof rightsClaims.expiresAt === "string" ? rightsClaims.expiresAt : null,
    revokedAt: typeof rightsClaims.revokedAt === "string" ? rightsClaims.revokedAt : null,
  };
  const normalized: ArtworkCandidate = {
    id: value.id,
    game: { stagingId: value.game.stagingId, gamefinderId: null },
    scope,
    source: {
      provider,
      originalImageReference: value.source.originalImageReference,
      provenance,
    },
    rights: {
      rightsHolder:
        typeof rightsClaims.rightsHolder === "string" ? rightsClaims.rightsHolder : null,
      permissionReference:
        typeof rightsClaims.permissionReference === "string"
          ? rightsClaims.permissionReference
          : null,
      commercialDisplay: "unknown",
      cachingHosting: "unknown",
      resizingTransformation: "unknown",
      attribution: {
        required: typeof attribution.required === "boolean" ? attribution.required : null,
        text: typeof attribution.text === "string" ? attribution.text : null,
      },
      expiresAt: typeof rightsClaims.expiresAt === "string" ? rightsClaims.expiresAt : null,
      revokedAt: typeof rightsClaims.revokedAt === "string" ? rightsClaims.revokedAt : null,
    },
    review: {
      verification: "unverified",
      approval: "pending",
      reviewerId: null,
      reviewedAt: null,
    },
    image: {
      availability: image.availability as ArtworkCandidate["image"]["availability"],
      width: typeof image.width === "number" ? image.width : null,
      height: typeof image.height === "number" ? image.height : null,
      format: typeof image.format === "string" ? image.format : null,
      fileSizeBytes: typeof image.fileSizeBytes === "number" ? image.fileSizeBytes : null,
      quality: image.quality as ArtworkCandidate["image"]["quality"],
    },
  };
  try {
    JSON.stringify(normalized);
    JSON.stringify(claimsSnapshot);
  } catch {
    return null;
  }
  return { candidate: normalized, rightsClaims: claimsSnapshot };
}

function isStagingRun(row: Record<string, unknown>): StagingRun {
  const providerId = row.provider_id;
  const status = row.status;
  if (
    typeof row.run_id !== "string" ||
    !row.run_id.trim() ||
    !isProviderId(providerId) ||
    !Number.isInteger(row.batch_size) ||
    (row.batch_size as number) < 1 ||
    (row.batch_size as number) > 1000 ||
    !Number.isInteger(row.total_records) ||
    (row.total_records as number) < 0 ||
    !Number.isInteger(row.next_index) ||
    (row.next_index as number) < 0 ||
    (row.next_index as number) > (row.total_records as number) ||
    !Number.isInteger(row.batches_completed) ||
    (row.batches_completed as number) < 0 ||
    (status !== "running" && status !== "complete")
  ) {
    throw new CatalogProviderError("invalid-response", "Persisted staging run is malformed.");
  }
  return {
    runId: row.run_id,
    providerId,
    batchSize: row.batch_size as number,
    totalRecords: row.total_records as number,
    nextIndex: row.next_index as number,
    batchesCompleted: row.batches_completed as number,
    status,
  };
}

async function verifyRunProgress(
  executor: StagingSqlExecutor,
  row: Record<string, unknown>,
  sourceRecords: readonly unknown[],
): Promise<StagingRun> {
  const run = isStagingRun(row);
  if (
    run.totalRecords !== sourceRecords.length ||
    row.input_signature !== signature(sourceRecords)
  ) {
    throw new CatalogProviderError(
      "invalid-request",
      "Source input is unavailable or does not match the persisted run.",
    );
  }

  const batches = await executor.query<{
    run_id: string;
    start_index: number;
    next_index: number;
    payload_signature: string;
    outcome: unknown;
  }>(
    `select run_id, start_index, next_index, payload_signature, outcome
     from catalog_staging_batches where run_id = $1 order by start_index`,
    [run.runId],
  );
  const records = await executor.query<{
    run_id: string;
    start_index: number;
    input_index: number;
    outcome: string;
    candidate_id: string | null;
    error_code: string | null;
    validation: unknown;
  }>(
    `select run_id, start_index, input_index, outcome, candidate_id, error_code, validation
     from catalog_staging_batch_records where run_id = $1 order by input_index`,
    [run.runId],
  );
  const recordsByBatch = new Map<number, typeof records.rows>();
  for (const record of records.rows) {
    const batchRecords = recordsByBatch.get(record.start_index) ?? [];
    batchRecords.push(record);
    recordsByBatch.set(record.start_index, batchRecords);
  }

  let verifiedNextIndex = 0;
  let verifiedBatchCount = 0;
  let verifiedRecordCount = 0;
  for (const batch of batches.rows) {
    const expectedStart = verifiedNextIndex;
    const expectedEnd = Math.min(expectedStart + run.batchSize, run.totalRecords);
    if (
      batch.run_id !== run.runId ||
      !Number.isInteger(batch.start_index) ||
      !Number.isInteger(batch.next_index) ||
      batch.start_index !== expectedStart ||
      expectedStart >= run.totalRecords ||
      batch.next_index !== expectedEnd
    ) {
      throw new CatalogProviderError(
        "invalid-response",
        "Persisted staging progress is inconsistent with committed batch boundaries.",
      );
    }

    const expectedRecords = sourceRecords.slice(expectedStart, expectedEnd);
    if (batch.payload_signature !== signature(expectedRecords)) {
      throw new CatalogProviderError(
        "invalid-response",
        "Persisted staging batch does not match the supplied source input.",
      );
    }
    const batchRecords = recordsByBatch.get(expectedStart) ?? [];
    const expectedCount = expectedEnd - expectedStart;
    if (batchRecords.length !== expectedCount || !isRecord(batch.outcome)) {
      throw new CatalogProviderError(
        "invalid-response",
        "Persisted staging batch is missing committed record outcomes.",
      );
    }
    const storedOutcome = batch.outcome;
    if (
      storedOutcome.runId !== run.runId ||
      storedOutcome.startIndex !== expectedStart ||
      storedOutcome.nextIndex !== expectedEnd ||
      storedOutcome.batchesCompleted !== verifiedBatchCount + 1 ||
      storedOutcome.replayed !== false ||
      !Array.isArray(storedOutcome.records) ||
      storedOutcome.records.length !== expectedCount
    ) {
      throw new CatalogProviderError(
        "invalid-response",
        "Persisted staging batch completion record is malformed.",
      );
    }

    for (let offset = 0; offset < expectedCount; offset += 1) {
      const inputIndex = expectedStart + offset;
      const storedRecord = batchRecords[offset];
      const outcomeRecord = storedOutcome.records[offset];
      if (
        storedRecord.run_id !== run.runId ||
        storedRecord.start_index !== expectedStart ||
        storedRecord.input_index !== inputIndex ||
        !isRecord(outcomeRecord) ||
        outcomeRecord.inputIndex !== inputIndex ||
        outcomeRecord.outcome !== storedRecord.outcome ||
        outcomeRecord.stagingId !== storedRecord.candidate_id ||
        outcomeRecord.errorCode !== storedRecord.error_code
      ) {
        throw new CatalogProviderError(
          "invalid-response",
          "Persisted per-record outcome is malformed or inconsistent.",
        );
      }

      if (storedRecord.outcome === "error") {
        if (
          storedRecord.candidate_id !== null ||
          storedRecord.error_code !== "invalid-record" ||
          storedRecord.validation !== null
        ) {
          throw new CatalogProviderError(
            "invalid-response",
            "Persisted rejected-record outcome is malformed.",
          );
        }
      } else {
        const candidate = cleanProviderCandidate(sourceRecords[inputIndex]);
        if (
          !["newly-staged", "existing", "refreshed"].includes(storedRecord.outcome) ||
          !candidate ||
          candidate.provider !== run.providerId ||
          storedRecord.candidate_id !==
            candidateId(candidate.provider, candidate.providerRecordId) ||
          storedRecord.error_code !== null ||
          !isRecord(storedRecord.validation) ||
          typeof storedRecord.validation.status !== "string" ||
          !Array.isArray(storedRecord.validation.reasons)
        ) {
          throw new CatalogProviderError(
            "invalid-response",
            "Persisted staged-record outcome does not match the source input.",
          );
        }
      }
    }

    verifiedNextIndex = expectedEnd;
    verifiedBatchCount += 1;
    verifiedRecordCount += expectedCount;
    recordsByBatch.delete(expectedStart);
  }

  const expectedStatus = verifiedNextIndex === run.totalRecords ? "complete" : "running";
  if (
    recordsByBatch.size !== 0 ||
    verifiedRecordCount !== records.rows.length ||
    run.nextIndex !== verifiedNextIndex ||
    run.batchesCompleted !== verifiedBatchCount ||
    run.status !== expectedStatus
  ) {
    throw new CatalogProviderError(
      "invalid-response",
      "Persisted staging progress is inconsistent with committed outcomes.",
    );
  }
  return run;
}

export function createPgTransactionalStagingDatabase(
  pool: PgPoolLike,
): TransactionalStagingDatabase {
  return {
    query: (text, params = []) => pool.query(text, [...params]),
    async transaction<T>(work: (tx: StagingSqlExecutor) => Promise<T>): Promise<T> {
      const client = await pool.connect();
      let transactionStarted = false;
      try {
        await client.query("begin");
        transactionStarted = true;
        const result = await work({
          query: (text, params = []) => client.query(text, [...params]),
        });
        await client.query("commit");
        transactionStarted = false;
        return result;
      } catch (error) {
        if (transactionStarted) {
          try {
            await client.query("rollback");
          } catch (rollbackError) {
            throw new AggregateError(
              [error, rollbackError],
              "Staging transaction failed and rollback could not be confirmed.",
            );
          }
        }
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

export function createCatalogStagingStore(database: TransactionalStagingDatabase) {
  async function loadStagedCandidatesFrom(
    executor: StagingSqlExecutor,
  ): Promise<StagedCatalogCandidate[]> {
    const result = await executor.query<{
      candidate_id: string;
      provider_id: string;
      source_record_id: string;
      current_revision: number;
      current_raw_candidate: ProviderGameCandidate;
      revisions: {
        providerRecordReference: string;
        rawClaims: ProviderCandidateFacts;
        externalIds: ProviderGameCandidate["externalIds"];
        providerRatings: ProviderGameCandidate["providerRatings"];
        importedAt: string;
      }[];
    }>(
      `select candidate.candidate_id, candidate.provider_id, candidate.source_record_id,
              candidate.current_revision, candidate.current_raw_candidate,
              coalesce(json_agg(json_build_object(
                'providerRecordReference', revision.provider_record_reference,
                'rawClaims', revision.raw_claims,
                'externalIds', revision.external_ids,
                'providerRatings', revision.provider_ratings,
                'importedAt', revision.imported_at
              ) order by revision.revision)
                filter (where revision.revision is not null), '[]'::json) as revisions
       from catalog_staged_candidates candidate
       left join catalog_staged_candidate_revisions revision
         on revision.candidate_id = candidate.candidate_id
       group by candidate.candidate_id
       order by candidate.candidate_id`,
    );
    return result.rows.map((row) => {
      if (
        !Array.isArray(row.revisions) ||
        row.revisions.length === 0 ||
        row.revisions.length !== row.current_revision ||
        !isProviderId(row.provider_id) ||
        typeof row.source_record_id !== "string"
      ) {
        throw new CatalogProviderError(
          "invalid-response",
          "Persisted candidate history is malformed.",
        );
      }
      let staged: StagedCatalogCandidate | null = null;
      let previousRaw: ProviderGameCandidate | null = null;
      for (const revision of row.revisions) {
        if (
          !isRecord(revision) ||
          typeof revision.providerRecordReference !== "string" ||
          !Array.isArray(revision.externalIds) ||
          !Array.isArray(revision.providerRatings) ||
          typeof revision.importedAt !== "string"
        ) {
          throw new CatalogProviderError(
            "invalid-response",
            "Persisted candidate revision is malformed.",
          );
        }
        const candidate = cleanProviderCandidate({
          provider: row.provider_id,
          providerRecordId: row.source_record_id,
          providerRecordReference: revision.providerRecordReference,
          externalIds: revision.externalIds,
          facts: revision.rawClaims,
          providerRatings: revision.providerRatings,
        });
        if (!candidate) {
          throw new CatalogProviderError(
            "invalid-response",
            "Persisted candidate revision claims are malformed.",
          );
        }
        const timestamp = new Date(revision.importedAt).toISOString();
        staged = staged
          ? refreshStagedCandidate(staged, candidate, timestamp)
          : stageProviderCandidate(candidate, timestamp);
        previousRaw = candidate;
      }
      const current = cleanProviderCandidate(row.current_raw_candidate);
      if (
        !staged ||
        !previousRaw ||
        !current ||
        row.candidate_id !== candidateId(current.provider, current.providerRecordId) ||
        signature(rawCandidate(staged)) !== signature(current)
      ) {
        throw new CatalogProviderError(
          "invalid-response",
          "Persisted candidate does not match its revision history.",
        );
      }
      return staged;
    });
  }

  return {
    async createOrLoadRun(input: {
      runId: string;
      providerId: CatalogProviderId;
      batchSize: number;
      sourceRecords: readonly unknown[];
    }): Promise<StagingRun> {
      if (!input.runId.trim() || !isProviderId(input.providerId)) {
        throw new CatalogProviderError("invalid-request", "A run ID and provider are required.");
      }
      if (!Number.isInteger(input.batchSize) || input.batchSize < 1 || input.batchSize > 1000) {
        throw new CatalogProviderError("invalid-request", "Batch size must be from 1 to 1000.");
      }
      const inputSignature = signature(input.sourceRecords);
      return database.transaction(async (tx) => {
        await tx.query(
          `insert into catalog_staging_runs
            (run_id, provider_id, batch_size, total_records, input_signature, status)
           values ($1, $2, $3, $4, $5, case when $4 = 0 then 'complete' else 'running' end)
           on conflict (run_id) do nothing`,
          [
            input.runId,
            input.providerId,
            input.batchSize,
            input.sourceRecords.length,
            inputSignature,
          ],
        );
        const selected = await tx.query<Record<string, unknown>>(
          "select * from catalog_staging_runs where run_id = $1 for update",
          [input.runId],
        );
        const row = selected.rows[0];
        if (!row) {
          throw new CatalogProviderError("unavailable", "Unable to initialize staging run.");
        }
        const run = await verifyRunProgress(tx, row, input.sourceRecords);
        if (run.providerId !== input.providerId || run.batchSize !== input.batchSize) {
          throw new CatalogProviderError(
            "invalid-request",
            "Run configuration or source input changed.",
          );
        }
        return run;
      });
    },

    async loadRun(input: {
      runId: string;
      providerId: CatalogProviderId;
      batchSize: number;
      sourceRecords: readonly unknown[];
    }): Promise<StagingRun> {
      return database.transaction(async (tx) => {
        const selected = await tx.query<Record<string, unknown>>(
          "select * from catalog_staging_runs where run_id = $1 for update",
          [input.runId],
        );
        const row = selected.rows[0];
        if (!row) throw new CatalogProviderError("unavailable", "Staging run was not found.");
        const run = await verifyRunProgress(tx, row, input.sourceRecords);
        if (run.providerId !== input.providerId || run.batchSize !== input.batchSize) {
          throw new CatalogProviderError(
            "invalid-request",
            "Run configuration or source input changed.",
          );
        }
        return run;
      });
    },

    async loadStagedCandidates(): Promise<StagedCatalogCandidate[]> {
      return loadStagedCandidatesFrom(database);
    },

    async loadArtworkCandidates(): Promise<ArtworkCandidate[]> {
      const result = await database.query<{
        artwork_id: string;
        candidate_id: string;
        edition_scope: unknown;
        source: unknown;
        rights_claims: unknown;
        image_metadata: unknown;
      }>(
        `select artwork_id, candidate_id, edition_scope, source, rights_claims, image_metadata
         from catalog_staged_artwork order by artwork_id`,
      );
      return result.rows.map((row) => {
        const cleaned = cleanArtworkCandidate({
          id: row.artwork_id,
          game: { stagingId: row.candidate_id, gamefinderId: null },
          scope: row.edition_scope,
          source: row.source,
          rights: row.rights_claims,
          review: { verification: "verified", approval: "approved" },
          image: row.image_metadata,
        });
        if (!cleaned) {
          throw new CatalogProviderError(
            "invalid-response",
            "Persisted artwork candidate is malformed.",
          );
        }
        return cleaned.candidate;
      });
    },

    async commitBatch(input: {
      runId: string;
      startIndex: number;
      sourceRecords: readonly unknown[];
      records: readonly unknown[];
      artworkCandidates?: readonly unknown[];
      now?: string;
    }): Promise<PersistedBatchOutcome> {
      if (!input.records.length) {
        throw new CatalogProviderError(
          "invalid-request",
          "A batch must contain at least one record.",
        );
      }
      const sourceSlice = input.sourceRecords.slice(
        input.startIndex,
        input.startIndex + input.records.length,
      );
      if (stableSerialize(sourceSlice) !== stableSerialize(input.records)) {
        throw new CatalogProviderError(
          "invalid-request",
          "Batch records do not match the independently supplied source input.",
        );
      }
      const runInputSignature = signature(input.sourceRecords);
      const batchPayloadSignature = signature(input.records);
      const now = input.now ?? new Date().toISOString();

      return database.transaction(async (tx) => {
        const locked = await tx.query<Record<string, unknown>>(
          "select * from catalog_staging_runs where run_id = $1 for update",
          [input.runId],
        );
        if (!locked.rows[0]) {
          throw new CatalogProviderError("unavailable", "Staging run was not found.");
        }
        if (locked.rows[0].input_signature !== runInputSignature) {
          throw new CatalogProviderError(
            "invalid-request",
            "Source input does not match the staging run.",
          );
        }
        const run = await verifyRunProgress(tx, locked.rows[0], input.sourceRecords);
        if (
          !Number.isInteger(input.startIndex) ||
          input.startIndex < 0 ||
          input.startIndex % run.batchSize !== 0 ||
          input.records.length > run.batchSize ||
          input.startIndex + input.records.length > run.totalRecords
        ) {
          throw new CatalogProviderError("invalid-request", "Batch bounds are invalid.");
        }

        const prior = await tx.query<{ payload_signature: string; next_index: number }>(
          `select payload_signature, next_index from catalog_staging_batches
           where run_id = $1 and start_index = $2`,
          [input.runId, input.startIndex],
        );
        if (prior.rows[0]) {
          if (prior.rows[0].payload_signature !== batchPayloadSignature) {
            throw new CatalogProviderError(
              "invalid-request",
              "A committed batch cannot be replayed with different source data.",
            );
          }
          const expectedNextIndex = input.startIndex + input.records.length;
          if (prior.rows[0].next_index !== expectedNextIndex || run.nextIndex < expectedNextIndex) {
            throw new CatalogProviderError(
              "invalid-response",
              "Persisted batch progress is inconsistent with the staging run.",
            );
          }
          const replayCandidates = await loadStagedCandidatesFrom(tx);
          const records = input.records.map((sourceRecord, offset) => {
            const inputIndex = input.startIndex + offset;
            const clean = cleanProviderCandidate(sourceRecord);
            if (!clean || clean.provider !== run.providerId) {
              return {
                inputIndex,
                outcome: "error" as const,
                stagingId: null,
                errorCode: "invalid-record" as const,
                validation: null,
              };
            }
            const stagingId = candidateId(clean.provider, clean.providerRecordId);
            const candidate = replayCandidates.find((item) => item.stagingId === stagingId);
            if (!candidate) {
              throw new CatalogProviderError(
                "invalid-response",
                "A committed batch candidate is missing from staging storage.",
              );
            }
            const related = replayCandidates.filter((other) => {
              if (other.stagingId === stagingId) return false;
              return candidate.externalIds.some((external) =>
                other.externalIds.some(
                  (otherExternal) =>
                    otherExternal.provider === external.provider &&
                    otherExternal.value.trim().toLocaleLowerCase() ===
                      external.value.trim().toLocaleLowerCase(),
                ),
              );
            });
            return {
              inputIndex,
              outcome: "existing" as const,
              stagingId,
              errorCode: null,
              validation: validateStagedCandidate(candidate, related, now),
            };
          });
          return {
            runId: input.runId,
            startIndex: input.startIndex,
            nextIndex: expectedNextIndex,
            batchesCompleted: Math.floor(input.startIndex / run.batchSize) + 1,
            records,
            replayed: true,
          };
        }
        if (input.startIndex !== run.nextIndex) {
          throw new CatalogProviderError(
            "invalid-request",
            "Batch does not begin at committed progress.",
          );
        }
        const expectedCount = Math.min(run.batchSize, run.totalRecords - run.nextIndex);
        if (input.records.length !== expectedCount) {
          throw new CatalogProviderError(
            "invalid-request",
            "Batch length does not match run configuration.",
          );
        }

        const outcomes: PersistedBatchOutcome["records"] = [];
        const touchedCandidateIds = new Set<string>();
        for (let offset = 0; offset < input.records.length; offset += 1) {
          const inputIndex = input.startIndex + offset;
          const clean = cleanProviderCandidate(input.records[offset]);
          if (!clean || clean.provider !== run.providerId) {
            outcomes.push({
              inputIndex,
              outcome: "error",
              stagingId: null,
              errorCode: "invalid-record",
              validation: null,
            });
            continue;
          }
          let staged: StagedCatalogCandidate;
          try {
            staged = stageProviderCandidate(clean, now);
          } catch {
            outcomes.push({
              inputIndex,
              outcome: "error",
              stagingId: null,
              errorCode: "invalid-record",
              validation: null,
            });
            continue;
          }

          const raw = rawCandidate(staged);
          const sourceFingerprint = signature(raw);
          const key = candidateId(clean.provider, clean.providerRecordId);
          const currentResult = await tx.query<Record<string, unknown>>(
            `select current_revision, source_fingerprint
             from catalog_staged_candidates
             where candidate_id = $1
             for update`,
            [key],
          );
          let outcome: "newly-staged" | "existing" | "refreshed";
          let revision: number;
          if (!currentResult.rows[0]) {
            outcome = "newly-staged";
            revision = 1;
            await tx.query(
              `insert into catalog_staged_candidates
                (candidate_id, provider_id, source_record_id, current_revision, source_fingerprint, current_raw_candidate)
               values ($1, $2, $3, $4, $5, $6::jsonb)`,
              [
                key,
                clean.provider,
                clean.providerRecordId,
                revision,
                sourceFingerprint,
                JSON.stringify(raw),
              ],
            );
          } else if (currentResult.rows[0].source_fingerprint === sourceFingerprint) {
            outcome = "existing";
            revision = Number(currentResult.rows[0].current_revision);
          } else {
            outcome = "refreshed";
            revision = Number(currentResult.rows[0].current_revision) + 1;
            await tx.query(
              `update catalog_staged_candidates
               set current_revision = $2, source_fingerprint = $3,
                   current_raw_candidate = $4::jsonb, updated_at = now()
               where candidate_id = $1`,
              [key, revision, sourceFingerprint, JSON.stringify(raw)],
            );
          }

          if (outcome !== "existing") {
            await tx.query(
              `insert into catalog_staged_candidate_revisions
                (candidate_id, revision, provider_record_reference, raw_claims, external_ids,
                 provider_ratings, provenance, validation, imported_at)
               values ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, '{}'::jsonb, $8)`,
              [
                key,
                revision,
                clean.providerRecordReference,
                JSON.stringify(clean.facts),
                JSON.stringify(clean.externalIds),
                JSON.stringify(clean.providerRatings),
                JSON.stringify(
                  Object.fromEntries(
                    Object.entries(clean.facts).map(([field, claims]) => [
                      field,
                      claims.map((claim) => claim.provenance),
                    ]),
                  ),
                ),
                now,
              ],
            );
            await tx.query("delete from catalog_staging_external_ids where candidate_id = $1", [
              key,
            ]);
            for (const external of clean.externalIds) {
              await tx.query(
                `insert into catalog_staging_external_ids (candidate_id, provider_id, external_id)
                 values ($1, $2, $3)
                 on conflict do nothing`,
                [key, external.provider, external.value],
              );
            }
          }

          touchedCandidateIds.add(key);
          outcomes.push({
            inputIndex,
            outcome,
            stagingId: key,
            errorCode: null,
            validation: null,
          });
        }

        const allRows = await tx.query<{
          candidate_id: string;
          current_raw_candidate: ProviderGameCandidate;
        }>("select candidate_id, current_raw_candidate from catalog_staged_candidates");
        const allStaged = allRows.rows.map((row) =>
          reconstructPersistedCandidate(row.candidate_id, row.current_raw_candidate, now),
        );
        const externalIndex = new Map<string, StagedCatalogCandidate[]>();
        for (const record of allStaged) {
          for (const external of record.externalIds) {
            const externalKey = `${external.provider}:${external.value.trim().toLocaleLowerCase()}`;
            const current = externalIndex.get(externalKey) ?? [];
            current.push(record);
            externalIndex.set(externalKey, current);
          }
        }
        const validationById = new Map<string, ReturnType<typeof validateStagedCandidate>>();
        for (const record of allStaged) {
          const related = new Set<StagedCatalogCandidate>();
          for (const external of record.externalIds) {
            const key = `${external.provider}:${external.value.trim().toLocaleLowerCase()}`;
            for (const other of externalIndex.get(key) ?? []) {
              if (other.stagingId !== record.stagingId) related.add(other);
            }
          }
          const validation = validateStagedCandidate(record, [...related], now);
          validationById.set(record.stagingId, validation);
          await tx.query(
            `update catalog_staged_candidate_revisions
             set validation = $2::jsonb
             where candidate_id = $1
               and revision = (select current_revision from catalog_staged_candidates where candidate_id = $1)`,
            [record.stagingId, JSON.stringify(validation)],
          );
        }

        for (const outcome of outcomes) {
          if (!outcome.stagingId) continue;
          outcome.validation = validationById.get(outcome.stagingId) ?? null;
        }

        for (const unknownArtwork of input.artworkCandidates ?? []) {
          const cleaned = cleanArtworkCandidate(unknownArtwork);
          if (!cleaned) continue;
          const { candidate: art, rightsClaims } = cleaned;
          const key = art.game.stagingId;
          const candidateExists = await tx.query<{ candidate_id: string }>(
            "select candidate_id from catalog_staged_candidates where candidate_id = $1",
            [key],
          );
          if (!candidateExists.rows[0]) continue;
          const storageId = `${key}:art:${encodeURIComponent(art.id)}`;
          const source = JSON.stringify(art.source);
          const scope = JSON.stringify(art.scope);
          const claims = JSON.stringify(rightsClaims);
          const image = JSON.stringify(art.image);
          const existingArt = await tx.query<{
            revision: number;
            source: unknown;
            edition_scope: unknown;
            rights_claims: unknown;
            image_metadata: unknown;
          }>(
            "select revision, source, edition_scope, rights_claims, image_metadata from catalog_staged_artwork where artwork_id = $1 for update",
            [storageId],
          );
          const artChanged =
            !existingArt.rows[0] ||
            stableSerialize(existingArt.rows[0].source) !== stableSerialize(art.source) ||
            stableSerialize(existingArt.rows[0].edition_scope) !== stableSerialize(art.scope) ||
            stableSerialize(existingArt.rows[0].rights_claims) !== stableSerialize(rightsClaims) ||
            stableSerialize(existingArt.rows[0].image_metadata) !== stableSerialize(art.image);
          if (!artChanged) continue;
          const revision = Number(existingArt.rows[0]?.revision ?? 0) + 1;
          await tx.query(
            `insert into catalog_staged_artwork
              (artwork_id, candidate_id, revision, edition_scope, source, rights_claims, image_metadata)
             values ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb)
             on conflict (artwork_id) do update set
               candidate_id = excluded.candidate_id,
               revision = excluded.revision,
               edition_scope = excluded.edition_scope,
               source = excluded.source,
               rights_claims = excluded.rights_claims,
               rights_state = '{"commercialDisplay":"unknown","cachingHosting":"unknown","resizingTransformation":"unknown","status":"pending"}'::jsonb,
               review_state = '{"verification":"unverified","approval":"pending","reviewerId":null,"reviewedAt":null}'::jsonb,
               image_metadata = excluded.image_metadata,
               updated_at = now()`,
            [storageId, key, revision, scope, source, claims, image],
          );
          await tx.query(
            `insert into catalog_staged_artwork_revisions
              (artwork_id, revision, edition_scope, source, rights_claims, image_metadata)
             values ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb)`,
            [storageId, revision, scope, source, claims, image],
          );
        }

        const nextIndex = input.startIndex + input.records.length;
        const batchesCompleted = run.batchesCompleted + 1;
        const outcome: PersistedBatchOutcome = {
          runId: input.runId,
          startIndex: input.startIndex,
          nextIndex,
          batchesCompleted,
          records: outcomes,
          replayed: false,
        };
        await tx.query(
          `insert into catalog_staging_batches
            (run_id, start_index, next_index, payload_signature, outcome)
           values ($1, $2, $3, $4, $5::jsonb)`,
          [
            input.runId,
            input.startIndex,
            nextIndex,
            batchPayloadSignature,
            JSON.stringify(outcome),
          ],
        );
        for (const item of outcomes) {
          await tx.query(
            `insert into catalog_staging_batch_records
              (run_id, start_index, input_index, outcome, candidate_id, error_code, validation)
             values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
            [
              input.runId,
              input.startIndex,
              item.inputIndex,
              item.outcome,
              item.stagingId,
              item.errorCode,
              item.validation ? JSON.stringify(item.validation) : null,
            ],
          );
        }
        await tx.query(
          `update catalog_staging_runs
           set next_index = $2, batches_completed = $3,
               status = case when $2 = total_records then 'complete' else 'running' end,
               updated_at = now()
           where run_id = $1`,
          [input.runId, nextIndex, batchesCompleted],
        );
        return outcome;
      });
    },
  };
}
