import { createFileRoute } from "@tanstack/react-router";
import { FinnCoach } from "@/components/finn-coach";
import { EmptyState } from "@/components/empty-state";
import { getGame } from "@/lib/scoring";

export const Route = createFileRoute("/game/$id/table")({
  component: TableCoachPage,
});

function TableCoachPage() {
  const { id } = Route.useParams();
  const game = getGame(id);
  if (!game) {
    return (
      <EmptyState
        mood="shrug"
        title="Game not found"
        body="Finn doesn't have that one in the catalog."
        cta="Back"
        onCta={() => history.back()}
      />
    );
  }

  return <FinnCoach game={game} variant="table" />;
}
