import { Link } from "@tanstack/react-router";
import { Check, ExternalLink } from "lucide-react";
import type { Game, MatchLabel, ScoredGame } from "@/lib/types";
import { formatAge, formatPlaytime, formatPlayers } from "@/lib/scoring";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { amazonSearchUrl } from "@/lib/affiliate";
import { useFlag } from "@/lib/flags";
import { GameCover } from "./game-cover";
import { Button } from "./ui/button";

const LABEL: Record<MatchLabel, string> = {
  excellent: "Excellent Match",
  strong: "Strong Match",
  good: "Good Match",
  closest: "Closest Available Match",
};

export function MatchLabelChip({ label }: { label: MatchLabel }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        label === "excellent" && "bg-fox text-cream",
        label === "strong" && "bg-moss text-cream",
        label === "good" && "bg-muted text-foreground",
        label === "closest" && "bg-card text-muted-foreground ring-1 ring-border",
      )}
    >
      {LABEL[label]}
    </span>
  );
}

export function MatchCard({
  game,
  showMatch = true,
  discover = false,
}: {
  game: ScoredGame;
  showMatch?: boolean;
  discover?: boolean;
}) {
  const addOwned = useAppStore((s) => s.addOwned);
  const amazonOn = useFlag("amazon_cta");

  return (
    <article className="anim-reveal rounded-card bg-card p-4 shadow-card">
      <Link to="/game/$id" params={{ id: game.bggId }} className="flex gap-4 text-left">
        <GameCover game={game} className="aspect-[5/7] w-24 shrink-0" />
        <div className="min-w-0 flex-1">
          {showMatch ? <MatchLabelChip label={game.matchLabel} /> : null}
          <h3 className="mt-1 font-display text-xl leading-tight">{game.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatPlayers(game)} players · {formatPlaytime(game)} · {formatAge(game)}
            {game.owned ? (
              <span className="ml-2 inline-flex items-center gap-1 font-semibold text-moss">
                <Check className="size-3.5" /> in your vault
              </span>
            ) : null}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{game.why}</p>
        </div>
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link to="/game/$id" params={{ id: game.bggId }}>
            View game
          </Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link to="/game/$id" params={{ id: game.bggId }} hash="ask-finn">
            Teach me
          </Link>
        </Button>
        {discover && !game.owned && amazonOn ? (
          <a
            href={amazonSearchUrl(game.name)}
            target="_blank"
            rel="noreferrer sponsored"
            className="inline-flex h-9 items-center gap-1 rounded-[10px] px-3 text-sm font-semibold text-sky"
          >
            Buy on Amazon
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
        {!game.owned && !discover ? (
          <Button size="sm" variant="ghost" onClick={() => addOwned(game.bggId)}>
            Add to vault
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function GameRow({
  game,
  owned,
}: {
  game: Game;
  owned?: boolean;
}) {
  return (
    <Link
      to="/game/$id"
      params={{ id: game.bggId }}
      className="flex items-center gap-3 rounded-xl px-1 py-2 transition-colors hover:bg-muted"
    >
      <GameCover game={game} className="h-14 w-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{game.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatPlayers(game)} · {formatPlaytime(game)}
          {owned ? " · In vault" : ""}
        </p>
      </div>
    </Link>
  );
}
