-- Cosine-similarity retrieval over game_knowledge, scoped to a single game.
-- Uses the HNSW index created in migration 0002.

create or replace function match_game_knowledge(
  query_embedding vector(1536),
  target_game_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  chunk_text text,
  topic text,
  confidence real,
  similarity real
)
language sql stable as $$
  select gk.id,
         gk.chunk_text,
         gk.topic,
         gk.confidence,
         (1 - (gk.embedding <=> query_embedding))::real as similarity
  from game_knowledge gk
  where gk.game_id = target_game_id
  order by gk.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function match_game_knowledge(vector, uuid, int) to anon, authenticated;
