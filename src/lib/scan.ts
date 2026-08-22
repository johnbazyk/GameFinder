import { createServerFn } from "@tanstack/react-start";
import { standaloneGames } from "./catalog";

export type ScanHit = {
  bggId: string | null;
  name: string;
  confidence: "high" | "review" | "unknown";
  note?: string;
  possibleExpansion?: boolean;
};

function apiKey() {
  return process.env.XAI_API_KEY;
}

export const identifyShelf = createServerFn({ method: "POST" })
  .validator((input: { image: string }) => {
    if (!input?.image || typeof input.image !== "string") throw new Error("Missing image");
    if (input.image.length > 6_500_000) throw new Error("Image too large");
    return { image: input.image };
  })
  .handler(async ({ data }) => {
    const key = apiKey();
    const catalog = standaloneGames().map((g) => `${g.bggId}|${g.name}|${g.yearPublished}`);
    if (!key) {
      return { ok: false as const, error: "unavailable", hits: [] as ScanHit[] };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.1,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: `You identify published board games visible in a photo of a shelf, table, or boxes. Match only against this catalog. Return JSON only: {"games":[{"bggId":"id or null","name":"title","confidence":"high"|"review"|"unknown","possibleExpansion":false,"note":"short"}]}. If a box is an expansion, set possibleExpansion true. If you cannot match a catalog id, set bggId null and confidence unknown. Do not invent games that are not in the photo. Catalog:\n${catalog.join("\n")}`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify every board game visible. Prefer catalog ids. Photos are used only for this identification.",
              },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: `xAI API error ${res.status}`, hits: [] as ScanHit[] };
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = body.choices?.[0]?.message?.content ?? "";
    const json = raw.replace(/^```json\s*|\s*```$/g, "");
    const start = json.indexOf("{");
    const end = json.lastIndexOf("}");
    if (start < 0 || end < 0) {
      return { ok: false as const, error: "parse", hits: [] as ScanHit[] };
    }
    let parsed: { games?: ScanHit[] } = {};
    try {
      parsed = JSON.parse(json.slice(start, end + 1)) as { games?: ScanHit[] };
    } catch {
      return { ok: false as const, error: "parse", hits: [] as ScanHit[] };
    }
    const known = new Map(standaloneGames().map((g) => [g.bggId, g]));
    const byName = new Map(standaloneGames().map((g) => [g.name.toLowerCase(), g]));
    const hits: ScanHit[] = (parsed.games ?? []).slice(0, 40).map((h) => {
      const byId = h.bggId ? known.get(String(h.bggId)) : undefined;
      const named = byName.get((h.name ?? "").toLowerCase());
      const game = byId ?? named;
      const confidence = game
        ? h.confidence === "high"
          ? "high"
          : "review"
        : "unknown";
      return {
        bggId: game?.bggId ?? null,
        name: game?.name ?? h.name ?? "Unknown box",
        confidence,
        note: h.note,
        possibleExpansion: Boolean(h.possibleExpansion),
      };
    });
    return { ok: true as const, hits };
  });
