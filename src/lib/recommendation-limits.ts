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
