import { coverSrc } from "@/lib/cover-art";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GameCover({
  game,
  className,
}: {
  game: Pick<Game, "name" | "bggId" | "yearPublished" | "vibes" | "mechanics" | "categories">;
  className?: string;
}) {
  return (
    <div className={cn("game-cover aspect-[3/4]", className)} aria-hidden>
      <img src={coverSrc(game)} alt="" className="game-cover-art" />
    </div>
  );
}
