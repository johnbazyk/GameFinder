// Provider-neutral entitlement decision. A verified paid-through timestamp is
// mandatory; cancellation at period end does not revoke an already paid term.
export type SubscriptionState = {
  status: string;
  paidThrough: number;
  verifiedAt: number;
  cancelAtPeriodEnd: boolean;
};
export function subscriptionEntitlement(state: SubscriptionState | null, now: number): boolean {
  if (
    !state ||
    !Number.isFinite(now) ||
    !Number.isFinite(state.paidThrough) ||
    !Number.isSafeInteger(state.verifiedAt) ||
    !Number.isSafeInteger(state.paidThrough) ||
    state.verifiedAt < 0 ||
    state.verifiedAt > now ||
    state.paidThrough <= now
  )
    return false;
  return state.status === "active" || state.status === "past_due";
}
export function acceptSubscriptionUpdate(
  previous: SubscriptionState | null,
  next: SubscriptionState,
): boolean {
  if (
    !Number.isFinite(next.verifiedAt) ||
    !Number.isFinite(next.paidThrough) ||
    next.verifiedAt < 0 ||
    next.paidThrough < 0 ||
    typeof next.cancelAtPeriodEnd !== "boolean" ||
    ![
      "active",
      "past_due",
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "paused",
      "trialing",
    ].includes(next.status)
  )
    return false;
  return !previous || next.verifiedAt > previous.verifiedAt;
}
