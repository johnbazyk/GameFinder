import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth/middleware";
import { GAMES } from "./catalog";

export type ScanHit = {
  bggId: string | null;
  name: string;
  confidence: "high" | "review" | "unknown";
  note?: string;
  possibleExpansion?: boolean;
};

function apiKey() {
  // External photo processing stays disabled until retention, rights and
  // provider terms have been explicitly reviewed.
  return process.env.GAMEFINDER_REMOTE_SCAN_APPROVED === "1" ? process.env.XAI_API_KEY : undefined;
}

export const remoteScanAvailable = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => Boolean(apiKey()));

export const identifyShelf = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { image: string; consent: boolean }) => {
    if (input?.consent !== true) throw new Error("External photo processing requires consent");
    if (!input?.image || typeof input.image !== "string") throw new Error("Missing image");
    if (input.image.length > 6_500_000) throw new Error("Image too large");
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(input.image))
      throw new Error("Invalid image");
    return { image: input.image };
  })
  .handler(async ({ data }) => {
    const key = apiKey();
    const catalog = GAMES.map((g) => `${g.bggId}|${g.name}|${g.yearPublished}`);
    if (!key) {
      return { ok: false as const, error: "unavailable", hits: [] as ScanHit[] };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.XAI_SCAN_MODEL || "grok-4.7",
        store: false,
        temperature: 0.1,
        max_tokens: 3200,
        messages: [
          {
            role: "system",
            content: `You identify published board games visible in a photo of a shelf, table, or boxes. Match only against this catalog. Read box fronts and spine titles. The Settlers of Catan is the base game Catan. Return JSON only: {"games":[{"bggId":"id or null","name":"title","confidence":"high"|"review"|"unknown","possibleExpansion":false,"note":"short"}]}. If a box is an expansion, set possibleExpansion true. If you cannot match a catalog id, set bggId null and confidence unknown. Do not invent games that are not in the photo. Catalog:\n${catalog.join("\n")}`,
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
    if (!Array.isArray(parsed.games))
      return { ok: false as const, error: "parse", hits: [] as ScanHit[] };
    const { validateScanHits } = await import("./scan-validation");
    const hits = validateScanHits(parsed.games, GAMES);
    return { ok: true as const, hits };
  });
