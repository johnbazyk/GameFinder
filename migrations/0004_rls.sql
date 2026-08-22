-- Row Level Security lockdown (Option A from GAMEFINDER_FAMILY_PLATFORM.md §5.4).
--
-- The app talks to Postgres ONLY from server functions over DATABASE_URL, which
-- connects as the table owner — owners bypass RLS, so the app keeps working.
-- Enabling RLS with no policies means Supabase's PostgREST roles (anon,
-- authenticated) are denied by default: the anon key can never read or write
-- family data. Better Auth ids are TEXT and do not match auth.uid(), so no
-- auth.uid() policies are written on purpose (see the brief: do not mix ids
-- without a mapping table).
--
-- Additive and idempotent. Safe under PGLite (statements parse; nothing
-- connects as a non-owner role in dev).

alter table "user" enable row level security;
alter table "session" enable row level security;
alter table "account" enable row level security;
alter table "verification" enable row level security;

alter table profiles enable row level security;
alter table vault_games enable row level security;
alter table friendships enable row level security;
alter table play_groups enable row level security;
alter table group_members enable row level security;
alter table invites enable row level security;
alter table group_plays enable row level security;
alter table group_play_seats enable row level security;
alter table group_activity enable row level security;

alter table game_sessions enable row level security;
alter table game_session_players enable row level security;
alter table family_scores enable row level security;
