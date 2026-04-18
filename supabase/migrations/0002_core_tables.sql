-- Core data model for the GameFinder RAG chatbot.

create table game_catalog (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name           text not null,
  publisher      text,
  min_players    int,
  max_players    int,
  play_time_min  int,
  play_time_max  int,
  complexity     numeric(3,1),
  description    text,
  created_at     timestamptz not null default now()
);

create table raw_sources (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null references game_catalog(id) on delete cascade,
  source_type    text not null check (source_type in ('firecrawl','reddit','manual')),
  source_url     text,
  fetched_at     timestamptz not null default now(),
  raw_content    jsonb not null,
  content_hash   text not null,
  created_at     timestamptz not null default now(),
  unique (game_id, content_hash)
);

create index raw_sources_game_id_idx on raw_sources (game_id);

create table game_knowledge (
  id                  uuid primary key default gen_random_uuid(),
  game_id             uuid not null references game_catalog(id) on delete cascade,
  chunk_text          text not null,
  embedding           vector(1536) not null,
  source_ids          uuid[] not null default '{}',
  confidence          real not null default 0.5,
  topic               text,
  content_hash        text not null,
  created_at          timestamptz not null default now(),
  unique (game_id, content_hash)
);

create index game_knowledge_game_id_idx on game_knowledge (game_id);
create index game_knowledge_embedding_idx on game_knowledge using hnsw (embedding vector_cosine_ops);

create table chat_sessions (
  id                 uuid primary key default gen_random_uuid(),
  anon_session_token text unique not null,
  game_id            uuid not null references game_catalog(id) on delete cascade,
  created_at         timestamptz not null default now(),
  last_active_at     timestamptz not null default now()
);

create index chat_sessions_token_idx on chat_sessions (anon_session_token);

create table chat_messages (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references chat_sessions(id) on delete cascade,
  role                text not null check (role in ('user','assistant','system')),
  content             text not null,
  retrieved_chunk_ids uuid[] not null default '{}',
  similarity_top      real,
  created_at          timestamptz not null default now()
);

create index chat_messages_session_created_idx on chat_messages (session_id, created_at);
