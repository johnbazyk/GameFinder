import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  describeKind,
  fieldTotal,
  getScoreCard,
  resolveWinners,
  type ScoreCardDef,
} from "@/lib/scorecards";
import { useAppStore } from "@/lib/store";
import type { Game, PlayerScore, TablePlayer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { listMyGroups, logGroupPlay, type GroupRow } from "@/lib/social";

export function ScoreSheet({ game }: { game: Game }) {
  const def = getScoreCard(game);
  const players = useAppStore((s) => s.tablePlayers);
  const addPlayer = useAppStore((s) => s.addPlayer);
  const lastPlayerIds = useAppStore((s) => s.lastPlayerIds);
  const saveSession = useAppStore((s) => s.saveSession);
  const allSessions = useAppStore((s) => s.scoreSessions);
  const sessions = useMemo(
    () => allSessions.filter((s) => s.bggId === game.bggId),
    [allSessions, game.bggId],
  );

  const [draftName, setDraftName] = useState("");
  const [seated, setSeated] = useState<string[]>(() =>
    lastPlayerIds.filter((id) => players.some((p) => p.id === id)).slice(0, game.players.max),
  );
  const [values, setValues] = useState<Record<string, Record<string, number>>>({});
  const [teams, setTeams] = useState<Record<string, string>>({});
  const [places, setPlaces] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [winningTeam, setWinningTeam] = useState<string | null>(null);
  const [coopWon, setCoopWon] = useState(true);
  const [draw, setDraw] = useState(false);
  const [shared, setShared] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const user = useCurrentUser();

  useEffect(() => {
    if (!user) return;
    void listMyGroups()
      .then(setGroups)
      .catch(() => setGroups([]));
  }, [user]);

  const seatedPlayers = players.filter((p) => seated.includes(p.id));

  const preview = useMemo(() => {
    const scores: PlayerScore[] = seatedPlayers.map((p) => ({
      playerId: p.id,
      values: values[p.id] ?? {},
      team: teams[p.id],
      place: places[p.id],
      won: picked === p.id,
    }));
    const winners = resolveWinners(def, {
      scores,
      coopWon,
      winningTeam: winningTeam ?? undefined,
      draw,
    });
    return { scores, winners };
  }, [seatedPlayers, values, teams, places, picked, coopWon, winningTeam, draw, def]);

  function toggleSeat(id: string) {
    setSeated((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function setField(pid: string, fid: string, n: number) {
    setValues((cur) => ({ ...cur, [pid]: { ...(cur[pid] ?? {}), [fid]: n } }));
  }

  function createPlayer() {
    const r = addPlayer(draftName);
    if (r === "ok") {
      toast(`Welcome to the table, ${draftName.trim()}.`);
      setDraftName("");
    } else if (r === "dup") toast("That name is already seated.");
    else if (r === "limit") toast("Sixteen names is a full house.");
    else toast("Give them a name first.");
  }

  function save() {
    if (seatedPlayers.length < 1) {
      toast("Seat at least one player.");
      return;
    }
    if (def.kind === "team" && !winningTeam) {
      toast("Who won the table?");
      return;
    }
    if ((def.kind === "last" || def.kind === "result") && !draw && !picked) {
      toast("Tap the winner — or call it a draw.");
      return;
    }
    const session = saveSession({
      bggId: game.bggId,
      playerIds: seatedPlayers.map((p) => p.id),
      scores: preview.scores,
      shared,
      coopWon: def.kind === "coop" ? coopWon : undefined,
      winningTeam: winningTeam ?? undefined,
      draw,
      notes: notes.trim() || undefined,
      groupId: groupId || undefined,
    });
    if (groupId) {
      void logGroupPlay({
        data: {
          groupId,
          bggId: game.bggId,
          notes: notes.trim() || undefined,
          seats: seatedPlayers.map((p) => ({
            playerName: p.name,
            total: fieldTotal(def, preview.scores.find((s) => s.playerId === p.id)?.values ?? {}),
            won: preview.winners.includes(p.id),
          })),
        },
      }).catch(() => toast("Saved here, but the table didn't get it."));
    }
    toast(
      session.draw
        ? "Logged a draw. The ledger remembers."
        : preview.winners.length
          ? "Scored. The ledger remembers forever."
          : "Logged. Finn filed it.",
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fox">
          {describeKind(def.kind)}
          {def.target ? ` · first to ${def.target}` : ""}
        </p>
        <h1 className="font-display text-3xl">{game.name} scorecard</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{def.summary}</p>
        {def.fields.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {def.fields.map((f) => (
              <li key={f.id} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">
                {f.label}
              </li>
            ))}
          </ul>
        ) : def.teamNames ? (
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            Sides: {def.teamNames.join(" vs ")}
          </p>
        ) : null}
      </header>

      <section className="rounded-card bg-card p-4 shadow-card">
        <h2 className="font-display text-xl">Who's playing?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Names live on this device forever. Tap to seat them for tonight.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggleSeat(p.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold ring-2 ring-transparent",
                seated.includes(p.id) ? "text-cream" : "bg-muted text-muted-foreground",
              )}
              style={seated.includes(p.id) ? { background: p.color } : undefined}
            >
              {p.name}
            </button>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            createPlayer();
          }}
        >
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Add a name"
            maxLength={20}
            className="h-11 flex-1 rounded-button bg-background px-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-fox/60"
          />
          <Button type="submit" variant="secondary">
            <Plus className="size-4" />
            Add
          </Button>
        </form>
      </section>

      {seatedPlayers.length ? (
        <KindFields
          def={def}
          seated={seatedPlayers}
          values={values}
          setField={setField}
          teams={teams}
          setTeams={setTeams}
          places={places}
          setPlaces={setPlaces}
          picked={picked}
          setPicked={setPicked}
          winningTeam={winningTeam}
          setWinningTeam={setWinningTeam}
          coopWon={coopWon}
          setCoopWon={setCoopWon}
          draw={draw}
          setDraw={setDraw}
          shared={shared}
          setShared={setShared}
          winners={preview.winners}
        />
      ) : (
        <p className="rounded-card bg-card p-4 text-sm text-muted-foreground shadow-card">
          Add the people at your table. Finn will keep their wins from here on.
        </p>
      )}

      {preview.winners.length && !draw ? (
        <p className="flex items-center gap-2 rounded-card bg-fox/10 px-4 py-3 text-sm font-semibold">
          <Trophy className="size-4 text-fox" />
          {preview.winners
            .map((id) => seatedPlayers.find((p) => p.id === id)?.name ?? "Someone")
            .join(" & ")}{" "}
          take{preview.winners.length === 1 ? "s" : ""} this one.
        </p>
      ) : null}

      <label className="block text-sm">
        <span className="font-semibold">Note (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full resize-none rounded-button bg-card px-3 py-2 text-sm shadow-card outline-none ring-1 ring-border focus:ring-2 focus:ring-fox/60"
          placeholder="House rules, a blooper, the winning play…"
        />
      </label>

      {groups.length ? (
        <label className="block text-sm">
          <span className="font-semibold">Also log to a table</span>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="mt-1 w-full rounded-button bg-card px-3 py-2 text-sm shadow-card outline-none ring-1 ring-border focus:ring-2 focus:ring-fox/60"
          >
            <option value="">Just this device</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <Button className="w-full" size="xl" onClick={save} disabled={!seatedPlayers.length}>
        Save to the ledger
      </Button>

      {sessions.length ? (
        <section>
          <h2 className="font-display text-xl">This game, forever</h2>
          <ul className="mt-2 divide-y divide-border rounded-card bg-card shadow-card">
            {sessions.slice(0, 8).map((s) => (
              <SessionRow key={s.id} sessionId={s.id} game={game} def={def} />
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-center text-sm">
        <Link to="/scoreboard" className="font-semibold text-sky">
          Open the lifetime scoreboard
        </Link>
      </p>
    </div>
  );
}

function SessionRow({
  sessionId,
  game,
  def,
}: {
  sessionId: string;
  game: Game;
  def: ScoreCardDef;
}) {
  const session = useAppStore((s) => s.scoreSessions.find((x) => x.id === sessionId));
  const players = useAppStore((s) => s.tablePlayers);
  if (!session) return null;
  const winners = resolveWinners(def, session);
  const names = winners
    .map((id) => players.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  return (
    <li className="px-4 py-3 text-sm">
      <div className="flex justify-between gap-3">
        <span className="font-semibold">{names || (session.draw ? "Draw" : "Logged")}</span>
        <span className="text-muted-foreground">
          {new Date(session.at).toLocaleDateString()}
        </span>
      </div>
      {def.kind === "points" || def.kind === "race" || def.kind === "rounds" ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {session.scores
            .map((sc) => {
              const n = players.find((p) => p.id === sc.playerId)?.name ?? "?";
              return `${n} ${fieldTotal(def, sc.values)}`;
            })
            .join(" · ")}
        </p>
      ) : null}
      {session.notes ? <p className="mt-1 text-xs italic text-muted-foreground">{session.notes}</p> : null}
      <span className="sr-only">{game.name}</span>
    </li>
  );
}

function KindFields({
  def,
  seated,
  values,
  setField,
  teams,
  setTeams,
  places,
  setPlaces,
  picked,
  setPicked,
  winningTeam,
  setWinningTeam,
  coopWon,
  setCoopWon,
  draw,
  setDraw,
  shared,
  setShared,
  winners,
}: {
  def: ScoreCardDef;
  seated: TablePlayer[];
  values: Record<string, Record<string, number>>;
  setField: (pid: string, fid: string, n: number) => void;
  teams: Record<string, string>;
  setTeams: (v: Record<string, string>) => void;
  places: Record<string, number>;
  setPlaces: (v: Record<string, number>) => void;
  picked: string | null;
  setPicked: (id: string | null) => void;
  winningTeam: string | null;
  setWinningTeam: (t: string | null) => void;
  coopWon: boolean;
  setCoopWon: (v: boolean) => void;
  draw: boolean;
  setDraw: (v: boolean) => void;
  shared: Record<string, number>;
  setShared: (v: Record<string, number>) => void;
  winners: string[];
}) {
  if (def.kind === "coop") {
    return (
      <section className="rounded-card bg-card p-4 shadow-card">
        <h2 className="font-display text-xl">Did the table make it?</h2>
        <div className="mt-3 flex gap-2">
          <Button variant={coopWon ? "moss" : "outline"} onClick={() => setCoopWon(true)}>
            We won
          </Button>
          <Button variant={!coopWon ? "berry" : "outline"} onClick={() => setCoopWon(false)}>
            We lost
          </Button>
        </div>
        {def.sharedFields?.map((f) => (
          <label key={f.id} className="mt-3 block text-sm">
            <span className="font-semibold">{f.label}</span>
            <input
              type="number"
              inputMode="numeric"
              min={f.min}
              max={f.max}
              value={shared[f.id] ?? ""}
              onChange={(e) => setShared({ ...shared, [f.id]: Number(e.target.value) })}
              className="mt-1 h-11 w-full rounded-button bg-background px-3 tabular-nums outline-none ring-1 ring-border focus:ring-2 focus:ring-fox/60"
            />
          </label>
        ))}
        <p className="mt-3 text-sm text-muted-foreground">
          {seated.map((p) => p.name).join(", ")} {coopWon ? "all get a win." : "fought well. No win this time."}
        </p>
      </section>
    );
  }

  if (def.kind === "team") {
    return (
      <section className="rounded-card bg-card p-4 shadow-card">
        <h2 className="font-display text-xl">Sides</h2>
        <ul className="mt-3 space-y-3">
          {seated.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3">
              <span className="font-semibold" style={{ color: p.color }}>
                {p.name}
              </span>
              <div className="flex gap-1">
                {(def.teamNames ?? ["A", "B"]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTeams({ ...teams, [p.id]: t })}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      teams[p.id] === t ? "bg-fox text-cream" : "bg-muted",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <h3 className="mt-4 text-sm font-semibold">Who won?</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {(def.teamNames ?? []).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={winningTeam === t ? "primary" : "outline"}
              onClick={() => {
                setDraw(false);
                setWinningTeam(t);
              }}
            >
              {t}
            </Button>
          ))}
        </div>
      </section>
    );
  }

  if (def.kind === "last" || def.kind === "result") {
    return (
      <section className="rounded-card bg-card p-4 shadow-card">
        <h2 className="font-display text-xl">{def.kind === "last" ? "Who's still standing?" : "Result"}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {seated.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setDraw(false);
                setPicked(p.id);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold",
                picked === p.id ? "text-cream" : "bg-muted",
              )}
              style={picked === p.id ? { background: p.color } : undefined}
            >
              {p.name}
            </button>
          ))}
          <Button
            size="sm"
            variant={draw ? "secondary" : "outline"}
            onClick={() => {
              setPicked(null);
              setDraw(true);
            }}
          >
            Draw
          </Button>
        </div>
      </section>
    );
  }

  if (def.kind === "place") {
    return (
      <section className="rounded-card bg-card p-4 shadow-card">
        <h2 className="font-display text-xl">Finishing order</h2>
        <ul className="mt-3 space-y-2">
          {seated.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <span className="w-28 truncate font-semibold" style={{ color: p.color }}>
                {p.name}
              </span>
              <input
                type="number"
                min={1}
                max={12}
                value={places[p.id] ?? ""}
                onChange={(e) => setPlaces({ ...places, [p.id]: Number(e.target.value) })}
                className="h-11 w-20 rounded-button bg-background px-3 tabular-nums outline-none ring-1 ring-border focus:ring-2 focus:ring-fox/60"
                aria-label={`${p.name} place`}
              />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="rounded-card bg-card p-4 shadow-card">
      <h2 className="font-display text-xl">Score pad</h2>
      <div className="mt-3 space-y-4">
        {seated.map((p) => {
          const tot = fieldTotal(def, values[p.id] ?? {});
          const isWin = winners.includes(p.id);
          return (
            <article
              key={p.id}
              className={cn("rounded-xl p-3 ring-1", isWin ? "bg-fox/10 ring-fox/40" : "bg-background ring-border")}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-lg" style={{ color: p.color }}>
                  {p.name}
                </h3>
                <p className="font-display text-2xl tabular-nums">{tot}</p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {def.fields.map((f) => (
                  <label key={f.id} className="text-xs">
                    <span className="font-semibold text-muted-foreground">{f.label}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={f.min}
                      max={f.max}
                      step={f.step ?? 1}
                      value={values[p.id]?.[f.id] ?? ""}
                      onChange={(e) => setField(p.id, f.id, Number(e.target.value))}
                      className="mt-1 h-10 w-full rounded-[10px] bg-card px-2 text-sm tabular-nums outline-none ring-1 ring-border focus:ring-2 focus:ring-fox/60"
                    />
                  </label>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PlayerRoster() {
  const players = useAppStore((s) => s.tablePlayers);
  const addPlayer = useAppStore((s) => s.addPlayer);
  const removePlayer = useAppStore((s) => s.removePlayer);
  const sessions = useAppStore((s) => s.scoreSessions);
  const [name, setName] = useState("");

  return (
    <section className="rounded-card bg-card p-4 shadow-card">
      <h2 className="font-display text-xl">Players</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a name once. Wins stick to it across every game.
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const r = addPlayer(name);
          if (r === "ok") setName("");
          else if (r === "dup") toast("That name already exists.");
          else if (r === "limit") toast("Sixteen names max.");
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New player"
          maxLength={20}
          className="h-11 flex-1 rounded-button bg-background px-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-fox/60"
        />
        <Button type="submit" variant="secondary">
          Add
        </Button>
      </form>
      <ul className="mt-3 divide-y divide-border">
        {players.map((p) => {
          const games = sessions.filter((s) => s.playerIds.includes(p.id)).length;
          return (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <span className="font-semibold" style={{ color: p.color }}>
                {p.name}
              </span>
              <span className="flex items-center gap-3 text-muted-foreground">
                {games} game{games === 1 ? "" : "s"}
                <button type="button" className="text-berry" onClick={() => removePlayer(p.id)}>
                  Remove
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
