import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Compass, Home, Library, LockKeyhole, Menu, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { markFlagsHydrated } from "@/lib/flags";
import { AccountSync } from "@/components/account-sync";

const NAV = [
  { to: "/", label: "Find", icon: Home },
  { to: "/vault", label: "Vault", icon: Library },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const hideNav =
    pathname.startsWith("/wizard") ||
    pathname.startsWith("/internal") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/play") ||
    /\/game\/[^/]+\/table\/?$/.test(pathname);
  const theme = useAppStore((s) => s.theme);
  const isPremium = useAppStore((s) => s.isPremium);
  const taps = useRef({ n: 0, t: 0 });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

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
      {hideNav ? null : (
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
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 sm:flex">
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
          <div className="relative">
            <button
              ref={menuButtonRef}
              type="button"
              className="grid size-11 place-items-center rounded-button text-foreground hover:bg-muted"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="secondary-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <nav
              id="secondary-navigation"
              aria-label="Secondary navigation"
              hidden={!menuOpen}
              className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-card border border-border bg-background p-1 shadow-lift"
            >
              <Link
                to="/table-setup"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center justify-between rounded-button px-3 text-sm font-semibold hover:bg-muted"
              >
                <span>Players Tonight</span>
                <span className="text-xs font-medium text-muted-foreground">Free</span>
              </Link>
              <Link
                to="/recently-played"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center justify-between rounded-button px-3 text-sm font-semibold hover:bg-muted"
              >
                <span>Recently Played</span>
                <span className="text-xs font-medium text-muted-foreground">Free</span>
              </Link>
              <Link
                to="/scoreboard"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center justify-between rounded-button px-3 text-sm font-semibold hover:bg-muted"
              >
                <span>Scores &amp; Win History</span>
                {!isPremium ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <LockKeyhole className="size-3" />
                    Premium
                  </span>
                ) : null}
              </Link>
              <Link
                to="/profile"
                hash="settings"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center justify-between rounded-button px-3 text-sm font-semibold hover:bg-muted"
              >
                <span>Settings</span>
                <span className="text-xs font-medium text-muted-foreground">Free</span>
              </Link>
              <Link
                to="/premium"
                search={{ session_id: "" }}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center rounded-button px-3 text-sm font-semibold text-fox hover:bg-muted"
              >
                Explore GameFinder Premium
              </Link>
            </nav>
          </div>
        </div>
      </header>
      )}
      <main className={cn("mx-auto w-full max-w-3xl px-4 pt-5", !hideNav && "safe-bottom")}>
        {children}
      </main>
      {!hideNav ? (
        <nav
          aria-label="Primary navigation"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 backdrop-blur-md sm:hidden"
        >
          <ul className="mx-auto grid max-w-3xl grid-cols-4 px-1 pt-1.5 pb-[max(0.55rem,env(safe-area-inset-bottom))]">
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
                      "flex min-h-[4.25rem] flex-col items-center justify-center gap-1 text-xs font-bold",
                      active ? "text-fox" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
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
