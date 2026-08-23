import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { FoxAvatar } from "@/components/fox-avatar";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn, SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  createFriendInvite,
  createGroup,
  listFriends,
  listMyGroups,
  requestFriendByEmail,
  respondFriend,
  type FriendRow,
  type GroupRow,
} from "@/lib/social";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/circle/")({ component: CirclePage });

function CirclePage() {
  const { user, isPending } = useCurrentUserState();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (isPending || !ready) {
    return <div className="h-40 animate-pulse rounded-card bg-muted" />;
  }
  return (
    <div className="pb-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fox">Your people</p>
      <h1 className="font-display text-3xl">Tables</h1>
      <SignedOut>
        <div className="mt-6 rounded-card bg-card p-5 text-center shadow-card">
          <FoxAvatar mood="hopeful" size="md" />
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to make a family table, invite friends, and keep a scoreboard that lasts years.
            Guest mode still finds tonight's game.
          </p>
          <Button asChild className="mt-4">
            <Link to="/login" search={{ next: "/circle" }}>Sign in</Link>
          </Button>
        </div>
      </SignedOut>
      <SignedIn>{user ? <CircleHome /> : <RedirectToSignIn />}</SignedIn>
    </div>
  );
}

function CircleHome() {
  const [friends, setFriends] = useState<FriendRow[] | null>(null);
  const [groups, setGroups] = useState<GroupRow[] | null>(null);
  const [email, setEmail] = useState("");
  const [tableName, setTableName] = useState("");
  const [kind, setKind] = useState<"family" | "friends">("family");
  const [busy, setBusy] = useState(false);

  async function reload() {
    const [f, g] = await Promise.all([listFriends(), listMyGroups()]);
    setFriends(f);
    setGroups(g);
  }

  useEffect(() => {
    void reload().catch(() => {
      setFriends([]);
      setGroups([]);
    });
  }, []);

  const incoming = friends?.filter((f) => f.status === "pending" && f.incoming) ?? [];
  const pals = friends?.filter((f) => f.status === "accepted") ?? [];

  async function addFriend(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await requestFriendByEmail({ data: { email } });
      if ("accepted" in r && r.accepted) toast("You're friends now.");
      else if ("already" in r && r.already) toast("Already at your table.");
      else toast("Request sent.");
      setEmail("");
      await reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't add them");
    } finally {
      setBusy(false);
    }
  }

  async function inviteLink() {
    try {
      const { token } = await createFriendInvite();
      const url = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(url);
      toast("Invite link copied. Good for 14 days.");
    } catch {
      toast("Couldn't make a link");
    }
  }

  async function makeTable(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createGroup({ data: { name: tableName, kind } });
      toast(kind === "family" ? "Family table is set." : "Friends table is set.");
      setTableName("");
      await reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't create the table");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="font-display text-xl">Tables</h2>
        <p className="text-sm text-muted-foreground">
          Family or friends. Shared shelf, shared scoreboard, years of nights.
        </p>
        <form onSubmit={(e) => void makeTable(e)} className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setKind("family")}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold",
                kind === "family" ? "bg-fox text-cream" : "bg-muted text-muted-foreground",
              )}
            >
              Family
            </button>
            <button
              type="button"
              onClick={() => setKind("friends")}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold",
                kind === "friends" ? "bg-fox text-cream" : "bg-muted text-muted-foreground",
              )}
            >
              Friends
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="The Saturday table"
              className="min-w-0 flex-1 rounded-card bg-card px-3 py-3 text-sm shadow-card outline-none ring-fox/40 focus:ring-2"
            />
            <Button type="submit" disabled={busy}>
              Create
            </Button>
          </div>
        </form>
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-card bg-card shadow-card">
          {(groups ?? []).length === 0 ? (
            <li className="px-4 py-4 text-sm text-muted-foreground">No tables yet.</li>
          ) : (
            (groups ?? []).map((g) => (
              <li key={g.id}>
                <Link
                  to="/circle/$groupId"
                  params={{ groupId: g.id }}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span>
                    <span className="font-semibold">{g.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {g.kind === "family" ? "Family" : "Friends"} · {g.memberCount}{" "}
                      {g.memberCount === 1 ? "person" : "people"}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-sky">Open</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-xl">Friends</h2>
        {incoming.length ? (
          <ul className="mt-3 space-y-2">
            {incoming.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-card bg-card px-4 py-3 shadow-card"
              >
                <span className="font-semibold">{f.displayName}</span>
                <span className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      void respondFriend({ data: { id: f.id, action: "accept" } }).then(reload)
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void respondFriend({ data: { id: f.id, action: "decline" } }).then(reload)
                    }
                  >
                    No
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <form onSubmit={(e) => void addFriend(e)} className="mt-3 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Friend's email"
            className="min-w-0 flex-1 rounded-card bg-card px-3 py-3 text-sm shadow-card outline-none ring-fox/40 focus:ring-2"
          />
          <Button type="submit" disabled={busy}>
            Add
          </Button>
        </form>
        <Button variant="secondary" className="mt-2 w-full" onClick={() => void inviteLink()}>
          <Users className="size-4" />
          Copy invite link
        </Button>
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-card bg-card shadow-card">
          {pals.length === 0 ? (
            <li className="px-4 py-4 text-sm text-muted-foreground">No friends yet. Send a link.</li>
          ) : (
            pals.map((f) => (
              <li key={f.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-semibold">{f.displayName}</span>
                <button
                  type="button"
                  className="text-xs font-semibold text-muted-foreground"
                  onClick={() =>
                    void respondFriend({ data: { id: f.id, action: "block" } }).then(reload)
                  }
                >
                  Block
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
