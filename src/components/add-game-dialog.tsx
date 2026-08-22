import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { searchGames, standaloneGames } from "@/lib/catalog";
import { useAppStore } from "@/lib/store";
import { GameCover } from "./game-cover";
import { Button } from "./ui/button";

export function AddGameDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const owned = useAppStore((s) => s.owned);
  const addOwned = useAppStore((s) => s.addOwned);
  const results = useMemo(
    () =>
      (q ? searchGames(q) : standaloneGames().slice().sort((a, b) => a.name.localeCompare(b.name))).slice(
        0,
        20,
      ),
    [q],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/40 p-0 sm:items-center sm:p-6">
      <div className="flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-2xl bg-background shadow-lift sm:rounded-2xl">
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="font-display text-xl">Search by title</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-button hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <label className="mx-4 mt-3 flex items-center gap-2 rounded-button bg-card px-3 ring-1 ring-border">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the catalog"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <ul className="mt-2 flex-1 overflow-y-auto px-2 pb-6">
          {results.map((g) => {
            const onShelf = owned.includes(g.bggId);
            return (
              <li key={g.bggId} className="flex items-center gap-3 px-2 py-2">
                <GameCover game={g} className="h-14 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.yearPublished}</p>
                </div>
                <Button
                  size="sm"
                  variant={onShelf ? "moss" : "primary"}
                  onClick={() => addOwned(g.bggId)}
                  disabled={onShelf}
                >
                  {onShelf ? "Owned" : "Add"}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
