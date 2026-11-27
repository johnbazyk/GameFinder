import { discoverDisplay, RECOMMENDATION_LIMIT } from "@/lib/recommendation-limits";
import { RatingNotice } from "@/components/rating-controls";
import { APPLICATION_RATING_MODE } from "@/lib/rating-policy";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { GameCover } from "@/components/game-cover";
import { VibeGrid } from "@/components/vibe-grid";
import {
  AgeBands,
  DiscoverPlayerPicker,
  TimeChips,
  WIZARD_QUESTIONS,
} from "@/components/wizard-controls";
import { STARTER_SHELF_IDS, standaloneGames } from "@/lib/catalog";
import {
  discoverAlternatives,
  discoverGames,
  formatPlaytime,
  formatPlayers,
  getGame,
} from "@/lib/scoring";
import { useAppStore, DEFAULT_DISCOVER } from "@/lib/store";
import type { Game, VibeId, WizardContext } from "@/lib/types";

export const Route = createFileRoute("/discover")({ component: DiscoverPage });

function DiscoverPage() {
  const owned = useAppStore((s) => s.owned);
  const q = useAppStore((s) => s.discoverQuery);
  const filters = useAppStore((s) => s.discoverFilters);
  const browseAll = useAppStore((s) => s.discoverAll);
  const setQ = (q: string) => useAppStore.setState({ discoverQuery: q });
  const setFilters = (update: WizardContext | ((prev: WizardContext) => WizardContext)) =>
    useAppStore.setState((s) => ({
      discoverFilters: typeof update === "function" ? update(s.discoverFilters) : update,
    }));
  const setBrowseAll = (update: boolean | ((prev: boolean) => boolean)) =>
    useAppStore.setState((s) => ({
      discoverAll: typeof update === "function" ? update(s.discoverAll) : update,
    }));

  const searching = Boolean(q.trim());
  const filtered =
    filters.players != null ||
    filters.ageBand != null ||
    filters.maxTimeMin != null ||
    filters.timeOver60 ||
    filters.vibes.length > 0;

  const results = useMemo(() => {
    return discoverGames(filters, q);
  }, [filters, q]);

  const featured = useMemo(() => {
    const fromShelf = STARTER_SHELF_IDS.map(getGame).filter((g): g is Game => Boolean(g));
    return fromShelf
      .filter((g) => standaloneGames().some((item) => item.bggId === g.bggId))
      .slice(0, RECOMMENDATION_LIMIT);
  }, []);

  const alternatives = useMemo(
    () =>
      !q.trim() && results.length === 0 && filters.vibes.length > 0
        ? discoverAlternatives(filters, q)
        : [],
    [filters, q, results.length],
  );
  const list = discoverDisplay(results, featured, { query: q, filtered, browseAll });

  function clear() {
    setQ("");
    setFilters({ ...DEFAULT_DISCOVER });
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
      <RatingNotice />

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
          <button
            type="button"
            className="grid size-11 place-items-center text-muted-foreground"
            onClick={() => setQ("")}
            aria-label="Clear search"
          >
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
        </div>
        <DiscoverPlayerPicker
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
        </div>
        <div className="mt-3">
          <AgeBands
            value={filters.ageBand}
            onChange={(ageBand) =>
              setFilters((current) => ({
                ...current,
                ageBand: current.ageBand === ageBand ? null : ageBand,
              }))
            }
          />
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {WIZARD_QUESTIONS[2].title}
        </legend>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{WIZARD_QUESTIONS[2].hint}</p>
        </div>
        <div className="mt-3">
          <TimeChips
            value={filters.maxTimeMin}
            over60={filters.timeOver60}
            onChange={(maxTimeMin, timeOver60) =>
              setFilters((current) =>
                current.maxTimeMin === maxTimeMin && current.timeOver60 === timeOver60
                  ? { ...current, maxTimeMin: null, timeOver60: false }
                  : { ...current, maxTimeMin, timeOver60 },
              )
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
        </div>
        <div className="mt-3">
          <VibeGrid selected={filters.vibes} onToggle={toggleVibe} />
        </div>
      </fieldset>

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <p className="font-display text-xl">
          {searching || browseAll
            ? `${list.length} ${list.length === 1 ? "game" : "games"}`
            : filtered
              ? "Recommended games"
              : "Featured Games"}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {filtered || searching ? (
            <button
              type="button"
              className="min-h-11 text-sm font-semibold text-sky"
              onClick={clear}
            >
              Clear
            </button>
          ) : null}
          {!searching && (
            <button
              type="button"
              className="min-h-11 text-sm font-semibold text-sky"
              onClick={() => setBrowseAll((current) => !current)}
            >
              {browseAll
                ? filtered
                  ? "Recommended games"
                  : "Featured games"
                : filtered
                  ? "Browse all matches"
                  : "Browse all"}
            </button>
          )}
          {!filtered && !searching && (
            <Link to="/wizard" className="min-h-11 text-sm font-semibold text-sky">
              Ask Finn
            </Link>
          )}
        </div>
      </div>

      {list.length ? (
        <ul
          aria-label={searching || browseAll ? "Catalog matches" : "Discover recommendations"}
          className="mt-2 space-y-2"
        >
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
                  {APPLICATION_RATING_MODE !== "legacy" && filters.vibes.length > 0 ? (
                    <p className="text-xs">
                      {APPLICATION_RATING_MODE === "beta"
                        ? "Provisional beta filter match"
                        : "Reviewed filter match"}
                    </p>
                  ) : null}
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
          <p className="font-display text-xl">Finn couldn’t find an exact match</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No games in the current catalog match all selected filters. Family needs an assessed age
            context. Adjust filters or search by title.
          </p>
          <button type="button" className="mt-3 min-h-11 font-semibold text-fox" onClick={clear}>
            Start over
          </button>
        </div>
      )}

      {alternatives.length > 0 && (
        <section className="mt-5 space-y-2">
          <h2 className="font-display text-xl">Other games that fit your limits</h2>
          <p className="text-sm text-muted-foreground">
            These meet your selected player, age and time constraints, but are not confirmed matches
            for every selected Vibe.
          </p>
          {alternatives.map((g) => (
            <Link
              key={g.bggId}
              to="/game/$id"
              params={{ id: g.bggId }}
              className="flex items-center gap-3 rounded-card bg-card p-3"
            >
              <GameCover game={g} className="h-16 w-12" />
              <span>
                {g.name}
                <span className="block text-sm text-muted-foreground">
                  {formatPlayers(g)} players · {formatPlaytime(g)}
                </span>
              </span>
            </Link>
          ))}
        </section>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Tonight’s pick is on Home. Browse all or search by title to explore the full catalog.
      </p>
    </div>
  );
}
