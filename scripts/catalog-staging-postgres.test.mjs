import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { after, before, test } from "node:test";
import { Pool } from "pg";
import { createServer } from "vite";

const root = new URL("..", import.meta.url).pathname;
const fixture = readFileSync(
  new URL("./fixtures/catalog-staging-schema.sql", import.meta.url),
  "utf8",
);
let databaseUrl = process.env.STAGING_TEST_DATABASE_URL;
const dockerContainer = process.env.STAGING_TEST_DOCKER_CONTAINER;
const fixedNow = "2026-03-01T00:00:00.000Z";
const enabled = Boolean(databaseUrl);

let server;
let pool;
let testSchema;
let ingestion;
let createStore;
let pgDatabase;

function assertSafeTestUrl(value) {
  const parsed = new URL(value);
  assert.ok(
    parsed.protocol === "postgres:" || parsed.protocol === "postgresql:",
    "staging test URL must use PostgreSQL",
  );
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    "staging test URL must target loopback only",
  );
  assert.equal(parsed.pathname, "/gamefinder_staging_05d4");
  assert.equal(decodeURIComponent(parsed.username), "gf_staging_test");
  assert.ok(parsed.password.length > 0);
  assert.equal(parsed.search, "");
  assert.equal(parsed.hash, "");
}

function makePool(connectionString = databaseUrl, options = {}) {
  return new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 2_000,
    connectionTimeoutMillis: 5_000,
    ssl: false,
    ...(testSchema ? { options: `-c search_path=${testSchema},public` } : {}),
    ...options,
  });
}

function instrumentPool(actualPool, { failWhen } = {}) {
  const events = [];
  let acquired = 0;
  let released = 0;
  const poolLike = {
    query: (text, params = []) => actualPool.query(text, params),
    async connect() {
      const client = await actualPool.connect();
      acquired += 1;
      let isReleased = false;
      return {
        async query(text, params = []) {
          const sql = String(text).trim().toLowerCase();
          events.push(sql);
          if (failWhen?.(sql)) throw new Error("injected PostgreSQL transaction failure");
          return client.query(text, params);
        },
        release() {
          if (!isReleased) {
            isReleased = true;
            released += 1;
          }
          client.release();
        },
      };
    },
  };
  return {
    poolLike,
    events,
    counts: () => ({ acquired, released }),
  };
}

function refreshLoopbackPort() {
  const mappedPort = JSON.parse(
    execFileSync(
      "docker",
      [
        "inspect",
        "--format",
        '{{json (index .NetworkSettings.Ports "5432/tcp")}}',
        dockerContainer,
      ],
      { encoding: "utf8" },
    ),
  )[0];
  assert.equal(mappedPort.HostIp, "127.0.0.1", "PostgreSQL must remain bound to loopback");
  const localUrl = new URL(databaseUrl);
  localUrl.port = mappedPort.HostPort;
  databaseUrl = localUrl.toString();
}

async function newStore(actualPool = pool, instrumentOptions = {}) {
  const instrumented = instrumentPool(actualPool, instrumentOptions);
  return {
    ...instrumented,
    store: createStore(pgDatabase(instrumented.poolLike)),
  };
}

async function baseCandidate(id) {
  const provider = ingestion.createSyntheticCatalogProvider();
  const [seed] = await provider.searchByTitle("Synthetic Cedar Grove");
  assert.ok(seed);
  const candidate = structuredClone(seed);
  candidate.providerRecordId = id;
  candidate.providerRecordReference = `synthetic-fixture:${id}`;
  candidate.externalIds = [{ provider: "synthetic", value: `pg-external-${id}` }];
  for (const claims of Object.values(candidate.facts)) {
    for (const claim of claims) {
      claim.provenance.providerRecordId = id;
    }
  }
  candidate.facts.title = candidate.facts.title.map((claim) => ({
    ...claim,
    value: `PostgreSQL synthetic ${id}`,
  }));
  return candidate;
}

async function candidateBatch(count, prefix) {
  const seed = await baseCandidate(`${prefix}-seed`);
  return Array.from({ length: count }, (_, index) => {
    const id = `${prefix}-${index}`;
    const candidate = structuredClone(seed);
    candidate.providerRecordId = id;
    candidate.providerRecordReference = `synthetic-fixture:${id}`;
    candidate.externalIds = [{ provider: "synthetic", value: `pg-external-${id}` }];
    for (const claims of Object.values(candidate.facts)) {
      for (const claim of claims) claim.provenance.providerRecordId = id;
    }
    candidate.facts.title = candidate.facts.title.map((claim) => ({
      ...claim,
      value: `PostgreSQL synthetic ${id}`,
    }));
    return candidate;
  });
}

function artworkFor(candidate) {
  const provenance = { ...candidate.facts.title[0].provenance, fieldName: "artwork" };
  return {
    id: `cover-${candidate.providerRecordId}`,
    game: {
      stagingId: `stage:${candidate.provider}:${encodeURIComponent(candidate.providerRecordId)}`,
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
      provenance,
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
      fileSizeBytes: 12000,
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

async function restartPostgres() {
  assert.ok(dockerContainer, "server-restart test requires the disposable Docker container id");
  const label = execFileSync(
    "docker",
    ["inspect", "--format", '{{ index .Config.Labels "com.gamefinder.test" }}', dockerContainer],
    { encoding: "utf8" },
  ).trim();
  assert.equal(label, "05d4", "refusing to restart a container not labeled for this test");
  await pool.end();
  pool = null;
  execFileSync("docker", ["restart", "--time", "5", dockerContainer], { stdio: "ignore" });
  refreshLoopbackPort();
  const deadline = Date.now() + 30_000;
  let lastError;
  while (Date.now() < deadline) {
    const candidatePool = makePool();
    try {
      await candidatePool.query("select 1");
      pool = candidatePool;
      return;
    } catch (error) {
      lastError = error;
      await candidatePool.end().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`PostgreSQL did not become ready after container restart: ${lastError}`);
}

before(async () => {
  if (!enabled) return;
  assertSafeTestUrl(databaseUrl);
  assert.ok(dockerContainer, "STAGING_TEST_DOCKER_CONTAINER is required for server-restart tests");
  const label = execFileSync(
    "docker",
    ["inspect", "--format", '{{ index .Config.Labels "com.gamefinder.test" }}', dockerContainer],
    { encoding: "utf8" },
  ).trim();
  assert.equal(label, "05d4", "test URL must be paired with the dedicated 05D4 container");
  refreshLoopbackPort();

  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ingestion = await server.ssrLoadModule("/src/lib/catalog-ingestion.ts");
  const staging = await server.ssrLoadModule("/src/lib/catalog-staging-store.server.ts");
  createStore = staging.createCatalogStagingStore;
  pgDatabase = staging.createPgTransactionalStagingDatabase;

  const preflightPool = makePool();
  const identity = await preflightPool.query(
    `select current_database() as database_name, current_user as user_name,
            version() as server_version, inet_server_addr()::text as server_address`,
  );
  assert.equal(identity.rows[0].database_name, "gamefinder_staging_05d4");
  assert.equal(identity.rows[0].user_name, "gf_staging_test");
  assert.match(identity.rows[0].server_version, /^PostgreSQL 16\./);
  assert.equal(typeof identity.rows[0].server_address, "string");
  testSchema = `staging_05d4_${process.pid}_${Date.now()}`;
  await preflightPool.query(`create schema ${testSchema}`);
  await preflightPool.end();
  pool = makePool();
  await pool.query(fixture);
});

after(async () => {
  await pool?.end();
  await server?.close();
});

const pgTest = (name, run) => test(name, { skip: !enabled }, run);

pgTest(
  "uses real node-postgres transaction, JSONB, integer, timestamp, and parameter paths",
  async () => {
    const instrumented = await newStore();
    const source = [await baseCandidate("pg-driver-1")];
    await createRun(instrumented.store, "quoted-'run-id", source);
    instrumented.events.length = 0;
    const committed = await instrumented.store.commitBatch({
      runId: "quoted-'run-id",
      startIndex: 0,
      sourceRecords: source,
      records: source,
      now: fixedNow,
    });
    assert.equal(committed.records[0].outcome, "newly-staged");
    assert.deepEqual(instrumented.events.slice(0, 2), [
      "begin",
      "select * from catalog_staging_runs where run_id = $1 for update",
    ]);
    assert.ok(instrumented.events.includes("commit"));
    assert.deepEqual(instrumented.counts(), { acquired: 2, released: 2 });

    const shapes = await pool.query(
      `select current_revision, current_raw_candidate, imported_at
     from catalog_staged_candidates candidate
     join catalog_staged_candidate_revisions revision
       on revision.candidate_id = candidate.candidate_id
      and revision.revision = candidate.current_revision
     where candidate.source_record_id = $1`,
      ["pg-driver-1"],
    );
    assert.equal(shapes.rows[0].current_revision, 1);
    assert.equal(typeof shapes.rows[0].current_revision, "number");
    assert.equal(typeof shapes.rows[0].current_raw_candidate, "object");
    assert.ok(shapes.rows[0].imported_at instanceof Date);
    assert.equal(shapes.rows[0].imported_at.toISOString(), fixedNow);
    assert.deepEqual(await loadRun(instrumented.store, "quoted-'run-id", source), {
      runId: "quoted-'run-id",
      providerId: "synthetic",
      batchSize: 1,
      totalRecords: 1,
      nextIndex: 1,
      batchesCompleted: 1,
      status: "complete",
    });
    assert.equal(pool.idleCount, pool.totalCount);
  },
);

pgTest("enforces PostgreSQL staging uniqueness and foreign-key constraints", async () => {
  const source = [await baseCandidate("pg-constraints-1")];
  const store = createStore(pgDatabase(pool));
  await createRun(store, "pg-constraints-run", source);
  await store.commitBatch({
    runId: "pg-constraints-run",
    startIndex: 0,
    sourceRecords: source,
    records: source,
    now: fixedNow,
  });

  await assert.rejects(
    pool.query(
      `insert into catalog_staging_batches (run_id, start_index, next_index, payload_signature, outcome)
         values ($1, 0, 1, 'duplicate', '{}'::jsonb)`,
      ["pg-constraints-run"],
    ),
    (error) => error.code === "23505",
  );
  await assert.rejects(
    pool.query(
      `insert into catalog_staging_batch_records
         (run_id, start_index, input_index, outcome, candidate_id, error_code, validation)
         values ('missing-run', 0, 0, 'error', null, 'invalid-record', null)`,
    ),
    (error) => error.code === "23503",
  );
  await assert.rejects(
    pool.query(
      `insert into catalog_staged_candidates
         (candidate_id, provider_id, source_record_id, current_revision, source_fingerprint, current_raw_candidate)
         select $1, provider_id, source_record_id, current_revision, source_fingerprint, current_raw_candidate
         from catalog_staged_candidates where source_record_id = $2`,
      ["stage:synthetic:duplicate", source[0].providerRecordId],
    ),
    (error) => error.code === "23505",
  );
});

pgTest(
  "rolls back writes on checkpoint and pre-commit failures and permits clean retry",
  async () => {
    const source = [await baseCandidate("pg-rollback-1")];
    await createRun(createStore(pgDatabase(pool)), "pg-rollback-run", source);

    const checkpointFailure = await newStore(pool, {
      failWhen: (sql) => sql.startsWith("update catalog_staging_runs"),
    });
    await assert.rejects(
      checkpointFailure.store.commitBatch({
        runId: "pg-rollback-run",
        startIndex: 0,
        sourceRecords: source,
        records: source,
        artworkCandidates: [artworkFor(source[0])],
        now: fixedNow,
      }),
      /injected PostgreSQL transaction failure/,
    );
    assert.ok(checkpointFailure.events.includes("rollback"));
    assert.deepEqual(checkpointFailure.counts(), { acquired: 1, released: 1 });
    assert.equal(
      (
        await pool.query(
          "select count(*)::int as count from catalog_staged_candidates where source_record_id = $1",
          [source[0].providerRecordId],
        )
      ).rows[0].count,
      0,
    );
    const candidateId = `stage:synthetic:${encodeURIComponent(source[0].providerRecordId)}`;
    const artworkId = `${candidateId}:art:${encodeURIComponent(`cover-${source[0].providerRecordId}`)}`;
    assert.equal(
      (
        await pool.query(
          "select count(*)::int as count from catalog_staged_candidate_revisions where candidate_id = $1",
          [candidateId],
        )
      ).rows[0].count,
      0,
    );
    assert.equal(
      (
        await pool.query(
          "select count(*)::int as count from catalog_staging_batches where run_id = $1",
          ["pg-rollback-run"],
        )
      ).rows[0].count,
      0,
    );
    assert.equal(
      (
        await pool.query(
          "select count(*)::int as count from catalog_staging_batch_records where run_id = $1",
          ["pg-rollback-run"],
        )
      ).rows[0].count,
      0,
    );
    assert.equal(
      (
        await pool.query(
          "select count(*)::int as count from catalog_staged_artwork where candidate_id = $1",
          [candidateId],
        )
      ).rows[0].count,
      0,
    );
    assert.equal(
      (
        await pool.query(
          "select count(*)::int as count from catalog_staged_artwork_revisions where artwork_id = $1",
          [artworkId],
        )
      ).rows[0].count,
      0,
    );
    assert.equal((await loadRun(checkpointFailure.store, "pg-rollback-run", source)).nextIndex, 0);

    const commitFailure = await newStore(pool, { failWhen: (sql) => sql === "commit" });
    await assert.rejects(
      commitFailure.store.commitBatch({
        runId: "pg-rollback-run",
        startIndex: 0,
        sourceRecords: source,
        records: source,
      }),
      /injected PostgreSQL transaction failure/,
    );
    assert.ok(commitFailure.events.includes("rollback"));
    assert.deepEqual(commitFailure.counts(), { acquired: 1, released: 1 });
    assert.equal(
      (
        await pool.query(
          "select count(*)::int as count from catalog_staged_candidates where source_record_id = $1",
          [source[0].providerRecordId],
        )
      ).rows[0].count,
      0,
    );
    const rawStore = createStore(pgDatabase(pool));
    assert.equal((await loadRun(rawStore, "pg-rollback-run", source)).nextIndex, 0);

    const retry = await rawStore.commitBatch({
      runId: "pg-rollback-run",
      startIndex: 0,
      sourceRecords: source,
      records: source,
      now: fixedNow,
    });
    assert.equal(retry.records[0].outcome, "newly-staged");
    assert.equal(
      (await loadRun(createStore(pgDatabase(pool)), "pg-rollback-run", source)).nextIndex,
      1,
    );
  },
);

pgTest(
  "serializes concurrent duplicate batches and makes completed replay idempotent",
  async () => {
    const source = [await baseCandidate("pg-concurrent-1")];
    const store = createStore(pgDatabase(pool));
    await createRun(store, "pg-concurrent-run", source);
    const submit = () =>
      store.commitBatch({
        runId: "pg-concurrent-run",
        startIndex: 0,
        sourceRecords: source,
        records: source,
        now: fixedNow,
      });
    const concurrent = await Promise.all([submit(), submit()]);
    assert.equal(concurrent.filter((item) => item.replayed).length, 1);
    assert.equal(concurrent.filter((item) => !item.replayed).length, 1);
    const replay = await submit();
    assert.equal(replay.replayed, true);
    assert.equal(replay.records[0].outcome, "existing");
    assert.equal(
      (
        await pool.query(
          "select count(*)::int as count from catalog_staged_candidate_revisions where candidate_id = $1",
          ["stage:synthetic:pg-concurrent-1"],
        )
      ).rows[0].count,
      1,
    );
    const changedSource = [await baseCandidate("pg-concurrent-different")];
    await assert.rejects(createRun(store, "pg-concurrent-run", changedSource));
  },
);

pgTest(
  "records malformed input, conflicting external IDs, and refresh history without merging",
  async () => {
    const malformed = await baseCandidate("pg-malformed");
    malformed.facts.title[0].provenance = null;
    const good = await baseCandidate("pg-good-after-malformed");
    const first = await baseCandidate("pg-external-conflict-1");
    const second = await baseCandidate("pg-external-conflict-2");
    second.externalIds = [{ provider: "synthetic", value: first.externalIds[0].value }];
    const source = [malformed, good, first, second];
    const store = createStore(pgDatabase(pool));
    await createRun(store, "pg-errors-conflicts-run", source, source.length);
    const outcomes = await store.commitBatch({
      runId: "pg-errors-conflicts-run",
      startIndex: 0,
      sourceRecords: source,
      records: source,
      now: fixedNow,
    });
    assert.deepEqual(
      outcomes.records.map((record) => record.outcome),
      ["error", "newly-staged", "newly-staged", "newly-staged"],
    );
    assert.ok(outcomes.records[3].validation.reasons.includes("duplicate-external-identifier"));
    assert.equal(
      (await loadRun(store, "pg-errors-conflicts-run", source, source.length)).nextIndex,
      4,
    );

    const refreshed = structuredClone(good);
    refreshed.facts.title[0].value = "PostgreSQL refreshed title";
    const refreshSource = [refreshed];
    await createRun(store, "pg-refresh-run", refreshSource);
    const refresh = await store.commitBatch({
      runId: "pg-refresh-run",
      startIndex: 0,
      sourceRecords: refreshSource,
      records: refreshSource,
      now: "2026-03-02T00:00:00.000Z",
    });
    assert.equal(refresh.records[0].outcome, "refreshed");
    const recovered = await store.loadStagedCandidates();
    const history = recovered.find((item) => item.providerRecordId === good.providerRecordId);
    assert.equal(history.history.length, 2);
    assert.equal(history.facts.title.claims[0].value, "PostgreSQL refreshed title");
    assert.equal(history.identityReview.status, "unreviewed");
    assert.equal(history.metadataRights.status, "unknown");
  },
);

pgTest("serializes concurrent distinct runs updating one shared candidate", async () => {
  const original = [await baseCandidate("pg-shared-candidate")];
  const store = createStore(pgDatabase(pool));
  await createRun(store, "pg-shared-seed-run", original);
  await store.commitBatch({
    runId: "pg-shared-seed-run",
    startIndex: 0,
    sourceRecords: original,
    records: original,
    now: fixedNow,
  });

  const left = structuredClone(original[0]);
  left.facts.title[0].value = "Concurrent revision left";
  const right = structuredClone(original[0]);
  right.facts.title[0].value = "Concurrent revision right";
  const leftInput = [left];
  const rightInput = [right];
  await createRun(store, "pg-shared-left-run", leftInput);
  await createRun(store, "pg-shared-right-run", rightInput);
  const submissions = await Promise.all([
    store.commitBatch({
      runId: "pg-shared-left-run",
      startIndex: 0,
      sourceRecords: leftInput,
      records: leftInput,
      now: "2026-03-02T00:00:00.000Z",
    }),
    store.commitBatch({
      runId: "pg-shared-right-run",
      startIndex: 0,
      sourceRecords: rightInput,
      records: rightInput,
      now: "2026-03-03T00:00:00.000Z",
    }),
  ]);
  assert.deepEqual(
    submissions.map((item) => item.records[0].outcome),
    ["refreshed", "refreshed"],
  );
  const revisions = await pool.query(
    `select revision, raw_claims->'title'->0->>'value' as title
     from catalog_staged_candidate_revisions
     where candidate_id = $1 order by revision`,
    ["stage:synthetic:pg-shared-candidate"],
  );
  assert.equal(revisions.rows.length, 3);
  assert.deepEqual(
    revisions.rows
      .slice(1)
      .map((row) => row.title)
      .sort(),
    ["Concurrent revision left", "Concurrent revision right"],
  );
  assert.equal((await loadRun(store, "pg-shared-left-run", leftInput)).nextIndex, 1);
  assert.equal((await loadRun(store, "pg-shared-right-run", rightInput)).nextIndex, 1);
});

pgTest(
  "rejects advanced/backward cursors, missing outcomes, missing batches, and gaps",
  async () => {
    const scenarios = [
      {
        name: "advanced cursor",
        committedCount: 1,
        mutate: (runId) =>
          pool.query(
            "update catalog_staging_runs set next_index = 2, batches_completed = 2, status = 'complete' where run_id = $1",
            [runId],
          ),
      },
      {
        name: "backward cursor",
        mutate: (runId) =>
          pool.query(
            "update catalog_staging_runs set next_index = 0, batches_completed = 0, status = 'running' where run_id = $1",
            [runId],
          ),
      },
      {
        name: "corrupted completed-batch count",
        mutate: (runId) =>
          pool.query("update catalog_staging_runs set batches_completed = 1 where run_id = $1", [
            runId,
          ]),
      },
      {
        name: "inconsistent run status",
        mutate: (runId) =>
          pool.query("update catalog_staging_runs set status = 'running' where run_id = $1", [
            runId,
          ]),
      },
      {
        name: "corrupted outcome record count",
        mutate: (runId) =>
          pool.query(
            "update catalog_staging_batches set outcome = jsonb_set(outcome, '{records}', '[]'::jsonb) where run_id = $1 and start_index = 0",
            [runId],
          ),
      },
      {
        name: "corrupted batch source fingerprint",
        mutate: (runId) =>
          pool.query(
            "update catalog_staging_batches set payload_signature = 'different-source' where run_id = $1 and start_index = 0",
            [runId],
          ),
      },
      {
        name: "missing outcome",
        mutate: (runId) =>
          pool.query(
            "delete from catalog_staging_batch_records where run_id = $1 and input_index = 1",
            [runId],
          ),
      },
      {
        name: "missing batch completion",
        mutate: (runId) =>
          pool.query("delete from catalog_staging_batches where run_id = $1 and start_index = 1", [
            runId,
          ]),
      },
      {
        name: "gap",
        mutate: (runId) =>
          pool.query("delete from catalog_staging_batches where run_id = $1 and start_index = 1", [
            runId,
          ]),
      },
    ];
    const store = createStore(pgDatabase(pool));
    for (const [index, scenario] of scenarios.entries()) {
      const runId = `pg-cursor-corrupt-${index}`;
      const source = await candidateBatch(2, `cursor-${index}`);
      await createRun(store, runId, source, 1);
      for (let startIndex = 0; startIndex < (scenario.committedCount ?? 2); startIndex += 1) {
        await store.commitBatch({
          runId,
          startIndex,
          sourceRecords: source,
          records: source.slice(startIndex, startIndex + 1),
          now: fixedNow,
        });
      }
      await scenario.mutate(runId);
      await assert.rejects(loadRun(store, runId, source, 1), /Persisted staging/, scenario.name);
      await assert.rejects(
        store.commitBatch({
          runId,
          startIndex: 0,
          sourceRecords: source,
          records: source.slice(0, 1),
        }),
        /Persisted staging/,
        scenario.name,
      );
    }

    const overlapRun = "pg-cursor-overlap";
    const overlapSource = await candidateBatch(4, "overlap");
    await createRun(store, overlapRun, overlapSource, 2);
    for (const startIndex of [0, 2]) {
      await store.commitBatch({
        runId: overlapRun,
        startIndex,
        sourceRecords: overlapSource,
        records: overlapSource.slice(startIndex, startIndex + 2),
        now: fixedNow,
      });
    }
    await pool.query(
      "update catalog_staging_batches set next_index = 3 where run_id = $1 and start_index = 0",
      [overlapRun],
    );
    await assert.rejects(loadRun(store, overlapRun, overlapSource, 2), /Persisted staging/);
  },
);

pgTest(
  "rejects changed source order, payload, provider, and batch configuration on recovery and commit",
  async () => {
    const source = await candidateBatch(2, "pg-source-mismatch");
    const store = createStore(pgDatabase(pool));
    await createRun(store, "pg-source-mismatch-run", source, 1);
    await store.commitBatch({
      runId: "pg-source-mismatch-run",
      startIndex: 0,
      sourceRecords: source,
      records: source.slice(0, 1),
      now: fixedNow,
    });

    await assert.rejects(loadRun(store, "pg-source-mismatch-run", [...source].reverse(), 1));
    await assert.rejects(loadRun(store, "pg-source-mismatch-run", source, 2));
    await assert.rejects(
      store.loadRun({
        runId: "pg-source-mismatch-run",
        providerId: "bgg",
        batchSize: 1,
        sourceRecords: source,
      }),
    );
    const changed = structuredClone(source);
    changed[1].facts.title[0].value = "Changed source payload";
    await assert.rejects(loadRun(store, "pg-source-mismatch-run", changed, 1));
    await assert.rejects(
      store.commitBatch({
        runId: "pg-source-mismatch-run",
        startIndex: 1,
        sourceRecords: [...source].reverse(),
        records: [...source].reverse().slice(1),
      }),
    );
    await assert.rejects(
      store.commitBatch({
        runId: "pg-source-mismatch-run",
        startIndex: 1,
        sourceRecords: source,
        records: [changed[1]],
      }),
    );
  },
);

pgTest(
  "recovers after pool and PostgreSQL server restart, then matches uninterrupted processing",
  async () => {
    const source = await candidateBatch(3, "pg-restart-equivalence");
    let store = createStore(pgDatabase(pool));
    await createRun(store, "pg-restart-run", source, 1);
    const first = await store.commitBatch({
      runId: "pg-restart-run",
      startIndex: 0,
      sourceRecords: source,
      records: source.slice(0, 1),
      now: fixedNow,
    });
    assert.equal(first.nextIndex, 1);

    await pool.end();
    pool = makePool();
    store = createStore(pgDatabase(pool));
    assert.equal((await loadRun(store, "pg-restart-run", source, 1)).nextIndex, 1);
    await store.commitBatch({
      runId: "pg-restart-run",
      startIndex: 1,
      sourceRecords: source,
      records: source.slice(1, 2),
      now: fixedNow,
    });

    await restartPostgres();
    store = createStore(pgDatabase(pool));
    const recovered = await loadRun(store, "pg-restart-run", source, 1);
    assert.equal(recovered.nextIndex, 2);
    const persisted = (await store.loadStagedCandidates()).filter((item) =>
      source.some((record) => record.providerRecordId === item.providerRecordId),
    );
    assert.equal(persisted.length, 2);
    assert.equal(
      persisted.find((item) => item.providerRecordId === source[0].providerRecordId).history.length,
      1,
    );
    await store.commitBatch({
      runId: "pg-restart-run",
      startIndex: recovered.nextIndex,
      sourceRecords: source,
      records: source.slice(recovered.nextIndex),
      now: fixedNow,
    });
    const resumedRecords = await store.loadStagedCandidates();
    assert.equal((await loadRun(store, "pg-restart-run", source, 1)).status, "complete");

    const comparisonSchema = `staging_uninterrupted_${process.pid}_${Date.now()}`;
    await pool.query(`create schema ${comparisonSchema}`);
    const comparisonPool = makePool(databaseUrl, {
      options: `-c search_path=${comparisonSchema},public`,
      max: 2,
    });
    try {
      await comparisonPool.query(fixture);
      const comparisonStore = createStore(pgDatabase(comparisonPool));
      await createRun(comparisonStore, "pg-uninterrupted-run", source, 1);
      for (let startIndex = 0; startIndex < source.length; startIndex += 1) {
        await comparisonStore.commitBatch({
          runId: "pg-uninterrupted-run",
          startIndex,
          sourceRecords: source,
          records: source.slice(startIndex, startIndex + 1),
          now: fixedNow,
        });
      }
      assert.deepEqual(
        resumedRecords.filter((item) =>
          source.some((record) => record.providerRecordId === item.providerRecordId),
        ),
        await comparisonStore.loadStagedCandidates(),
      );
    } finally {
      await comparisonPool.end();
    }
  },
);

pgTest(
  "persists untrusted review and rights claims as pending across PostgreSQL recovery",
  async () => {
    const source = [await baseCandidate("pg-forged-trust")];
    source[0].identityReview = {
      status: "verified",
      gamefinderId: "gf:00000000-0000-4000-8000-000000000001",
      evidence: ["forged"],
    };
    source[0].review = {
      humanReview: { status: "approved", reviewerId: "attacker", decidedAt: fixedNow },
      ownerApproval: { status: "approved", reviewerId: "attacker", decidedAt: fixedNow },
    };
    source[0].metadataRights = {
      status: "cleared",
      commercialUse: "allowed",
      storage: "allowed",
      licenseReference: "forged",
    };
    const artwork = artworkFor(source[0]);
    const store = createStore(pgDatabase(pool));
    await createRun(store, "pg-forged-trust-run", source);
    await store.commitBatch({
      runId: "pg-forged-trust-run",
      startIndex: 0,
      sourceRecords: source,
      records: source,
      artworkCandidates: [artwork],
      now: fixedNow,
    });
    const recovered = createStore(pgDatabase(pool));
    const [candidate] = (await recovered.loadStagedCandidates()).filter(
      (item) => item.providerRecordId === source[0].providerRecordId,
    );
    const [storedArtwork] = (await recovered.loadArtworkCandidates()).filter(
      (item) => item.game.stagingId === artwork.game.stagingId,
    );
    assert.equal(candidate.identityReview.status, "unreviewed");
    assert.equal(candidate.identityReview.gamefinderId, null);
    assert.equal(candidate.metadataRights.commercialUse, "unknown");
    assert.equal(candidate.metadataRights.storage, "unknown");
    assert.equal(candidate.review.humanReview.status, "pending");
    assert.equal(candidate.review.ownerApproval.status, "pending");
    assert.equal(storedArtwork.rights.commercialDisplay, "unknown");
    assert.equal(storedArtwork.rights.cachingHosting, "unknown");
    assert.equal(storedArtwork.rights.resizingTransformation, "unknown");
    assert.equal(storedArtwork.review.verification, "unverified");
    assert.equal(storedArtwork.review.approval, "pending");
    assert.equal(storedArtwork.rights.revokedAt, "2026-02-15T00:00:00.000Z");
    await assert.rejects(
      pool.query(
        `update catalog_staged_artwork
       set rights_state = '{"commercialDisplay":"allowed","cachingHosting":"allowed","resizingTransformation":"allowed","status":"approved"}'::jsonb`,
      ),
    );
  },
);

pgTest("measures PostgreSQL batch commit and recovery at 25, 250, and 1,000 records", async () => {
  const store = createStore(pgDatabase(pool));
  const timings = [];
  for (const count of [25, 250, 1000]) {
    const runId = `pg-scale-${count}`;
    const source = await candidateBatch(count, `pg-scale-${count}`);
    const started = performance.now();
    await createRun(store, runId, source, count);
    const result = await store.commitBatch({
      runId,
      startIndex: 0,
      sourceRecords: source,
      records: source,
      now: fixedNow,
    });
    const commitMs = performance.now() - started;
    assert.equal(result.records.length, count);
    const resumeStarted = performance.now();
    assert.equal((await loadRun(store, runId, source, count)).nextIndex, count);
    assert.equal(
      (await store.loadStagedCandidates()).filter((item) =>
        item.providerRecordId.startsWith(`pg-scale-${count}-`),
      ).length,
      count,
    );
    const resumeMs = performance.now() - resumeStarted;
    timings.push({
      count,
      commitMs: Number(commitMs.toFixed(1)),
      resumeMs: Number(resumeMs.toFixed(1)),
    });
  }
  console.log(`PostgreSQL staging timings (ms): ${JSON.stringify(timings)}`);
});
