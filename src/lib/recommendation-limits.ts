/** Product limit per recommendation group, never a catalog retrieval limit. */
export const RECOMMENDATION_LIMIT = 3;
export function recommendationGroup<T>(items: readonly T[], limit = RECOMMENDATION_LIMIT): T[] {
  const count = Number.isFinite(limit)
    ? Math.max(0, Math.min(RECOMMENDATION_LIMIT, Math.floor(limit)))
    : RECOMMENDATION_LIMIT;
  return items.slice(0, count);
}
export function discoverDisplay<T>(
  matches: readonly T[],
  featured: readonly T[],
  options: { query: string; filtered: boolean; browseAll: boolean },
): T[] {
  if (options.query.trim() || options.browseAll) return [...matches];
  return recommendationGroup(options.filtered ? matches : featured);
}

/** Acquisition recommendations only: never apply to manual retrieval. */
export function unownedCandidates<T extends { bggId: string }>(
  games: readonly T[],
  ownedIds: readonly string[],
): T[] {
  const owned = new Set(ownedIds);
  return games.filter((game) => !owned.has(game.bggId));
}
export function featuredRotation<T extends { bggId: string }>(
  pool: readonly T[],
  ownedIds: readonly string[],
  now = Date.now(),
): T[] {
  if (!pool.length) return [];
  // Stable UTC weeks; step by one so every curated title gets exposure.
  const index = ((Math.floor(now / 604800000) % pool.length) + pool.length) % pool.length;
  return recommendationGroup(
    unownedCandidates([...pool.slice(index), ...pool.slice(0, index)], ownedIds),
  );
}
