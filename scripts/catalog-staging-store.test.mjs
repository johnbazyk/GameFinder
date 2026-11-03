import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { createServer } from "vite";

const root = new URL("..", import.meta.url).pathname;
let server;
let ingestion;
let createStore;

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  ingestion = await server.ssrLoadModule("/src/lib/catalog-ingestion.ts");
  ({ createCatalogStagingStore: createStore } = await server.ssrLoadModule(
    "/src/lib/catalog-staging-store.server.ts",
  ));
});

after(async () => {
  await server?.close();
});

async function setupDatabase({ queryOverride } = {}) {
  const pg = new PGlite();
  await pg.exec(
    readFileSync(new URL("./fixtures/catalog-staging-schema.sql", import.meta.url), "utf8"),
  );
  const database = {
    query: (text, params = []) =>
      queryOverride ? queryOverride(pg, text, params) : pg.query(text, params),
    transaction: (work) =>
      pg.transaction(async (tx) =>
        work({
          query: (text, params = []) =>
            queryOverride ? queryOverride(tx, text, params) : tx.query(text, params),
        }),
      ),
  };
  return { pg, database, store: createStore(database) };
}

async function candidate(id, title = `Synthetic game ${id}`) {
  const provider = ingestion.createSyntheticCatalogProvider();
  const [base] = await provider.searchByTitle("Synthetic Cedar Grove");
  assert.ok(base);
  const clone = structuredClone(base);
  clone.providerRecordId = id;
  clone.providerRecordReference = `synthetic-fixture:${id}`;
  clone.externalIds = [{ provider: "synthetic", value: `external-${id}` }];
  for (const [field, claims] of Object.entries(clone.facts)) {
    clone.facts[field] = claims.map((claim) => ({
      ...claim,
      provenance: { ...claim.provenance, providerRecordId: id },
    }));
  }
  clone.facts.title = clone.facts.title.map((claim) => ({
    ...claim,
    value: title,
  }));
  return clone;
}

async function batchCandidates(size, prefix) {
  const seed = await candidate(`${prefix}-seed`);
  return Array.from({ length: size }, (_, index) => {
    const id = `${prefix}-${index}`;
    const clone = structuredClone(seed);
    clone.providerRecordId = id;
    clone.providerRecordReference = `synthetic-fixture:${id}`;
    clone.externalIds = [{ provider: "synthetic", value: `external-${id}` }];
    for (const claims of Object.values(clone.facts)) {
      for (const claim of claims) {
        claim.provenance.providerRecordId = id;
      }
    }
    clone.facts.title[0].value = `Synthetic ${prefix} ${index}`;
    return clone;
  });
}

function artworkFor(game) {
  const titleClaim = game.facts.title[0];
  return {
    id: "cover-1",
    game: {
      stagingId: `stage:${game.provider}:${encodeURIComponent(game.providerRecordId)}`,
      gamefinderId: null,
    },
    scope: {
      edition: { status: "known", value: "First edition" },
      printing: { status: "unknown", value: null },
      language: { status: "known", value: "English" },
      market: { status: "known", value: "US" },
    },
    source: {
      provider: "synthetic",
      originalImageReference: "synthetic-fixture:cover",
      provenance: { ...titleClaim.provenance, fieldName: "artwork" },
    },
    rights: {
      rightsHolder: "Unverified holder",
      permissionReference: "untrusted-reference",
      commercialDisplay: "allowed",
      cachingHosting: "allowed",
      resizingTransformation: "allowed",
      attribution: { required: false, text: null },
      expiresAt: null,
      revokedAt: "2026-02-15T00:00:00.000Z",
    },
    review: { verification: "verified", approval: "approved", reviewerId: "forged" },
    image: {
      availability: "available",
      width: 800,
      height: 800,
      format: "image/png",
      fileSizeBytes: 10000,
      quality: "high",
    },
  };
}

async function createRun(store, runId, sourceRecords, batchSize = sourceRecords.length || 1) {
  return store.createOrLoadRun({
    runId,
    providerId: "synthetic",
    batchSize,
    sourceRecords,
  });
}

async function loadRun(store, runId, sourceRecords, batchSize = sourceRecords.length || 1) {
  return store.loadRun({
    runId,
    providerId: "synthetic",
    batchSize,
    sourceRecords,
  });
}

test("commits atomically, recovers through a new adapter, and replays idempotently", async () => {
  const { pg, store } = await setupDatabase();
  try {
    const source = [await candidate("resume-1")];
    source[0].identityReview = {
      status: "verified",
      gamefinderId: "gf:00000000-0000-4000-8000-000000000001",
      evidence: ["forged"],
    };
    source[0].metadataRights = {
      status: "cleared",
      commercialUse: "allowed",
      storage: "allowed",
      licenseReference: "forged",
    };
    source[0].review = {
      humanReview: { status: "approved", reviewerId: "attacker", decidedAt: "2026-01-01" },
      ownerApproval: { status: "approved", reviewerId: "attacker", decidedAt: "2026-01-01" },
    };
    await createRun(store, "resume-run", source);
    const outcome = await store.commitBatch({
      runId: "resume-run",
      startIndex: 0,
      sourceRecords: source,
      records: source,
      artworkCandidates: [artworkFor(source[0])],
      now: "2026-03-01T00:00:00.000Z",
    });
    assert.equal(outcome.records[0].outcome, "newly-staged");
    assert.equal(outcome.records[0].validation.status, "quarantined");
    await assert.rejects(
      pg.query(
        `update catalog_staged_candidate_revisions
         set identity_review = '{"status":"verified","gamefinderId":"gf:00000000-0000-4000-8000-000000000001","evidence":[]}'::jsonb`,
      ),
    );
    await assert.rejects(
      pg.query(
        `update catalog_staged_candidate_revisions
         set metadata_rights = '{"status":"cleared","commercialUse":"allowed","storage":"allowed","licenseReference":"forged"}'::jsonb`,
      ),
    );
    await assert.rejects(
      pg.query(
        `update catalog_staged_candidate_revisions
         set human_review = '{"status":"approved","reviewerId":"attacker","decidedAt":"2026-01-01"}'::jsonb`,
      ),
    );
    await assert.rejects(
      pg.query(
        `update catalog_staged_artwork
         set rights_state = '{"commercialDisplay":"allowed","cachingHosting":"allowed","resizingTransformation":"allowed","status":"approved"}'::jsonb`,
      ),
    );

    const restored = createStore({
      query: (text, params = []) => pg.query(text, params),
      transaction: (work) =>
        pg.transaction((tx) => work({ query: (text, params = []) => tx.query(text, params) })),
    });
    const run = await loadRun(restored, "resume-run", source);
    assert.equal(run.nextIndex, 1);
    await assert.rejects(createRun(restored, "resume-run", source, 2));
    const changedSource = [await candidate("different-source")];
    await assert.rejects(loadRun(restored, "resume-run", changedSource));
    await assert.rejects(
      restored.commitBatch({
        runId: "resume-run",
        startIndex: 0,
        sourceRecords: changedSource,
        records: changedSource,
      }),
    );
    const staged = await restored.loadStagedCandidates();
    assert.equal(staged.length, 1);
    assert.equal(staged[0].identityReview.status, "unreviewed");
    assert.equal(staged[0].identityReview.gamefinderId, null);
    assert.equal(staged[0].metadataRights.commercialUse, "unknown");
    assert.equal(staged[0].metadataRights.storage, "unknown");
    assert.equal(staged[0].review.humanReview.status, "pending");
    assert.equal(staged[0].review.ownerApproval.status, "pending");
    assert.equal(staged[0].facts.publisherMinimumAge.reviewed.value, null);
    assert.equal(staged[0].facts.publisherMinimumAge.reviewed.status, "unverified");

    const art = await restored.loadArtworkCandidates();
    assert.equal(art.length, 1);
    assert.equal(art[0].rights.commercialDisplay, "unknown");
    assert.equal(art[0].rights.cachingHosting, "unknown");
    assert.equal(art[0].review.verification, "unverified");
    assert.equal(art[0].review.approval, "pending");
    assert.equal(art[0].rights.rightsHolder, "Unverified holder");
    assert.equal(art[0].rights.revokedAt, "2026-02-15T00:00:00.000Z");

    await pg.query(
      `update catalog_staging_batches
       set outcome = jsonb_set(
         outcome,
         '{records,0,validation}',
         '{"status":"metadata-validated","reasons":[]}'::jsonb
       )`,
    );
    const replay = await restored.commitBatch({
      runId: "resume-run",
      startIndex: 0,
      sourceRecords: source,
      records: source,
    });
    assert.equal(replay.replayed, true);
    assert.equal(replay.records[0].outcome, "existing");
    assert.equal(replay.records[0].validation.status, "quarantined");
    assert.equal(
      (await pg.query("select * from catalog_staged_candidate_revisions")).rows.length,
      1,
    );
    assert.equal((await pg.query("select * from catalog_staged_artwork_revisions")).rows.length, 1);
    await assert.rejects(loadRun(restored, "resume-run", [await candidate("changed")]));
  } finally {
    await pg.close();
  }
});

test("rejects a progress cursor that advances beyond committed batch outcomes", async () => {
  const { pg, store } = await setupDatabase();
  try {
    const source = [await candidate("cursor-advanced-1"), await candidate("cursor-advanced-2")];
    await createRun(store, "cursor-advanced-run", source, 1);
    await store.commitBatch({
      runId: "cursor-advanced-run",
      startIndex: 0,
      sourceRecords: source,
      records: source.slice(0, 1),
    });
    await pg.query(
      `update catalog_staging_runs
       set next_index = 2, batches_completed = 2, status = 'complete'
       where run_id = 'cursor-advanced-run'`,
    );

    await assert.rejects(
      loadRun(store, "cursor-advanced-run", source, 1),
      /Persisted staging progress is inconsistent/,
    );
  } finally {
    await pg.close();
  }
});

test("rejects corrupted batch boundaries, outcomes, and progress counters on recovery", async () => {
  const scenarios = [
    {
      name: "cursor advanced",
      total: 3,
      batchSize: 1,
      completedBatches: 1,
      mutate: (pg) =>
        pg.query(
          `update catalog_staging_runs
           set next_index = 3, batches_completed = 3, status = 'complete'
           where run_id = 'integrity-run'`,
        ),
    },
    {
      name: "cursor moved backward",
      total: 3,
      batchSize: 1,
      mutate: (pg) =>
        pg.query(
          `update catalog_staging_runs
           set next_index = 2, batches_completed = 2, status = 'running'
           where run_id = 'integrity-run'`,
        ),
    },
    {
      name: "missing per-record outcome in the middle",
      total: 3,
      batchSize: 1,
      mutate: (pg) =>
        pg.query(
          `delete from catalog_staging_batch_records
           where run_id = 'integrity-run' and input_index = 1`,
        ),
    },
    {
      name: "missing batch completion in the middle",
      total: 3,
      batchSize: 1,
      mutate: (pg) =>
        pg.query(
          `delete from catalog_staging_batches
           where run_id = 'integrity-run' and start_index = 1`,
        ),
    },
    {
      name: "overlapping batch boundaries",
      total: 4,
      batchSize: 2,
      mutate: (pg) =>
        pg.query(
          `update catalog_staging_batches set next_index = 3
           where run_id = 'integrity-run' and start_index = 0`,
        ),
    },
    {
      name: "gap between committed batches",
      total: 3,
      batchSize: 1,
      mutate: (pg) =>
        pg.query(
          `delete from catalog_staging_batches
           where run_id = 'integrity-run' and start_index = 1`,
        ),
    },
    {
      name: "corrupted batch record count",
      total: 3,
      batchSize: 1,
      mutate: (pg) =>
        pg.query(
          `update catalog_staging_batches
           set outcome = jsonb_set(outcome, '{records}', '[]'::jsonb)
           where run_id = 'integrity-run' and start_index = 1`,
        ),
    },
    {
      name: "contradictory processing counters",
      total: 3,
      batchSize: 1,
      mutate: (pg) =>
        pg.query(
          `update catalog_staging_runs set batches_completed = 1
           where run_id = 'integrity-run'`,
        ),
    },
    {
      name: "status contradicts the verified cursor",
      total: 3,
      batchSize: 1,
      completedBatches: 1,
      mutate: (pg) =>
        pg.query(
          `update catalog_staging_runs set status = 'complete'
           where run_id = 'integrity-run'`,
        ),
    },
  ];

  for (const [index, scenario] of scenarios.entries()) {
    const { pg, store } = await setupDatabase();
    try {
      const source = await Promise.all(
        Array.from({ length: scenario.total }, (_, recordIndex) =>
          candidate(`integrity-${index}-${recordIndex}`),
        ),
      );
      await createRun(store, "integrity-run", source, scenario.batchSize);
      const batchCount =
        scenario.completedBatches ?? Math.ceil(scenario.total / scenario.batchSize);
      for (let batch = 0; batch < batchCount; batch += 1) {
        const startIndex = batch * scenario.batchSize;
        const endIndex = Math.min(startIndex + scenario.batchSize, source.length);
        await store.commitBatch({
          runId: "integrity-run",
          startIndex,
          sourceRecords: source,
          records: source.slice(startIndex, endIndex),
        });
      }
      await scenario.mutate(pg);

      await assert.rejects(
        loadRun(store, "integrity-run", source, scenario.batchSize),
        /Persisted staging/,
      );
      await assert.rejects(
        store.commitBatch({
          runId: "integrity-run",
          startIndex: 0,
          sourceRecords: source,
          records: source.slice(0, scenario.batchSize),
        }),
        /Persisted staging/,
        scenario.name,
      );
    } finally {
      await pg.close();
    }
  }
});

test("binds recovery to source order and run configuration", async () => {
  const { pg, store } = await setupDatabase();
  try {
    const source = [await candidate("source-order-1"), await candidate("source-order-2")];
    await createRun(store, "source-order-run", source, 1);
    await store.commitBatch({
      runId: "source-order-run",
      startIndex: 0,
      sourceRecords: source,
      records: source.slice(0, 1),
    });

    await assert.rejects(loadRun(store, "source-order-run", [...source].reverse(), 1));
    await assert.rejects(loadRun(store, "source-order-run", source, 2));
    await assert.rejects(
      store.loadRun({
        runId: "source-order-run",
        providerId: "bgg",
        batchSize: 1,
        sourceRecords: source,
      }),
    );
    await assert.rejects(createRun(store, "source-order-run", source, 2));
    assert.equal((await loadRun(store, "source-order-run", source, 1)).nextIndex, 1);
    await pg.query(
      `update catalog_staging_runs set input_signature = 'altered-signature'
       where run_id = 'source-order-run'`,
    );
    await assert.rejects(loadRun(store, "source-order-run", source, 1), /Source input/);
    await assert.rejects(
      store.commitBatch({
        runId: "source-order-run",
        startIndex: 1,
        sourceRecords: source,
        records: source.slice(1),
      }),
      /Source input/,
    );
  } finally {
    await pg.close();
  }
});

test("resumes a committed prefix to the same records and outcomes as uninterrupted staging", async () => {
  const interrupted = await setupDatabase();
  const uninterrupted = await setupDatabase();
  try {
    const source = await Promise.all(
      Array.from({ length: 3 }, (_, index) => candidate(`equivalent-${index}`)),
    );
    await createRun(interrupted.store, "interrupted-run", source, 1);
    const first = await interrupted.store.commitBatch({
      runId: "interrupted-run",
      startIndex: 0,
      sourceRecords: source,
      records: source.slice(0, 1),
      now: "2026-03-01T00:00:00.000Z",
    });
    assert.equal(first.nextIndex, 1);

    const resumedStore = createStore({
      query: (text, params = []) => interrupted.pg.query(text, params),
      transaction: (work) =>
        interrupted.pg.transaction((tx) =>
          work({ query: (text, params = []) => tx.query(text, params) }),
        ),
    });
    const recoveredRun = await loadRun(resumedStore, "interrupted-run", source, 1);
    assert.equal(recoveredRun.nextIndex, 1);
    const resumedOutcomes = [first];
    for (let startIndex = recoveredRun.nextIndex; startIndex < source.length; startIndex += 1) {
      resumedOutcomes.push(
        await resumedStore.commitBatch({
          runId: "interrupted-run",
          startIndex,
          sourceRecords: source,
          records: source.slice(startIndex, startIndex + 1),
          now: "2026-03-01T00:00:00.000Z",
        }),
      );
    }

    await createRun(uninterrupted.store, "uninterrupted-run", source, 1);
    const uninterruptedOutcomes = [];
    for (let startIndex = 0; startIndex < source.length; startIndex += 1) {
      uninterruptedOutcomes.push(
        await uninterrupted.store.commitBatch({
          runId: "uninterrupted-run",
          startIndex,
          sourceRecords: source,
          records: source.slice(startIndex, startIndex + 1),
          now: "2026-03-01T00:00:00.000Z",
        }),
      );
    }

    assert.deepEqual(
      await resumedStore.loadStagedCandidates(),
      await uninterrupted.store.loadStagedCandidates(),
    );
    assert.deepEqual(
      resumedOutcomes.map((item) => item.records),
      uninterruptedOutcomes.map((item) => item.records),
    );
    assert.equal((await loadRun(resumedStore, "interrupted-run", source, 1)).status, "complete");
  } finally {
    await interrupted.pg.close();
    await uninterrupted.pg.close();
  }
});

test("rolls back candidate writes when progress checkpoint update fails", async () => {
  let failCheckpoint = false;
  const { pg, store } = await setupDatabase({
    queryOverride: async (executor, text, params) => {
      if (failCheckpoint && text.includes("update catalog_staging_runs")) {
        throw new Error("injected checkpoint failure");
      }
      return executor.query(text, params);
    },
  });
  try {
    const source = [await candidate("rollback-1")];
    await createRun(store, "rollback-run", source);
    failCheckpoint = true;
    await assert.rejects(
      store.commitBatch({
        runId: "rollback-run",
        startIndex: 0,
        sourceRecords: source,
        records: source,
      }),
      /injected checkpoint failure/,
    );
    failCheckpoint = false;
    assert.equal(
      (await pg.query("select count(*)::int as count from catalog_staged_candidates")).rows[0]
        .count,
      0,
    );
    assert.equal(
      (await pg.query("select count(*)::int as count from catalog_staging_batches")).rows[0].count,
      0,
    );
    assert.equal((await loadRun(store, "rollback-run", source)).nextIndex, 0);
    await store.commitBatch({
      runId: "rollback-run",
      startIndex: 0,
      sourceRecords: source,
      records: source,
    });
    assert.equal((await loadRun(store, "rollback-run", source)).nextIndex, 1);
  } finally {
    await pg.close();
  }
});

test("refreshes changed claims and detects external-ID conflicts across batches", async () => {
  const { pg, store } = await setupDatabase();
  try {
    const first = await candidate("conflict-1", "First duplicate");
    const second = await candidate("conflict-2", "Second duplicate");
    second.externalIds = [{ provider: "synthetic", value: first.externalIds[0].value }];
    const source = [first, second];
    await createRun(store, "conflict-run", source, 1);
    await store.commitBatch({
      runId: "conflict-run",
      startIndex: 0,
      sourceRecords: source,
      records: source.slice(0, 1),
    });
    const secondOutcome = await store.commitBatch({
      runId: "conflict-run",
      startIndex: 1,
      sourceRecords: source,
      records: source.slice(1),
    });
    assert.ok(
      secondOutcome.records[0].validation.reasons.includes("duplicate-external-identifier"),
    );
    const priorValidation = await pg.query(
      `select validation from catalog_staged_candidate_revisions
       where candidate_id = $1 and revision = 1`,
      [`stage:synthetic:${encodeURIComponent(first.providerRecordId)}`],
    );
    assert.ok(priorValidation.rows[0].validation.reasons.includes("duplicate-external-identifier"));

    const changedFirst = structuredClone(first);
    changedFirst.facts.title[0].value = "First duplicate refreshed";
    const refreshSource = [changedFirst];
    await createRun(store, "refresh-run", refreshSource, 1);
    const refresh = await store.commitBatch({
      runId: "refresh-run",
      startIndex: 0,
      sourceRecords: refreshSource,
      records: refreshSource,
    });
    assert.equal(refresh.records[0].outcome, "refreshed");
    assert.equal(
      (
        await pg.query(
          `select count(*)::int as count from catalog_staged_candidate_revisions
         where candidate_id = $1`,
          [`stage:synthetic:${encodeURIComponent(first.providerRecordId)}`],
        )
      ).rows[0].count,
      2,
    );
    const recovered = await store.loadStagedCandidates();
    const refreshed = recovered.find((item) => item.providerRecordId === first.providerRecordId);
    assert.equal(refreshed.identityReview.status, "unreviewed");
    assert.equal(refreshed.metadataRights.status, "unknown");
    assert.equal(refreshed.facts.title.reviewed.status, "unverified");
    assert.equal(refreshed.history.length, 2);
    assert.equal(refreshed.history[1].action, "refresh");
    assert.ok(refreshed.history[1].changes.some((change) => change.field === "title"));
  } finally {
    await pg.close();
  }
});

test("serializes concurrent duplicate batch submissions", async () => {
  const { pg, store } = await setupDatabase();
  try {
    const source = [await candidate("concurrent-1")];
    await createRun(store, "concurrent-run", source);
    const submit = () =>
      store.commitBatch({
        runId: "concurrent-run",
        startIndex: 0,
        sourceRecords: source,
        records: source,
      });
    const outcomes = await Promise.all([submit(), submit()]);
    assert.equal(outcomes.filter((outcome) => outcome.replayed).length, 1);
    assert.equal(outcomes.filter((outcome) => !outcome.replayed).length, 1);
    assert.equal(
      (await pg.query("select count(*)::int as count from catalog_staging_batches")).rows[0].count,
      1,
    );
    assert.equal(
      (await pg.query("select count(*)::int as count from catalog_staged_candidate_revisions"))
        .rows[0].count,
      1,
    );
  } finally {
    await pg.close();
  }
});

test("rejects provider mismatch and isolates malformed records as explicit errors", async () => {
  const { pg, store } = await setupDatabase();
  try {
    const good = await candidate("valid-1");
    const wrongProvider = await candidate("wrong-provider");
    wrongProvider.provider = "bgg";
    wrongProvider.providerRecordId = "wrong-provider";
    wrongProvider.providerRecordReference = "fixture:bgg:wrong-provider";
    wrongProvider.externalIds = [{ provider: "bgg", value: "external-wrong-provider" }];
    for (const claims of Object.values(wrongProvider.facts)) {
      for (const claim of claims) {
        claim.provenance.provider = "bgg";
        claim.provenance.providerRecordId = "wrong-provider";
      }
    }
    const malformed = structuredClone(good);
    malformed.providerRecordId = "missing-provenance";
    malformed.facts.title[0].provenance = null;
    const source = [malformed, good, wrongProvider];
    await createRun(store, "invalid-run", source, 3);
    const result = await store.commitBatch({
      runId: "invalid-run",
      startIndex: 0,
      sourceRecords: source,
      records: source,
    });
    assert.deepEqual(
      result.records.map((record) => record.outcome),
      ["error", "newly-staged", "error"],
    );
    assert.equal(result.records[0].errorCode, "invalid-record");
    assert.equal(result.records[1].outcome, "newly-staged");
    assert.equal(result.records[2].errorCode, "invalid-record");
    assert.equal((await store.loadStagedCandidates()).length, 1);
    assert.equal((await loadRun(store, "invalid-run", source, 3)).nextIndex, source.length);
    const batchRecords = await pg.query(
      "select outcome, error_code from catalog_staging_batch_records order by input_index",
    );
    assert.deepEqual(batchRecords.rows, [
      { outcome: "error", error_code: "invalid-record" },
      { outcome: "newly-staged", error_code: null },
      { outcome: "error", error_code: "invalid-record" },
    ]);
  } finally {
    await pg.close();
  }
});

test("fails closed when persisted candidate revisions are missing or malformed", async () => {
  const { pg, store } = await setupDatabase();
  try {
    const source = [await candidate("corrupt-1")];
    await createRun(store, "corrupt-run", source);
    await store.commitBatch({
      runId: "corrupt-run",
      startIndex: 0,
      sourceRecords: source,
      records: source,
    });
    await pg.query("delete from catalog_staged_candidate_revisions where candidate_id = $1", [
      `stage:synthetic:${encodeURIComponent(source[0].providerRecordId)}`,
    ]);
    await assert.rejects(store.loadStagedCandidates(), /Persisted candidate history is malformed/);
  } finally {
    await pg.close();
  }
});

test("persists small, medium, and 1,000-record batches", async () => {
  const { pg, store } = await setupDatabase();
  try {
    for (const size of [25, 250, 1000]) {
      const source = await batchCandidates(size, `scale-${size}`);
      const runId = `scale-run-${size}`;
      const started = performance.now();
      await createRun(store, runId, source, size);
      const outcome = await store.commitBatch({
        runId,
        startIndex: 0,
        sourceRecords: source,
        records: source,
      });
      const elapsedMs = performance.now() - started;
      assert.equal(outcome.records.length, size);
      assert.ok(outcome.records.every((record) => record.outcome === "newly-staged"));
      assert.equal((await loadRun(store, runId, source, size)).nextIndex, size);
      console.log(`PGlite staging ${size} records: ${elapsedMs.toFixed(1)} ms`);
    }
    assert.equal(
      (await pg.query("select count(*)::int as count from catalog_staged_candidates")).rows[0]
        .count,
      1275,
    );
  } finally {
    await pg.close();
  }
});
