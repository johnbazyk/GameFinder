-- GameFinder social layer: profiles, vault cloud, friends, tables, invites, group plays.
-- user_id is TEXT to match Better Auth ids. Scope every query in server functions.

create table if not exists profiles (
  user_id text primary key,
  display_name text not null,
  avatar_seed int not null default 0,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vault_games (
  user_id text not null,
  bgg_id text not null,
  list text not null check (list in ('owned', 'wishlist')),
  created_at timestamptz not null default now(),
  primary key (user_id, bgg_id, list)
);
create index if not exists vault_games_user_idx on vault_games (user_id);

create table if not exists friendships (
  id text primary key,
  requester_id text not null,
  addressee_id text not null,
  status text not null check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);
create index if not exists friendships_req_idx on friendships (requester_id);
create index if not exists friendships_add_idx on friendships (addressee_id);

create table if not exists play_groups (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('friends', 'family')),
  owner_id text not null,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);
create index if not exists play_groups_owner_idx on play_groups (owner_id);

create table if not exists group_members (
  group_id text not null references play_groups (id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('owner', 'admin', 'member')),
  share_vault boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on group_members (user_id);

create table if not exists invites (
  token text primary key,
  kind text not null check (kind in ('friend', 'group')),
  group_id text,
  from_user_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_by text
);
create index if not exists invites_from_idx on invites (from_user_id);

create table if not exists group_plays (
  id text primary key,
  group_id text not null references play_groups (id) on delete cascade,
  logger_id text not null,
  bgg_id text not null,
  notes text,
  played_at timestamptz not null default now()
);
create index if not exists group_plays_group_idx on group_plays (group_id, played_at desc);

create table if not exists group_play_seats (
  play_id text not null references group_plays (id) on delete cascade,
  seat int not null,
  player_name text not null,
  user_id text,
  total int not null default 0,
  won boolean not null default false,
  primary key (play_id, seat)
);

create table if not exists group_activity (
  id text primary key,
  group_id text not null references play_groups (id) on delete cascade,
  user_id text not null,
  kind text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists group_activity_idx on group_activity (group_id, created_at desc);
