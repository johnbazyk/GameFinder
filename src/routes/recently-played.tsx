import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getGame } from "@/lib/scoring";
import { getScoreCard, resolveWinners } from "@/lib/scorecards";
import { useAppStore } from "@/lib/store";
import { PremiumGate } from "@/components/premium-gate";

export const Route = createFileRoute("/recently-played")({
  component: RecentlyPlayedPage,
});

function RecentlyPlayedPage() {
  const plays = useAppStore((s) => s.plays);
  const sessions = useAppStore((s) => s.scoreSessions);
  const players = useAppStore((s) => s.tablePlayers);
  const pending = useAppStore((s) => s.pendingPlayPrompt);
  const lastResults = useAppStore((s) => s.lastResults);
  const logPlay = useAppStore((s) => s.logPlay);
  const dismissPlayPrompt = useAppStore((s) => s.dismissPlayPrompt);

  return (
    <div className="pb-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fox">
        Your table&apos;s history
      </p>
      <h1 className="font-display text-3xl">Recently Played</h1>

      {pending ? (
        <section className="mt-5 rounded-card bg-card p-4 shadow-card">
          <h2 className="font-display text-xl">Did you play {pending.name}? How&apos;d it go?</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() =>
                logPlay({
                  bggId: pending.bggId,
                  players: lastResults?.appliedFilters.players ?? 4,
                  durationMin: lastResults?.appliedFilters.maxTimeMin ?? 45,
                  enjoyed: true,
                })
              }
            >
              We loved it
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                logPlay({
                  bggId: pending.bggId,
                  players: lastResults?.appliedFilters.players ?? 4,
                  durationMin: lastResults?.appliedFilters.maxTimeMin ?? 45,
                  enjoyed: false,
                })
              }
            >
              Not our night
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissPlayPrompt}>
              Skip
            </Button>
          </div>
        </section>
      ) : null}

      <PremiumGate>
        <section className="mt-6">
          <h2 className="font-display text-xl">Scored games</h2>
          {sessions.length ? (
            <ul className="mt-2 divide-y divide-border rounded-card bg-card shadow-card">
              {sessions.map((session) => {
                const game = getGame(session.bggId);
                const scoreCard = game ? getScoreCard(game) : null;
                const winners = scoreCard ? resolveWinners(scoreCard, session) : [];
                const winnerNames = winners
                  .map((id) => players.find((player) => player.id === id)?.name)
                  .filter(Boolean)
                  .join(", ");
                return (
                  <li key={session.id} className="px-4 py-3 text-sm">
                    <Link
                      to="/game/$id/score"
                      params={{ id: session.bggId }}
                      className="font-semibold"
                    >
                      {game?.name ?? session.bggId}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {session.draw ? "Draw" : winnerNames || "Logged"} ·{" "}
                      {new Date(session.at).toLocaleDateString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 rounded-card bg-card p-4 text-sm text-muted-foreground shadow-card">
              Scored games will show up here.
            </p>
          )}
        </section>
      </PremiumGate>

      <section className="mt-8">
        <h2 className="font-display text-xl">Play feedback</h2>
        {plays.length ? (
          <ul className="mt-2 divide-y divide-border rounded-card bg-card shadow-card">
            {plays.map((play) => {
              const game = getGame(play.bggId);
              return (
                <li key={play.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{game?.name ?? play.bggId}</p>
                    <p className="text-xs text-muted-foreground">
                      {play.players} players · {play.durationMin} min ·{" "}
                      {new Date(play.at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={play.enjoyed ? "text-sm text-moss" : "text-sm text-berry"}>
                    {play.enjoyed ? "Loved" : "Passed"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 rounded-card bg-card p-4 text-sm text-muted-foreground shadow-card">
            Your play feedback will show up here and help Finn tune future picks.
          </p>
        )}
      </section>
    </div>
  );
}
