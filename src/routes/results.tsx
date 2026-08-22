import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FoxAvatar } from "@/components/fox-avatar";
import { MatchCard } from "@/components/match-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { AdBanner } from "@/components/ad-banner";
import { useAppStore } from "@/lib/store";
import { VIBE_META, AGE_BANDS } from "@/lib/vibes";
import { useFlag } from "@/lib/flags";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/results")({ component: ResultsPage });

function ResultsPage() {
  const navigate = useNavigate();
  const result = useAppStore((s) => s.lastResults);
  const sniffAgain = useAppStore((s) => s.sniffAgain);
  const startOver = useAppStore((s) => s.startOver);
  const ownedCount = useAppStore((s) => s.owned.length);
  const recPool = useAppStore((s) => s.recPool);
  const expandOn = useFlag("expand_shelf");

  if (!result) {
    return (
      <EmptyState
        mood="sniffing"
        title="No sniff yet"
        body="Run Find a Game and Finn will bring back a top 3 from your vault."
        cta="Find tonight's game"
        onCta={() => navigate({ to: "/wizard" })}
      />
    );
  }

  const f = result.appliedFilters;
  const noOwned = result.ownedTop.length === 0;

  if (noOwned && result.unownedTop.length === 0) {
    return (
      <div className="pb-10">
        <EmptyState
          mood="shrug"
          title="No exact match found in your vault."
          body="Try adjusting your player count, age, or time filter."
          cta="Adjust filters"
          onCta={() => navigate({ to: "/wizard" })}
        />
        <Button
          variant="ghost"
          className="mx-auto mt-2 flex"
          onClick={() => {
            startOver();
            navigate({ to: "/wizard" });
          }}
        >
          Start over
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="flex flex-col items-center text-center">
        <FoxAvatar mood="proud" size="md" />
        <h1 className="mt-3 font-display text-3xl">
          {recPool ? `Finn sniffed ${recPool.groupName}` : "Finn found your games"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {recPool
            ? `${recPool.ids.length} games on the shared shelf fit tonight`
            : result.ownedCount
              ? `${result.ownedCount} in your vault fit tonight`
              : "Nothing in the vault fit — here are games you might like"}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {f.players != null ? (
          <Chip>{f.players >= 13 ? "13+" : f.players} players</Chip>
        ) : (
          <Chip>Any players</Chip>
        )}
        {f.timeOver60 ? (
          <Chip>Over 60 min</Chip>
        ) : f.maxTimeMin != null ? (
          <Chip>{f.maxTimeMin} min or less</Chip>
        ) : (
          <Chip>Any time</Chip>
        )}
        {f.ageBand ? (
          <Chip>{AGE_BANDS.find((b) => b.id === f.ageBand)?.label}</Chip>
        ) : null}
        {f.vibes.map((v) => (
          <Chip key={v}>{VIBE_META[v].label}</Chip>
        ))}
      </div>

      {result.exhaustedVault ? (
        <p className="mt-6 rounded-card bg-card p-4 text-sm shadow-card">
          You've seen all matching games in your vault. Adjust your filters or start over.
        </p>
      ) : noOwned ? (
        <p className="mt-6 rounded-card bg-card p-4 text-sm shadow-card">
          {ownedCount
            ? "No exact match found in your vault. Finn kept your filters honest."
            : "Your vault is empty — scan your shelf, then this top 3 will come from games you own."}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {result.ownedTop.map((g) => (
            <MatchCard key={g.bggId} game={g} />
          ))}
        </div>
      )}

      {expandOn && result.unownedTop.length ? (
        <section className="mt-10">
          <h2 className="font-display text-xl">Expand Your Shelf</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Games you don't own that still fit tonight.
          </p>
          <div className="space-y-4">
            {result.unownedTop.map((g) => (
              <MatchCard key={g.bggId} game={g} discover />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8 space-y-2">
        <Button
          className="w-full"
          size="xl"
          onClick={() => {
            const next = sniffAgain();
            if (next?.exhaustedVault && !next.ownedTop.length) {
              /* stay put — copy already shown */
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Sniff again
        </Button>
        <Button
          className="w-full"
          variant="secondary"
          onClick={() => navigate({ to: "/wizard" })}
        >
          Adjust filters
        </Button>
        <button
          type="button"
          className="block w-full py-3 text-center text-sm font-semibold text-muted-foreground"
          onClick={() => {
            startOver();
            navigate({ to: "/wizard" });
          }}
        >
          Start over
        </button>
      </div>
      <AdBanner />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full bg-card px-3 py-1.5 text-sm font-semibold ring-1 ring-border",
      )}
    >
      {children}
    </span>
  );
}
