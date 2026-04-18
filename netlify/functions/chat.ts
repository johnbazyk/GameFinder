import Anthropic from "@anthropic-ai/sdk";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---- constants ----
const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const MAX_OUTPUT_TOKENS = 800;
const EMBEDDING_MODEL = "text-embedding-3-small";
const OPENAI_EMBED_ENDPOINT = "https://api.openai.com/v1/embeddings";
const SIMILARITY_THRESHOLD = 0.7;
const TOP_K = 5;
const RATE_LIMIT_PER_HOUR = 30;
const MESSAGE_MIN = 1;
const MESSAGE_MAX = 2000;

// Approximate April 2026 list prices (per token).
const COST_PER_HAIKU_INPUT_TOKEN = 0.8 / 1_000_000;
const COST_PER_HAIKU_OUTPUT_TOKEN = 4.0 / 1_000_000;
const COST_PER_EMBEDDING_TOKEN = 0.02 / 1_000_000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface MatchedChunk {
  id: string;
  chunk_text: string;
  topic: string | null;
  confidence: number;
  similarity: number;
}

interface GameRow {
  id: string;
  name: string;
  publisher: string | null;
  min_players: number | null;
  max_players: number | null;
  play_time_min: number | null;
  play_time_max: number | null;
  complexity: number | null;
  description: string | null;
}

// ---- helpers ----
function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sseChunk(event: string, data: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function embedQuery(
  text: string,
  apiKey: string,
): Promise<{ embedding: number[]; tokens: number }> {
  const res = await fetch(OPENAI_EMBED_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`openai embeddings http ${res.status}: ${body.slice(0, 200)}`);
  }
  const payload = (await res.json()) as {
    data: Array<{ embedding: number[] }>;
    usage: { total_tokens: number };
  };
  return {
    embedding: payload.data[0].embedding,
    tokens: payload.usage.total_tokens,
  };
}

function buildContextBlock(chunks: MatchedChunk[]): string {
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] (topic: ${c.topic ?? "n/a"}, confidence: ${c.confidence.toFixed(2)}, similarity: ${c.similarity.toFixed(2)})\n${c.chunk_text}`,
    )
    .join("\n---\n");
}

function buildSystemPrompt(game: GameRow, chunks: MatchedChunk[]): string {
  const publisher = game.publisher ? ` (published by ${game.publisher})` : "";
  const players =
    game.min_players != null && game.max_players != null
      ? `Players: ${game.min_players}–${game.max_players}.`
      : "";
  const play =
    game.play_time_min != null && game.play_time_max != null
      ? ` Play time: ${game.play_time_min}–${game.play_time_max} min.`
      : "";
  const complexity = game.complexity != null ? ` Complexity: ${game.complexity}/5.` : "";
  const header = `You are the AI Game Coach for the board game "${game.name}"${publisher}.\n${players}${play}${complexity}`.trim();

  return `${header}

Use ONLY the context chunks below to answer the user's question. If the chunks don't contain the answer, say so directly — do not guess, do not invent rules, do not fill gaps from general knowledge.

Keep answers concise: 2–4 short paragraphs unless the question genuinely needs more. When a chunk's topic tag is relevant ("setup", "rules", "strategy", "faq", "edge-case"), cite it naturally ("In setup, …").

Context chunks (highest similarity first):
---
${buildContextBlock(chunks)}
---`;
}

function buildFallbackText(gameName: string, chunks: MatchedChunk[]): string {
  const opening = `I don't have enough information about ${gameName} to answer that well — I might say something wrong. You'll want to check the official rules or a community guide.`;
  if (chunks.length === 0) {
    return `${opening}\n\nTry asking something more specific and I'll do my best.`;
  }
  const topics = Array.from(
    new Set(chunks.map((c) => c.topic).filter((t): t is string => Boolean(t))),
  );
  const topicLine =
    topics.length > 0
      ? `\n\nHere are the kinds of things I can help with for ${gameName}: ${topics.join(", ")}.`
      : "";
  return `${opening}${topicLine}\n\nTry asking something more specific about those areas and I'll do my best.`;
}

async function checkRateLimit(
  supabase: SupabaseClient,
  dbSessionId: string,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", dbSessionId)
    .eq("role", "user")
    .gte("created_at", oneHourAgo);
  if (error) throw new Error(`rate_limit count failed: ${error.message}`);
  if ((count ?? 0) < RATE_LIMIT_PER_HOUR) return { allowed: true };

  // Find oldest message in the last hour to compute retry_after.
  const { data: oldest, error: oldestErr } = await supabase
    .from("chat_messages")
    .select("created_at")
    .eq("session_id", dbSessionId)
    .eq("role", "user")
    .gte("created_at", oneHourAgo)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (oldestErr || !oldest) {
    return { allowed: false, retryAfterSeconds: 3600 };
  }
  const oldestAt = new Date(oldest.created_at as string).getTime();
  const expiresAt = oldestAt + 60 * 60 * 1000;
  const retryAfterSeconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
  return { allowed: false, retryAfterSeconds };
}

// ---- handler ----
export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "method not allowed" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!supabaseUrl || !anonKey || !anthropicKey || !openaiKey) {
    return jsonResponse(500, { error: "server misconfigured" });
  }

  let body: { session_id?: unknown; game_slug?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "invalid json body" });
  }

  const sessionId = typeof body.session_id === "string" ? body.session_id : "";
  const gameSlug = typeof body.game_slug === "string" ? body.game_slug : "";
  const message = typeof body.message === "string" ? body.message : "";
  if (!UUID_RE.test(sessionId)) {
    return jsonResponse(400, { error: "session_id must be a valid UUID" });
  }
  if (!gameSlug) {
    return jsonResponse(400, { error: "game_slug is required" });
  }
  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
    return jsonResponse(400, {
      error: `message must be ${MESSAGE_MIN}-${MESSAGE_MAX} characters`,
    });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Look up game
  const gameLookup = await supabase
    .from("game_catalog")
    .select(
      "id,name,publisher,min_players,max_players,play_time_min,play_time_max,complexity,description",
    )
    .eq("slug", gameSlug)
    .maybeSingle();
  if (gameLookup.error) return jsonResponse(500, { error: "game lookup failed" });
  if (!gameLookup.data) return jsonResponse(404, { error: `game not found: ${gameSlug}` });
  const game = gameLookup.data as GameRow;

  // Upsert session (unique constraint is on anon_session_token).
  const sessionUpsert = await supabase
    .from("chat_sessions")
    .upsert(
      {
        anon_session_token: sessionId,
        game_id: game.id,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "anon_session_token" },
    )
    .select("id")
    .single();
  if (sessionUpsert.error || !sessionUpsert.data) {
    return jsonResponse(500, { error: "session upsert failed" });
  }
  const dbSessionId = sessionUpsert.data.id as string;

  // Rate limit BEFORE persisting the user message.
  let rl: { allowed: boolean; retryAfterSeconds?: number };
  try {
    rl = await checkRateLimit(supabase, dbSessionId);
  } catch {
    return jsonResponse(500, { error: "rate limit check failed" });
  }
  if (!rl.allowed) {
    return jsonResponse(429, {
      error: "rate_limit",
      retry_after_seconds: rl.retryAfterSeconds ?? 3600,
    });
  }

  // Persist user message.
  const userInsert = await supabase
    .from("chat_messages")
    .insert({ session_id: dbSessionId, role: "user", content: message })
    .select("id")
    .single();
  if (userInsert.error) return jsonResponse(500, { error: "user message insert failed" });

  // Embed + retrieve.
  let embedding: number[];
  let embedTokens: number;
  try {
    const result = await embedQuery(message, openaiKey);
    embedding = result.embedding;
    embedTokens = result.tokens;
  } catch {
    return jsonResponse(502, { error: "embedding failed" });
  }

  const matchResult = await supabase.rpc("match_game_knowledge", {
    query_embedding: embedding,
    target_game_id: game.id,
    match_count: TOP_K,
  });
  if (matchResult.error) {
    return jsonResponse(500, { error: "retrieval failed" });
  }
  const chunks = (matchResult.data ?? []) as MatchedChunk[];
  const similarityTop = chunks.length > 0 ? chunks[0].similarity : 0;
  const retrievedIds = chunks.map((c) => c.id);
  const isFallback = similarityTop < SIMILARITY_THRESHOLD;

  let estimatedCost = embedTokens * COST_PER_EMBEDDING_TOKEN;

  // Start the SSE stream. Heavy lifting happens inside the ReadableStream.
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let assistantText = "";
      try {
        if (isFallback) {
          const fallback = buildFallbackText(game.name, chunks);
          // Emit in 1-2 chunks at paragraph breaks to preserve the streaming feel.
          const parts = fallback.split("\n\n");
          const firstChunk = parts.shift() ?? fallback;
          controller.enqueue(sseChunk("delta", { content: firstChunk + (parts.length ? "\n\n" : "") }));
          if (parts.length > 0) {
            controller.enqueue(sseChunk("delta", { content: parts.join("\n\n") }));
          }
          assistantText = fallback;
        } else {
          const systemPrompt = buildSystemPrompt(game, chunks);
          const anthropicStream = anthropic.messages.stream({
            model: HAIKU_MODEL,
            max_tokens: MAX_OUTPUT_TOKENS,
            system: systemPrompt,
            messages: [{ role: "user", content: message }],
          });
          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              assistantText += text;
              controller.enqueue(sseChunk("delta", { content: text }));
            }
          }
          const finalMessage = await anthropicStream.finalMessage();
          estimatedCost +=
            finalMessage.usage.input_tokens * COST_PER_HAIKU_INPUT_TOKEN +
            finalMessage.usage.output_tokens * COST_PER_HAIKU_OUTPUT_TOKEN;
        }

        // Persist assistant message.
        const assistantInsert = await supabase
          .from("chat_messages")
          .insert({
            session_id: dbSessionId,
            role: "assistant",
            content: assistantText,
            retrieved_chunk_ids: retrievedIds,
            similarity_top: similarityTop,
          })
          .select("id")
          .single();
        const assistantMessageId = assistantInsert.data?.id as string | undefined;

        // Best-effort: nudge last_active_at on session.
        supabase
          .from("chat_sessions")
          .update({ last_active_at: new Date().toISOString() })
          .eq("id", dbSessionId)
          .then(undefined, () => {});

        controller.enqueue(
          sseChunk("done", {
            session_id: sessionId,
            message_id: assistantMessageId ?? null,
            similarity_top: Number(similarityTop.toFixed(4)),
            retrieved_chunk_ids: retrievedIds,
            is_fallback: isFallback,
            estimated_cost_usd: Number(estimatedCost.toFixed(6)),
          }),
        );

        console.log("chat turn", {
          db_session_id: dbSessionId,
          game_slug: gameSlug,
          similarity_top: Number(similarityTop.toFixed(4)),
          is_fallback: isFallback,
          retrieved_count: chunks.length,
          user_message_chars: message.length,
          assistant_message_chars: assistantText.length,
          estimated_cost_usd: Number(estimatedCost.toFixed(6)),
        });
      } catch (err) {
        const shortMsg = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          sseChunk("error", { message: shortMsg.slice(0, 200) }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
};
