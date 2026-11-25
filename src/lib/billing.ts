import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, withSqlTransaction } from "@/lib/db";
import { recordVerifiedSubscription } from "./subscription-ledger.server";
import { verifiedSubscriptionState } from "./stripe-reconciliation.server";
import { subscriptionEntitlement } from "./subscription-policy";

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
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error("Billing provider request failed.");
  return (await res.json()) as Record<string, unknown>;
}

async function stripeGet(path: string) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    signal: AbortSignal.timeout(15000),
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
  const recurring = data.recurring as { interval?: string; interval_count?: number } | undefined;
  const expected = BILLING[tier];
  return (
    data.active === true &&
    data.unit_amount === expected.amount &&
    data.currency === "usd" &&
    recurring?.interval === expected.interval &&
    recurring.interval_count === 1
  );
}

export const billingStatus = createServerFn({ method: "GET" }).handler(async () => ({
  stripe: SUBSCRIPTION_MANAGEMENT_AVAILABLE && stripeConfigured(),
  subscriptionManagement: SUBSCRIPTION_MANAGEMENT_AVAILABLE,
  prices: {
    monthly: SUBSCRIPTION_MANAGEMENT_AVAILABLE && (await approvedStripePrice("monthly")),
    yearly: SUBSCRIPTION_MANAGEMENT_AVAILABLE && (await approvedStripePrice("yearly")),
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
    const origin = process.env.GAMEFINDER_BILLING_ORIGIN?.trim();
    if (!origin || !/^https:\/\/[a-z0-9.-]+$/i.test(origin))
      throw new Error("Billing return origin is not configured.");
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
    if (!/^cs_(test|live)_[a-zA-Z0-9]+$/.test(data.sessionId)) throw new Error("Missing checkout");
    if (!stripeKey()) throw new Error("Billing isn't connected");
    const session = await stripeGet(`checkout/sessions/${encodeURIComponent(data.sessionId)}`);
    const meta = (session.metadata ?? {}) as Record<string, string>;
    if (meta.userId !== context.userId || session.client_reference_id !== context.userId)
      throw new Error("That's not your checkout");
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
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : "";
    if (!subscriptionId) throw new Error("Checkout has no subscription.");
    const subscription = await stripeGet(`subscriptions/${encodeURIComponent(subscriptionId)}`);
    const customerId = typeof session.customer === "string" ? session.customer : "";
    if (!/^cus_[a-zA-Z0-9]+$/.test(customerId) || !/^sub_[a-zA-Z0-9]+$/.test(subscriptionId))
      throw new Error("Invalid checkout identity.");
    const invoiceId =
      typeof subscription.latest_invoice === "string" ? subscription.latest_invoice : "";
    if (!/^in_[a-zA-Z0-9]+$/.test(invoiceId)) throw new Error("Missing paid invoice.");
    const invoice = await stripeGet("invoices/" + invoiceId);
    const now = Date.now();
    const state = verifiedSubscriptionState(
      subscription,
      invoice,
      {
        user_id: context.userId,
        provider_subscription_id: subscriptionId,
        provider_customer_id: customerId,
        paid_through_ms: 0,
        verified_at_ms: 0,
      },
      [priceId(tier)],
      now,
    );
    if (!subscriptionEntitlement(state, now)) throw new Error("No verified paid term.");
    await withSqlTransaction(async (sql) => {
      await sql`insert into profiles (user_id, display_name) values (${context.userId}, 'Player') on conflict (user_id) do nothing`;
      await recordVerifiedSubscription(sql, context.userId, subscriptionId, customerId, state);
    });
    return { ok: true as const, plan: "premium" as const };
  });

export const openBillingPortal = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // Keep this gate closed until the provider portal is configured and tested.
    if (!SUBSCRIPTION_MANAGEMENT_AVAILABLE)
      throw new Error("Subscription management is unavailable.");
    const sql = await getSql();
    const rows = await sql<{
      provider_customer_id: string;
    }>`select provider_customer_id from billing_subscriptions where user_id=${context.userId}`;
    const customer = rows[0]?.provider_customer_id;
    if (!customer || !/^cus_[a-zA-Z0-9]+$/.test(customer)) throw new Error("No billing account.");
    const origin = process.env.GAMEFINDER_BILLING_ORIGIN?.trim();
    if (!origin || !/^https:\/\/[a-z0-9.-]+$/i.test(origin))
      throw new Error("Billing return origin is not configured.");
    const session = await stripeForm("billing_portal/sessions", {
      customer,
      return_url: origin + "/premium",
    });
    const url = typeof session.url === "string" ? session.url : "";
    if (!url || new URL(url).origin !== "https://billing.stripe.com")
      throw new Error("Invalid portal URL.");
    return { url };
  });
