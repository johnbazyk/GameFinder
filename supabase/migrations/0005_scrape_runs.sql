-- Per-invocation log for the scrape-game Netlify Function.
-- Service role writes on every invocation; anon has no access.

create table scrape_runs (
  id                         uuid primary key default gen_random_uuid(),
  game_id                    uuid not null references game_catalog(id) on delete cascade,
  started_at                 timestamptz not null default now(),
  completed_at               timestamptz,
  sources_attempted          int not null default 0,
  sources_succeeded          int not null default 0,
  sources_skipped_duplicate  int not null default 0,
  errors                     jsonb not null default '[]'::jsonb
);

create index scrape_runs_game_started_idx
  on scrape_runs (game_id, started_at desc);

alter table scrape_runs enable row level security;
-- No policies -> anon (and authenticated) are denied all ops.
-- Service role bypasses RLS, which is the only caller by design.
