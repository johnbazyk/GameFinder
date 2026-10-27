import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Dices, Mic, X } from "lucide-react";
import { FoxAvatar } from "@/components/fox-avatar";
import { Button } from "@/components/ui/button";
import { GameCover } from "@/components/game-cover";
import { useAppStore } from "@/lib/store";
import {
  formatAge,
  formatPlaytime,
  formatPlayers,
  pickSurprise,
} from "@/lib/scoring";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const owned = useAppStore((s) => s.owned);
  const lastSurpriseId = useAppStore((s) => s.lastSurpriseId);
  const setLastSurprise = useAppStore((s) => s.setLastSurprise);
  const [surprise, setSurprise] = useState<Game | null>(null);
  const [surpriseMessage, setSurpriseMessage] = useState<string | null>(null);

  function rollSurprise() {
    if (!owned.length) {
      setSurprise(null);
      setSurpriseMessage("Your vault is empty. Add a game to your vault before asking Finn to pick one.");
      return;
    }
    const pick = pickSurprise(owned, lastSurpriseId ?? undefined);
    if (!pick) {
      setSurprise(null);
      setSurpriseMessage("No playable games were found in your vault. Update your vault and try again.");
      return;
    }
    setSurpriseMessage(null);
    setSurprise(pick);
    setLastSurprise(pick.bggId);
  }

  return (
    <div className="pb-8">
      <div className="anim-rise flex flex-col items-center pt-1 text-center">
        <FoxAvatar mood="proud" size="md" />
        <h1 className="mt-2 max-w-md font-display text-4xl">What should we play right now?</h1>
      </div>

      <div className="anim-rise mt-5 flex flex-col gap-2">
        <Button size="xl" className="w-full" onClick={() => navigate({ to: "/wizard" })}>
          Find a Game
          <ArrowRight className="size-5" />
        </Button>
        <Button size="lg" variant="secondary" className="w-full" onClick={rollSurprise}>
          <Dices className="size-4" />
          Surprise Me
        </Button>
      </div>

      {surprise || surpriseMessage ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-night/40 sm:place-items-center sm:p-6">
          <div className="w-full max-w-md rounded-t-2xl bg-background p-5 shadow-lift sm:rounded-2xl">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-fox">
                {surprise ? "Just pick something" : "Surprise me"}
              </p>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-button hover:bg-muted"
                onClick={() => {
                  setSurprise(null);
                  setSurpriseMessage(null);
                }}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            {surprise ? (
              <>
                <div className="mt-3 flex gap-4">
                  <GameCover game={surprise} className="w-24 shrink-0" />
                  <div>
                    <h2 className="font-display text-2xl">{surprise.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatPlayers(surprise)} players · {formatPlaytime(surprise)} · {formatAge(surprise)}
                    </p>
                    <p className="mt-3 text-sm">A random pick from your vault, without applying filters.</p>
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
              </>
            ) : (
              <>
                <p className="mt-4 text-sm text-muted-foreground">{surpriseMessage}</p>
                <Button asChild className="mt-5 w-full">
                  <Link to="/vault">Open your vault</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
