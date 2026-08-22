import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { FoxAvatar } from "@/components/fox-avatar";
import { Button } from "@/components/ui/button";
import { PieceSwatch } from "@/components/piece-swatch";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import {
  inviteTokenFromPath,
  peekInvite,
  rememberInvite,
  safeNext,
} from "@/lib/pending-invite";
import { DEFAULT_PIECE_COLOR } from "@/lib/piece-color";
import { updateMyProfile } from "@/lib/social";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  validateSearch: (raw: Record<string, unknown>) => ({ next: safeNext(raw.next) }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const fromUrl = inviteTokenFromPath(next);
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const inviteToken = fromUrl ?? storedToken;
  const afterAuth = next ?? (inviteToken ? `/invite/${inviteToken}` : "/");
  const [mode, setMode] = useState<"in" | "up">(fromUrl ? "up" : "in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [color, setColor] = useState(useAppStore.getState().pieceColor || DEFAULT_PIECE_COLOR);
  const setPieceColor = useAppStore((s) => s.setPieceColor);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fromUrl) rememberInvite(fromUrl);
    setStoredToken(peekInvite());
  }, [fromUrl]);

  function goAfterAuth() {
    const token = inviteTokenFromPath(afterAuth) ?? peekInvite();
    if (token) {
      void navigate({ to: "/invite/$token", params: { token } });
      return;
    }
    if (afterAuth.startsWith("/invite/")) {
      window.location.assign(afterAuth);
      return;
    }
    if (afterAuth === "/") {
      void navigate({ to: "/" });
      return;
    }
    window.location.assign(afterAuth);
  }

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        setPieceColor(color);
        const res = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0],
        });
        if (res.error) throw new Error(res.error.message || "Could not create the account");
        await updateMyProfile({
          data: { displayName: name.trim() || email.split("@")[0], pieceColor: color },
        }).catch(() => undefined);
      } else {
        const res = await authClient.signIn.email({ email: email.trim(), password });
        if (res.error) throw new Error(res.error.message || "Email or password didn't match");
      }
      goAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm pb-16 pt-4">
      <div className="flex flex-col items-center text-center">
        <FoxAvatar mood="hopeful" size="lg" />
        <h1 className="mt-3 font-display text-3xl">Pull up a chair</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {inviteToken
            ? "Create an account and you'll land at the table this link is for."
            : "Sign in to share a table with family and friends. Tonight's recs still work as a guest."}
        </p>
      </div>

      {authEnabled ? (
        <div className="mt-6 space-y-3">
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => signIn(p.providerId, { callbackURL: afterAuth, errorCallbackURL: "/login" })}
            >
              Continue with {p.label}
            </Button>
          ))}

          <p className="pt-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            or email
          </p>

          <form onSubmit={(e) => void onEmail(e)} className="space-y-3">
            {mode === "up" ? (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display name"
                  autoComplete="name"
                  className="w-full rounded-card bg-card px-3 py-3 text-sm shadow-card outline-none ring-fox/40 focus:ring-2"
                />
                <PieceSwatch value={color} onChange={setColor} />
              </>
            ) : null}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full rounded-card bg-card px-3 py-3 text-sm shadow-card outline-none ring-fox/40 focus:ring-2"
            />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (8+)"
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              className="w-full rounded-card bg-card px-3 py-3 text-sm shadow-card outline-none ring-fox/40 focus:ring-2"
            />
            {error ? <p className="text-sm text-berry">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "One second…" : mode === "up" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <button
            type="button"
            className={cn("w-full text-sm font-semibold text-sky")}
            onClick={() => {
              setMode(mode === "up" ? "in" : "up");
              setError(null);
            }}
          >
            {mode === "up" ? "Already have a chair? Sign in" : "New here? Create an account"}
          </button>
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-muted-foreground">Sign-in is disabled.</p>
      )}

      <p className="mt-8 text-center text-sm">
        <Link to="/" className="font-semibold text-muted-foreground">
          Keep browsing as a guest
        </Link>
      </p>
    </div>
  );
}
