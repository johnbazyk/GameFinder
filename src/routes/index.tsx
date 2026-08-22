import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Dices, Library, Sparkles, Users, X } from "lucide-react";
import { FoxAvatar } from "@/components/fox-avatar";
import { Button } from "@/components/ui/button";
import { GameCover } from "@/components/game-cover";
import { AdBanner } from "@/components/ad-banner";
import { useAppStore } from "@/lib/store";
import { formatAge, formatPlaytime, formatPlayers, getGame, pickSurprise } from "@/lib/scoring";
import { useFlag } from "@/lib/flags";
import type { Game } from "@/lib/types";

const EVERY_SHELF_IDS = [
  "13",
  "9209",
  "178900",
  "230802",
  "30549",
  "148228",
];

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const owned = useAppStore((s) => s.owned);
  const lastResults = useAppStore((s) => s.lastResults);
  const pending = useAppStore((s) => s.pendingPlayPrompt);
  const dismissPlayPrompt = useAppStore((s) => s.dismissPlayPrompt);
  const logPlay = useAppStore((s) => s.logPlay);
  const plays = useAppStore((s) => s.plays);
  const lastSurpriseId = useAppStore((s) => s.lastSurpriseId);
  const setLastSurprise = useAppStore((s) => s.setLastSurprise);
  const surpriseOn = useFlag("surprise_me");
  const [surprise, setSurprise] = useState<Game | null>(null);
  const shelf = owned.map(getGame).filter(Boolean).slice(0, 6);
  const featured = EVERY_SHELF_IDS.map(getGame).filter(Boolean);
  const recent = plays
    .map((p) => getGame(p.bggId))
    .filter((g, i, arr): g is Game => {
      if (!g) return false;
      return arr.findIndex((x) => x?.bggId === g.bggId) === i;
    })
    .slice(0, 6);

  function rollSurprise() {
    if (!owned.length) {
      navigate({ to: "/vault" });
      return;
    }
    const pick = pickSurprise(owned, lastSurpriseId ?? undefined);
    if (pick) {
      setSurprise(pick);
      setLastSurprise(pick.bggId);
    }
  }

  return (
    <div className="pb-8">
      <div className="anim-rise flex flex-col items-center pt-2 text-center">
        <FoxAvatar mood="proud" size="hero" />
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-fox">
          Finn is ready
        </p>
        <h1 className="mt-2 max-w-md font-display text-4xl sm:text-5xl">
          What should we play right now?
        </h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          Four taps. Three from your vault. Built for tonight, not a random list.
        </p>
        <Button
          size="xl"
          className="mt-6 w-full max-w-xs"
          onClick={() => navigate({ to: "/play/bank" })}
        >
          Play Bank vs Finn, Sly & Rook
          <ArrowRight className="size-5" />
        </Button>
        {surpriseOn ? (
          <Button
            size="lg"
            variant="secondary"
            className="mt-3 w-full max-w-xs"
            onClick={rollSurprise}
          >
            <Dices className="size-4" />
            Surprise Me
          </Button>
        ) : null}
        <Link
          to="/circle"
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sky"
        >
          <Users className="size-4" />
          Play with family or friends
        </Link>
      </div>

      <Link
        to="/play/bank"
        className="anim-rise mt-8 flex items-center justify-between rounded-card bg-card px-4 py-4 shadow-card"
      >
        <span>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-fox">
            Play here
          </span>
          <span className="mt-1 block font-display text-xl">Bank</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            You vs Finn, Sly & Rook. First three rolls are safe.
          </span>
        </span>
        <span className="text-sm font-semibold text-sky">Play</span>
      </Link>
      <Link
        to="/play/stockpile"
        className="anim-rise mt-3 flex items-center justify-between rounded-card bg-card px-4 py-4 shadow-card"
      >
        <span>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-fox">
            Play here
          </span>
          <span className="mt-1 block font-display text-xl">Stockpile</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Empty your stock. Build 1 to 12. Wilds are W. You vs three foxes.
          </span>
        </span>
        <span className="text-sm font-semibold text-sky">Play</span>
      </Link>

      {pending ? (
        <section className="anim-rise mt-8 rounded-card bg-card p-4 shadow-card" style={{ animationDelay: "80ms" }}>
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

      {recent.length ? (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl">Recently played</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recent.map((g) => (
              <Link key={g.bggId} to="/game/$id" params={{ id: g.bggId }} className="w-24 shrink-0">
                <GameCover game={g} className="aspect-[5/7] w-full" />
                <p className="mt-1 truncate text-xs font-semibold">{g.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : lastResults?.ownedTop.length ? (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">Last sniff</h2>
            <Link to="/results" className="text-sm font-semibold text-sky">
              Open results
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {lastResults.ownedTop.map((g) => (
              <Link key={g.bggId} to="/game/$id" params={{ id: g.bggId }} className="w-24 shrink-0">
                <GameCover game={g} className="aspect-[5/7] w-full" />
                <p className="mt-1 truncate text-xs font-semibold">{g.name}</p>
              </Link>
            ))}
          </div>
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

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
          <Sparkles className="size-5 text-fox" />
          On every shelf
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {featured.map((g) =>
            g ? (
              <Link key={g.bggId} to="/game/$id" params={{ id: g.bggId }}>
                <GameCover game={g} className="aspect-[5/7] w-full" />
                <p className="mt-1 truncate text-xs font-semibold">{g.name}</p>
              </Link>
            ) : null,
          )}
        </div>
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
                <p className="mt-3 text-sm">Finn grabbed this one at random from your vault. No overthinking.</p>
              </div>
            </div>
            <Button className="mt-5 w-full" onClick={rollSurprise}>
              Surprise Me Again
            </Button>
            <Button className="mt-2 w-full" variant="secondary" onClick={() => navigate({ to: "/wizard" })}>
              Find a Better Fit
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
