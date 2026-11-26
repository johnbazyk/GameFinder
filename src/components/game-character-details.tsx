import { gameRating } from "@/lib/application-ratings";
import { formatAge, formatPlayers, formatPlaytime } from "@/lib/scoring";
import type { Game, WizardContext, VibeId } from "@/lib/types";
import { VIBE_META } from "@/lib/vibes";
import { RatingProfile } from "./rating-profile";

/** Shared profile content: no fabricated metadata or independent score calculation. */
export function GameCharacterDetails({
  game,
  context,
  compact = false,
}: {
  game: Game;
  context: WizardContext;
  compact?: boolean;
}) {
  return (
    <section className="space-y-3">
      {compact && (
        <>
          <p>
            {formatPlayers(game)} players · {formatAge(game)} · {formatPlaytime(game)}
          </p>
          <p>{game.description}</p>
        </>
      )}
      <p className="text-sm">
        <strong>Mechanics:</strong> {game.mechanics.join(", ") || "Not documented"}
      </p>
      <RatingProfile game={game} initialContext={context} />
      <section className="rounded-card bg-card p-4">
        <h2 className="font-display text-xl">GameFinder Vibes</h2>
        <dl className="mt-2 space-y-2">
          {(Object.keys(VIBE_META) as VibeId[]).map((vibe) => {
            const rating = gameRating(game, vibe, {
              ...context,
              ratingMode: context.ratingMode === "reviewed" ? "reviewed" : "beta",
            });
            return (
              <div key={vibe} className="flex items-center justify-between gap-2 text-sm">
                <dt>{VIBE_META[vibe].label}</dt>
                <dd>
                  {rating.value === null ? "Not assessed" : rating.value + " / 5"}{" "}
                  <span className="text-xs text-muted-foreground">{rating.label}</span>
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </section>
  );
}
