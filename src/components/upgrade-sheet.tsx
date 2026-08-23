import { X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { Button } from "./ui/button";

export function UpgradeSheet() {
  const prompt = useAppStore((s) => s.upgradePrompt);
  const setUpgradePrompt = useAppStore((s) => s.setUpgradePrompt);
  const navigate = useNavigate();
  if (!prompt) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-night/40 p-0 sm:place-items-center sm:p-6">
      <div className="w-full max-w-md rounded-t-2xl bg-background p-5 shadow-lift sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-fox">
              GameFinder Premium
            </p>
            <h2 className="mt-1 font-display text-2xl">A calmer family night</h2>
          </div>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-button hover:bg-muted"
            onClick={() => setUpgradePrompt(null)}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{prompt}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Unlimited vault, no ads, exact-score filters. Yearly is $29.99. Lifetime is $49.99 once.
        </p>
        <Button
          className="mt-5 w-full"
          size="xl"
          onClick={() => {
            setUpgradePrompt(null);
            navigate({ to: "/premium", search: { session_id: "" } });
          }}
        >
          See the family plan
        </Button>
        <Button className="mt-2 w-full" variant="ghost" onClick={() => setUpgradePrompt(null)}>
          Not now
        </Button>
      </div>
    </div>
  );
}
