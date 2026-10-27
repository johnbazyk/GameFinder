import { useEffect, useRef } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getCloudCatalogGames,
  getCloudVault,
  getMyProfile,
  replaceCloudVault,
  syncCloudCatalogGames,
} from "@/lib/social";
import { useAppStore } from "@/lib/store";

/** Merge the device vault with the signed-in cloud shelf. Guests are untouched. */
export function AccountSync() {
  const { user, isPending } = useCurrentUserState();
  const mergedFor = useRef<string | null>(null);

  useEffect(() => {
    if (isPending || !user) {
      mergedFor.current = null;
      return;
    }
    if (mergedFor.current === user.id) return;
    mergedFor.current = user.id;
    useAppStore.setState({ isPremium: false });
    void getCloudVault()
      .then(async (cloud) => {
        const cloudCatalog = await getCloudCatalogGames().catch((error) => {
          console.error("[account-sync] Couldn't load custom catalog records.", error);
          return [];
        });
        if (mergedFor.current !== user.id) return;
        const local = useAppStore.getState();
        const owned = Array.from(new Set([...cloud.owned, ...local.owned]));
        const wishlist = Array.from(new Set([...cloud.wishlist, ...local.wishlist])).filter(
          (id) => !owned.includes(id),
        );
        const customGames = Array.from(
          new Map([...cloudCatalog, ...local.customGames].map((game) => [game.id, game])).values(),
        );
        useAppStore.setState({ owned, wishlist, customGames });
        return getMyProfile()
          .then((prof) => {
            if (mergedFor.current !== user.id) return;
            if (prof.pieceColor) useAppStore.getState().setPieceColor(prof.pieceColor);
            useAppStore.setState({ isPremium: prof.plan === "premium" });
          })
          .catch((error) => {
            if (mergedFor.current !== user.id) return;
            useAppStore.setState({ isPremium: false });
            console.error("[account-sync] Couldn't verify Premium plan status.", error);
          })
          .then(async () => {
            if (mergedFor.current !== user.id) return;
            await replaceCloudVault({ data: { owned, wishlist } });
            await syncCloudCatalogGames({ data: { games: customGames } });
          });
      })
      .catch((error) => {
        mergedFor.current = null;
        console.error("[account-sync] Couldn't merge account data.", error);
      });
  }, [user, isPending]);

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
      if (state.customGames !== prev.customGames) {
        if (catalogTimer) window.clearTimeout(catalogTimer);
        catalogTimer = window.setTimeout(() => {
          const latest = useAppStore.getState();
          void syncCloudCatalogGames({ data: { games: latest.customGames } }).catch((error) => {
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

  return null;
}
