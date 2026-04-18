-- Row-level security for Phase 0.
--
-- Rationale for chat tables:
-- Phase 0 is anonymous with no JWT plumbing. Token-scoped RLS (matching
-- chat_sessions.anon_session_token against a JWT claim or custom request
-- header) would require client code we haven't written yet. So chat tables
-- use PERMISSIVE policies for anon reads and scoped writes.
--
-- TODO(phase-1): Tighten chat RLS once auth is wired up. At that point:
--   - chat_sessions: SELECT/UPDATE should require the caller to prove they
--     own the session_token (via JWT claim or signed request header).
--   - chat_messages: SELECT should join through chat_sessions and require
--     the same proof-of-ownership.

alter table game_catalog   enable row level security;
alter table raw_sources    enable row level security;
alter table game_knowledge enable row level security;
alter table chat_sessions  enable row level security;
alter table chat_messages  enable row level security;

-- game_catalog: public read, no public writes.
create policy game_catalog_public_read
  on game_catalog for select
  to anon, authenticated
  using (true);

-- game_knowledge: public read, no public writes.
create policy game_knowledge_public_read
  on game_knowledge for select
  to anon, authenticated
  using (true);

-- raw_sources: no policies → anon cannot read or write. Service role
-- bypasses RLS so backfill / scrape jobs keep working.

-- chat_sessions: anon may create sessions and read/update them.
-- Permissive in Phase 0; tightened in Phase 1 (see header).
create policy chat_sessions_anon_insert
  on chat_sessions for insert
  to anon, authenticated
  with check (true);

create policy chat_sessions_anon_select
  on chat_sessions for select
  to anon, authenticated
  using (true);

create policy chat_sessions_anon_update
  on chat_sessions for update
  to anon, authenticated
  using (true)
  with check (true);

-- chat_messages: anon may read and append messages. Same Phase 0 permissive
-- stance as chat_sessions.
create policy chat_messages_anon_insert
  on chat_messages for insert
  to anon, authenticated
  with check (true);

create policy chat_messages_anon_select
  on chat_messages for select
  to anon, authenticated
  using (true);
