import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StartGame } from "@/components/minigames/start-game";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  createGroupInvite,
  deleteGroup,
  getGroup,
  leaveGroup,
  listGroupPlays,
  listGroupVault,
  setShareVault,
  updateGroup,
  type ActivityRow,
  type GroupMember,
  type GroupPlayRow,
} from "@/lib/social";
import { listFamilyScores, listMiniSessions, type FamilyScoreRow, type SessionListItem } from "@/lib/minigames/server";
import { MINI_GAMES } from "@/lib/minigames/types";
import { getGame } from "@/lib/scoring";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/circle/$groupId")({ component: GroupPage });

function GroupPage() {
  const { groupId } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const setRecPool = useAppStore((s) => s.setRecPool);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"friends" | "family">("friends");
  const [role, setRole] = useState("member");
  const [loaded, setLoaded] = useState(false);
  const [share, setShare] = useState(true);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [plays, setPlays] = useState<GroupPlayRow[]>([]);
  const [shelf, setShelf] = useState<string[]>([]);
  const [family, setFamily] = useState<FamilyScoreRow[]>([]);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftKind, setDraftKind] = useState<"friends" | "family">("family");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const [g, p, v, f, s] = await Promise.all([
      getGroup({ data: { groupId } }),
      listGroupPlays({ data: { groupId } }),
      listGroupVault({ data: { groupId } }),
      listFamilyScores({ data: { groupId } }),
      listMiniSessions({ data: { groupId } }),
    ]);
    setName(g.name);
    setKind(g.kind);
    setDraftName(g.name);
    setDraftKind(g.kind);
    setRole(g.role);
    setShare(g.shareVault);
    setMembers(g.members);
    setActivity(g.activity);
    setPlays(p);
    setShelf(v);
    setFamily(f);
    setSessions(s);
    setLoaded(true);
  }

  useEffect(() => {
    if (!user) return;
    void reload().catch((e) => setErr(e instanceof Error ? e.message : "Couldn't open the table"));
  }, [user?.id, groupId]);

  if (isPending) return <div className="h-40 animate-pulse rounded-card bg-muted" />;
  if (!user) return <RedirectToSignIn />;
  if (!loaded && !err) return <div className="h-40 animate-pulse rounded-card bg-muted" />;
  if (err) {
    return (
      <div className="pb-10">
        <p className="text-sm text-berry">{err}</p>
        <Link to="/circle" className="mt-3 inline-block text-sm font-semibold text-sky">
          Back to tables
        </Link>
      </div>
    );
  }

  const openGames = sessions.filter((s) => s.status === "active");

  async function copyInvite() {
    try {
      const { token } = await createGroupInvite({ data: { groupId } });
      const url = `${window.location.origin}/invite/${token}`;
      setInviteUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        toast("Table invite copied. Good for 14 days.");
      } catch {
        toast(`Copy this invite: ${url}`);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't invite");
    }
  }

  async function saveTable() {
    setBusy(true);
    try {
      const r = await updateGroup({ data: { groupId, name: draftName, kind: draftKind } });
      setName(r.name);
      setKind(r.kind);
      setEditing(false);
      toast("Table saved.");
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setBusy(false);
    }
  }

  async function throwOut() {
    setBusy(true);
    try {
      await deleteGroup({ data: { groupId } });
      toast("Table is gone.");
      navigate({ to: "/circle" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't delete");
      setBusy(false);
    }
  }

  async function walkAway() {
    setBusy(true);
    try {
      await leaveGroup({ data: { groupId } });
      toast("You left the table.");
      navigate({ to: "/circle" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't leave");
      setBusy(false);
    }
  }

  const owner = role === "owner";

  return (
    <div className="pb-10">
      <Link to="/circle" className="text-sm font-semibold text-sky">
        All tables
      </Link>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-fox">
        {kind === "family" ? "Family" : "Friends"} · {role}
      </p>
      <h1 className="font-display text-3xl">{name || "Table"}</h1>
      {owner ? (
        <button
          type="button"
          className="mt-1 text-sm font-semibold text-sky"
          onClick={() => {
            setDraftName(name);
            setDraftKind(kind);
            setEditing(true);
            document.getElementById("table-settings")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Edit table
        </button>
      ) : null}
      <p className="mt-2 text-sm text-muted-foreground">
        {members.length} {members.length === 1 ? "person" : "people"} · {shelf.length} games on the
        shared shelf
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          onClick={() => {
            setRecPool({ groupId, groupName: name, ids: shelf });
            navigate({ to: "/wizard" });
          }}
          disabled={!shelf.length}
        >
          What should we play?
        </Button>
        {!shelf.length ? (
          <p className="text-sm text-muted-foreground">
            Share games from your vault first. The wizard uses this table’s shelf.
          </p>
        ) : null}
        <Button variant="secondary" onClick={() => void copyInvite()}>
          Copy invite link
        </Button>
        <button
          type="button"
          className="text-sm font-semibold text-muted-foreground"
          onClick={() => {
            const next = !share;
            setShare(next);
            void setShareVault({ data: { groupId, share: next } }).catch(() => setShare(share));
          }}
        >
          {share ? "Sharing my vault with this table" : "Vault hidden from this table"}
        </button>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl">Family scoreboard</h2>
        <p className="text-sm text-muted-foreground">
          Win a mini-game, get +N — N is the number of people who played. Draws get nothing.
        </p>
        {family.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No family points yet. Start a game below.</p>
        ) : (
          <ol className="mt-3 divide-y divide-border overflow-hidden rounded-card bg-card shadow-card">
            {family.map((row, i) => (
              <li key={row.userId} className="flex items-center justify-between px-4 py-3">
                <span className="font-semibold">
                  {i + 1}. {row.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {row.points} pts · {row.wins} {row.wins === 1 ? "win" : "wins"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {openGames.length ? (
        <section className="mt-8">
          <h2 className="font-display text-xl">Games in motion</h2>
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-card bg-card shadow-card">
            {openGames.map((s) => (
              <li key={s.id}>
                <Link
                  to="/play/$sessionId"
                  params={{ sessionId: s.id }}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span>
                    <span className="font-semibold">{MINI_GAMES[s.gameType].label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {s.yourTurn ? "Your turn" : s.youAreIn ? "You're in" : "At this table"}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-sky">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {user ? <StartGame groupId={groupId} members={members} you={user.id} /> : null}

      <section className="mt-8">
        <h2 className="font-display text-xl">People</h2>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-card bg-card shadow-card">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between px-4 py-3">
              <span className="font-semibold">{m.displayName}</span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl">Nights together</h2>
        <ul className="mt-3 space-y-2">
          {plays.length === 0 ? (
            <li className="text-sm text-muted-foreground">Nothing logged yet.</li>
          ) : (
            plays.map((p) => {
              const game = getGame(p.bggId);
              const winner = p.seats.find((s) => s.won)?.playerName;
              return (
                <li key={p.id} className="rounded-card bg-card px-4 py-3 shadow-card">
                  <p className="font-semibold">{game?.name ?? p.bggId}</p>
                  <p className="text-sm text-muted-foreground">
                    {winner ? `${winner} won` : "Logged"} · {p.loggerName}
                  </p>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {inviteUrl ? (
        <p className="mt-3 break-all rounded-card bg-muted px-3 py-2 text-xs text-muted-foreground">
          {inviteUrl}
        </p>
      ) : null}

      <section className="mt-8">
        <h2 id="table-settings" className="font-display text-xl">
          Table settings
        </h2>
        {owner ? (
          editing ? (
            <div className="mt-3 space-y-2 rounded-card bg-card p-4 shadow-card">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                maxLength={40}
                className="min-h-11 w-full rounded-card border border-border bg-background px-3 text-sm"
                aria-label="Table name"
              />
              <div className="flex gap-2">
                {(["family", "friends"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setDraftKind(k)}
                    className={
                      draftKind === k
                        ? "min-h-11 rounded-full bg-fox px-3 text-sm font-semibold text-cream"
                        : "min-h-11 rounded-full bg-muted px-3 text-sm font-semibold text-muted-foreground"
                    }
                  >
                    {k === "family" ? "Family" : "Friends"}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button disabled={busy} onClick={() => void saveTable()}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDraftName(name);
                    setDraftKind(kind);
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button className="mt-3" variant="secondary" onClick={() => setEditing(true)}>
              Edit name or type
            </Button>
          )
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Only the owner can rename this table.</p>
        )}

        <Button className="mt-3 w-full" variant="outline" disabled={busy} onClick={() => void walkAway()}>
          Leave this table
        </Button>

        {owner ? (
          confirmDelete ? (
            <div className="mt-3 space-y-2 rounded-card bg-berry/10 p-4">
              <p className="text-sm font-semibold">Throw out {name || "this table"}? Scores and games at this table go with it.</p>
              <div className="flex gap-2">
                <Button variant="berry" disabled={busy} onClick={() => void throwOut()}>
                  Yes, delete it
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep it
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="mt-3 block w-full text-center text-sm font-semibold text-berry"
              onClick={() => setConfirmDelete(true)}
            >
              Delete this table
            </button>
          )
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl">Activity</h2>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {activity.map((a) => (
            <li key={a.id}>{a.body}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
