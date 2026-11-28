import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { searchGames, standaloneGames } from "@/lib/catalog";
import { useAppStore } from "@/lib/store";
import { GameCharacterDetails } from "./game-character-details";
import { amazonSearchUrl } from "@/lib/affiliate";
import { useFlag } from "@/lib/flags";
import { DEFAULT_WIZARD } from "@/lib/store";
import { GameCover } from "./game-cover";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function AddGameDialog({
  open,
  onClose,
  collection = "owned",
}: {
  open: boolean;
  onClose: () => void;
  collection?: "owned" | "wish";
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const wishlist = useAppStore((s) => s.wishlist);
  const toggleWishlist = useAppStore((s) => s.toggleWishlist);
  const wishMode = collection === "wish";
  const amazonOn = useFlag("amazon_cta");
  function add(id: string) {
    if (wishMode) {
      if (!owned.includes(id) && !wishlist.includes(id)) {
        toggleWishlist(id);
        return "ok";
      }
      return "exists";
    }
    return addOwned(id);
  }
  const [q, setQ] = useState("");
  const ready = useAppStore((s) => s.entitlementReady);
  const owned = useAppStore((s) => s.owned);
  const addOwned = useAppStore((s) => s.addOwned);
  const customGames = useAppStore((s) => s.customGames);
  const addCustomGame = useAppStore((s) => s.addCustomGame);
  const [customEntryOpen, setCustomEntryOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const results = useMemo(
    () =>
      q
        ? searchGames(q)
        : standaloneGames()
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name)),
    [q],
  );
  const customResults = useMemo(() => {
    const query = q.trim().toLowerCase();
    return customGames
      .filter((game) => !query || game.title.toLowerCase().includes(query))
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [customGames, q]);

  if (!open) return null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="app-modal-overlay fixed inset-0 z-50 bg-night/40" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            if (window.matchMedia("(pointer: coarse)").matches) event.preventDefault();
          }}
          className="app-bottom-sheet mobile-keyboard-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-2xl bg-background shadow-lift sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        >
          <div className="flex items-center justify-between px-4 pt-4">
            <Dialog.Title className="font-display text-xl">
              {wishMode ? "Add to Wishlist" : "Search by title"}
            </Dialog.Title>
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
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search the catalog"
              placeholder="Search the catalog"
              className="h-11 min-w-0 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
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
                  if (!ready) return;
                  try {
                    const game = addCustomGame(customTitle);
                    const result = add(game.id);
                    if (result === "ok") {
                      toast(
                        wishMode
                          ? "Custom game added to your Wishlist"
                          : "Custom game added to your Vault",
                      );
                      setCustomTitle("");
                      setCustomEntryOpen(false);
                      onClose();
                    } else if (result === "limit") {
                      toast("Your Vault is full. The custom game was saved to your catalog.");
                    } else {
                      toast("That custom game is already in your Vault.");
                    }
                  } catch (error) {
                    toast(
                      error instanceof Error ? error.message : "Couldn't save the custom game.",
                    );
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
          <ul className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-6">
            {customResults.map((game) => {
              const onShelf = owned.includes(game.id) || (wishMode && wishlist.includes(game.id));
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
                    onClick={() => add(game.id)}
                    disabled={!ready || onShelf}
                  >
                    {onShelf
                      ? wishMode && !owned.includes(game.id)
                        ? "Wishlisted"
                        : "Owned"
                      : "Add"}
                  </Button>
                </li>
              );
            })}
            {results.map((g) => {
              const onShelf = owned.includes(g.bggId) || (wishMode && wishlist.includes(g.bggId));
              return (
                <li key={g.bggId} className="px-2 py-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-expanded={expanded === g.bggId}
                      aria-label={`Details for ${g.name}`}
                      onClick={() => setExpanded(expanded === g.bggId ? null : g.bggId)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <GameCover game={g} className="h-14 w-10 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{g.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {g.yearPublished}
                        </span>
                      </span>
                      <ChevronDown
                        className={`size-4 shrink-0 ${expanded === g.bggId ? "rotate-180" : ""}`}
                      />
                    </button>
                    <Button
                      size="sm"
                      variant={onShelf ? "moss" : "primary"}
                      onClick={() => add(g.bggId)}
                      disabled={!ready || onShelf}
                    >
                      {onShelf
                        ? wishMode && !owned.includes(g.bggId)
                          ? "Wishlisted"
                          : "Owned"
                        : "Add"}
                    </Button>
                  </div>
                  {expanded === g.bggId && (
                    <div className="mt-2 rounded-card bg-muted p-3 text-sm">
                      <GameCharacterDetails
                        game={g}
                        context={{
                          ...DEFAULT_WIZARD,
                          players: null,
                          ageBand: null,
                          maxTimeMin: null,
                        }}
                        compact
                      />
                      {amazonOn && !owned.includes(g.bggId) && (
                        <a
                          className="mt-3 block text-center font-semibold text-sky"
                          href={amazonSearchUrl(g.name)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Search Amazon for this game
                        </a>
                      )}
                      {!owned.includes(g.bggId) && (
                        <Button
                          className="mt-3 w-full"
                          variant="outline"
                          onClick={() => toggleWishlist(g.bggId)}
                        >
                          {wishlist.includes(g.bggId) ? "Remove from Wishlist" : "Add to Wishlist"}
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
