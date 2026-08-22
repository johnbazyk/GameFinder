import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  FeedbackType,
  PlayLog,
  ScoreSession,
  TablePlayer,
  VibeWeights,
  WizardContext,
  WizardResult,
} from "./types";
import { FREE_VAULT_LIMIT, PLAYER_COLORS } from "./types";
import { DEFAULT_USER_WEIGHTS } from "./vibes";
import { applyFeedbackDelta, getGame, runWizard } from "./scoring";
import { STARTER_SHELF_IDS } from "./catalog";
import { flagOn } from "./flags";

export const DEFAULT_WIZARD: WizardContext = {
  players: 4,
  ageBand: null,
  maxTimeMin: 30,
  timeOver60: false,
  vibes: [],
  exactTraits: null,
};

type AppState = {
  wizard: WizardContext;
  setWizard: (patch: Partial<WizardContext>) => void;
  resetWizard: () => void;

  lastResults: WizardResult | null;
  setResults: (r: WizardResult | null) => void;
  shownIds: string[];
  sniffAgain: () => WizardResult | null;
  startOver: () => void;

  owned: string[];
  wishlist: string[];
  addOwned: (id: string) => "ok" | "exists" | "limit";
  removeOwned: (id: string) => void;
  toggleWishlist: (id: string) => void;
  stockStarterShelf: () => "ok" | "limit";

  plays: PlayLog[];
  logPlay: (entry: Omit<PlayLog, "id" | "at">) => void;

  tablePlayers: TablePlayer[];
  addPlayer: (name: string) => "ok" | "empty" | "dup" | "limit";
  renamePlayer: (id: string, name: string) => "ok" | "empty" | "dup";
  removePlayer: (id: string) => void;

  scoreSessions: ScoreSession[];
  saveSession: (session: Omit<ScoreSession, "id" | "at">) => ScoreSession;
  deleteSession: (id: string) => void;
  lastPlayerIds: string[];
  setLastPlayerIds: (ids: string[]) => void;

  vibeWeights: VibeWeights;
  giveFeedback: (bggId: string, type: FeedbackType) => void;

  theme: "light" | "dark";
  toggleTheme: () => void;
  haptics: boolean;
  setHaptics: (v: boolean) => void;

  pendingPlayPrompt: { bggId: string; name: string } | null;
  dismissPlayPrompt: () => void;

  isPremium: boolean;
  upgrade: () => void;
  lastSurpriseId: string | null;
  setLastSurprise: (id: string | null) => void;

  upgradePrompt: string | null;
  setUpgradePrompt: (v: string | null) => void;

  recPool: { groupId: string; groupName: string; ids: string[] } | null;
  setRecPool: (v: { groupId: string; groupName: string; ids: string[] } | null) => void;
};

function haptic(enabled: boolean) {
  if (!enabled) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(12);
  }
}

function nid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      wizard: { ...DEFAULT_WIZARD },
      setWizard: (patch) => {
        haptic(get().haptics);
        set({ wizard: { ...get().wizard, ...patch } });
      },
      resetWizard: () => set({ wizard: { ...DEFAULT_WIZARD }, shownIds: [] }),

      lastResults: null,
      shownIds: [],
      setResults: (r) => {
        const top = r?.ownedTop[0] ?? r?.unownedTop[0];
        const shown = r ? [...r.ownedTop, ...r.unownedTop].map((g) => g.bggId) : [];
        set({
          lastResults: r,
          shownIds: r ? Array.from(new Set([...get().shownIds, ...shown])) : [],
          pendingPlayPrompt: top
            ? { bggId: top.bggId, name: top.name }
            : get().pendingPlayPrompt,
        });
      },
      sniffAgain: () => {
        const { wizard, owned, wishlist, plays, vibeWeights, shownIds, recPool } = get();
        const result = runWizard(
          wizard,
          {
            owned: recPool?.ids.length ? recPool.ids : owned,
            wishlist,
            plays,
            vibeWeights,
          },
          shownIds,
        );
        get().setResults(result);
        return result;
      },
      startOver: () => {
        set({
          wizard: { ...DEFAULT_WIZARD },
          lastResults: null,
          shownIds: [],
          recPool: null,
        });
      },

      owned: [],
      wishlist: [],
      addOwned: (id) => {
        const { owned, isPremium, wishlist } = get();
        if (owned.includes(id)) return "exists";
        if (flagOn("premium_paywall") && !isPremium && owned.length >= FREE_VAULT_LIMIT) {
          set({
            upgradePrompt:
              "Free vaults hold up to 50 games. Upgrade to GameFinder Premium for unlimited vault storage.",
          });
          return "limit";
        }
        haptic(get().haptics);
        set({
          owned: [...owned, id],
          wishlist: wishlist.filter((x) => x !== id),
        });
        return "ok";
      },
      removeOwned: (id) =>
        set({ owned: get().owned.filter((x) => x !== id) }),
      toggleWishlist: (id) => {
        const list = get().wishlist;
        set({
          wishlist: list.includes(id)
            ? list.filter((x) => x !== id)
            : [...list, id],
        });
      },
      stockStarterShelf: () => {
        const { owned, isPremium, addOwned } = get();
        let last: "ok" | "limit" = "ok";
        for (const id of STARTER_SHELF_IDS) {
          if (owned.includes(id)) continue;
          const r = addOwned(id);
          if (r === "limit") {
            last = "limit";
            break;
          }
        }
        return last;
      },

      plays: [],
      logPlay: (entry) => {
        const game = getGame(entry.bggId);
        const delta = entry.enjoyed ? 0.08 : -0.05;
        set({
          plays: [
            {
              ...entry,
              id: nid(),
              at: Date.now(),
            },
            ...get().plays,
          ],
          vibeWeights: game
            ? applyFeedbackDelta(get().vibeWeights, game, delta)
            : get().vibeWeights,
          pendingPlayPrompt: null,
        });
      },

      tablePlayers: [],
      addPlayer: (name) => {
        const trimmed = name.trim().slice(0, 20);
        if (!trimmed) return "empty";
        const list = get().tablePlayers;
        if (list.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return "dup";
        if (list.length >= 16) return "limit";
        const color = PLAYER_COLORS[list.length % PLAYER_COLORS.length];
        set({
          tablePlayers: [
            ...list,
            { id: nid(), name: trimmed, color, createdAt: Date.now() },
          ],
        });
        return "ok";
      },
      renamePlayer: (id, name) => {
        const trimmed = name.trim().slice(0, 20);
        if (!trimmed) return "empty";
        const list = get().tablePlayers;
        if (list.some((p) => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase())) {
          return "dup";
        }
        set({
          tablePlayers: list.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
        });
        return "ok";
      },
      removePlayer: (id) =>
        set({
          tablePlayers: get().tablePlayers.filter((p) => p.id !== id),
          lastPlayerIds: get().lastPlayerIds.filter((x) => x !== id),
        }),

      scoreSessions: [],
      saveSession: (session) => {
        const full: ScoreSession = { ...session, id: nid(), at: Date.now() };
        haptic(get().haptics);
        set({
          scoreSessions: [full, ...get().scoreSessions].slice(0, 400),
          lastPlayerIds: full.playerIds,
        });
        const game = getGame(full.bggId);
        if (game) {
          get().logPlay({
            bggId: full.bggId,
            players: full.playerIds.length,
            durationMin: game.playtime.avg,
            enjoyed: true,
          });
        }
        return full;
      },
      deleteSession: (id) =>
        set({ scoreSessions: get().scoreSessions.filter((s) => s.id !== id) }),
      lastPlayerIds: [],
      setLastPlayerIds: (ids) => set({ lastPlayerIds: ids }),

      vibeWeights: { ...DEFAULT_USER_WEIGHTS },
      giveFeedback: (bggId, type) => {
        const game = getGame(bggId);
        if (!game) return;
        const delta = type === "thumbs_up" ? 0.05 : -0.03;
        set({ vibeWeights: applyFeedbackDelta(get().vibeWeights, game, delta) });
      },

      theme: "light",
      toggleTheme: () => {
        const next = get().theme === "light" ? "dark" : "light";
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", next === "dark");
        }
        set({ theme: next });
      },
      haptics: true,
      setHaptics: (v) => set({ haptics: v }),

      pendingPlayPrompt: null,
      dismissPlayPrompt: () => set({ pendingPlayPrompt: null }),

      isPremium: false,
      upgrade: () => set({ isPremium: true, upgradePrompt: null }),
      lastSurpriseId: null,
      setLastSurprise: (id) => set({ lastSurpriseId: id }),
      upgradePrompt: null,
      setUpgradePrompt: (v) => set({ upgradePrompt: v }),

      recPool: null,
      setRecPool: (v) => set({ recPool: v }),
    }),
    {
      name: "gamefinder-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        owned: s.owned,
        wishlist: s.wishlist,
        plays: s.plays,
        vibeWeights: s.vibeWeights,
        theme: s.theme,
        haptics: s.haptics,
        wizard: s.wizard,
        lastResults: s.lastResults,
        pendingPlayPrompt: s.pendingPlayPrompt,
        isPremium: s.isPremium,
        lastSurpriseId: s.lastSurpriseId,
        shownIds: s.shownIds,
        tablePlayers: s.tablePlayers,
        scoreSessions: s.scoreSessions,
        lastPlayerIds: s.lastPlayerIds,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme === "dark" && typeof document !== "undefined") {
          document.documentElement.classList.add("dark");
        }
      },
    },
  ),
);
