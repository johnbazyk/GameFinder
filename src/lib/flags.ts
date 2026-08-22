import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { hashString } from "./utils";

export const FLAG_KEYS = [
  "scan_games",
  "surprise_me",
  "banner_ads",
  "premium_paywall",
  "bookworm",
  "advanced_filters",
  "expand_shelf",
  "amazon_cta",
] as const;

export type FlagKey = (typeof FLAG_KEYS)[number];
export type RolloutMode = "off" | "percent" | "on";
export type DeviceOverride = "inherit" | "force_on" | "force_off";

export type FlagDef = {
  key: FlagKey;
  name: string;
  description: string;
  owner: string;
  defaultMode: RolloutMode;
  defaultPercent: number;
};

export type FlagRuntime = {
  mode: RolloutMode;
  percent: number;
  override: DeviceOverride;
};

export type FlagLog = {
  at: number;
  flag: FlagKey | "lab";
  detail: string;
};

export const FLAG_DEFS: FlagDef[] = [
  {
    key: "scan_games",
    name: "Scan Games",
    description: "Photo identification of boxes on Vault and Profile. Manual search stays available.",
    owner: "Mary / shelf",
    defaultMode: "on",
    defaultPercent: 100,
  },
  {
    key: "surprise_me",
    name: "Surprise Me",
    description: "One random owned game from Home. Find-a-Game is unaffected.",
    owner: "John / decision",
    defaultMode: "on",
    defaultPercent: 100,
  },
  {
    key: "banner_ads",
    name: "Free banner ads",
    description: "Labeled mock ads for Free users. Premium still hides them.",
    owner: "John / monetize",
    defaultMode: "on",
    defaultPercent: 100,
  },
  {
    key: "premium_paywall",
    name: "50-game vault cap",
    description: "Free vault limit and upgrade prompts. Off = unlimited on this build.",
    owner: "John / monetize",
    defaultMode: "on",
    defaultPercent: 100,
  },
  {
    key: "bookworm",
    name: "Bookworm (voice coach)",
    description: "Finn teaches rules aloud with Grok voice, and stays at the table for rulings.",
    owner: "John / teach",
    defaultMode: "on",
    defaultPercent: 100,
  },
  {
    key: "advanced_filters",
    name: "Advanced exact-score filters",
    description: "Premium sliders on the vibe step. Still requires Premium if the paywall is on.",
    owner: "John / premium",
    defaultMode: "on",
    defaultPercent: 100,
  },
  {
    key: "expand_shelf",
    name: "Expand Your Shelf",
    description: "Three unowned recommendations under vault results.",
    owner: "Mary / discovery",
    defaultMode: "on",
    defaultPercent: 100,
  },
  {
    key: "amazon_cta",
    name: "Amazon buy buttons",
    description: "Affiliate search links on results and game pages.",
    owner: "John / revenue",
    defaultMode: "on",
    defaultPercent: 100,
  },
];

function defaults(): Record<FlagKey, FlagRuntime> {
  return Object.fromEntries(
    FLAG_DEFS.map((d) => [
      d.key,
      { mode: d.defaultMode, percent: d.defaultPercent, override: "inherit" as const },
    ]),
  ) as Record<FlagKey, FlagRuntime>;
}

function newDeviceId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function bucketFor(deviceId: string, flag: FlagKey): number {
  return hashString(`${deviceId}:${flag}`) % 100;
}

export function evaluate(
  flag: FlagKey,
  runtime: FlagRuntime,
  deviceId: string,
  bucketOverride: number | null,
): { on: boolean; reason: string; bucket: number } {
  const bucket = bucketOverride ?? bucketFor(deviceId, flag);
  if (runtime.override === "force_on") {
    return { on: true, reason: "Forced on for this device", bucket };
  }
  if (runtime.override === "force_off") {
    return { on: false, reason: "Forced off for this device", bucket };
  }
  if (runtime.mode === "off") {
    return { on: false, reason: "Kill switch — everyone off", bucket };
  }
  if (runtime.mode === "on") {
    return { on: true, reason: "Rolled out to 100%", bucket };
  }
  const on = bucket < runtime.percent;
  return {
    on,
    reason: on
      ? `In the ${runtime.percent}% slice (bucket ${bucket})`
      : `Outside the ${runtime.percent}% slice (bucket ${bucket})`,
    bucket,
  };
}

type FlagsState = {
  deviceId: string;
  flags: Record<FlagKey, FlagRuntime>;
  bucketOverride: number | null;
  log: FlagLog[];
  hydrated: boolean;
  setMode: (flag: FlagKey, mode: RolloutMode, percent?: number) => void;
  setPercent: (flag: FlagKey, percent: number) => void;
  setOverride: (flag: FlagKey, override: DeviceOverride) => void;
  setBucketOverride: (n: number | null) => void;
  resetAll: () => void;
  rotateDevice: () => void;
};

function pushLog(log: FlagLog[], entry: FlagLog): FlagLog[] {
  return [entry, ...log].slice(0, 40);
}

export const useFlagStore = create<FlagsState>()(
  persist(
    (set, get) => ({
      deviceId: "pending",
      flags: defaults(),
      bucketOverride: null,
      log: [],
      hydrated: false,
      setMode: (flag, mode, percent) => {
        const cur = get().flags[flag];
        const nextPercent = percent ?? cur.percent;
        set({
          flags: {
            ...get().flags,
            [flag]: { ...cur, mode, percent: nextPercent },
          },
          log: pushLog(get().log, {
            at: Date.now(),
            flag,
            detail: `rollout → ${mode}${mode === "percent" ? ` ${nextPercent}%` : ""}`,
          }),
        });
      },
      setPercent: (flag, percent) => {
        const cur = get().flags[flag];
        const p = Math.max(0, Math.min(100, Math.round(percent)));
        set({
          flags: { ...get().flags, [flag]: { ...cur, percent: p, mode: p === 0 ? "off" : p === 100 ? "on" : "percent" } },
          log: pushLog(get().log, { at: Date.now(), flag, detail: `percent → ${p}%` }),
        });
      },
      setOverride: (flag, override) => {
        const cur = get().flags[flag];
        set({
          flags: { ...get().flags, [flag]: { ...cur, override } },
          log: pushLog(get().log, { at: Date.now(), flag, detail: `this device → ${override}` }),
        });
      },
      setBucketOverride: (n) =>
        set({
          bucketOverride: n,
          log: pushLog(get().log, {
            at: Date.now(),
            flag: "lab",
            detail: n == null ? "cleared bucket preview" : `preview bucket ${n}`,
          }),
        }),
      resetAll: () =>
        set({
          flags: defaults(),
          bucketOverride: null,
          log: pushLog(get().log, { at: Date.now(), flag: "lab", detail: "reset all flags to defaults" }),
        }),
      rotateDevice: () =>
        set({
          deviceId: newDeviceId(),
          log: pushLog(get().log, { at: Date.now(), flag: "lab", detail: "new device id" }),
        }),
    }),
    {
      name: "gamefinder-flags-v2",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        deviceId: s.deviceId,
        flags: s.flags,
        bucketOverride: s.bucketOverride,
        log: s.log,
      }),
    },
  ),
);

export function useFlag(key: FlagKey): boolean {
  return useFlagStore((s) => {
    const def = FLAG_DEFS.find((d) => d.key === key);
    const runtime = s.flags[key] ?? {
      mode: def?.defaultMode ?? "off",
      percent: def?.defaultPercent ?? 0,
      override: "inherit" as const,
    };
    return evaluate(key, runtime, s.deviceId === "pending" ? "pending" : s.deviceId, s.bucketOverride).on;
  });
}

export async function markFlagsHydrated() {
  if (useFlagStore.getState().hydrated) return;
  await useFlagStore.persist.rehydrate();
  const s = useFlagStore.getState();
  useFlagStore.setState({
    hydrated: true,
    deviceId: s.deviceId && s.deviceId !== "pending" ? s.deviceId : newDeviceId(),
  });
}

export function flagOn(key: FlagKey): boolean {
  const s = useFlagStore.getState();
  const def = FLAG_DEFS.find((d) => d.key === key);
  const runtime = s.flags[key] ?? {
    mode: def?.defaultMode ?? "off",
    percent: def?.defaultPercent ?? 0,
    override: "inherit" as const,
  };
  return evaluate(key, runtime, s.deviceId, s.bucketOverride).on;
}

if (typeof window !== "undefined") {
  void markFlagsHydrated();
}
