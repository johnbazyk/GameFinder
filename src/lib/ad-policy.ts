/** Ads fail closed: a known Free account is the only eligible audience.
 * Entitlement lookup failures must not turn a paying customer into an ad target.
 */
export function shouldShowAd({
  plan,
  ready,
  premium,
  ads,
}: {
  plan: "unknown" | "free" | "premium";
  ready: boolean;
  premium: boolean;
  ads: boolean;
}): boolean {
  return plan === "free" && ready && !premium && ads;
}
