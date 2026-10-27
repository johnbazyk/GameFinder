import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePremiumAccess } from "@/lib/use-premium-access";

export function PremiumGate({ children }: { children: ReactNode }) {
  const { access, retry } = usePremiumAccess();
  if (access === "premium") return <>{children}</>;
  if (access === "loading") {
    return (
      <p role="status" className="rounded-card bg-card p-4 text-sm text-muted-foreground shadow-card">
        Checking your Premium access…
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-lg rounded-card bg-card p-5 shadow-card">
      <LockKeyhole className="size-5 text-muted-foreground" />
      <h1 className="mt-3 font-display text-2xl">
        {access === "error"
          ? "Couldn’t verify Premium access"
          : "Scores & Win History is Premium"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {access === "error"
          ? "We couldn’t confirm this account’s subscription. Scoring stays locked until access can be verified."
          : "Premium unlocks game scorecards, winning records, win/loss statistics, and lifetime standings. Your recorded score data is preserved if a subscription expires or is cancelled."}
      </p>
      {access === "error" ? (
        <Button className="mt-4 w-full" variant="secondary" onClick={retry}>
          Try again
        </Button>
      ) : null}
      <Button className="mt-3 w-full" asChild>
        <Link to="/premium" search={{ session_id: "" }}>
          View subscription plans
        </Link>
      </Button>
    </section>
  );
}
