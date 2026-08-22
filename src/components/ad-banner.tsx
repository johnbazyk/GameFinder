import { useAppStore } from "@/lib/store";
import { useFlag } from "@/lib/flags";

export function AdBanner() {
  const premium = useAppStore((s) => s.isPremium);
  const ads = useFlag("banner_ads");
  if (premium || !ads) return null;
  return (
    <div className="mt-6 rounded-card bg-muted/80 px-4 py-3 text-center ring-1 ring-border">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        Ad · GameFinder Free
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        A short banner while Finn sniffs. Premium removes ads.
      </p>
    </div>
  );
}
