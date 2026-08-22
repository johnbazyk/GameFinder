import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { PlayerRoster } from "@/components/score-sheet";
import { getGame } from "@/lib/scoring";
import { getScoreCard, lifetimeStats, resolveWinners } from "@/lib/scorecards";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scoreboard")({ component: ScoreboardPage });

function ScoreboardPage() {
  const players = useAppStore((s) => s.tablePlayers);
  const sessions = useAppStore((s) => s.scoreSessions);

  const ranked = [...players]
    .map((p) => ({
      player: p,
      ...lifetimeStats(p.id, sessions, (id) => {
        const g = getGame(id);
        return g ? getScoreCard(g) : null;
      }),
    }))
    .sort((a, b) => b.wins - a.wins || b.games - a.games);

  return (
    <div className="pb-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fox">Forever ledger</p>
      <h1 className="font-display text-3xl">Scoreboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Named players. Official-style pads. Wins never reset on this device.
      </p>

      {ranked.length === 0 ? (
        <p className="mt-6 rounded-card bg-card p-4 text-sm text-muted-foreground shadow-card">
          Add the people you play with, then open a game's scorecard after the last round.
        </p>
      ) : (
        <ol className="mt-6 divide-y divide-border rounded-card bg-card shadow-card">
          {ranked.map((row, i) => (
            <li key={row.player.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full text-sm font-bold",
                  i === 0 ? "bg-fox text-cream" : "bg-muted",
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg" style={{ color: row.player.color }}>
                  {row.player.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.games} play{row.games === 1 ? "" : "s"}
                  {row.coopWins ? ` · ${row.coopWins} co-op` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1 font-display text-2xl tabular-nums">
                  {i === 0 && row.wins > 0 ? <Trophy className="size-4 text-fox" /> : null}
                  {row.wins}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">wins</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8">
        <PlayerRoster />
      </div>

      {sessions.length ? (
        <section className="mt-8">
          <h2 className="font-display text-xl">Recent tables</h2>
          <ul className="mt-2 divide-y divide-border rounded-card bg-card shadow-card">
            {sessions.slice(0, 12).map((s) => {
              const g = getGame(s.bggId);
              const def = g ? getScoreCard(g) : null;
              const winners = def ? resolveWinners(def, s) : [];
              const names = winners
                .map((id) => players.find((p) => p.id === id)?.name)
                .filter(Boolean)
                .join(", ");
              return (
                <li key={s.id} className="px-4 py-3 text-sm">
                  <Link
                    to="/game/$id/score"
                    params={{ id: s.bggId }}
                    className="font-semibold"
                  >
                    {g?.name ?? s.bggId}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {s.draw ? "Draw" : names || "Logged"} · {new Date(s.at).toLocaleDateString()}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
