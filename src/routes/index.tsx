import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Dices, Library, Mic, Trophy, Users, X } from "lucide-react";
import { FoxAvatar } from "@/components/fox-avatar";
import { Button } from "@/components/ui/button";
import { GameCover } from "@/components/game-cover";
import { AdBanner } from "@/components/ad-banner";
import { WhosHome } from "@/components/whos-home";
import { useAppStore } from "@/lib/store";
import {
  formatAge,
  formatPlaytime,
  formatPlayers,
  getGame,
  pickTonight,
} from "@/lib/scoring";
import { getScoreCard, lifetimeStats, resolveWinners } from "@/lib/scorecards";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const owned = useAppStore((s) => s.owned);
  const lastResults = useAppStore((s) => s.lastResults);
  const pending = useAppStore((s) => s.pendingPlayPrompt);
  const dismissPlayPrompt = useAppStore((s) => s.dismissPlayPrompt);
  const logPlay = useAppStore((s) => s.logPlay);
  const lastSurpriseId = useAppStore((s) => s.lastSurpriseId);
  const setLastSurprise = useAppStore((s) => s.setLastSurprise);
  const wizard = useAppStore((s) => s.wizard);
  const wishlist = useAppStore((s) => s.wishlist);
  const plays = useAppStore((s) => s.plays);
  const vibeWeights = useAppStore((s) => s.vibeWeights);
  const recPool = useAppStore((s) => s.recPool);
  const tablePlayers = useAppStore((s) => s.tablePlayers);
  const sessions = useAppStore((s) => s.scoreSessions);
  const [surprise, setSurprise] = useState<Game | null>(null);
  const shelf = owned.map(getGame).filter(Boolean).slice(0, 6);

  const recs = (lastResults?.ownedTop.length ? lastResults.ownedTop : lastResults?.unownedTop ?? []).slice(0, 3);

  const ranked = [...tablePlayers]
    .map((p) => ({
      player: p,
      ...lifetimeStats(p.id, sessions, (id) => {
        const g = getGame(id);
        return g ? getScoreCard(g) : null;
      }),
    }))
    .sort((a, b) => b.wins - a.wins || b.games - a.games)
    .filter((r) => r.games > 0)
    .slice(0, 3);

  const recentWins = sessions.slice(0, 4).map((s) => {
    const g = getGame(s.bggId);
    const def = g ? getScoreCard(g) : null;
    const winners = def ? resolveWinners(def, s) : [];
    const names = winners
      .map((id) => tablePlayers.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    return { s, g, names };
  });

  function rollSurprise() {
    const ids = recPool?.ids.length ? recPool.ids : owned;
    if (!ids.length) {
      navigate({ to: "/vault" });
      return;
    }
    const pick = pickTonight(
      wizard,
      { owned: ids, wishlist, plays, vibeWeights },
      lastSurpriseId ?? undefined,
    );
    if (pick) {
      setSurprise(pick);
      setLastSurprise(pick.bggId);
    }
  }

  return (
    <div className="pb-8">
      <div className="anim-rise flex flex-col items-center pt-1 text-center">
        <FoxAvatar mood="proud" size="md" />
        <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-fox">Finn is ready</p>
        <h1 className="mt-2 max-w-md font-display text-4xl">What should we play right now?</h1>
      </div>

      <WhosHome />

      <div className="anim-rise mt-5 flex flex-col gap-2">
        <Button size="xl" className="w-full" onClick={() => navigate({ to: "/wizard" })}>
          Pick a game
          <ArrowRight className="size-5" />
        </Button>
        <Button size="lg" variant="secondary" className="w-full" onClick={rollSurprise}>
          <Dices className="size-4" />
          Surprise me from the vault
        </Button>
        <Link to="/circle" className="inline-flex items-center justify-center gap-2 py-2 text-sm font-semibold text-sky">
          <Users className="size-4" />
          Play with family or friends
        </Link>
      </div>

      <section className="anim-rise mt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-fox">Play here while you wait</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link to="/play/bank" className="rounded-card bg-card px-3 py-3 shadow-card">
            <p className="font-display text-lg">Bank</p>
            <p className="text-xs text-muted-foreground">Dice. Don't be the 7.</p>
          </Link>
          <Link to="/play/stockpile" className="rounded-card bg-card px-3 py-3 shadow-card">
            <p className="font-display text-lg">Stockpile</p>
            <p className="text-xs text-muted-foreground">Empty your stock. 1 to 12.</p>
          </Link>
        </div>
      </section>

      {pending ? (
        <section className="anim-rise mt-6 rounded-card bg-card p-4 shadow-card">
          <p className="font-display text-lg">Did you play {pending.name}? How'd it go?</p>
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

      {recs.length ? (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">For tonight</h2>
            <Link to="/results" className="text-sm font-semibold text-sky">
              Open results
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recs.map((g) => (
              <Link key={g.bggId} to="/game/$id" params={{ id: g.bggId }} className="w-24 shrink-0">
                <GameCover game={g} className="aspect-[5/7] w-full" />
                <p className="mt-1 truncate text-xs font-semibold">{g.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {ranked.length ? (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl">
              <Trophy className="size-5 text-fox" />
              Forever scores
            </h2>
            <Link to="/scoreboard" className="text-sm font-semibold text-sky">
              Full board
            </Link>
          </div>
          <ol className="divide-y divide-border rounded-card bg-card shadow-card">
            {ranked.map((row) => (
              <li key={row.player.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-semibold" style={{ color: row.player.color }}>
                  {row.player.name}
                </span>
                <span className="font-display text-xl tabular-nums">{row.wins}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {recentWins.length ? (
        <section className="mt-8">
          <h2 className="mb-2 font-display text-xl">Who won</h2>
          <ul className="divide-y divide-border rounded-card bg-card shadow-card">
            {recentWins.map(({ s, g, names }) => (
              <li key={s.id} className="px-4 py-3 text-sm">
                <Link to="/game/$id/score" params={{ id: s.bggId }} className="font-semibold">
                  {g?.name ?? "A game"}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {s.draw ? "Draw" : names || "Logged"} · {new Date(s.at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <Library className="size-5 text-fox" />
            Your vault
          </h2>
          <Link to="/vault" className="text-sm font-semibold text-sky">
            {owned.length ? `${owned.length} games` : "Open"}
          </Link>
        </div>
        {shelf.length ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {shelf.map((g) =>
              g ? (
                <Link key={g.bggId} to="/game/$id" params={{ id: g.bggId }}>
                  <GameCover game={g} className="aspect-[5/7] w-full" />
                </Link>
              ) : null,
            )}
          </div>
        ) : (
          <div className="rounded-card bg-card px-4 py-6 text-center shadow-card">
            <p className="text-sm text-muted-foreground">
              Scan your shelf so Finn can pick from games you already own.
            </p>
            <Button asChild size="sm" variant="secondary" className="mt-3">
              <Link to="/vault">Open the vault</Link>
            </Button>
          </div>
        )}
      </section>

      <AdBanner />

      {surprise ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-night/40 sm:place-items-center sm:p-6">
          <div className="w-full max-w-md rounded-t-2xl bg-background p-5 shadow-lift sm:rounded-2xl">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-fox">Just pick something</p>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-button hover:bg-muted"
                onClick={() => setSurprise(null)}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-3 flex gap-4">
              <GameCover game={surprise} className="w-24 shrink-0" />
              <div>
                <h2 className="font-display text-2xl">{surprise.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatPlayers(surprise)} players · {formatPlaytime(surprise)} · {formatAge(surprise)}
                </p>
                <p className="mt-3 text-sm">From your vault, with tonight's people and time in mind.</p>
              </div>
            </div>
            <Button
              className="mt-5 w-full"
              onClick={() => navigate({ to: "/game/$id", params: { id: surprise.bggId } })}
            >
              <Mic className="size-4" />
              Teach me, then play
            </Button>
            <Button className="mt-2 w-full" variant="secondary" onClick={rollSurprise}>
              Surprise me again
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
