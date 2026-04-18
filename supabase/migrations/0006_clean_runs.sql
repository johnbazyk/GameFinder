-- Per-invocation log for the clean-game Netlify Function plus a cleaned_at
-- skip-marker on raw_sources so reruns don't reprocess the same source.

alter table raw_sources
  add column cleaned_at timestamptz;

create table clean_runs (
  id                          uuid primary key default gen_random_uuid(),
  game_id                     uuid not null references game_catalog(id) on delete cascade,
  started_at                  timestamptz not null default now(),
  completed_at                timestamptz,
  raw_sources_processed       int not null default 0,
  chunks_extracted            int not null default 0,
  chunks_kept                 int not null default 0,
  chunks_embedded             int not null default 0,
  chunks_duplicate_skipped    int not null default 0,
  estimated_cost_usd          numeric(10,4) not null default 0,
  aborted_reason              text,
  errors                      jsonb not null default '[]'::jsonb
);

create index clean_runs_game_started_idx
  on clean_runs (game_id, started_at desc);

alter table clean_runs enable row level security;
-- No policies -> anon denied. Service role bypasses RLS.
