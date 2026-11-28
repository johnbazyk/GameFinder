import { useEffect, useState } from "react";
import { getSubscriptionTestMode, setSubscriptionTestMode } from "@/lib/social";
import { Button } from "./ui/button";
import { toast } from "sonner";
export function SubscriptionTestControl() {
  const [mode, setMode] = useState<"actual" | "free" | "premium" | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Checking test environment…");
  useEffect(() => {
    if (import.meta.env.DEV)
      void getSubscriptionTestMode()
        .then((result) => {
          if (result.enabled) setMode(result.mode);
          else
            setStatus(
              "Testing unavailable. Start a private development server with auth off, an empty DATABASE_URL and GAMEFINDER_LOCAL_TEST_PLAN=1.",
            );
        })
        .catch(() =>
          setStatus("Cannot reach subscription testing. Check the development server and retry."),
        );
  }, []);
  if (!import.meta.env.DEV) return null;
  if (mode === null)
    return (
      <section className="mt-5 rounded-card bg-card p-4">
        <h2 className="font-display text-xl">Owner testing mode</h2>
        <p role="status" className="text-sm">
          {status}
        </p>
      </section>
    );
  return (
    <section className="mt-5 rounded-card bg-card p-4 shadow-card">
      <h2 className="font-display text-xl">Subscription testing</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Local test account only. No purchases or billing changes. Switching reloads the app and
        preserves your Vault.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["actual", "free", "premium"] as const).map((value) => (
          <Button
            key={value}
            disabled={busy}
            variant={mode === value ? "primary" : "outline"}
            aria-pressed={mode === value}
            onClick={async () => {
              setBusy(true);
              try {
                await setSubscriptionTestMode({ data: { mode: value } });
                window.location.reload();
              } catch {
                toast.error("Could not change test subscription");
                setBusy(false);
              }
            }}
          >
            {value === "actual" ? "Actual" : value === "free" ? "Free" : "Premium"}
          </Button>
        ))}
      </div>
    </section>
  );
}
