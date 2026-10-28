import { useEffect, useRef, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getCloudVault,
  getCloudCatalogGames,
  getMyProfile,
  replaceCloudVault,
  syncCloudCatalogGames,
} from "@/lib/social";
import { useAppStore } from "@/lib/store";
import { loadAndMergeAccountCatalog } from "@/lib/catalog-sync";

/** Merge the device vault with the signed-in cloud shelf. Guests are untouched. */
export function AccountSync() {
  const { user, isPending } = useCurrentUserState();
  const mergedFor = useRef<string | null>(null);
  const catalogLoadedFor = useRef<string | null>(null);
  const [catalogSyncError, setCatalogSyncError] = useState(false);
  const [catalogRetry, setCatalogRetry] = useState(0);

  useEffect(() => {
    if (isPending || !user) {
      mergedFor.current = null;
      catalogLoadedFor.current = null;
      return;
    }
    if (mergedFor.current === user.id && catalogLoadedFor.current === user.id) return;
    mergedFor.current = user.id;
    catalogLoadedFor.current = null;
    setCatalogSyncError(false);
    useAppStore.setState({ isPremium: false });
    let active = true;
    const isCurrent = () => active && mergedFor.current === user.id;
    void (async () => {
      try {
        const cloud = await getCloudVault();
        if (!isCurrent()) return;
        const catalogResult = await loadAndMergeAccountCatalog({
          userId: user.id,
          loadCloudCatalog: getCloudCatalogGames,
          getLocalCatalog: () => {
            const state = useAppStore.getState();
            return { games: state.customGames, ownerId: state.customGamesOwnerId };
          },
          setLocalCatalog: (games, ownerId, preservedLocalGames) => {
            const state = useAppStore.getState();
            const unattributedCustomGames = Array.from(
              new Map(
                [...state.unattributedCustomGames, ...preservedLocalGames].map((game) => [
                  game.id,
                  game,
                ]),
              ).values(),
            );
            useAppStore.setState({
              customGames: games,
              customGamesOwnerId: ownerId,
              unattributedCustomGames,
            });
          },
          syncCloudCatalog: async () => {
            if (!isCurrent()) return;
            const latest = useAppStore.getState();
            if (latest.customGamesOwnerId !== user.id) return;
            await syncCloudCatalogGames({ data: { games: latest.customGames } });
          },
          isCurrent,
        });
        if (!catalogResult || !isCurrent()) return;
        catalogLoadedFor.current = user.id;

        const local = useAppStore.getState();
        const owned = Array.from(new Set([...cloud.owned, ...local.owned]));
        const wishlist = Array.from(new Set([...cloud.wishlist, ...local.wishlist])).filter(
          (id) => !owned.includes(id),
        );
        useAppStore.setState({ owned, wishlist });
        try {
          const prof = await getMyProfile();
          if (!isCurrent()) return;
          if (prof.pieceColor) useAppStore.getState().setPieceColor(prof.pieceColor);
          useAppStore.setState({ isPremium: prof.plan === "premium" });
        } catch (error) {
          if (!isCurrent()) return;
          useAppStore.setState({ isPremium: false });
          console.error("[account-sync] Couldn't verify Premium plan status.", error);
        }
        if (isCurrent()) await replaceCloudVault({ data: { owned, wishlist } });
      } catch (error) {
        if (!isCurrent()) return;
        setCatalogSyncError(true);
        console.error("[account-sync] Couldn't load or sync saved account data.", error);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, isPending, catalogRetry]);

  useEffect(() => {
    if (!user) return;
    let vaultTimer: number | null = null;
    let catalogTimer: number | null = null;
    const unsub = useAppStore.subscribe((state, prev) => {
      if (state.owned !== prev.owned || state.wishlist !== prev.wishlist) {
        if (vaultTimer) window.clearTimeout(vaultTimer);
        vaultTimer = window.setTimeout(() => {
          const latest = useAppStore.getState();
          void replaceCloudVault({
            data: { owned: latest.owned, wishlist: latest.wishlist },
          }).catch((error) => {
            console.error("[account-sync] Couldn't save the cloud Vault.", error);
          });
        }, 900);
      }
      if (
        state.customGames !== prev.customGames &&
        state.customGamesOwnerId === user.id &&
        catalogLoadedFor.current === user.id
      ) {
        if (catalogTimer) window.clearTimeout(catalogTimer);
        catalogTimer = window.setTimeout(() => {
          const latest = useAppStore.getState();
          if (
            latest.customGamesOwnerId !== user.id ||
            catalogLoadedFor.current !== user.id
          ) {
            return;
          }
          void syncCloudCatalogGames({ data: { games: latest.customGames } })
            .then(() => {
              if (mergedFor.current === user.id) setCatalogSyncError(false);
            })
            .catch((error) => {
              if (mergedFor.current === user.id) setCatalogSyncError(true);
              console.error("[account-sync] Couldn't save custom catalog records.", error);
            });
        }, 900);
      }
    });
    return () => {
      unsub();
      if (vaultTimer) window.clearTimeout(vaultTimer);
      if (catalogTimer) window.clearTimeout(catalogTimer);
    };
  }, [user]);

  return catalogSyncError ? (
    <div
      role="alert"
      className="fixed inset-x-3 bottom-3 z-[100] flex items-center justify-between gap-3 rounded-card bg-destructive p-3 text-sm text-destructive-foreground shadow-lift"
    >
      <span>Saved account data could not be synced. Your local catalog is still here.</span>
      <button
        type="button"
        className="shrink-0 font-semibold underline"
        onClick={() => {
          mergedFor.current = null;
          catalogLoadedFor.current = null;
          setCatalogRetry((retry) => retry + 1);
        }}
      >
        Retry
      </button>
    </div>
  ) : null;
}
