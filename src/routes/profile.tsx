import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Camera, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { FoxAvatar } from "@/components/fox-avatar";
import { Button } from "@/components/ui/button";
import { ScanGames } from "@/components/scan-games";
import { useAppStore } from "@/lib/store";
import { GAMES } from "@/lib/catalog";
import { FREE_VAULT_LIMIT, PREMIUM_PRICE } from "@/lib/types";
import { useFlag } from "@/lib/flags";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile, updateMyProfile } from "@/lib/social";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const owned = useAppStore((s) => s.owned);
  const plays = useAppStore((s) => s.plays);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const haptics = useAppStore((s) => s.haptics);
  const setHaptics = useAppStore((s) => s.setHaptics);
  const isPremium = useAppStore((s) => s.isPremium);
  const setUpgradePrompt = useAppStore((s) => s.setUpgradePrompt);
  const enjoyed = plays.filter((p) => p.enjoyed).length;
  const { user, isPending } = useCurrentUserState();
  const [scan, setScan] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const scanOn = useFlag("scan_games");
  const paywall = useFlag("premium_paywall");

  useEffect(() => {
    if (!user) return;
    void getMyProfile()
      .then((p) => setDisplayName(p.displayName))
      .catch(() => setDisplayName(user.displayName ?? ""));
  }, [user]);

  return (
    <div className="pb-10">
      <div className="flex flex-col items-center text-center">
        <FoxAvatar mood="proud" size="lg" />
        <h1 className="mt-3 font-display text-3xl">
          {isPending ? "Your table" : user?.displayName || displayName || "Your table"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {user
            ? "Signed in. Vault syncs to this account."
            : isPremium
              ? "GameFinder Premium is on this device."
              : "Finn remembers this device. Sign in when you want a family table."}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <SignedOut>
            <Link
              to="/login"
              className="inline-flex h-10 items-center rounded-full bg-fox px-4 text-sm font-bold text-cream"
            >
              Sign in
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-3 gap-3">
        <Stat label="On the shelf" value={owned.length} />
        <Stat label="Plays logged" value={plays.length} />
        <Stat label="Loved" value={enjoyed} />
      </dl>

      <Link
        to="/circle"
        className="mt-3 flex items-center justify-between rounded-card bg-card px-4 py-4 shadow-card"
      >
        <span>
          <span className="flex items-center gap-2 font-display text-xl">
            <Users className="size-5 text-fox" />
            Tables
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Family, friends, invites, shared scoreboards.
          </span>
        </span>
        <span className="text-sm font-semibold text-sky">Open</span>
      </Link>

      {user ? (
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void updateMyProfile({ data: { displayName } }).then(() =>
              setDisplayName(displayName.trim()),
            );
          }}
        >
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={32}
            placeholder="Display name"
            className="min-w-0 flex-1 rounded-card bg-card px-3 py-3 text-sm shadow-card outline-none ring-fox/40 focus:ring-2"
          />
          <Button type="submit" variant="secondary">
            Save
          </Button>
        </form>
      ) : null}

      <Link
        to="/scoreboard"
        className="mt-3 flex items-center justify-between rounded-card bg-card px-4 py-4 shadow-card"
      >
        <span>
          <span className="flex items-center gap-2 font-display text-xl">
            <Trophy className="size-5 text-fox" />
            Scoreboard
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Named players and a lifetime win table.
          </span>
        </span>
        <span className="text-sm font-semibold text-sky">Open</span>
      </Link>

      {paywall ? (
      <section className="mt-8 rounded-card bg-card p-4 shadow-card">
        <h2 className="font-display text-xl">
          {isPremium ? "You're on Premium" : "GameFinder Premium"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPremium
            ? "Unlimited vault, no ads, exact-score filters. Bookworm rules help is coming later."
            : `Free vaults hold ${FREE_VAULT_LIMIT} games. Premium is ${PREMIUM_PRICE} for unlimited storage, no ads, and advanced filters.`}
        </p>
        {!isPremium ? (
          <Button
            className="mt-4 w-full"
            onClick={() =>
              setUpgradePrompt(
                "Unlock unlimited vault storage, no banner ads, advanced exact-score filters, and future Bookworm rules help.",
              )
            }
          >
            Upgrade for {PREMIUM_PRICE}
          </Button>
        ) : null}
      </section>
      ) : null}

      {scanOn ? (
      <section className="mt-8 space-y-2">
        <h2 className="font-display text-xl">Shelf</h2>
        <Row
          title="Scan Games"
          hint="Photograph a shelf. Photos aren't stored."
          action={
            <Button size="sm" variant="secondary" onClick={() => setScan(true)}>
              <Camera className="size-4" />
              Scan
            </Button>
          }
        />
      </section>
      ) : null}

      <section className="mt-8 space-y-2">
        <h2 className="font-display text-xl">Preferences</h2>
        <Row
          title={theme === "dark" ? "Night table" : "Day table"}
          hint="Cream or ink. Same fox."
          action={
            <Button size="sm" variant="secondary" onClick={toggleTheme}>
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
          }
        />
        <Row
          title="Haptics"
          hint="A little buzz when you tap a chip."
          action={
            <Button
              size="sm"
              variant={haptics ? "primary" : "outline"}
              onClick={() => setHaptics(!haptics)}
            >
              {haptics ? "On" : "Off"}
            </Button>
          }
        />
      </section>

      {plays.length ? (
        <section className="mt-8">
          <h2 className="font-display text-xl">Recent plays</h2>
          <ul className="mt-2 divide-y divide-border rounded-card bg-card shadow-card">
            {plays.slice(0, 8).map((p) => {
              const g = GAMES.find((x) => x.bggId === p.bggId);
              return (
                <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-semibold">{g?.name ?? p.bggId}</span>
                  <span className={p.enjoyed ? "text-moss" : "text-berry"}>
                    {p.enjoyed ? "Loved" : "Passed"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <ScanGames open={scan} onClose={() => setScan(false)} />
      <p className="mt-10 text-center text-xs text-muted-foreground">
        <Link to="/internal/flags" className="font-semibold text-sky">
          Internal flags
        </Link>
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card bg-card px-3 py-4 text-center shadow-card">
      <div className="font-display text-2xl">{value}</div>
      <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card bg-card px-4 py-3 shadow-card">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {action}
    </div>
  );
}
