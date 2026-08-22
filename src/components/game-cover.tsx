import { hashString } from "@/lib/utils";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

const PALETTES = [
  ["#E8642B", "#1A1A2E", "#FBF6EF"],
  ["#4A6B4D", "#FBF6EF", "#1A1A2E"],
  ["#A63D57", "#FBF6EF", "#1A1A2E"],
  ["#7FA8C9", "#1A1A2E", "#FBF6EF"],
  ["#C44D1A", "#F3EADC", "#1A1A2E"],
  ["#2A2A44", "#E8642B", "#FBF6EF"],
];

function artKind(game: Pick<Game, "vibes" | "mechanics" | "name">): 0 | 1 | 2 | 3 | 4 {
  if (game.vibes.includes("dexterity")) return 4;
  if (game.vibes.includes("party")) return 1;
  if (game.vibes.includes("board")) return 0;
  if (game.vibes.includes("luck")) return 2;
  if (game.vibes.includes("strategy")) return 3;
  return (hashString(game.name) % 5) as 0 | 1 | 2 | 3 | 4;
}

export function GameCover({
  game,
  className,
}: {
  game: Pick<Game, "name" | "bggId" | "yearPublished" | "vibes" | "mechanics">;
  className?: string;
}) {
  const h = hashString(game.bggId + game.name);
  const [a, b, c] = PALETTES[h % PALETTES.length];
  const kind = artKind(game);

  return (
    <div
      className={cn("relative overflow-hidden rounded-[14px] shadow-card", className)}
      style={{ background: a }}
      aria-hidden
    >
      <svg viewBox="0 0 100 140" className="size-full">
        <rect x="8" y="10" width="84" height="120" rx="6" fill={b} opacity="0.18" />
        <rect x="14" y="16" width="72" height="100" rx="4" fill="none" stroke={c} strokeWidth="1.4" opacity="0.45" />
        {kind === 0 && (
          <>
            <rect x="22" y="32" width="56" height="56" rx="3" fill={c} opacity="0.22" />
            <path d="M22 60 H78 M50 32 V88 M22 46 H78 M22 74 H78" stroke={b} strokeWidth="1.2" opacity="0.5" />
            <circle cx="36" cy="52" r="4" fill={c} opacity="0.7" />
            <circle cx="64" cy="70" r="4" fill={c} opacity="0.7" />
          </>
        )}
        {kind === 1 && (
          <>
            <rect x="24" y="36" width="28" height="40" rx="3" fill={c} opacity="0.55" transform="rotate(-12 38 56)" />
            <rect x="46" y="34" width="28" height="40" rx="3" fill={b} opacity="0.45" transform="rotate(10 60 54)" />
            <rect x="36" y="40" width="28" height="40" rx="3" fill={c} opacity="0.85" />
          </>
        )}
        {kind === 2 && (
          <>
            <rect x="28" y="40" width="44" height="44" rx="8" fill={c} opacity="0.7" />
            <circle cx="40" cy="52" r="3.2" fill={b} />
            <circle cx="60" cy="52" r="3.2" fill={b} />
            <circle cx="50" cy="62" r="3.2" fill={b} />
            <circle cx="40" cy="72" r="3.2" fill={b} />
            <circle cx="60" cy="72" r="3.2" fill={b} />
          </>
        )}
        {kind === 3 && (
          <>
            <polygon points="50,28 78,50 50,92 22,50" fill={c} opacity="0.35" />
            <polygon points="50,40 68,54 50,78 32,54" fill={b} opacity="0.45" />
            <circle cx="50" cy="56" r="5" fill={c} opacity="0.9" />
          </>
        )}
        {kind === 4 && (
          <>
            <ellipse cx="50" cy="88" rx="26" ry="8" fill={b} opacity="0.35" />
            <rect x="36" y="70" width="28" height="10" rx="2" fill={c} opacity="0.85" />
            <rect x="40" y="58" width="20" height="10" rx="2" fill={c} opacity="0.7" />
            <rect x="44" y="46" width="12" height="10" rx="2" fill={c} opacity="0.55" />
          </>
        )}
        <rect x="22" y="108" width="56" height="8" rx="2" fill={c} opacity="0.35" />
      </svg>
    </div>
  );
}
