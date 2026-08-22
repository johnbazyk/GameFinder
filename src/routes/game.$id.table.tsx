import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FinnCoach } from "@/components/finn-coach";
import { EmptyState } from "@/components/empty-state";
import { getGame } from "@/lib/scoring";
import { useFlag } from "@/lib/flags";

export const Route = createFileRoute("/game/$id/table")({
  component: TableCoachPage,
});

function TableCoachPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const game = getGame(id);
  const bookworm = useFlag("bookworm");

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

  if (!bookworm) {
    return (
      <EmptyState
        mood="hopeful"
        title="Bookworm is off"
        body="Rules help is behind the Bookworm flag. Turn it on in Internal flags for a closed test."
        cta="Open flags"
        onCta={() => navigate({ to: "/internal/flags" })}
      />
    );
  }

  return <FinnCoach game={game} variant="table" />;
}
