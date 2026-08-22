const KEY = "gamefinder.pendingInvite";

export function rememberInvite(token: string) {
  const t = token.trim();
  if (!t || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, t);
  } catch {
    /* private mode */
  }
}

export function peekInvite(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearInvite() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Only same-origin relative paths. Blocks `//evil` and `https:`. */
export function safeNext(path: unknown): string | undefined {
  if (typeof path !== "string") return undefined;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) return undefined;
  if (path.includes("\\")) return undefined;
  return path;
}

export function inviteTokenFromPath(path?: string | null): string | undefined {
  const m = path?.match(/^\/invite\/([^/?#]+)/);
  return m?.[1];
}
