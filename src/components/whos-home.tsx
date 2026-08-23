import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listHousehold, type HouseholdPerson } from "@/lib/social";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function WhosHome() {
  const { user } = useCurrentUserState();
  const players = useAppStore((s) => s.tablePlayers);
  const addPlayer = useAppStore((s) => s.addPlayer);
  const ensurePlayer = useAppStore((s) => s.ensurePlayer);
  const lastPlayerIds = useAppStore((s) => s.lastPlayerIds);
  const setLastPlayerIds = useAppStore((s) => s.setLastPlayerIds);
  const setWizard = useAppStore((s) => s.setWizard);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [house, setHouse] = useState<HouseholdPerson[]>([]);

  const seated = lastPlayerIds.filter((id) => players.some((p) => p.id === id));

  useEffect(() => {
    if (!user) return;
    void listHousehold()
      .then((people) => {
        setHouse(people);
        for (const p of people) {
          ensurePlayer({
            id: `u:${p.userId}`,
            name: p.displayName,
            color: p.pieceColor,
          });
        }
      })
      .catch(() => setHouse([]));
  }, [user?.id, ensurePlayer]);

  function seat(ids: string[]) {
    setLastPlayerIds(ids);
    if (ids.length) setWizard({ players: ids.length });
  }

  function toggle(id: string) {
    seat(seated.includes(id) ? seated.filter((x) => x !== id) : [...seated, id]);
  }

  function pick(label: string, id?: string) {
    const pid = id ?? ensurePlayer({ name: label }) ?? "";
    if (!pid) {
      const r = addPlayer(label);
      if (r === "dup") {
        const hit = useAppStore.getState().tablePlayers.find(
          (p) => p.name.toLowerCase() === label.trim().toLowerCase(),
        );
        if (hit) {
          if (!seated.includes(hit.id)) seat([...seated, hit.id]);
          setName("");
          setOpen(false);
        }
        return;
      }
      if (r === "limit") toast("Sixteen is enough names for one house");
      if (r === "empty") return;
      const added = useAppStore.getState().tablePlayers.at(-1);
      if (added) seat([...seated, added.id]);
      setName("");
      setOpen(false);
      return;
    }
    if (!seated.includes(pid)) seat([...seated, pid]);
    setName("");
    setOpen(false);
  }

  function add() {
    const q = name.trim();
    if (!q) return;
    const match = suggestions[0];
    if (match && match.name.toLowerCase() === q.toLowerCase()) {
      pick(match.name, match.id);
      return;
    }
    pick(q);
  }

  const q = name.trim().toLowerCase();
  const suggestions = useMemo(() => {
    const fromHouse = house.map((p) => {
      const id =
        players.find((x) => x.id === `u:${p.userId}` || x.name.toLowerCase() === p.displayName.toLowerCase())
          ?.id ?? `u:${p.userId}`;
      return { id, name: p.displayName };
    });
    const extra = players
      .filter((p) => !fromHouse.some((h) => h.id === p.id || h.name.toLowerCase() === p.name.toLowerCase()))
      .map((p) => ({ id: p.id, name: p.name }));
    const all = [...fromHouse, ...extra];
    const unique = all.filter(
      (p, i) => all.findIndex((x) => x.name.toLowerCase() === p.name.toLowerCase()) === i,
    );
    if (!q) return unique.filter((p) => !seated.includes(p.id)).slice(0, 8);
    return unique
      .filter((p) => p.name.toLowerCase().includes(q) && !seated.includes(p.id))
      .slice(0, 6);
  }, [house, players, q, seated]);

  return (
    <section className="anim-rise mt-6 text-left">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-fox">Who's home tonight</p>
      {players.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {players.map((p) => {
            const on = seated.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold",
                  on ? "bg-fox text-cream" : "bg-muted text-muted-foreground",
                )}
              >
                <span className="size-2.5 rounded-full" style={{ background: p.color }} />
                {p.name}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          {user
            ? "Family names load from your tables. Tap who is playing, or type to add a kid without an account."
            : "Add the people at the table. Finn remembers who won."}
        </p>
      )}
      <form
        className="relative mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 160)}
          placeholder={house.length ? "Type a family name" : "Add a name"}
          maxLength={20}
          autoComplete="off"
          className="min-h-11 flex-1 rounded-card border border-border bg-card px-3 text-sm"
          aria-label="Add a player"
          aria-autocomplete="list"
        />
        <Button type="submit" variant="secondary" className="min-h-11 px-3" aria-label="Add">
          <Plus className="size-4" />
        </Button>
        {open && suggestions.length ? (
          <ul className="absolute left-0 right-12 top-[calc(100%+0.25rem)] z-20 overflow-hidden rounded-card bg-card shadow-lift">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center px-3 text-left text-sm font-semibold hover:bg-muted"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s.name, s.id)}
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </form>
    </section>
  );
}
