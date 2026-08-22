import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createMiniSession } from "@/lib/minigames/server";
import { HOUSE_BOTS } from "@/lib/minigames/bots";
import { MINI_GAMES, type MiniGameType } from "@/lib/minigames/types";
import type { GroupMember } from "@/lib/social";
import { cn } from "@/lib/utils";

export function StartGame({
  groupId,
  members,
  you,
}: {
  groupId: string;
  members: GroupMember[];
  you: string;
}) {
  const navigate = useNavigate();
  const [kind, setKind] = useState<MiniGameType>("bank");
  const [picked, setPicked] = useState<string[]>([you]);
  const [rounds, setRounds] = useState<10 | 15 | 20 | 30>(15);
  const [busy, setBusy] = useState(false);
  const meta = MINI_GAMES[kind];

  function toggle(id: string) {
    setPicked((cur) => {
      if (id === you) return cur;
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      return [...cur, id].slice(0, meta.max);
    });
  }

  async function start() {
    setBusy(true);
    try {
      const { id } = await createMiniSession({
        data: { groupId, gameType: kind, playerIds: picked, rounds },
      });
      navigate({ to: "/play/$sessionId", params: { sessionId: id } });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't start");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-xl">Play together</h2>
      <p className="text-sm text-muted-foreground">
        Winner gets +N family points — N is how many sat down. Draws award nothing.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(MINI_GAMES) as MiniGameType[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              if (k === "stockpile") setRounds(20);
              if (k === "bank") setRounds(15);
              setPicked((cur) => {
                const keep = k === "bank" || k === "stockpile" ? cur : cur.filter((id) => !id.startsWith("bot:"));
                return keep.slice(0, MINI_GAMES[k].max);
              });
            }}
            className={cn(
              "min-h-11 rounded-full px-3 text-sm font-semibold",
              kind === k ? "bg-fox text-cream" : "bg-muted text-muted-foreground",
            )}
          >
            {MINI_GAMES[k].label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{meta.blurb}</p>
      <ul className="mt-3 space-y-2">
        {members.map((m) => (
          <li key={m.userId}>
            <button
              type="button"
              onClick={() => toggle(m.userId)}
              className={cn(
                "flex min-h-12 w-full items-center justify-between rounded-card px-4 text-left",
                picked.includes(m.userId) ? "bg-fox/10 ring-1 ring-fox" : "bg-card shadow-card",
              )}
            >
              <span className="font-semibold">{m.displayName}</span>
              <span className="text-xs text-muted-foreground">
                {m.userId === you ? "you" : picked.includes(m.userId) ? "in" : "sit out"}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {kind === "bank" || kind === "stockpile" ? (
        <div className="mt-4">
          <p className="text-sm font-semibold">House players</p>
          <p className="text-sm text-muted-foreground">
            Seat a bot if the table is short. They don't take family points when they win.
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {HOUSE_BOTS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => toggle(b.id)}
                className={cn(
                  "flex min-h-12 w-full items-center justify-between rounded-card px-4 text-left",
                  picked.includes(b.id) ? "bg-fox/10 ring-1 ring-fox" : "bg-card shadow-card",
                )}
              >
                <span>
                  <span className="font-semibold">{b.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{b.style}</span>
                </span>
                <span className="text-xs text-muted-foreground">{picked.includes(b.id) ? "in" : "sit out"}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {kind === "bank" ? (
        <div className="mt-3 flex gap-2">
          {([10, 15, 20] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRounds(n)}
              className={cn(
                "min-h-11 flex-1 rounded-full text-sm font-bold",
                rounds === n ? "bg-fox text-cream" : "bg-muted",
              )}
            >
              {n} rounds
            </button>
          ))}
        </div>
      ) : null}
      {kind === "stockpile" ? (
        <div className="mt-3 flex gap-2">
          {([10, 20, 30] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRounds(n)}
              className={cn(
                "min-h-11 flex-1 rounded-full text-sm font-bold",
                rounds === n ? "bg-fox text-cream" : "bg-muted",
              )}
            >
              {n} in stock
            </button>
          ))}
        </div>
      ) : null}
      <Button className="mt-4 w-full" disabled={busy} onClick={() => void start()}>
        Start {meta.label}
      </Button>
    </section>
  );
}
