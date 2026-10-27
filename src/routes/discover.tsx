import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { GameCover } from "@/components/game-cover";
import { AdBanner } from "@/components/ad-banner";
import { VibeGrid } from "@/components/vibe-grid";
import {
  AgeBands,
  PlayerPicker,
  TimeChips,
  WIZARD_QUESTIONS,
} from "@/components/wizard-controls";
import { STARTER_SHELF_IDS, standaloneGames } from "@/lib/catalog";
import { discoverGames, formatPlaytime, formatPlayers, getGame } from "@/lib/scoring";
import { useAppStore } from "@/lib/store";
import type { Game, VibeId, WizardContext } from "@/lib/types";

export const Route = createFileRoute("/discover")({ component: DiscoverPage });

const EMPTY_FILTERS: WizardContext = {
  players: null,
  ageBand: null,
  maxTimeMin: null,
  timeOver60: false,
  vibes: [],
  exactTraits: null,
};

function DiscoverPage() {
  const owned = useAppStore((s) => s.owned);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<WizardContext>(() => ({ ...EMPTY_FILTERS }));
  const [browseAll, setBrowseAll] = useState(false);

  const filtered =
    Boolean(q.trim()) ||
    filters.players != null ||
    filters.ageBand != null ||
    filters.maxTimeMin != null ||
    filters.timeOver60 ||
    filters.vibes.length > 0;

  const results = useMemo(() => {
    return discoverGames(filters, q);
  }, [filters, q]);

  const popular = useMemo(() => {
    const fromShelf = STARTER_SHELF_IDS.map(getGame).filter((g): g is Game => Boolean(g));
    if (fromShelf.length >= 8) return fromShelf.slice(0, 10);
    return standaloneGames()
      .slice()
      .sort((a, b) => b.bggRating - a.bggRating)
      .slice(0, 10);
  }, []);

  const list = filtered || browseAll ? results : popular;

  function clear() {
    setQ("");
    setFilters({ ...EMPTY_FILTERS });
    setBrowseAll(false);
  }

  function toggleVibe(vibe: VibeId) {
    setFilters((current) => ({
      ...current,
      vibes: current.vibes.includes(vibe)
        ? current.vibes.filter((value) => value !== vibe)
        : [...current.vibes, vibe],
    }));
  }

  return (
    <div className="pb-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-fox">Find a game</p>
      <h1 className="font-display text-3xl">What are you looking for?</h1>

      <label className="mt-4 flex min-h-12 items-center gap-2 rounded-card bg-card px-3 shadow-card">
        <Search className="size-5 shrink-0 text-fox" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Catan, Ticket to Ride…"
          className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          type="search"
          enterKeyHint="search"
          autoCapitalize="off"
          autoCorrect="off"
        />
        {q ? (
          <button type="button" className="grid size-11 place-items-center text-muted-foreground" onClick={() => setQ("")} aria-label="Clear search">
            <X className="size-4" />
          </button>
        ) : null}
      </label>

      <fieldset className="mt-4">
        <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {WIZARD_QUESTIONS[0].title}
        </legend>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filters.players == null ? "No player-count limit" : WIZARD_QUESTIONS[0].hint}
          </p>
          <SkipFilter
            label="player count"
            onClick={() => setFilters((current) => ({ ...current, players: null }))}
          />
        </div>
        <PlayerPicker
          value={filters.players}
          onChange={(players) => setFilters((current) => ({ ...current, players }))}
        />
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {WIZARD_QUESTIONS[1].title}
        </legend>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{WIZARD_QUESTIONS[1].hint}</p>
          <SkipFilter
            label="youngest age"
            onClick={() => setFilters((current) => ({ ...current, ageBand: null }))}
          />
        </div>
        <div className="mt-3">
          <AgeBands
            value={filters.ageBand}
            onChange={(ageBand) => setFilters((current) => ({ ...current, ageBand }))}
          />
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {WIZARD_QUESTIONS[2].title}
        </legend>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{WIZARD_QUESTIONS[2].hint}</p>
          <SkipFilter
            label="maximum playtime"
            onClick={() =>
              setFilters((current) => ({ ...current, maxTimeMin: null, timeOver60: false }))
            }
          />
        </div>
        <div className="mt-3">
          <TimeChips
            value={filters.maxTimeMin}
            over60={filters.timeOver60}
            onChange={(maxTimeMin, timeOver60) =>
              setFilters((current) => ({ ...current, maxTimeMin, timeOver60 }))
            }
          />
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {WIZARD_QUESTIONS[3].title}
        </legend>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{WIZARD_QUESTIONS[3].hint}</p>
          <SkipFilter
            label="vibe preferences"
            onClick={() => setFilters((current) => ({ ...current, vibes: [] }))}
          />
        </div>
        <div className="mt-3">
          <VibeGrid selected={filters.vibes} onToggle={toggleVibe} />
        </div>
      </fieldset>

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <p className="font-display text-xl">
          {filtered
            ? `${results.length} ${results.length === 1 ? "game" : "games"}`
            : browseAll
              ? "All games"
              : "Popular to start"}
        </p>
        {filtered ? (
          <button
            type="button"
            className="min-h-11 text-sm font-semibold text-sky"
            onClick={clear}
          >
            Clear
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="min-h-11 text-sm font-semibold text-sky"
              onClick={() => setBrowseAll((current) => !current)}
            >
              {browseAll ? "Popular picks" : "Browse all"}
            </button>
            <Link to="/wizard" className="min-h-11 text-sm font-semibold text-sky">
              Ask Finn
            </Link>
          </div>
        )}
      </div>

      {list.length ? (
        <ul className="mt-2 space-y-2">
          {list.map((g) => (
            <li key={g.bggId}>
              <Link
                to="/game/$id"
                params={{ id: g.bggId }}
                className="flex min-h-20 items-center gap-3 rounded-card bg-card px-3 py-2 shadow-card"
              >
                <GameCover game={g} className="h-16 w-12 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg leading-tight">{g.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatPlayers(g)} players · {formatPlaytime(g)}
                    {owned.includes(g.bggId) ? " · In vault" : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-card bg-card p-5 text-center shadow-card">
          <p className="font-display text-xl">Nothing with those knobs</p>
          <p className="mt-1 text-sm text-muted-foreground">Clear a filter or search a name.</p>
          <button
            type="button"
            className="mt-3 min-h-11 font-semibold text-fox"
            onClick={clear}
          >
            Start over
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Tonight’s pick is on Home. This is the whole shelf.
      </p>
      <AdBanner />
    </div>
  );
}

function SkipFilter({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Skip ${label} filter`}
      className="min-h-11 px-2 text-sm font-semibold text-sky"
    >
      Skip
    </button>
  );
}
