-- Family mini-games: sessions, seats, and the global family score (+N to the winner).

create table if not exists game_sessions (
  id text primary key,
  group_id text not null references play_groups (id) on delete cascade,
  game_type text not null,
  status text not null check (status in ('waiting', 'active', 'finished')),
  created_by text not null,
  current_turn_user_id text,
  settings text not null default '{}',
  state text not null default '{}',
  winner_id text,
  points_awarded int,
  version int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists game_sessions_group_idx on game_sessions (group_id, created_at desc);

create table if not exists game_session_players (
  session_id text not null references game_sessions (id) on delete cascade,
  user_id text not null,
  seat int not null,
  primary key (session_id, user_id)
);
create index if not exists game_session_players_user_idx on game_session_players (user_id);

create table if not exists family_scores (
  group_id text not null references play_groups (id) on delete cascade,
  user_id text not null,
  points int not null default 0,
  games_played int not null default 0,
  wins int not null default 0,
  primary key (group_id, user_id)
);
