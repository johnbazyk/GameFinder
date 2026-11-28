import { useAppStore } from "@/lib/store";
import { shouldShowAd } from "@/lib/ad-policy";
import { useFlag } from "@/lib/flags";

export function useShowAdBanner() {
  const premium = useAppStore((s) => s.isPremium);
  const ready = useAppStore((s) => s.entitlementReady);
  const plan = useAppStore((s) => s.adEntitlement);
  const ads = useFlag("banner_ads");
  return shouldShowAd({ plan, ready, premium, ads });
}

export function AdBanner() {
  const show = useShowAdBanner();
  if (!show) return null;
  return (
    <div
      role="complementary"
      aria-label="Advertisement"
      className="flex h-[50px] shrink-0 items-center justify-center border-t border-border bg-muted px-3 text-center"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        Ad · GameFinder Free
      </p>
    </div>
  );
}
