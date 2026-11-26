import { useAppStore } from "@/lib/store";
import { useFlag } from "@/lib/flags";

export function AdBanner() {
  const premium = useAppStore((s) => s.isPremium);
  const ready = useAppStore((s) => s.entitlementReady);
  const ads = useFlag("banner_ads");
  if (!ready || premium || !ads) return null;
  return (
    <div
      role="complementary"
      aria-label="Advertisement"
      className="mb-4 rounded-card bg-muted/80 px-3 py-2 text-center ring-1 ring-border"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        Ad · GameFinder Free
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Advertisement placeholder · Premium removes ads.
      </p>
    </div>
  );
}
