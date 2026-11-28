import type { Sql } from "./db";
import {
  acceptSubscriptionUpdate,
  subscriptionEntitlement,
  type SubscriptionState,
} from "./subscription-policy";

type LedgerRow = {
  provider_subscription_id: string;
  provider_customer_id: string;
  status: string;
  paid_through_ms: number | string | bigint;
  verified_at_ms: number | string | bigint;
  cancel_at_period_end: boolean;
};
function state(row: LedgerRow): SubscriptionState {
  return {
    status: row.status,
    paidThrough: Number(row.paid_through_ms),
    verifiedAt: Number(row.verified_at_ms),
    cancelAtPeriodEnd: row.cancel_at_period_end,
  };
}
// Call inside a transaction that locks the profile. Input must come from
// authenticated provider reconciliation, never a client or unverified webhook.
export async function recordVerifiedSubscription(
  sql: Sql,
  userId: string,
  subscriptionId: string,
  customerId: string,
  next: SubscriptionState,
  now = Date.now(),
) {
  if (
    !userId ||
    !/^sub_[a-zA-Z0-9]+$/.test(subscriptionId) ||
    !/^cus_[a-zA-Z0-9]+$/.test(customerId) ||
    !Number.isSafeInteger(next.paidThrough) ||
    !Number.isSafeInteger(next.verifiedAt) ||
    next.verifiedAt > now ||
    !acceptSubscriptionUpdate(null, next)
  )
    throw new Error("Invalid subscription evidence");
  const profile = await sql`select user_id from profiles where user_id=${userId} for update`;
  if (!profile.length) throw new Error("Unknown billing account");
  const rows =
    await sql<LedgerRow>`select * from billing_subscriptions where user_id=${userId} for update`;
  const prior = rows[0];
  if (
    prior &&
    (prior.provider_subscription_id !== subscriptionId || prior.provider_customer_id !== customerId)
  )
    throw new Error("Billing identity changed; explicit reconciliation required");
  if (prior && !acceptSubscriptionUpdate(state(prior), next)) return false;
  await sql`insert into billing_subscriptions (user_id,provider_subscription_id,provider_customer_id,status,paid_through_ms,verified_at_ms,cancel_at_period_end)
    values (${userId},${subscriptionId},${customerId},${next.status},${next.paidThrough},${next.verifiedAt},${next.cancelAtPeriodEnd})
    on conflict (user_id) do update set status=excluded.status,paid_through_ms=excluded.paid_through_ms,verified_at_ms=excluded.verified_at_ms,cancel_at_period_end=excluded.cancel_at_period_end`;
  return true;
}
export async function readManagedEntitlement(
  sql: Sql,
  userId: string,
  now = Date.now(),
): Promise<boolean | null> {
  const rows = await sql<LedgerRow>`select * from billing_subscriptions where user_id=${userId}`;
  return rows[0] ? subscriptionEntitlement(state(rows[0]), now) : null;
}
