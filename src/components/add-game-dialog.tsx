import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { searchGames, standaloneGames } from "@/lib/catalog";
import { useAppStore } from "@/lib/store";
import { GameCover } from "./game-cover";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function AddGameDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const owned = useAppStore((s) => s.owned);
  const addOwned = useAppStore((s) => s.addOwned);
  const customGames = useAppStore((s) => s.customGames);
  const addCustomGame = useAppStore((s) => s.addCustomGame);
  const [customEntryOpen, setCustomEntryOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const results = useMemo(
    () =>
      (q
        ? searchGames(q)
        : standaloneGames()
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
      ).slice(0, 20),
    [q],
  );
  const customResults = useMemo(() => {
    const query = q.trim().toLowerCase();
    return customGames
      .filter((game) => !query || game.title.toLowerCase().includes(query))
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 20);
  }, [customGames, q]);

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
        <div className="px-4 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomEntryOpen((isOpen) => !isOpen)}
          >
            {customEntryOpen ? "Cancel custom game" : "Add a custom game"}
          </Button>
          {customEntryOpen ? (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                try {
                  const game = addCustomGame(customTitle);
                  const result = addOwned(game.id);
                  if (result === "ok") {
                    toast("Custom game added to your Vault");
                    setCustomTitle("");
                    setCustomEntryOpen(false);
                    onClose();
                  } else if (result === "limit") {
                    toast("Your Vault is full. The custom game was saved to your catalog.");
                  } else {
                    toast("That custom game is already in your Vault.");
                  }
                } catch (error) {
                  toast(error instanceof Error ? error.message : "Couldn't save the custom game.");
                }
              }}
            >
              <input
                autoFocus
                required
                maxLength={120}
                value={customTitle}
                onChange={(event) => setCustomTitle(event.target.value)}
                placeholder="Game title"
                aria-label="Custom game title"
                className="h-10 min-w-0 flex-1 rounded-button bg-background px-3 text-sm ring-1 ring-border"
              />
              <Button type="submit" size="sm">
                Save
              </Button>
            </form>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            Custom games are saved with unknown details until you add verified information.
          </p>
        </div>
        <ul className="mt-2 flex-1 overflow-y-auto px-2 pb-6">
          {customResults.map((game) => {
            const onShelf = owned.includes(game.id);
            return (
              <li key={game.id} className="flex items-center gap-3 px-2 py-2">
                <div className="grid h-14 w-10 shrink-0 place-items-center rounded-card bg-muted text-[10px] font-semibold text-muted-foreground">
                  Custom
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{game.title}</p>
                  <p className="text-xs text-muted-foreground">Details not verified</p>
                </div>
                <Button
                  size="sm"
                  variant={onShelf ? "moss" : "primary"}
                  onClick={() => addOwned(game.id)}
                  disabled={onShelf}
                >
                  {onShelf ? "Owned" : "Add"}
                </Button>
              </li>
            );
          })}
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
