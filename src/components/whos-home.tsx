import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function WhosHome() {
  const players = useAppStore((s) => s.tablePlayers);
  const addPlayer = useAppStore((s) => s.addPlayer);
  const lastPlayerIds = useAppStore((s) => s.lastPlayerIds);
  const setLastPlayerIds = useAppStore((s) => s.setLastPlayerIds);
  const setWizard = useAppStore((s) => s.setWizard);
  const [name, setName] = useState("");

  const seated = lastPlayerIds.filter((id) => players.some((p) => p.id === id));

  function seat(ids: string[]) {
    setLastPlayerIds(ids);
    if (ids.length) setWizard({ players: ids.length });
  }

  function toggle(id: string) {
    seat(seated.includes(id) ? seated.filter((x) => x !== id) : [...seated, id]);
  }

  function add() {
    const r = addPlayer(name);
    if (r === "empty") return;
    if (r === "dup") {
      toast("That name is already at the table");
      return;
    }
    if (r === "limit") {
      toast("Sixteen is enough names for one house");
      return;
    }
    const added = useAppStore.getState().tablePlayers.at(-1);
    setName("");
    if (added) seat([...seated, added.id]);
  }

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
        <p className="mt-1 text-sm text-muted-foreground">Add the people at the table. Finn remembers who won.</p>
      )}
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a name"
          maxLength={20}
          className="min-h-11 flex-1 rounded-card border border-border bg-card px-3 text-sm"
          aria-label="Add a player"
        />
        <Button type="submit" variant="secondary" className="min-h-11 px-3" aria-label="Add">
          <Plus className="size-4" />
        </Button>
      </form>
    </section>
  );
}
