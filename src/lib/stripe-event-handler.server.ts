import type { Sql } from "./db";
import { verifyStripeEvent } from "./stripe-webhook.server";
import { reconcileBoundSubscription } from "./stripe-reconciliation.server";

type Event = ReturnType<typeof verifyStripeEvent>;
type ProviderObject = Record<string, unknown>;
function asObject(x: unknown): ProviderObject {
  return x && typeof x === "object" && !Array.isArray(x) ? (x as ProviderObject) : {};
}
export function subscriptionForEvent(event: Event): string | null {
  const o = event.data.object;
  let candidate: unknown;
  if (
    [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "customer.subscription.paused",
      "customer.subscription.resumed",
    ].includes(event.type)
  )
    candidate = o.id;
  else if (
    [
      "invoice.paid",
      "invoice.payment_failed",
      "invoice.payment_action_required",
      "invoice.voided",
      "invoice.marked_uncollectible",
    ].includes(event.type)
  ) {
    candidate = o.subscription ?? asObject(asObject(o.parent).subscription_details).subscription;
  } else return null;
  if (typeof candidate !== "string" || !/^sub_[a-zA-Z0-9]+$/.test(candidate)) return null;
  return candidate;
}
// Must run inside one DB transaction. Failed reconciliation rolls back the
// event receipt, allowing delivery retry. Repeated IDs have no side effects.
export async function processStripeEvent(
  sql: Sql,
  event: Event,
  fetchProvider: (path: string) => Promise<ProviderObject>,
  priceIds: string[],
  liveMode: boolean,
) {
  if (event.livemode !== liveMode) throw new Error("Webhook environment mismatch");
  const subscriptionId = subscriptionForEvent(event);
  if (!subscriptionId) return "ignored" as const;
  const receipt =
    await sql`insert into billing_webhook_events(event_id,event_type) values (${event.id},${event.type}) on conflict (event_id) do nothing returning event_id`;
  if (!receipt.length) return "duplicate" as const;
  const reconciled = await reconcileBoundSubscription(sql, subscriptionId, fetchProvider, priceIds);
  if (!reconciled) {
    // Never mark an unbound subscription as handled: initial enrollment is
    // not enabled, and a later binding must permit retry.
    throw new Error("Subscription not bound or observation not applied");
  }
  return "reconciled" as const;
}
