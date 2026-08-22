import { createFileRoute, Link } from "@tanstack/react-router";
import { FLAG_DEFS, evaluate, useFlagStore, type DeviceOverride, type FlagKey, type RolloutMode } from "@/lib/flags";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/internal/flags")({ component: FlagsConsole });

const STEPS = [0, 5, 10, 25, 50, 100];

function FlagsConsole() {
  const deviceId = useFlagStore((s) => s.deviceId);
  const flags = useFlagStore((s) => s.flags);
  const bucketOverride = useFlagStore((s) => s.bucketOverride);
  const log = useFlagStore((s) => s.log);
  const setMode = useFlagStore((s) => s.setMode);
  const setPercent = useFlagStore((s) => s.setPercent);
  const setOverride = useFlagStore((s) => s.setOverride);
  const setBucketOverride = useFlagStore((s) => s.setBucketOverride);
  const resetAll = useFlagStore((s) => s.resetAll);
  const rotateDevice = useFlagStore((s) => s.rotateDevice);
  const hydrated = useFlagStore((s) => s.hydrated);

  if (!hydrated) {
    return (
      <div className="pb-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fox">Internal · staged rollouts</p>
        <h1 className="mt-1 font-display text-3xl">Feature flags</h1>
        <p className="mt-3 text-sm text-muted-foreground">Loading this device’s lab…</p>
      </div>
    );
  }

  const live = FLAG_DEFS.filter((d) => {
    const ev = evaluate(d.key, flags[d.key], deviceId, bucketOverride);
    return ev.on;
  }).length;

  return (
    <div className="pb-12">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fox">Internal · staged rollouts</p>
      <h1 className="mt-1 font-display text-3xl">Feature flags</h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Percent rollouts use a stable device bucket (0–99). Testers on this phone keep the same slice unless you rotate the id. Overrides apply only here.
      </p>

      <section className="mt-5 rounded-card bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">This device</p>
            <p className="mt-1 font-mono text-sm">{deviceId === "pending" ? "…" : deviceId}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {live} / {FLAG_DEFS.length} flags on
              {bucketOverride != null ? ` · previewing bucket ${bucketOverride}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(deviceId);
                toast("Device id copied");
              }}
            >
              Copy id
            </Button>
            <Button size="sm" variant="outline" onClick={rotateDevice}>
              New device
            </Button>
            <Button size="sm" variant="ghost" onClick={resetAll}>
              Reset defaults
            </Button>
          </div>
        </div>

        <label className="mt-4 block text-sm">
          <span className="font-semibold">Preview another bucket</span>
          <span className="ml-2 text-muted-foreground">Doesn't change the stored id.</span>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={99}
              value={bucketOverride ?? bucketForDisplay(deviceId)}
              onChange={(e) => setBucketOverride(Number(e.target.value))}
              className="flex-1 accent-fox"
            />
            <span className="w-10 tabular-nums">{bucketOverride ?? "auto"}</span>
            {bucketOverride != null ? (
              <button type="button" className="text-sm font-semibold text-sky" onClick={() => setBucketOverride(null)}>
                Clear
              </button>
            ) : null}
          </div>
        </label>
      </section>

      <div className="mt-5 space-y-3">
        {FLAG_DEFS.map((def) => {
          const runtime = flags[def.key];
          const ev = evaluate(def.key, runtime, deviceId, bucketOverride);
          return (
            <article key={def.key} data-flag={def.key} className="rounded-card bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl">{def.name}</h2>
                    <StatusPill on={ev.on} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{def.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {def.owner} · <span className="font-mono">{def.key}</span> · bucket {ev.bucket}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-fox">{ev.reason}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["off", "percent", "on"] as RolloutMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(def.key, m, m === "percent" ? Math.min(99, Math.max(1, runtime.percent || 25)) : runtime.percent)}
                    aria-label={`${def.name} ${m}`}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
                      runtime.mode === m ? "bg-fox text-cream" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {m === "off" ? "Off" : m === "on" ? "100%" : "% rollout"}
                  </button>
                ))}
              </div>

              {runtime.mode === "percent" ? (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {STEPS.filter((s) => s > 0 && s < 100).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPercent(def.key, s)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          runtime.percent === s ? "bg-night text-cream" : "bg-muted",
                        )}
                      >
                        {s}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={99}
                    value={runtime.percent}
                    onChange={(e) => setPercent(def.key, Number(e.target.value))}
                    className="mt-2 w-full accent-fox"
                    aria-label={`${def.name} percent`}
                  />
                  <p className="text-xs tabular-nums text-muted-foreground">{runtime.percent}% of devices</p>
                </div>
              ) : null}

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">This device</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(["inherit", "force_on", "force_off"] as DeviceOverride[]).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOverride(def.key, o)}
                      aria-label={`${def.name} ${o}`}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold",
                        runtime.override === o ? "bg-moss text-cream" : "bg-muted",
                      )}
                    >
                      {o === "inherit" ? "Follow rollout" : o === "force_on" ? "Force on" : "Force off"}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl">Change log</h2>
        {log.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No changes yet on this device.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border rounded-card bg-card shadow-card">
            {log.slice(0, 12).map((row, i) => (
              <li key={`${row.at}-${i}`} className="px-4 py-2.5 text-sm">
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(row.at).toLocaleTimeString()}
                </span>
                <span className="mx-2 font-semibold">{labelFor(row.flag)}</span>
                <span className="text-muted-foreground">{row.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-center text-sm">
        <Link to="/" className="font-semibold text-sky">
          Back to GameFinder
        </Link>
      </p>
    </div>
  );
}

function StatusPill({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        on ? "bg-moss text-cream" : "bg-muted text-muted-foreground",
      )}
    >
      {on ? "On" : "Off"}
    </span>
  );
}

function labelFor(flag: FlagKey | "lab"): string {
  if (flag === "lab") return "Lab";
  return FLAG_DEFS.find((d) => d.key === flag)?.name ?? flag;
}

function bucketForDisplay(deviceId: string): number {
  return evaluate("scan_games", useFlagStore.getState().flags.scan_games, deviceId, null).bucket;
}
