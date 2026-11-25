import type { Sql } from "./db";
import { recordVerifiedSubscription } from "./subscription-ledger.server";
import type { SubscriptionState } from "./subscription-policy";

type ProviderObject = Record<string, unknown>;
type Binding = {
  user_id: string;
  provider_subscription_id: string;
  provider_customer_id: string;
  paid_through_ms: number | string | bigint;
  verified_at_ms: number | string | bigint;
};
const object = (x: unknown): ProviderObject =>
  x && typeof x === "object" && !Array.isArray(x) ? (x as ProviderObject) : {};
const id = (x: unknown) => (typeof x === "string" ? x : object(x).id);
const seconds = (x: unknown) =>
  typeof x === "number" && Number.isSafeInteger(x) && x > 0 && Number.isSafeInteger(x * 1000)
    ? x * 1000
    : 0;

// Only an already bound subscription can be reconciled by this path.
// Initial checkout binding and replacement subscription onboarding remain locked.
export function verifiedSubscriptionState(
  subscription: ProviderObject,
  invoice: ProviderObject,
  binding: Binding,
  priceIds: string[],
  observedAt: number,
): SubscriptionState {
  if (
    subscription.id !== binding.provider_subscription_id ||
    id(subscription.customer) !== binding.provider_customer_id
  )
    throw new Error("Subscription identity mismatch");
  const items = object(subscription.items);
  const list = items.data;
  if (!Array.isArray(list) || list.length !== 1 || items.has_more === true)
    throw new Error("Unexpected subscription items");
  const item = object(list[0]);
  const price = id(item.price);
  if (typeof price !== "string" || !priceIds.includes(price) || item.quantity !== 1)
    throw new Error("Unexpected subscription price");
  const status = subscription.status;
  if (typeof status !== "string" || typeof subscription.cancel_at_period_end !== "boolean")
    throw new Error("Invalid subscription status");
  let paidThrough = Number(binding.paid_through_ms);
  // Never extend a term from a failed invoice, a trial or an unbound invoice.
  const parent = object(invoice.parent);
  const subscriptionDetails = object(parent.subscription_details);
  const invoiceSubscription = id(invoice.subscription ?? subscriptionDetails.subscription);
  const lines = object(invoice.lines);
  const entries = lines.data;
  if (
    status === "active" &&
    invoice.status === "paid" &&
    invoice.paid !== false &&
    invoice.currency === "usd" &&
    typeof invoice.amount_paid === "number" &&
    invoice.amount_paid > 0 &&
    invoice.id === id(subscription.latest_invoice) &&
    id(invoice.customer) === binding.provider_customer_id &&
    invoiceSubscription === binding.provider_subscription_id &&
    Array.isArray(entries) &&
    entries.length === 1 &&
    lines.has_more !== true
  ) {
    const line = object(entries[0]);
    const linePrice = id(line.price ?? object(object(line.pricing).price_details).price);
    const period = object(line.period);
    const end = seconds(period.end);
    const start = seconds(period.start);
    const itemEnd = seconds(item.current_period_end ?? subscription.current_period_end);
    if (
      linePrice === price &&
      line.quantity === 1 &&
      start > 0 &&
      end > start &&
      end === itemEnd &&
      line.proration !== true
    )
      paidThrough = Math.max(paidThrough, end);
  }
  return {
    status,
    paidThrough,
    verifiedAt: observedAt,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

export async function reconcileBoundSubscription(
  sql: Sql,
  subscriptionId: string,
  fetchProvider: (path: string) => Promise<ProviderObject>,
  priceIds: string[],
  now = Date.now,
) {
  if (!/^sub_[a-zA-Z0-9]+$/.test(subscriptionId)) throw new Error("Invalid subscription id");
  const bindings =
    await sql<Binding>`select user_id,provider_subscription_id,provider_customer_id,paid_through_ms,verified_at_ms from billing_subscriptions where provider_subscription_id=${subscriptionId}`;
  const binding = bindings[0];
  if (!binding) return false;
  // Caller holds a transaction; serialize provider observations for this account.
  await sql`select user_id from profiles where user_id=${binding.user_id} for update`;
  const latest = (
    await sql<Binding>`select user_id,provider_subscription_id,provider_customer_id,paid_through_ms,verified_at_ms from billing_subscriptions where provider_subscription_id=${subscriptionId}`
  )[0];
  if (!latest || latest.user_id !== binding.user_id) throw new Error("Billing binding changed");
  const observedAt = now();
  const subscription = await fetchProvider("subscriptions/" + subscriptionId);
  const invoiceId = id(subscription.latest_invoice);
  const invoice =
    typeof invoiceId === "string" && /^in_[a-zA-Z0-9]+$/.test(invoiceId)
      ? await fetchProvider("invoices/" + invoiceId)
      : {};
  const next = verifiedSubscriptionState(subscription, invoice, latest, priceIds, observedAt);
  return recordVerifiedSubscription(
    sql,
    latest.user_id,
    subscriptionId,
    latest.provider_customer_id,
    next,
    now(),
  );
}
