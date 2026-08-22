import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GameCover } from "@/components/game-cover";
import { AdBanner } from "@/components/ad-banner";
import { searchGames, standaloneGames } from "@/lib/catalog";
import type { VibeId } from "@/lib/types";
import { VIBE_META } from "@/lib/vibes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discover")({ component: DiscoverPage });

const COLLECTIONS: { title: string; filter: (g: ReturnType<typeof standaloneGames>[number]) => boolean }[] = [
  { title: "Trending", filter: () => true },
  { title: "Family Favorites", filter: (g) => g.vibes.includes("family") },
  { title: "Party Games", filter: (g) => g.vibes.includes("party") },
  { title: "Strategic Picks", filter: (g) => g.vibes.includes("strategy") },
  { title: "New Releases", filter: (g) => g.yearPublished >= 2022 },
];

function DiscoverPage() {
  const [q, setQ] = useState("");
  const [vibe, setVibe] = useState<VibeId | "all">("all");
  const pool = standaloneGames();
  const results = useMemo(() => {
    let list = q ? searchGames(q) : pool.slice().sort((a, b) => b.bggRating - a.bggRating);
    if (vibe !== "all") list = list.filter((g) => g.vibes.includes(vibe));
    return list;
  }, [q, vibe, pool]);

  return (
    <div className="pb-8">
      <h1 className="font-display text-3xl">Discover</h1>
      <p className="mt-1 text-sm text-muted-foreground">Browse games to add — or just get inspired.</p>

      <label className="mt-4 flex items-center gap-2 rounded-button bg-card px-3 ring-1 ring-border">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search games"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <FilterChip on={vibe === "all"} onClick={() => setVibe("all")}>
          All
        </FilterChip>
        {(Object.keys(VIBE_META) as VibeId[]).map((id) => (
          <FilterChip key={id} on={vibe === id} onClick={() => setVibe(id)}>
            {VIBE_META[id].label}
          </FilterChip>
        ))}
      </div>

      {q || vibe !== "all" ? (
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {results.map((g) => (
            <Link key={g.bggId} to="/game/$id" params={{ id: g.bggId }}>
              <GameCover game={g} className="aspect-[5/7] w-full" />
              <p className="mt-1 truncate text-xs font-semibold">{g.name}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {COLLECTIONS.map((c) => {
            const list = pool
              .filter(c.filter)
              .sort((a, b) => b.bggRating - a.bggRating)
              .slice(0, 8);
            if (!list.length) return null;
            return (
              <section key={c.title}>
                <h2 className="mb-3 font-display text-xl">{c.title}</h2>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {list.map((g) => (
                    <Link
                      key={g.bggId}
                      to="/game/$id"
                      params={{ id: g.bggId }}
                      className="w-24 shrink-0"
                    >
                      <GameCover game={g} className="aspect-[5/7] w-full" />
                      <p className="mt-1 truncate text-xs font-semibold">{g.name}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <AdBanner />
    </div>
  );
}

function FilterChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold",
        on ? "bg-fox text-cream" : "bg-card ring-1 ring-border",
      )}
    >
      {children}
    </button>
  );
}
