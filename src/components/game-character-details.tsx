import { formatAge, formatPlayers, formatPlaytime } from "@/lib/scoring";
import type { Game, WizardContext } from "@/lib/types";
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
    </section>
  );
}
