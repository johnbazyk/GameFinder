import { createFileRoute, Link } from "@tanstack/react-router";
import { ScoreSheet } from "@/components/score-sheet";
import { EmptyState } from "@/components/empty-state";
import { getGame } from "@/lib/scoring";

export const Route = createFileRoute("/game/$id/score")({
  component: ScorePage,
});

function ScorePage() {
  const { id } = Route.useParams();
  const game = getGame(id);
  if (!game) {
    return (
      <EmptyState
        mood="shrug"
        title="Game not found"
        body="Finn doesn't have a scorecard for that one."
        cta="Back"
        onCta={() => history.back()}
      />
    );
  }
  return (
    <div>
      <Link to="/game/$id" params={{ id }} className="text-sm font-semibold text-sky">
        Back to {game.name}
      </Link>
      <div className="mt-4">
        <ScoreSheet game={game} />
      </div>
    </div>
  );
}
