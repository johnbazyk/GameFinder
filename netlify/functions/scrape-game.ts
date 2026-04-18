import crypto from "node:crypto";
import type { Handler } from "@netlify/functions";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SCRAPE_SOURCES, type ScrapeSource } from "./_lib/scrape-sources";

interface ScrapeError {
  url: string;
  error: string;
}

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    metadata?: Record<string, unknown>;
  };
  error?: string;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

// Canonical JSON with sorted keys — used for the dedup content hash so re-scraping
// the same URL produces the same hash regardless of key-insertion order.
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalJson).join(",") + "]";
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return (
    "{" +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ":" +
          canonicalJson((value as Record<string, unknown>)[k]),
      )
      .join(",") +
    "}"
  );
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function firecrawlScrape(
  apiKey: string,
  url: string,
): Promise<{ markdown: string; metadata: Record<string, unknown> }> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`firecrawl http ${res.status}`);
  }
  const body = (await res.json()) as FirecrawlResponse;
  if (!body.success || !body.data?.markdown) {
    throw new Error(body.error ?? "firecrawl returned no markdown");
  }
  return {
    markdown: body.data.markdown,
    metadata: body.data.metadata ?? {},
  };
}

async function processUrl(
  supabase: SupabaseClient,
  firecrawlKey: string,
  gameId: string,
  source: ScrapeSource,
): Promise<"inserted" | "duplicate"> {
  const { markdown, metadata } = await firecrawlScrape(firecrawlKey, source.url);

  // Hash inputs exclude Firecrawl metadata because it contains per-call fields
  // (scrapeId, cacheState, cachedAt) that would break the unique-content dedup.
  // Metadata is still persisted in raw_content for audit/debug.
  const hashInputs = {
    url: source.url,
    url_category: source.category,
    firecrawl_markdown: markdown,
  };
  const contentHash = sha256(canonicalJson(hashInputs));

  const rawContent = { ...hashInputs, firecrawl_metadata: metadata };

  // Pre-check by hash to distinguish "inserted" from "duplicate". The unique index
  // is the actual integrity guarantee; this select just lets us report counters.
  const existing = await supabase
    .from("raw_sources")
    .select("id")
    .eq("game_id", gameId)
    .eq("content_hash", contentHash)
    .maybeSingle();
  if (existing.error) throw new Error(`db select failed: ${existing.error.message}`);
  if (existing.data) return "duplicate";

  const insert = await supabase.from("raw_sources").insert({
    game_id: gameId,
    source_type: "firecrawl",
    source_url: source.url,
    raw_content: rawContent,
    content_hash: contentHash,
  });
  if (insert.error) {
    // Race against the unique index — treat as duplicate rather than error.
    if (insert.error.code === "23505") return "duplicate";
    throw new Error(`db insert failed: ${insert.error.message}`);
  }
  return "inserted";
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "method not allowed" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const invokeToken = process.env.SCRAPE_INVOKE_TOKEN;
  if (!supabaseUrl || !serviceRoleKey || !firecrawlKey || !invokeToken) {
    return json(500, { error: "server misconfigured" });
  }

  const providedToken = event.headers["x-scrape-token"] ?? event.headers["X-Scrape-Token"];
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
  if (!gameSlug) {
    return json(400, { error: "game_slug is required" });
  }

  const sources = SCRAPE_SOURCES[gameSlug];
  if (!sources || sources.length === 0) {
    return json(400, { error: `no sources configured for ${gameSlug}` });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const gameLookup = await supabase
    .from("game_catalog")
    .select("id")
    .eq("slug", gameSlug)
    .maybeSingle();
  if (gameLookup.error) {
    return json(500, { error: "game lookup failed" });
  }
  if (!gameLookup.data) {
    return json(404, { error: `game not found: ${gameSlug}` });
  }
  const gameId = gameLookup.data.id as string;

  const runInsert = await supabase
    .from("scrape_runs")
    .insert({ game_id: gameId, sources_attempted: sources.length })
    .select("id")
    .single();
  if (runInsert.error || !runInsert.data) {
    return json(500, { error: "scrape_runs insert failed" });
  }
  const runId = runInsert.data.id as string;

  let succeeded = 0;
  let skipped = 0;
  const errors: ScrapeError[] = [];

  for (const source of sources) {
    try {
      const outcome = await processUrl(supabase, firecrawlKey, gameId, source);
      if (outcome === "inserted") succeeded += 1;
      else skipped += 1;
    } catch (err) {
      errors.push({
        url: source.url,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const update = await supabase
    .from("scrape_runs")
    .update({
      completed_at: new Date().toISOString(),
      sources_succeeded: succeeded,
      sources_skipped_duplicate: skipped,
      errors,
    })
    .eq("id", runId);
  if (update.error) {
    console.error("scrape_runs update failed", { run_id: runId, code: update.error.code });
  }

  console.log("scrape-game run", {
    run_id: runId,
    game_slug: gameSlug,
    attempted: sources.length,
    succeeded,
    skipped,
    errors: errors.length,
  });

  return json(200, {
    run_id: runId,
    game_slug: gameSlug,
    sources_attempted: sources.length,
    sources_succeeded: succeeded,
    sources_skipped_duplicate: skipped,
    errors,
  });
};
