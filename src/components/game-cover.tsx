import type { CSSProperties } from "react";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCENTS = ["#b74d28", "#49664b", "#476b82", "#79617d"];

/** Original, decorative placeholder. Colors do not encode game ratings or types. */
export function GameCover({
  game,
  className,
}: {
  game: Pick<Game, "name" | "bggId" | "yearPublished" | "vibes" | "mechanics" | "categories">;
  className?: string;
}) {
  const hash = Array.from(game.bggId || game.name).reduce(
    (n, c) => (n * 31 + c.charCodeAt(0)) >>> 0,
    0,
  );
  return (
    <div
      className={cn("game-cover aspect-[3/4]", className)}
      aria-hidden="true"
      style={{ "--cover-accent": ACCENTS[hash % ACCENTS.length] } as CSSProperties}
    >
      <div className="game-cover-placeholder">
        <span className="game-cover-brand">GAMEFINDER</span>
        <svg className="game-cover-symbol" viewBox="0 0 100 80" fill="none" focusable="false">
          <rect
            x="16"
            y="10"
            width="43"
            height="55"
            rx="8"
            transform="rotate(-12 16 10)"
            fill="currentColor"
            opacity=".12"
          />
          <rect
            x="31"
            y="12"
            width="43"
            height="55"
            rx="8"
            fill="#fffaf2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M52 25 64 39 52 53 40 39Z" fill="currentColor" opacity=".85" />
          <circle cx="72" cy="62" r="12" fill="#fffaf2" stroke="currentColor" strokeWidth="2" />
          <circle cx="72" cy="62" r="6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="game-cover-title">{game.name}</span>
        <span className="game-cover-caption">Cover coming soon</span>
      </div>
    </div>
  );
}
