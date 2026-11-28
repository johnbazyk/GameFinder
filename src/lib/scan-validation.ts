import { boxTitleKey } from "./box-titles";
import type { ScanHit } from "./scan";

/** Never trust provider identifiers or confidence without catalog agreement. */
export function validateScanHits(
  input: unknown[],
  catalog: readonly { bggId: string; name: string }[],
): ScanHit[] {
  const known = new Map(catalog.map((g) => [g.bggId, g]));
  const byName = new Map<string, (typeof catalog)[number][]>();
  for (const game of catalog) {
    const key = boxTitleKey(game.name);
    byName.set(key, [...(byName.get(key) ?? []), game]);
  }
  const hits: ScanHit[] = [];
  for (const entry of input.slice(0, 40)) {
    if (!entry || typeof entry !== "object") continue;
    const h = entry as Record<string, unknown>;
    if (typeof h.name !== "string" || !h.name.trim() || h.name.length > 120) continue;
    const name = h.name.trim();
    const named = byName.get(boxTitleKey(name)) ?? [];
    const id = typeof h.bggId === "string" ? known.get(h.bggId) : undefined;
    const expansion = h.possibleExpansion === true;
    const validExpansion = h.possibleExpansion === undefined || h.possibleExpansion === false;
    const game =
      validExpansion && named.length === 1 && (h.bggId == null || id === named[0])
        ? named[0]
        : undefined;
    hits.push({
      bggId: game?.bggId ?? null,
      name: game?.name ?? name,
      confidence: game ? (id && h.confidence === "high" ? "high" : "review") : "unknown",
      possibleExpansion: expansion,
    });
  }
  return hits;
}
