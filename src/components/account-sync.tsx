import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getCloudVault,
  getCloudCatalogGames,
  getMyProfile,
  getPremiumEntitlement,
  replaceCloudVault,
  syncCloudCatalogGames,
} from "@/lib/social";
import { useAppStore, DEFAULT_WIZARD, EMPTY_BROWSE } from "@/lib/store";
import { accountVaultKey, switchVault, mergeVaultDelta, sameVault } from "@/lib/account-vault";
import { DEFAULT_USER_WEIGHTS } from "@/lib/vibes";
import { DEFAULT_PIECE_COLOR } from "@/lib/piece-color";
import type { VaultSnapshot } from "@/lib/vault-policy";

const empty = (): VaultSnapshot => ({ owned: [], wishlist: [] });
const snapshot = (): VaultSnapshot => {
  const { owned, wishlist } = useAppStore.getState();
  return { owned, wishlist };
};

export function AccountSync() {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id ?? null;
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    let sequence = 0;
    const refresh = () => {
      const request = ++sequence;
      if (isPending || !userId) {
        useAppStore.setState({
          isPremium: false,
          entitlementReady: !isPending,
          adEntitlement: isPending ? "unknown" : "free",
        });
        return;
      }
      void getPremiumEntitlement()
        .then(({ premium }) => {
          if (active && request === sequence && useAppStore.getState().vaultOwnerId === userId)
            useAppStore.setState({
              isPremium: premium,
              entitlementReady: true,
              adEntitlement: premium ? "premium" : "free",
            });
        })
        .catch(() => {
          if (active && request === sequence)
            useAppStore.setState({
              isPremium: false,
              entitlementReady: true,
              adEntitlement: "unknown",
            });
        });
    };
    useAppStore.setState({ isPremium: false, entitlementReady: false, adEntitlement: "unknown" });
    refresh();
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.clearInterval(timer);
    };
  }, [userId, isPending, retry]);

  useEffect(() => {
    if (isPending) return;
    const s = useAppStore.getState();
    if (s.vaultOwnerId !== userId) {
      const switched = switchVault(
        { ...snapshot(), ownerId: s.vaultOwnerId },
        s.vaultArchives,
        userId,
      );
      const history = {
        ...s.accountHistory,
        [accountVaultKey(s.vaultOwnerId)]: {
          plays: s.plays,
          scoreSessions: s.scoreSessions,
          tablePlayers: s.tablePlayers,
          lastPlayerIds: s.lastPlayerIds,
          vibeWeights: s.vibeWeights,
          customGames: s.customGames,
        },
      };
      const target = history[accountVaultKey(userId)];
      useAppStore.setState({
        owned: switched.vault.owned,
        wishlist: switched.vault.wishlist,
        vaultOwnerId: userId,
        vaultArchives: switched.archives,
        accountHistory: history,
        plays: target?.plays ?? [],
        scoreSessions: target?.scoreSessions ?? [],
        tablePlayers: target?.tablePlayers ?? [],
        lastPlayerIds: target?.lastPlayerIds ?? [],
        vibeWeights: target?.vibeWeights ?? { ...DEFAULT_USER_WEIGHTS },
        customGames: target?.customGames ?? [],
        customGamesOwnerId: userId,
        ...EMPTY_BROWSE,
        wizard: { ...DEFAULT_WIZARD },
        lastResults: null,
        shownIds: [],
        recPool: null,
        pendingPlayPrompt: null,
        lastSurpriseId: null,
        upgradePrompt: null,
        pieceColor: DEFAULT_PIECE_COLOR,
        isPremium: false,
        entitlementReady: userId === null,
        adEntitlement: userId === null ? "free" : "unknown",
      });
    }
    setError(false);
    if (!userId) return;
    let active = true,
      ready = false,
      running = false,
      queued = false,
      catalogDirty = false;
    let timer: number | undefined;
    const key = accountVaultKey(userId);
    const current = () => active && useAppStore.getState().vaultOwnerId === userId;
    const fail = () => {
      if (current()) setError(true);
    };
    // Persist the acknowledged baseline, so a reconnect never resurrects remote deletions.
    const acknowledge = (cloud: VaultSnapshot, sent: VaultSnapshot) => {
      if (!current()) return;
      const next = mergeVaultDelta(sent, snapshot(), cloud);
      useAppStore.setState({
        ...next,
        vaultBaselines: { ...useAppStore.getState().vaultBaselines, [key]: cloud },
      });
    };
    const flush = async () => {
      if (!current() || !ready) return;
      if (running) {
        queued = true;
        return;
      }
      running = true;
      try {
        const sent = snapshot();
        const baseline = useAppStore.getState().vaultBaselines[key] ?? empty();
        if (!sameVault(sent, baseline)) {
          const saved = await replaceCloudVault({
            data: { ...sent, baseline, expectedUserId: userId },
          });
          acknowledge(saved, sent);
        }
        if (current() && catalogDirty) {
          catalogDirty = false;
          try {
            await syncCloudCatalogGames({
              data: { games: useAppStore.getState().customGames, expectedUserId: userId },
            });
          } catch (e) {
            catalogDirty = true;
            throw e;
          }
        }
        if (current()) setError(false);
      } catch {
        fail();
      } finally {
        running = false;
        if (queued && current()) {
          queued = false;
          void flush();
        }
      }
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void flush(), 500);
    };
    const unsub = useAppStore.subscribe((next, prev) => {
      if (!current() || !ready) return;
      if (next.customGames !== prev.customGames) {
        catalogDirty = true;
        schedule();
      }
      if (next.owned !== prev.owned || next.wishlist !== prev.wishlist) schedule();
    });
    void (async () => {
      try {
        const cloud = await getCloudVault({ data: { expectedUserId: userId } });
        if (!current()) return;
        const games = await getCloudCatalogGames({ data: { expectedUserId: userId } });
        if (!current()) return;
        const state = useAppStore.getState();
        const base = state.vaultBaselines[key] ?? empty();
        const next = mergeVaultDelta(base, snapshot(), cloud);
        const local = state.customGamesOwnerId === userId ? state.customGames : [];
        const merged = Array.from(new Map([...games, ...local].map((g) => [g.id, g])).values());
        useAppStore.setState({
          ...next,
          vaultBaselines: { ...state.vaultBaselines, [key]: cloud },
          customGames: merged,
          customGamesOwnerId: userId,
        });
        catalogDirty = local.some((g) => !games.some((c) => c.id === g.id));
        ready = true;
        await flush();
        const profile = await getMyProfile();
        if (current() && profile.pieceColor)
          useAppStore.getState().setPieceColor(profile.pieceColor);
      } catch {
        fail();
      }
    })();
    return () => {
      active = false;
      unsub();
      window.clearTimeout(timer);
    };
  }, [userId, isPending, retry]);

  return error ? (
    <div
      role="alert"
      className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 bg-destructive p-3 text-sm text-destructive-foreground"
    >
      <span>Saved account data could not be synced. Your local collection is still here.</span>
      <button
        type="button"
        className="shrink-0 font-semibold underline"
        onClick={() => setRetry((n) => n + 1)}
      >
        Retry
      </button>
      <button
        type="button"
        className="shrink-0 font-semibold underline"
        onClick={() => setError(false)}
        aria-label="Dismiss sync warning"
      >
        Dismiss
      </button>
    </div>
  ) : null;
}
