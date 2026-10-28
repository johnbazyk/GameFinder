import type { CatalogGameRecord } from "./catalog-foundation";

export async function loadAndMergeAccountCatalog({
  userId,
  loadCloudCatalog,
  getLocalCatalog,
  setLocalCatalog,
  syncCloudCatalog,
  isCurrent,
}: {
  userId: string;
  loadCloudCatalog: () => Promise<CatalogGameRecord[]>;
  getLocalCatalog: () => {
    games: CatalogGameRecord[];
    ownerId: string | null | "unattributed";
  };
  setLocalCatalog: (
    games: CatalogGameRecord[],
    ownerId: string,
    preservedLocalGames: CatalogGameRecord[],
  ) => void;
  syncCloudCatalog: (games: CatalogGameRecord[]) => Promise<void>;
  isCurrent: () => boolean;
}): Promise<{ games: CatalogGameRecord[]; preservedLocalGames: CatalogGameRecord[] } | null> {
  const cloudGames = await loadCloudCatalog();
  if (!isCurrent()) return null;

  const local = getLocalCatalog();
  const canMergeLocal = local.ownerId === null || local.ownerId === userId;
  const preservedLocalGames = canMergeLocal ? [] : local.games;
  const games = Array.from(
    new Map(
      [...cloudGames, ...(canMergeLocal ? local.games : [])].map((game) => [game.id, game]),
    ).values(),
  );

  setLocalCatalog(games, userId, preservedLocalGames);
  if (!isCurrent()) return null;
  await syncCloudCatalog(games);
  if (!isCurrent()) return null;
  return { games, preservedLocalGames };
}
