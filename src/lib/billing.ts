import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export const BILLING = {
  monthly: {
    id: "monthly" as const,
    label: "Monthly",
    price: "$3.99",
    blurb: "Cancel anytime.",
    env: "STRIPE_PRICE_MONTHLY",
    mode: "subscription" as const,
  },
  yearly: {
    id: "yearly" as const,
    label: "Yearly",
    price: "$29.99",
    blurb: "Two months free. Best for a family.",
    env: "STRIPE_PRICE_YEARLY",
    mode: "subscription" as const,
  },
  lifetime: {
    id: "lifetime" as const,
    label: "Lifetime",
    price: "$29",
    blurb: "Pay once. No subscription.",
    env: "STRIPE_PRICE_LIFETIME",
    mode: "payment" as const,
  },
};

export type BillingTier = keyof typeof BILLING;

function stripeKey() {
  return (process.env.STRIPE_SECRET_KEY ?? "").trim();
}

function priceId(tier: BillingTier) {
  return (process.env[BILLING[tier].env] ?? "").trim();
}

export function stripeReady() {
  return Boolean(stripeKey() && (priceId("yearly") || priceId("monthly") || priceId("lifetime")));
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
  return (await res.json()) as Record<string, unknown>;
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
  stripe: stripeReady(),
  prices: {
    monthly: Boolean(priceId("monthly")),
    yearly: Boolean(priceId("yearly")),
    lifetime: Boolean(priceId("lifetime")),
  },
}));

export const startCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tier: BillingTier; origin: string }) => ({
    tier: input?.tier === "monthly" || input?.tier === "lifetime" ? input.tier : ("yearly" as const),
    origin: String(input?.origin ?? "")
      .trim()
      .slice(0, 200),
  }))
  .handler(async ({ context, data }) => {
    if (!stripeReady()) return { ok: false as const, reason: "not-configured" as const };
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
    if (!data.sessionId.startsWith("cs_")) throw new Error("Missing checkout");
    if (!stripeKey()) throw new Error("Billing isn't connected");
    const session = await stripeGet(`checkout/sessions/${data.sessionId}`);
    const meta = (session.metadata ?? {}) as Record<string, string>;
    if (meta.userId && meta.userId !== context.userId) throw new Error("That's not your checkout");
    const paid = session.payment_status === "paid" || session.status === "complete";
    if (!paid) return { ok: false as const, plan: "free" };
    await writePlan(context.userId, "premium");
    return { ok: true as const, plan: "premium" as const };
  });

/** Account preview when Stripe keys are not on the server yet. Not a charge. */
export const grantPreviewPremium = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (stripeReady()) throw new Error("Use checkout — billing is live");
    await writePlan(context.userId, "premium");
    return { ok: true as const };
  });
