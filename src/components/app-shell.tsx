import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Compass, Home, Library, Trophy, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { markFlagsHydrated } from "@/lib/flags";
import { AuthChip } from "@/components/auth-chip";
import { AccountSync } from "@/components/account-sync";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/vault", label: "Vault", icon: Library },
  { to: "/scoreboard", label: "Scores", icon: Trophy },
  { to: "/profile", label: "You", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const hideNav =
    pathname.startsWith("/wizard") ||
    pathname.startsWith("/internal") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/play") ||
    /\/game\/[^/]+\/table\/?$/.test(pathname);
  const theme = useAppStore((s) => s.theme);
  const taps = useRef({ n: 0, t: 0 });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    void markFlagsHydrated();
  }, []);

  function onLogo(e: MouseEvent) {
    const now = Date.now();
    if (now - taps.current.t > 900) taps.current.n = 0;
    taps.current.t = now;
    taps.current.n += 1;
    if (taps.current.n >= 5) {
      e.preventDefault();
      taps.current.n = 0;
      navigate({ to: "/internal/flags" });
    }
  }

  return (
    <div className="paper-grain min-h-dvh text-foreground">
      <AccountSync />
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2" onClick={onLogo}>
            <img src="/favicon.svg" alt="" className="size-8" />
            <span className="font-display text-xl tracking-tight">
              GameFinder
            </span>
            {pathname.startsWith("/internal") ? (
              <span className="rounded-full bg-fox px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cream">
                Lab
              </span>
            ) : null}
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <AuthChip />
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-3xl px-4 pt-5", !hideNav && "safe-bottom")}>
        {children}
      </main>
      {!hideNav ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 backdrop-blur-md sm:hidden">
          <ul className="mx-auto grid max-w-3xl grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)]">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                      active ? "text-fox" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
