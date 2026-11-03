create table catalog_staging_runs (
  run_id text primary key,
  provider_id text not null,
  batch_size integer not null check (batch_size between 1 and 1000),
  total_records integer not null check (total_records >= 0),
  input_signature text not null,
  next_index integer not null default 0 check (next_index >= 0),
  batches_completed integer not null default 0 check (batches_completed >= 0),
  status text not null default 'running' check (status in ('running', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (next_index <= total_records)
);

create table catalog_staged_candidates (
  candidate_id text primary key,
  provider_id text not null,
  source_record_id text not null,
  current_revision integer not null check (current_revision >= 1),
  source_fingerprint text not null,
  current_raw_candidate jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, source_record_id)
);

create table catalog_staged_candidate_revisions (
  candidate_id text not null references catalog_staged_candidates(candidate_id) on delete cascade,
  revision integer not null check (revision >= 1),
  provider_record_reference text not null,
  raw_claims jsonb not null,
  external_ids jsonb not null,
  provider_ratings jsonb not null,
  provenance jsonb not null,
  identity_review jsonb not null default '{"status":"unreviewed","gamefinderId":null,"evidence":[]}'::jsonb
    check (
      identity_review->>'status' = 'unreviewed'
      and identity_review->'gamefinderId' = 'null'::jsonb
      and identity_review->'evidence' = '[]'::jsonb
    ),
  metadata_rights jsonb not null default '{"status":"unknown","commercialUse":"unknown","storage":"unknown","licenseReference":null,"attribution":null,"expiresAt":null}'::jsonb
    check (
      metadata_rights->>'status' = 'unknown'
      and metadata_rights->>'commercialUse' = 'unknown'
      and metadata_rights->>'storage' = 'unknown'
      and metadata_rights->'licenseReference' = 'null'::jsonb
      and metadata_rights->'attribution' = 'null'::jsonb
      and metadata_rights->'expiresAt' = 'null'::jsonb
    ),
  human_review jsonb not null default '{"status":"pending","reviewerId":null,"decidedAt":null}'::jsonb
    check (
      human_review->>'status' = 'pending'
      and human_review->'reviewerId' = 'null'::jsonb
      and human_review->'decidedAt' = 'null'::jsonb
    ),
  owner_approval jsonb not null default '{"status":"pending","reviewerId":null,"decidedAt":null}'::jsonb
    check (
      owner_approval->>'status' = 'pending'
      and owner_approval->'reviewerId' = 'null'::jsonb
      and owner_approval->'decidedAt' = 'null'::jsonb
    ),
  validation jsonb not null,
  imported_at timestamptz not null default now(),
  primary key (candidate_id, revision)
);

create table catalog_staging_external_ids (
  candidate_id text not null references catalog_staged_candidates(candidate_id) on delete cascade,
  provider_id text not null,
  external_id text not null,
  primary key (candidate_id, provider_id, external_id)
);
create index catalog_staging_external_ids_lookup
  on catalog_staging_external_ids (provider_id, external_id);

create table catalog_staging_batches (
  run_id text not null references catalog_staging_runs(run_id) on delete cascade,
  start_index integer not null check (start_index >= 0),
  next_index integer not null check (next_index > start_index),
  payload_signature text not null,
  outcome jsonb not null,
  committed_at timestamptz not null default now(),
  primary key (run_id, start_index),
  unique (run_id, next_index)
);

create table catalog_staging_batch_records (
  run_id text not null,
  start_index integer not null,
  input_index integer not null,
  outcome text not null check (outcome in ('newly-staged', 'existing', 'refreshed', 'error')),
  candidate_id text references catalog_staged_candidates(candidate_id),
  error_code text,
  validation jsonb,
  check (
    (outcome = 'error'
      and candidate_id is null
      and error_code = 'invalid-record'
      and validation is null)
    or
    (outcome in ('newly-staged', 'existing', 'refreshed')
      and candidate_id is not null
      and error_code is null
      and jsonb_typeof(validation) = 'object')
  ),
  primary key (run_id, input_index),
  foreign key (run_id, start_index)
    references catalog_staging_batches(run_id, start_index) on delete cascade
);

create table catalog_staged_artwork (
  artwork_id text primary key,
  candidate_id text not null references catalog_staged_candidates(candidate_id) on delete cascade,
  revision integer not null check (revision >= 1),
  edition_scope jsonb not null,
  source jsonb not null,
  rights_claims jsonb not null,
  rights_state jsonb not null default '{"commercialDisplay":"unknown","cachingHosting":"unknown","resizingTransformation":"unknown","status":"pending"}'::jsonb
    check (
      rights_state->>'commercialDisplay' = 'unknown'
      and rights_state->>'cachingHosting' = 'unknown'
      and rights_state->>'resizingTransformation' = 'unknown'
      and rights_state->>'status' = 'pending'
    ),
  review_state jsonb not null default '{"verification":"unverified","approval":"pending","reviewerId":null,"reviewedAt":null}'::jsonb
    check (
      review_state->>'verification' = 'unverified'
      and review_state->>'approval' = 'pending'
      and review_state->'reviewerId' = 'null'::jsonb
      and review_state->'reviewedAt' = 'null'::jsonb
    ),
  image_metadata jsonb not null,
  updated_at timestamptz not null default now()
);

create table catalog_staged_artwork_revisions (
  artwork_id text not null references catalog_staged_artwork(artwork_id) on delete cascade,
  revision integer not null check (revision >= 1),
  edition_scope jsonb not null,
  source jsonb not null,
  rights_claims jsonb not null,
  image_metadata jsonb not null,
  created_at timestamptz not null default now(),
  primary key (artwork_id, revision)
);
