import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, Heart, Library, Mic, Play, Trophy } from "lucide-react";
import { toast } from "sonner";
import { GameCover } from "@/components/game-cover";
import { RubricRadar } from "@/components/rubric-radar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { GameRow } from "@/components/match-card";
import { getGame, similarGames, formatPlaytime, formatPlayers, formatAge } from "@/lib/scoring";
import { useAppStore } from "@/lib/store";
import { VIBE_META, traitScore } from "@/lib/vibes";
import { amazonSearchUrl } from "@/lib/affiliate";
import { BANK_BGG_ID } from "@/lib/bank";
import { STOCKPILE_ID } from "@/lib/minigames/stockpile";
import type { VibeId } from "@/lib/types";
import { useFlag } from "@/lib/flags";
import { FinnCoach } from "@/components/finn-coach";

export const Route = createFileRoute("/game/$id/")({ component: GamePage });

function GamePage() {
  const { id } = Route.useParams();
  const game = getGame(id);
  const owned = useAppStore((s) => s.owned.includes(id));
  const wish = useAppStore((s) => s.wishlist.includes(id));
  const addOwned = useAppStore((s) => s.addOwned);
  const removeOwned = useAppStore((s) => s.removeOwned);
  const toggleWishlist = useAppStore((s) => s.toggleWishlist);
  const logPlay = useAppStore((s) => s.logPlay);
  const fromResults = useAppStore((s) =>
    Boolean(
      s.lastResults &&
        [...s.lastResults.ownedTop, ...s.lastResults.unownedTop].some((g) => g.bggId === id),
    ),
  );
  const match = useAppStore((s) =>
    s.lastResults
      ? [...s.lastResults.ownedTop, ...s.lastResults.unownedTop].find((g) => g.bggId === id)
      : undefined,
  );
  const [logging, setLogging] = useState(false);
  const [enjoyed, setEnjoyed] = useState(true);
  const amazonOn = useFlag("amazon_cta");

  if (!game) {
    return (
      <EmptyState
        mood="shrug"
        title="Game not found"
        body="Finn doesn't have that one in the catalog."
        cta="Back to discover"
        onCta={() => history.back()}
      />
    );
  }

  const related = similarGames(game);
  const amazon = amazonSearchUrl(game.name);
  const bgg = /^\d+$/.test(game.bggId)
    ? `https://boardgamegeek.com/boardgame/${game.bggId}`
    : `https://boardgamegeek.com/geeksearch.php?action=search&objecttype=boardgame&q=${encodeURIComponent(game.name)}`;

  return (
    <div className="pb-10">
      <div className="flex gap-4">
        <GameCover game={game} className="w-28 shrink-0 sm:w-36" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-fox">
            {game.yearPublished} · {game.designer}
          </p>
          <h1 className="mt-1 font-display text-3xl">{game.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatPlayers(game)} players · {formatPlaytime(game)} · {formatAge(game)}
          </p>
          <p className="mt-2 text-sm font-semibold">BGG Rating: {game.bggRating.toFixed(1)} / 10</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {game.vibes.map((v) => (
              <span key={v} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                {VIBE_META[v].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {fromResults && match ? (
        <p className="mt-4 rounded-card bg-fox/10 px-4 py-3 text-sm">{match.why}</p>
      ) : null}

      <p className="mt-5 text-pretty leading-relaxed">{game.description}</p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {owned ? (
          <>
            <Button variant="moss" disabled>
              <Library className="size-4" />
              In Your Vault
            </Button>
            <Button variant="outline" onClick={() => removeOwned(game.bggId)}>
              Remove from Vault
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              onClick={() => {
                const r = addOwned(game.bggId);
                if (r === "ok") toast("Added to your vault");
              }}
            >
              <Library className="size-4" />
              Add to Vault
            </Button>
            <Button variant={wish ? "secondary" : "outline"} onClick={() => toggleWishlist(game.bggId)}>
              <Heart className={wish ? "size-4 fill-fox text-fox" : "size-4"} />
              {wish ? "On Wishlist" : "Add to Wishlist"}
            </Button>
          </>
        )}
      </div>
      {owned ? (
        <Button
          className="mt-2 w-full"
          variant={wish ? "secondary" : "ghost"}
          onClick={() => toggleWishlist(game.bggId)}
        >
          <Heart className={wish ? "size-4 fill-fox text-fox" : "size-4"} />
          {wish ? "On Wishlist" : "Add to Wishlist"}
        </Button>
      ) : null}

      <Button className="mt-3 w-full" variant="secondary" asChild>
        <Link to="/game/$id/table" params={{ id: game.bggId }}>
          <Mic className="size-4" />
          Teach me with Finn
        </Link>
      </Button>
      <FinnCoach game={game} />

      <section className="mt-8 rounded-card bg-card p-4 shadow-card">
        <h2 className="font-display text-xl">How it plays</h2>
        <ul className="mt-3 space-y-2">
          {(Object.keys(VIBE_META) as VibeId[]).map((v) => (
            <li key={v} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-muted-foreground">{VIBE_META[v].label}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-fox"
                  style={{ width: `${(traitScore(game, v) / 5) * 100}%` }}
                />
              </span>
              <span className="w-8 text-right tabular-nums">{traitScore(game, v).toFixed(1)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">Scores are 1–5 for each vibe trait.</p>
        <div className="mt-4">
          <RubricRadar rubric={game.rubric} />
        </div>
      </section>

      <section className="mt-6 rounded-card bg-card p-4 shadow-card">
        <h2 className="font-display text-xl">Scorecard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Named players, this game's real pad, wins that never reset.
        </p>
        <Button className="mt-3 w-full" asChild>
          <Link to="/game/$id/score" params={{ id: game.bggId }}>
            <Trophy className="size-4" />
            Open {game.name} scorecard
          </Link>
        </Button>
        {game.bggId === BANK_BGG_ID ? (
          <Button className="mt-3 w-full" variant="secondary" asChild>
            <Link to="/play/bank">
              <Play className="size-4" />
              Play Bank at the table
            </Link>
          </Button>
        ) : null}
        {game.bggId === STOCKPILE_ID ? (
          <Button className="mt-3 w-full" variant="secondary" asChild>
            <Link to="/play/stockpile">
              <Play className="size-4" />
              Play Stockpile at the table
            </Link>
          </Button>
        ) : null}
        {logging ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">Quick vibe check instead?</p>
            <div className="flex gap-2">
              <Button size="sm" variant={enjoyed ? "primary" : "outline"} onClick={() => setEnjoyed(true)}>
                We loved it
              </Button>
              <Button size="sm" variant={!enjoyed ? "berry" : "outline"} onClick={() => setEnjoyed(false)}>
                Not our night
              </Button>
            </div>
            <Button
              onClick={() => {
                logPlay({
                  bggId: game.bggId,
                  players: game.players.best[0] ?? game.players.min,
                  durationMin: game.playtime.avg,
                  enjoyed,
                });
                setLogging(false);
                toast("Logged. Finn is pleased.");
              }}
            >
              Save play
            </Button>
          </div>
        ) : (
          <Button className="mt-3 w-full" variant="ghost" onClick={() => setLogging(true)}>
            <Play className="size-4" />
            Just log that we played
          </Button>
        )}
      </section>

      {!owned && amazonOn && game.bggId !== BANK_BGG_ID && game.bggId !== STOCKPILE_ID ? (
        <a
          href={amazon}
          target="_blank"
          rel="noreferrer sponsored"
          className="mt-6 flex items-center justify-between rounded-card bg-fox px-4 py-4 text-cream shadow-card"
        >
          <div>
            <p className="font-display text-lg">Don't own it yet? It's worth it.</p>
            <p className="text-sm text-cream/80">Buy on Amazon</p>
          </div>
          <ExternalLink className="size-5" />
        </a>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={bgg}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-card px-3 py-1.5 text-sm font-semibold text-sky ring-1 ring-border"
        >
          BoardGameGeek
        </a>
      </div>

      {game.expansions?.length ? (
        <section className="mt-8">
          <h2 className="font-display text-xl">Expansions</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {game.expansions.map((e) => (
              <li key={e.bggId} className="text-muted-foreground">
                {e.name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length ? (
        <section className="mt-8">
          <h2 className="mb-2 font-display text-xl">If you like this</h2>
          <div className="divide-y divide-border rounded-card bg-card px-3 py-1 shadow-card">
            {related.map((g) => (
              <GameRow key={g.bggId} game={g} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
