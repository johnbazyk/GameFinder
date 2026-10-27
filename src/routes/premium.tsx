import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FoxAvatar } from "@/components/fox-avatar";
import { BILLING, billingStatus, confirmCheckout, startCheckout, type BillingTier } from "@/lib/billing";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { usePremiumAccess } from "@/lib/use-premium-access";

export const Route = createFileRoute("/premium")({
  validateSearch: (raw: Record<string, unknown>) => ({
    session_id: typeof raw.session_id === "string" ? raw.session_id : "",
  }),
  component: PremiumPage,
});

function PremiumPage() {
  const { session_id: sessionId } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useCurrentUserState();
  const userId = user?.id;
  const { access, retry: retryEntitlement } = usePremiumAccess();
  const isPremium = access === "premium";
  const [stripe, setStripe] = useState<boolean | null>(null);
  const [subscriptionManagement, setSubscriptionManagement] = useState(false);
  const [prices, setPrices] = useState<Record<BillingTier, boolean>>({
    monthly: false,
    yearly: false,
  });
  const [billingError, setBillingError] = useState<string | null>(null);
  const [busy, setBusy] = useState<BillingTier | "confirm" | null>(null);

  useEffect(() => {
    void billingStatus()
      .then((s) => {
        setStripe(s.stripe);
        setSubscriptionManagement(s.subscriptionManagement);
        setPrices(s.prices);
      })
      .catch((error) => {
        setStripe(false);
        setSubscriptionManagement(false);
        setPrices({ monthly: false, yearly: false });
        setBillingError(
          error instanceof Error
            ? error.message
            : "Couldn't verify the Stripe checkout configuration.",
        );
      });
  }, []);

  useEffect(() => {
    if (!sessionId || !userId) return;
    setBusy("confirm");
    void confirmCheckout({ data: { sessionId } })
      .then((r) => {
        if (r.ok) {
          useAppStore.setState({ isPremium: true, upgradePrompt: null });
          retryEntitlement();
          toast("GameFinder Premium is on this account.");
          navigate({ to: "/premium", search: { session_id: "" } });
        } else toast("Checkout didn't finish. Try again.");
      })
      .catch((e) => toast(e instanceof Error ? e.message : "Couldn't confirm"))
      .finally(() => setBusy(null));
  }, [sessionId, userId, navigate, retryEntitlement]);

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
      toast(
        r.reason === "not-configured"
          ? "Checkout isn't configured yet."
          : r.reason === "price-mismatch"
            ? "Checkout is disabled because the configured Stripe price doesn't match this plan."
            : r.reason,
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't start checkout");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="pb-10">
      <FoxAvatar mood={isPremium ? "celebrate" : "proud"} size="md" />
      <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-fox">
        GameFinder Premium
      </p>
      <h1 className="mt-2 text-center font-display text-4xl">
        {isPremium ? "You're on Premium" : "More room for game night"}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-center text-sm text-muted-foreground">
        Keep an unlimited Vault, enjoy an ad-free experience, tune exact scores in Vibe filters,
        and unlock Scores &amp; Win History. Your plays stay yours.
      </p>

      {access === "error" ? (
        <p role="alert" className="mt-5 rounded-card bg-muted p-3 text-sm text-muted-foreground">
          We couldn’t verify this account’s Premium entitlement. Scoring remains locked until it
          can be verified.
        </p>
      ) : null}

      <section className="mt-6 space-y-2" aria-labelledby="plan-prices">
        <h2 id="plan-prices" className="font-display text-2xl">
          Subscription plans
        </h2>
        {(Object.keys(BILLING) as BillingTier[]).map((id) => {
          const plan = BILLING[id];
          const featured = id === "yearly";
          const available =
            subscriptionManagement && stripe === true && prices[id];
          return (
            <button
              key={id}
              type="button"
              disabled={busy !== null || !available || access !== "free"}
              onClick={() => (available && access === "free" ? void pay(id) : undefined)}
              className={cn(
                "flex min-h-20 w-full items-center justify-between gap-3 rounded-card px-4 py-4 text-left shadow-card disabled:cursor-not-allowed disabled:opacity-70",
                featured ? "bg-fox text-cream" : "bg-card",
              )}
            >
              <span className="min-w-0">
                <span className="block font-display text-xl">{plan.label}</span>
                <span
                  className={cn(
                    "block text-sm",
                    featured ? "text-cream/80" : "text-muted-foreground",
                  )}
                >
                  {plan.blurb}
                </span>
              </span>
              <span className="shrink-0 font-display text-xl">{plan.price}</span>
            </button>
          );
        })}
        {!subscriptionManagement ? (
          <p className="pt-2 text-sm text-muted-foreground">
            Checkout is disabled until Stripe pricing and subscription management are configured.
          </p>
        ) : billingError ? (
          <p role="alert" className="pt-2 text-sm text-berry">
            Stripe checkout configuration could not be verified: {billingError}
          </p>
        ) : stripe === false ? (
          <p className="pt-2 text-sm text-muted-foreground">
            Checkout is not configured yet. Prices are shown for reference; purchasing is disabled.
          </p>
        ) : stripe && (!prices.monthly || !prices.yearly) ? (
          <p className="pt-2 text-sm text-muted-foreground">
            Checkout is disabled for any plan whose Stripe price is missing or does not match the
            approved amount and billing interval.
          </p>
        ) : stripe === null ? (
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Checking Stripe checkout configuration…
          </p>
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl">Current Premium benefits</h2>
        <ul className="mt-2 space-y-2 text-sm">
          <li>Unlimited Vault; Free includes up to 50 games.</li>
          <li>Ad-free experience.</li>
          <li>Advanced exact-score filters in the Vibe step.</li>
          <li>Scorecards, winning records, win/loss statistics, and lifetime standings.</li>
        </ul>
      </section>

      <p className="mt-6 rounded-card bg-muted p-4 text-sm text-muted-foreground">
        Future Premium features are not available today and are not included as current benefits.
      </p>

      <Link to="/profile" className="mt-6 inline-block text-sm font-semibold text-sky">
        Back to you
      </Link>
    </div>
  );
}
