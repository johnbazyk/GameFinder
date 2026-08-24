import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { GameCover } from "@/components/game-cover";
import { AdBanner } from "@/components/ad-banner";
import { searchGames, STARTER_SHELF_IDS, standaloneGames } from "@/lib/catalog";
import { formatPlaytime, formatPlayers, getGame } from "@/lib/scoring";
import { useAppStore } from "@/lib/store";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discover")({ component: DiscoverPage });

type People = "any" | "2" | "34" | "5";
type Time = "any" | "30" | "60" | "90";
type Mood = "any" | "family" | "party" | "strategy" | "luck";

const PEOPLE: { id: People; label: string }[] = [
  { id: "any", label: "Any" },
  { id: "2", label: "2" },
  { id: "34", label: "3–4" },
  { id: "5", label: "5+" },
];

const TIMES: { id: Time; label: string }[] = [
  { id: "any", label: "Any" },
  { id: "30", label: "30 min" },
  { id: "60", label: "1 hour" },
  { id: "90", label: "Long" },
];

const MOODS: { id: Mood; label: string }[] = [
  { id: "any", label: "Any" },
  { id: "family", label: "Family" },
  { id: "party", label: "Party" },
  { id: "strategy", label: "Thinky" },
  { id: "luck", label: "Luck" },
];

function fitsPeople(g: Game, people: People) {
  if (people === "any") return true;
  if (people === "2") return g.players.min <= 2 && g.players.max >= 2;
  if (people === "34") return g.players.min <= 4 && g.players.max >= 3;
  return g.players.max >= 5;
}

function fitsTime(g: Game, time: Time) {
  const avg = g.playtime.avg || (g.playtime.min + g.playtime.max) / 2;
  if (time === "any") return true;
  if (time === "30") return avg <= 35;
  if (time === "60") return avg > 35 && avg <= 75;
  return avg > 75;
}

function fitsMood(g: Game, mood: Mood) {
  if (mood === "any") return true;
  return g.vibes.includes(mood);
}

function DiscoverPage() {
  const owned = useAppStore((s) => s.owned);
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<People>("any");
  const [time, setTime] = useState<Time>("any");
  const [mood, setMood] = useState<Mood>("any");

  const filtered = q || people !== "any" || time !== "any" || mood !== "any";

  const results = useMemo(() => {
    const pool = q.trim() ? searchGames(q) : standaloneGames().slice().sort((a, b) => b.bggRating - a.bggRating);
    return pool.filter((g) => fitsPeople(g, people) && fitsTime(g, time) && fitsMood(g, mood));
  }, [q, people, time, mood]);

  const popular = useMemo(() => {
    const fromShelf = STARTER_SHELF_IDS.map(getGame).filter((g): g is Game => Boolean(g));
    if (fromShelf.length >= 8) return fromShelf.slice(0, 10);
    return standaloneGames()
      .slice()
      .sort((a, b) => b.bggRating - a.bggRating)
      .slice(0, 10);
  }, []);

  const list = filtered ? results : popular;

  function clear() {
    setQ("");
    setPeople("any");
    setTime("any");
    setMood("any");
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
        <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">People</legend>
        <ChipRow>
          {PEOPLE.map((p) => (
            <Chip key={p.id} on={people === p.id} onClick={() => setPeople(p.id)}>
              {p.label}
            </Chip>
          ))}
        </ChipRow>
      </fieldset>

      <fieldset className="mt-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Time</legend>
        <ChipRow>
          {TIMES.map((t) => (
            <Chip key={t.id} on={time === t.id} onClick={() => setTime(t.id)}>
              {t.label}
            </Chip>
          ))}
        </ChipRow>
      </fieldset>

      <fieldset className="mt-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Feel</legend>
        <ChipRow>
          {MOODS.map((m) => (
            <Chip key={m.id} on={mood === m.id} onClick={() => setMood(m.id)}>
              {m.label}
            </Chip>
          ))}
        </ChipRow>
      </fieldset>

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <p className="font-display text-xl">
          {filtered ? `${results.length} ${results.length === 1 ? "game" : "games"}` : "Popular to start"}
        </p>
        {filtered ? (
          <button type="button" className="min-h-11 text-sm font-semibold text-sky" onClick={clear}>
            Clear
          </button>
        ) : (
          <Link to="/wizard" className="min-h-11 text-sm font-semibold text-sky">
            Ask Finn
          </Link>
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
          <button type="button" className="mt-3 min-h-11 font-semibold text-fox" onClick={clear}>
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

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-1.5 flex flex-wrap gap-2">{children}</div>;
}

function Chip({
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
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-semibold",
        on ? "bg-fox text-cream" : "bg-card text-foreground shadow-card",
      )}
    >
      {children}
    </button>
  );
}
