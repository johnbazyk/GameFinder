import crypto from "node:crypto";
import type { Handler } from "@netlify/functions";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { extractChunks, type ExtractedChunk } from "./_lib/anthropic";
import { embedBatch } from "./_lib/openai";

interface CleanError {
  raw_source_id: string;
  error: string;
}

interface RawSourceRow {
  id: string;
  raw_content: { firecrawl_markdown?: string } & Record<string, unknown>;
}

interface GameRow {
  id: string;
  name: string;
  description: string | null;
}

// Approximate April 2026 list prices (per token). Centralized here for clarity.
// Haiku 4.5 is quoted at $0.80 / $4.00 per MTok in the P0.5 ticket; text-embedding-3-small at $0.02 / MTok.
const COST_PER_HAIKU_INPUT_TOKEN = 0.8 / 1_000_000;
const COST_PER_HAIKU_OUTPUT_TOKEN = 4.0 / 1_000_000;
const COST_PER_EMBEDDING_TOKEN = 0.02 / 1_000_000;

const INVOCATION_BUDGET_USD = 1.0;
const CONFIDENCE_THRESHOLD = 0.7;

// Cap Haiku input length to keep each extraction call under Netlify's sync
// function timeout (30s). A full 55KB BGG page otherwise takes 40-60s to
// extract. ~25k chars is ~6k tokens — plenty of context for rules content
// and the first section of a BGG overview, which is where rule intros live.
const INPUT_MARKDOWN_MAX_CHARS = 25_000;

const JSON_HEADERS = { "Content-Type": "application/json" };
const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: JSON_HEADERS,
  body: JSON.stringify(body),
});

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function estimateHaikuCost(input: number, output: number): number {
  return input * COST_PER_HAIKU_INPUT_TOKEN + output * COST_PER_HAIKU_OUTPUT_TOKEN;
}

function estimateEmbeddingCost(tokens: number): number {
  return tokens * COST_PER_EMBEDDING_TOKEN;
}

async function insertKeptChunks(
  supabase: SupabaseClient,
  gameId: string,
  rawSourceId: string,
  chunks: ExtractedChunk[],
  embeddings: number[][],
): Promise<{ embedded: number; duplicate: number }> {
  // Single batch insert with ignoreDuplicates=true. The unique (game_id,
  // content_hash) index handles dedup; the response only contains actually-
  // inserted rows, so (requested - returned) = duplicates skipped.
  const rows = chunks.map((chunk, i) => ({
    game_id: gameId,
    chunk_text: chunk.content,
    embedding: embeddings[i],
    source_ids: [rawSourceId],
    confidence: chunk.confidence,
    topic: chunk.topic,
    content_hash: sha256(chunk.content),
  }));

  const result = await supabase
    .from("game_knowledge")
    .upsert(rows, { onConflict: "game_id,content_hash", ignoreDuplicates: true })
    .select("id");
  if (result.error) {
    throw new Error(`game_knowledge upsert failed: ${result.error.message}`);
  }
  const embedded = result.data?.length ?? 0;
  const duplicate = rows.length - embedded;
  return { embedded, duplicate };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "method not allowed" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const invokeToken = process.env.SCRAPE_INVOKE_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!supabaseUrl || !serviceRoleKey || !invokeToken || !anthropicKey || !openaiKey) {
    return json(500, { error: "server misconfigured" });
  }

  const providedToken =
    event.headers["x-scrape-token"] ?? event.headers["X-Scrape-Token"];
  if (providedToken !== invokeToken) {
    return json(401, { error: "unauthorized" });
  }

  let body: { game_slug?: unknown };
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(400, { error: "invalid json body" });
  }
  const gameSlug = typeof body.game_slug === "string" ? body.game_slug : null;
  if (!gameSlug) return json(400, { error: "game_slug is required" });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const gameLookup = await supabase
    .from("game_catalog")
    .select("id,name,description")
    .eq("slug", gameSlug)
    .maybeSingle();
  if (gameLookup.error) return json(500, { error: "game lookup failed" });
  if (!gameLookup.data) return json(404, { error: `game not found: ${gameSlug}` });
  const game = gameLookup.data as GameRow;

  const pendingLookup = await supabase
    .from("raw_sources")
    .select("id,raw_content")
    .eq("game_id", game.id)
    .is("cleaned_at", null)
    .order("created_at", { ascending: true });
  if (pendingLookup.error) return json(500, { error: "raw_sources lookup failed" });
  const pending = (pendingLookup.data ?? []) as RawSourceRow[];

  if (pending.length === 0) {
    return json(200, {
      status: "nothing_to_clean",
      game_slug: gameSlug,
      raw_sources_processed: 0,
      chunks_extracted: 0,
      chunks_kept: 0,
      chunks_embedded: 0,
      chunks_duplicate_skipped: 0,
      estimated_cost_usd: 0,
      cost_budget_exceeded: false,
      errors: [],
    });
  }

  const runInsert = await supabase
    .from("clean_runs")
    .insert({ game_id: game.id })
    .select("id")
    .single();
  if (runInsert.error || !runInsert.data) {
    return json(500, { error: "clean_runs insert failed" });
  }
  const runId = runInsert.data.id as string;

  // Per-source work is independent (different markdown -> different chunks),
  // so run sources in parallel to keep wall-clock time under Netlify's sync
  // timeout. The cost budget is checked per source; parallel kick-off makes
  // the check imperfect, but at ~$0.05/source the worst case is a few cents
  // of overrun on the very rare case of a fat source.
  type PerSourceResult = {
    cost: number;
    extracted: number;
    kept: number;
    embedded: number;
    duplicate: number;
    error: CleanError | null;
    markCleaned: boolean;
  };

  const emptyResult = (error: CleanError | null, markCleaned: boolean): PerSourceResult => ({
    cost: 0,
    extracted: 0,
    kept: 0,
    embedded: 0,
    duplicate: 0,
    error,
    markCleaned,
  });

  async function processSource(rs: RawSourceRow): Promise<PerSourceResult> {
    const markdown = rs.raw_content?.firecrawl_markdown;
    if (typeof markdown !== "string" || markdown.length === 0) {
      return emptyResult(
        { raw_source_id: rs.id, error: "raw_content.firecrawl_markdown missing or empty" },
        true,
      );
    }
    try {
      let localCost = 0;
      const truncated =
        markdown.length > INPUT_MARKDOWN_MAX_CHARS
          ? markdown.slice(0, INPUT_MARKDOWN_MAX_CHARS)
          : markdown;
      const { chunks, usage: haikuUsage } = await extractChunks(
        truncated,
        game.name,
        game.description ?? "",
      );
      localCost += estimateHaikuCost(haikuUsage.input_tokens, haikuUsage.output_tokens);

      const keptChunks = chunks.filter((c) => c.confidence >= CONFIDENCE_THRESHOLD);
      let embedded = 0;
      let duplicate = 0;

      if (keptChunks.length > 0) {
        const { embeddings, usage: embedUsage } = await embedBatch(
          keptChunks.map((c) => c.content),
        );
        localCost += estimateEmbeddingCost(embedUsage.total_tokens);
        const inserted = await insertKeptChunks(supabase, game.id, rs.id, keptChunks, embeddings);
        embedded = inserted.embedded;
        duplicate = inserted.duplicate;
      }

      return {
        cost: localCost,
        extracted: chunks.length,
        kept: keptChunks.length,
        embedded,
        duplicate,
        error: null,
        markCleaned: true,
      };
    } catch (err) {
      return emptyResult(
        { raw_source_id: rs.id, error: err instanceof Error ? err.message : String(err) },
        false,
      );
    }
  }

  const results = await Promise.all(pending.map(processSource));

  let processed = 0;
  let extracted = 0;
  let kept = 0;
  let embeddedCount = 0;
  let duplicateCount = 0;
  let estimatedCost = 0;
  const errors: CleanError[] = [];
  const cleanedIds: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    estimatedCost += r.cost;
    extracted += r.extracted;
    kept += r.kept;
    embeddedCount += r.embedded;
    duplicateCount += r.duplicate;
    if (r.error) errors.push(r.error);
    if (r.markCleaned) {
      cleanedIds.push(pending[i].id);
      processed += 1;
    }
  }

  const costExceeded = estimatedCost >= INVOCATION_BUDGET_USD;

  if (cleanedIds.length > 0) {
    const markUpdate = await supabase
      .from("raw_sources")
      .update({ cleaned_at: new Date().toISOString() })
      .in("id", cleanedIds);
    if (markUpdate.error) {
      console.error("cleaned_at update failed", { code: markUpdate.error.code });
    }
  }

  const update = await supabase
    .from("clean_runs")
    .update({
      completed_at: new Date().toISOString(),
      raw_sources_processed: processed,
      chunks_extracted: extracted,
      chunks_kept: kept,
      chunks_embedded: embeddedCount,
      chunks_duplicate_skipped: duplicateCount,
      estimated_cost_usd: Number(estimatedCost.toFixed(4)),
      aborted_reason: costExceeded ? "cost_budget" : null,
      errors,
    })
    .eq("id", runId);
  if (update.error) {
    console.error("clean_runs update failed", { run_id: runId, code: update.error.code });
  }

  console.log("clean-game run", {
    run_id: runId,
    game_slug: gameSlug,
    processed,
    extracted,
    kept,
    embedded: embeddedCount,
    duplicate: duplicateCount,
    estimated_cost_usd: Number(estimatedCost.toFixed(4)),
    cost_budget_exceeded: costExceeded,
    errors: errors.length,
  });

  return json(200, {
    run_id: runId,
    game_slug: gameSlug,
    raw_sources_processed: processed,
    chunks_extracted: extracted,
    chunks_kept: kept,
    chunks_embedded: embeddedCount,
    chunks_duplicate_skipped: duplicateCount,
    estimated_cost_usd: Number(estimatedCost.toFixed(4)),
    cost_budget_exceeded: costExceeded,
    errors,
  });
};
