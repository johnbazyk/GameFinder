import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

const MONTHLY_AMOUNT = 499;
const YEARLY_AMOUNT = 4499;
// Keep checkout and confirmation disabled until subscribers can manage subscriptions.
const SUBSCRIPTION_MANAGEMENT_AVAILABLE = false;
const annualSavings = MONTHLY_AMOUNT * 12 - YEARLY_AMOUNT;
const annualSavingsPercent = Math.round((annualSavings / (MONTHLY_AMOUNT * 12)) * 100);
const dollars = (amount: number) => `$${(amount / 100).toFixed(2)}`;

export const BILLING = {
  monthly: {
    id: "monthly" as const,
    label: "Monthly",
    price: `${dollars(MONTHLY_AMOUNT)}/month`,
    blurb: "Cancel anytime.",
    env: "STRIPE_PRICE_MONTHLY",
    mode: "subscription" as const,
    amount: MONTHLY_AMOUNT,
    interval: "month" as const,
  },
  yearly: {
    id: "yearly" as const,
    label: "Annual",
    price: `${dollars(YEARLY_AMOUNT)}/year`,
    blurb: `Save ${dollars(annualSavings)} vs. 12 monthly payments (about ${annualSavingsPercent}%).`,
    env: "STRIPE_PRICE_YEARLY",
    mode: "subscription" as const,
    amount: YEARLY_AMOUNT,
    interval: "year" as const,
  },
} satisfies Record<
  "monthly" | "yearly",
  {
    id: "monthly" | "yearly";
    label: string;
    price: string;
    blurb: string;
    env: string;
    mode: "subscription";
    amount: number;
    interval: "month" | "year";
  }
>;

export type BillingTier = "monthly" | "yearly";

function stripeKey() {
  return (process.env.STRIPE_SECRET_KEY ?? "").trim();
}

function priceId(tier: BillingTier) {
  return (process.env[BILLING[tier].env] ?? "").trim();
}

function stripeConfigured() {
  return Boolean(stripeKey());
}

async function stripeForm(path: string, body: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
  return (await res.json()) as Record<string, unknown>;
}

async function stripeGet(path: string) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${stripeKey()}` },
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = data.error as { message?: string } | undefined;
    throw new Error(err?.message || "Couldn't verify the Stripe configuration.");
  }
  return data;
}

async function approvedStripePrice(tier: BillingTier) {
  const id = priceId(tier);
  if (!stripeKey() || !id) return false;
  const data = await stripeGet(`prices/${encodeURIComponent(id)}`);
  const recurring = data.recurring as
    | { interval?: string; interval_count?: number }
    | undefined;
  const expected = BILLING[tier];
  return (
    data.active === true &&
    data.unit_amount === expected.amount &&
    data.currency === "usd" &&
    recurring?.interval === expected.interval &&
    recurring.interval_count === 1
  );
}

async function writePlan(userId: string, plan: string) {
  const sql = await getSql();
  await sql`
    insert into profiles (user_id, display_name, plan, updated_at)
    values (${userId}, 'Player', ${plan}, now())
    on conflict (user_id) do update set plan = excluded.plan, updated_at = now()
  `;
}

export const billingStatus = createServerFn({ method: "GET" }).handler(async () => ({
  stripe: stripeConfigured(),
  subscriptionManagement: SUBSCRIPTION_MANAGEMENT_AVAILABLE,
  prices: {
    monthly: await approvedStripePrice("monthly"),
    yearly: await approvedStripePrice("yearly"),
  },
}));

export const startCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tier: BillingTier; origin: string }) => ({
    tier: input?.tier === "monthly" || input?.tier === "yearly" ? input.tier : null,
    origin: String(input?.origin ?? "")
      .trim()
      .slice(0, 200),
  }))
  .handler(async ({ context, data }) => {
    if (!data.tier) throw new Error("Choose a valid subscription plan.");
    if (!SUBSCRIPTION_MANAGEMENT_AVAILABLE) {
      return { ok: false as const, reason: "subscription-management-unavailable" as const };
    }
    if (!stripeConfigured() || !priceId(data.tier)) {
      return { ok: false as const, reason: "not-configured" as const };
    }
    if (!(await approvedStripePrice(data.tier))) {
      return { ok: false as const, reason: "price-mismatch" as const };
    }
    const price = priceId(data.tier);
    if (!price) return { ok: false as const, reason: "not-configured" as const };
    const origin = data.origin.replace(/\/$/, "") || "https://gamefinderapp.netlify.app";
    const spec = BILLING[data.tier];
    const session = await stripeForm("checkout/sessions", {
      mode: spec.mode,
      success_url: `${origin}/premium?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/premium`,
      client_reference_id: context.userId,
      "line_items[0][price]": price,
      "line_items[0][quantity]": "1",
      "metadata[userId]": context.userId,
      "metadata[tier]": data.tier,
    });
    const url = typeof session.url === "string" ? session.url : "";
    if (!url) {
      const err = session.error as { message?: string } | undefined;
      return { ok: false as const, reason: (err?.message || "stripe") as string };
    }
    return { ok: true as const, url };
  });

export const confirmCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { sessionId: string }) => ({
    sessionId: String(input?.sessionId ?? "").slice(0, 80),
  }))
  .handler(async ({ context, data }) => {
    if (!SUBSCRIPTION_MANAGEMENT_AVAILABLE) {
      throw new Error("Purchases are disabled until subscription management is available.");
    }
    if (!data.sessionId.startsWith("cs_")) throw new Error("Missing checkout");
    if (!stripeKey()) throw new Error("Billing isn't connected");
    const session = await stripeGet(
      `checkout/sessions/${encodeURIComponent(data.sessionId)}`,
    );
    const meta = (session.metadata ?? {}) as Record<string, string>;
    if (meta.userId !== context.userId) throw new Error("That's not your checkout");
    if (meta.tier !== "monthly" && meta.tier !== "yearly") {
      throw new Error("This checkout isn't for an active GameFinder plan.");
    }
    const tier = meta.tier;
    const expected = BILLING[tier];
    if (!(await approvedStripePrice(tier))) {
      throw new Error("The configured Stripe price doesn't match this plan.");
    }
    const paid =
      session.mode === "subscription" &&
      session.status === "complete" &&
      session.payment_status === "paid" &&
      session.currency === "usd" &&
      session.amount_total === expected.amount;
    if (!paid) return { ok: false as const, plan: "free" };
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : "";
    if (!subscriptionId) throw new Error("Checkout has no subscription.");
    const subscription = await stripeGet(
      `subscriptions/${encodeURIComponent(subscriptionId)}`,
    );
    if (subscription.status !== "active" && subscription.status !== "trialing") {
      throw new Error("This subscription isn't active.");
    }
    const items = subscription.items as
      | { data?: { price?: string | { id?: string } }[] }
      | undefined;
    const subscriptionPrice = items?.data?.[0]?.price;
    const subscriptionPriceId =
      typeof subscriptionPrice === "string" ? subscriptionPrice : subscriptionPrice?.id;
    if (items?.data?.length !== 1 || subscriptionPriceId !== priceId(tier)) {
      throw new Error("The active subscription price doesn't match this plan.");
    }
    await writePlan(context.userId, "premium");
    return { ok: true as const, plan: "premium" as const };
  });
