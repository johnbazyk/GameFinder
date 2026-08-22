import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Camera, Plus, Search } from "lucide-react";
import { AddGameDialog } from "@/components/add-game-dialog";
import { ScanGames } from "@/components/scan-games";
import { EmptyState } from "@/components/empty-state";
import { GameCover } from "@/components/game-cover";
import { Button } from "@/components/ui/button";
import { AdBanner } from "@/components/ad-banner";
import { getGame } from "@/lib/scoring";
import { useAppStore } from "@/lib/store";
import { FREE_VAULT_LIMIT } from "@/lib/types";
import { useFlag } from "@/lib/flags";

export const Route = createFileRoute("/vault")({ component: VaultPage });

function VaultPage() {
  const owned = useAppStore((s) => s.owned);
  const wishlist = useAppStore((s) => s.wishlist);
  const isPremium = useAppStore((s) => s.isPremium);
  const stockStarterShelf = useAppStore((s) => s.stockStarterShelf);
  const [scan, setScan] = useState(false);
  const [manual, setManual] = useState(false);
  const [tab, setTab] = useState<"owned" | "wish">("owned");
  const [q, setQ] = useState("");
  const scanOn = useFlag("scan_games");
  const paywall = useFlag("premium_paywall");

  const games = useMemo(() => {
    const ids = tab === "owned" ? owned : wishlist;
    return ids
      .map(getGame)
      .filter((g): g is NonNullable<typeof g> => Boolean(g))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [owned, wishlist, tab]);

  const filtered = q.trim()
    ? games.filter((g) => g.name.toLowerCase().includes(q.trim().toLowerCase()))
    : games;

  if (owned.length === 0 && wishlist.length === 0) {
    return (
      <>
        <EmptyState
          mood="hopeful"
          title="What's on your shelf?"
          body={
            scanOn
              ? "Scan a photo of your games, or search by title. Owned games are what Finn recommends first."
              : "Search by title to stock your vault. Owned games are what Finn recommends first."
          }
          cta={scanOn ? "Scan Games" : "Search by title"}
          onCta={() => (scanOn ? setScan(true) : setManual(true))}
        />
        <div className="flex flex-col items-center gap-2">
          {scanOn ? (
            <Button variant="secondary" onClick={() => setManual(true)}>
              Can't scan it? Search by title.
            </Button>
          ) : null}
          <button
            type="button"
            className="text-sm font-semibold text-sky"
            onClick={() => stockStarterShelf()}
          >
            Or stock a starter shelf
          </button>
        </div>
        <ScanGames open={scan} onClose={() => setScan(false)} />
        <AddGameDialog open={manual} onClose={() => setManual(false)} />
      </>
    );
  }

  return (
    <div className="pb-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Vault</h1>
          <p className="text-sm text-muted-foreground">
            {owned.length}
            {paywall && !isPremium ? ` / ${FREE_VAULT_LIMIT}` : ""} owned · {wishlist.length} wishlisted
          </p>
        </div>
        {scanOn ? (
          <Button onClick={() => setScan(true)}>
            <Camera className="size-4" />
            Scan Games
          </Button>
        ) : (
          <Button onClick={() => setManual(true)}>
            <Plus className="size-4" />
            Add
          </Button>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Tab on={tab === "owned"} onClick={() => setTab("owned")}>
          Owned
        </Tab>
        <Tab on={tab === "wish"} onClick={() => setTab("wish")}>
          Wishlist
        </Tab>
      </div>

      <label className="mt-4 flex items-center gap-2 rounded-button bg-card px-3 ring-1 ring-border">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your vault"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {filtered.map((g) => (
          <Link key={g.bggId} to="/game/$id" params={{ id: g.bggId }}>
            <GameCover game={g} className="aspect-[5/7] w-full" />
            <p className="mt-1 truncate text-xs font-semibold">{g.name}</p>
          </Link>
        ))}
      </div>

      <button
        type="button"
        className="mt-6 flex w-full items-center justify-center gap-2 text-sm font-semibold text-sky"
        onClick={() => setManual(true)}
      >
        <Plus className="size-4" />
        Can't scan it? Search by title.
      </button>
      <AdBanner />
      <ScanGames open={scan} onClose={() => setScan(false)} />
      <AddGameDialog open={manual} onClose={() => setManual(false)} />
    </div>
  );
}

function Tab({
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
      className={
        on
          ? "rounded-full bg-fox px-4 py-1.5 text-sm font-semibold text-cream"
          : "rounded-full bg-card px-4 py-1.5 text-sm font-semibold ring-1 ring-border"
      }
    >
      {children}
    </button>
  );
}
