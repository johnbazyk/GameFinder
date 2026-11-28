import { boxTitleKey } from "./box-titles";
import type { ScanHit } from "./scan";

export type RecognitionSource = "ocr" | "visual" | "reference" | "barcode";
export type ScanEvidence = { source: RecognitionSource; hit: ScanHit };
export type ScanCatalogIdentity = { bggId: string; name: string };
export type ReviewCandidate = ScanHit & { sources: RecognitionSource[] };

/** Provider-independent identity resolution. No uncalibrated signal is auto-selected. */
export function resolveScanEvidence(
  evidence: readonly ScanEvidence[],
  catalog: readonly ScanCatalogIdentity[],
  blockedIds: ReadonlySet<string> = new Set(),
): ReviewCandidate[] {
  const results = new Map<string, ReviewCandidate>();
  // Explicit same-title expansion evidence prevents a base-game candidate from
  // being offered for this photo. A user can still search for the correct edition.
  const expansionTitles = new Set(
    evidence.filter((e) => e.hit.possibleExpansion === true).map((e) => boxTitleKey(e.hit.name)),
  );
  for (const { source, hit } of evidence) {
    const name = hit.name.trim();
    if (!name || name.length > 120) continue;
    const title = boxTitleKey(name);
    if (!title) continue;
    const named = catalog.filter((game) => boxTitleKey(game.name) === title);
    const game =
      named.length === 1 &&
      !hit.possibleExpansion &&
      !expansionTitles.has(title) &&
      (!hit.bggId || hit.bggId === named[0].bggId) &&
      !blockedIds.has(named[0].bggId) &&
      catalog.filter((g) => g.bggId === named[0].bggId).length === 1
        ? named[0]
        : undefined;
    // A known conflicting base title is deliberately not offered as an automatic/custom match.
    if (named.some((g) => blockedIds.has(g.bggId))) continue;
    const key = game ? "id:" + game.bggId : "title:" + title;
    const previous = results.get(key);
    if (previous) {
      if (!previous.sources.includes(source)) previous.sources.push(source);
      continue;
    }
    results.set(key, {
      bggId: game?.bggId ?? null,
      name: game?.name ?? name,
      confidence: game ? "review" : "unknown",
      possibleExpansion: hit.possibleExpansion,
      sources: [source],
    });
  }
  return [...results.values()];
}
