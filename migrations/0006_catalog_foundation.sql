-- Unified catalog record and rights metadata foundation.
-- No provider data or rulebook content is seeded by this migration.

create table if not exists catalog_games (
  owner_user_id text not null references "user" (id) on delete cascade,
  id text not null,
  title text not null,
  record jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_user_id, id)
);
create index if not exists catalog_games_owner_title_idx
  on catalog_games (owner_user_id, lower(title));

create table if not exists catalog_external_ids (
  owner_user_id text not null,
  catalog_game_id text not null,
  provider text not null,
  external_id text not null,
  primary key (owner_user_id, catalog_game_id, provider),
  unique (owner_user_id, provider, external_id),
  foreign key (owner_user_id, catalog_game_id)
    references catalog_games (owner_user_id, id) on delete cascade
);
create index if not exists catalog_external_ids_lookup_idx
  on catalog_external_ids (provider, external_id);

create table if not exists rulebook_sources (
  id text primary key,
  catalog_game_id text not null,
  edition text,
  publisher text,
  official_source_url text not null,
  document_title text not null,
  language text not null,
  version text,
  publication_date date,
  last_verified_at date,
  source_classification text not null check (
    source_classification in ('official-publisher', 'third-party', 'user-provided', 'fictional-test')
  ),
  copyright_status text not null default 'permission-pending' check (
    copyright_status in (
      'unknown',
      'official-link-available',
      'permission-pending',
      'authorized',
      'denied',
      'revoked'
    )
  ),
  allow_storage boolean not null default false,
  allow_parsing boolean not null default false,
  allow_ai_retrieval boolean not null default false,
  allow_display boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rulebook_sources_game_idx
  on rulebook_sources (catalog_game_id, edition);

-- Match the server-only access model from 0004_rls.sql. The application
-- connects as the table owner; browser-facing PostgREST roles get no access.
alter table catalog_games enable row level security;
alter table catalog_external_ids enable row level security;
alter table rulebook_sources enable row level security;

revoke all privileges on table catalog_games, catalog_external_ids, rulebook_sources from public;

do $$
declare
  role_name text;
begin
  for role_name in
    select rolname from pg_roles where rolname in ('anon', 'authenticated')
  loop
    execute format(
      'revoke all privileges on table catalog_games, catalog_external_ids, rulebook_sources from %I',
      role_name
    );
  end loop;
end
$$;
