import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FoxAvatar } from "@/components/fox-avatar";
import { Button } from "@/components/ui/button";
import { BILLING, billingStatus, confirmCheckout, grantPreviewPremium, startCheckout, type BillingTier } from "@/lib/billing";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/premium")({
  validateSearch: (raw: Record<string, unknown>) => ({
    session_id: typeof raw.session_id === "string" ? raw.session_id : "",
  }),
  component: PremiumPage,
});

function PremiumPage() {
  const { session_id: sessionId } = Route.useSearch();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const isPremium = useAppStore((s) => s.isPremium);
  const [stripe, setStripe] = useState<boolean | null>(null);
  const [prices, setPrices] = useState<Record<BillingTier, boolean>>({
    monthly: false,
    yearly: true,
    lifetime: false,
  });
  const [busy, setBusy] = useState<BillingTier | "preview" | "confirm" | null>(null);

  useEffect(() => {
    void billingStatus()
      .then((s) => {
        setStripe(s.stripe);
        setPrices(s.prices);
      })
      .catch(() => setStripe(false));
  }, []);

  useEffect(() => {
    if (!sessionId || !user) return;
    setBusy("confirm");
    void confirmCheckout({ data: { sessionId } })
      .then((r) => {
        if (r.ok) {
          useAppStore.setState({ isPremium: true, upgradePrompt: null });
          toast("Family Premium is on this account.");
          navigate({ to: "/premium", search: { session_id: "" } });
        } else toast("Checkout didn't finish. Try again.");
      })
      .catch((e) => toast(e instanceof Error ? e.message : "Couldn't confirm"))
      .finally(() => setBusy(null));
  }, [sessionId, user?.id]);

  async function pay(tier: BillingTier) {
    if (!user) {
      navigate({ to: "/login", search: { next: "/premium" } });
      return;
    }
    setBusy(tier);
    try {
      const r = await startCheckout({ data: { tier, origin: window.location.origin } });
      if (r.ok) {
        window.location.href = r.url;
        return;
      }
      toast(r.reason === "not-configured" ? "Stripe isn't connected yet." : r.reason);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't start checkout");
    } finally {
      setBusy(null);
    }
  }

  async function preview() {
    if (!user) {
      navigate({ to: "/login", search: { next: "/premium" } });
      return;
    }
    setBusy("preview");
    try {
      await grantPreviewPremium();
      useAppStore.setState({ isPremium: true, upgradePrompt: null });
      toast("Premium is on this account. Not a charge — billing isn't connected yet.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't preview");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="pb-10">
      <FoxAvatar mood={isPremium ? "celebrate" : "proud"} size="md" />
      <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-fox">
        Family plan
      </p>
      <h1 className="mt-2 text-center font-display text-4xl">
        {isPremium ? "You're on Premium" : "Peace at the table"}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-center text-sm text-muted-foreground">
        One family seat. Unlimited vault. No ads during the night. Finn's lessons stay on this
        account. We don't sell your plays.
      </p>

      {isPremium ? (
        <p className="mt-6 rounded-card bg-card p-4 text-center text-sm shadow-card">
          Ads are off. The vault has no cap. Advanced filters are unlocked.
        </p>
      ) : (
        <div className="mt-6 space-y-2">
          {(Object.keys(BILLING) as BillingTier[]).map((id) => {
            const t = BILLING[id];
            const featured = id === "yearly";
            const live = stripe && prices[id];
            return (
              <button
                key={id}
                type="button"
                disabled={busy !== null || (stripe === true && !prices[id])}
                onClick={() => (live ? void pay(id) : undefined)}
                className={cn(
                  "flex w-full items-center justify-between rounded-card px-4 py-4 text-left shadow-card",
                  featured ? "bg-fox text-cream" : "bg-card",
                )}
              >
                <span>
                  <span className="block font-display text-xl">{t.label}</span>
                  <span className={cn("text-sm", featured ? "text-cream/80" : "text-muted-foreground")}>
                    {t.blurb}
                  </span>
                </span>
                <span className="font-display text-2xl">{t.price}</span>
              </button>
            );
          })}
          {stripe ? (
            <p className="pt-1 text-center text-xs text-muted-foreground">
              Checkout is Stripe. We never see your card.
            </p>
          ) : (
            <div className="pt-2">
              <p className="text-center text-sm text-muted-foreground">
                Card checkout isn't connected on this site yet. You can preview Premium on a signed-in
                account so we can test the plan. It is not a charge.
              </p>
              <Button
                className="mt-3 w-full"
                disabled={busy !== null || isPending}
                onClick={() => void preview()}
              >
                {user ? "Preview Premium on this account" : "Sign in to preview"}
              </Button>
            </div>
          )}
        </div>
      )}

      <ul className="mt-8 space-y-2 text-sm">
        <li>Unlimited games in the vault — free stops at 50.</li>
        <li>No banner ads, especially not over Teach or play.</li>
        <li>Exact-score filters in the wizard.</li>
        <li>Finn lessons cached on this account's devices.</li>
        <li>One family. Extra seats later — not tonight.</li>
      </ul>

      <Link to="/profile" className="mt-6 inline-block text-sm font-semibold text-sky">
        Back to you
      </Link>
    </div>
  );
}
