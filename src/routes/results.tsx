import { APPLICATION_RATING_MODE } from "@/lib/rating-policy";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FoxAvatar } from "@/components/fox-avatar";
import { MatchCard } from "@/components/match-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { MAX_PLAYER_COUNT, type MatchCoverage } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { VIBE_META, AGE_BANDS } from "@/lib/vibes";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/results")({ component: ResultsPage });

function ResultsPage() {
  const navigate = useNavigate();
  const result = useAppStore((s) => s.lastResults);
  const sniffAgain = useAppStore((s) => s.sniffAgain);
  const startOver = useAppStore((s) => s.startOver);
  const ownedCount = useAppStore((s) => s.owned.length);
  const recPool = useAppStore((s) => s.recPool);

  const staleRatings =
    result &&
    APPLICATION_RATING_MODE !== "legacy" &&
    [...result.ownedTop, ...result.unownedTop].some(
      (g) => g.ratingContext?.ratingMode !== APPLICATION_RATING_MODE,
    );
  if (!result || staleRatings) {
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

  return (
    <div className="pb-10">
      <div className="flex flex-col items-center text-center">
        <FoxAvatar mood={result.exhaustedVault ? "resting" : "proud"} size="md" />
        <h1 className="mt-3 font-display text-3xl">
          {recPool ? `Finn sniffed ${recPool.groupName}` : "Finn found your games"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {recPool
            ? `${result.ownedCount} games on the shared shelf match your filters`
            : result.ownedCount
              ? `${result.ownedCount} in your vault fit tonight`
              : "Let’s see what matches your selections"}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {f.players != null ? (
          <Chip>{f.players >= MAX_PLAYER_COUNT ? "13+" : f.players} players</Chip>
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
        {f.ageBand ? <Chip>{AGE_BANDS.find((b) => b.id === f.ageBand)?.label}</Chip> : null}
        {f.vibes.map((v) => (
          <Chip key={v}>{VIBE_META[v].label}</Chip>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="font-display text-xl">
          {recPool ? "From Your Shared Shelf" : "From Your Vault"}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {result.ownedTop.length} of 3 suggestions
        </p>
        {noOwned && !ownedCount && !recPool ? (
          <p className="mb-3 text-sm">
            Your vault is empty. Add games to get suggestions from your collection.
          </p>
        ) : null}
        {(ownedCount > 0 || recPool) && (
          <MatchAvailability
            shown={result.ownedTop.length}
            total={result.ownedCount}
            coverage={result.coverage?.owned}
          />
        )}
        <div className="space-y-4">
          {result.ownedTop.map((g) => (
            <MatchCard key={g.bggId} game={g} />
          ))}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="font-display text-xl">Expand Your Shelf</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {result.unownedTop.length} of 3 suggestions · Games you don’t own
        </p>
        <MatchAvailability
          shown={result.unownedTop.length}
          total={result.unownedCount}
          coverage={result.coverage?.unowned}
        />
        <div className="space-y-4">
          {result.unownedTop.map((g) => (
            <MatchCard key={g.bggId} game={g} discover />
          ))}
        </div>
      </section>

      <div className="mt-8 space-y-2">
        <Button
          className="w-full"
          size="xl"
          onClick={() => {
            sniffAgain();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Sniff again
        </Button>
        <Button className="w-full" variant="secondary" onClick={() => navigate({ to: "/wizard" })}>
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
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn("rounded-full bg-card px-3 py-1.5 text-sm font-semibold ring-1 ring-border")}
    >
      {children}
    </span>
  );
}

function MatchAvailability({
  shown,
  total,
  coverage,
}: {
  shown: number;
  total: number;
  coverage?: MatchCoverage;
}) {
  if (shown >= 3) return null;
  const message =
    total > shown
      ? shown === 0
        ? "You’ve seen all matching games. Start over to see them again."
        : `Only ${shown} new ${shown === 1 ? "match" : "matches"} left.`
      : coverage?.missingRatings
        ? shown === 0
          ? "No matches yet—some games still need ratings."
          : `Only ${shown} ${shown === 1 ? "match" : "matches"} so far—some games still need ratings.`
        : shown === 0
          ? "No games match these filters."
          : `Only ${shown} ${shown === 1 ? "game matches" : "games match"} these filters.`;
  return <p className="mb-4 text-sm text-muted-foreground">{message}</p>;
}
